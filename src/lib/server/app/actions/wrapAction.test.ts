import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("$lib/server/atlas", () => ({
  ensureOrgContext: vi.fn(),
}))

vi.mock("$lib/server/billing", () => ({
  getOrgBillingSnapshot: vi.fn(),
  assertWorkspaceWritable: vi.fn(),
}))

import { wrapAction } from "./wrapAction"
import { ensureOrgContext } from "$lib/server/atlas"
import {
  getOrgBillingSnapshot,
  assertWorkspaceWritable,
} from "$lib/server/billing"

const makeRequestWithFormData = (form: Record<string, string> = {}) => {
  const formData = new FormData()
  for (const [k, v] of Object.entries(form)) {
    formData.set(k, v)
  }
  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as Request
}

describe("wrapAction", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("returns fail(403) when permission check fails", async () => {
    vi.mocked(ensureOrgContext).mockResolvedValue({
      orgId: "org-1",
      orgName: "Org",
      membershipRole: "member",
      userId: "user-1",
    })
    vi.mocked(getOrgBillingSnapshot).mockResolvedValue({
      orgId: "org-1",
      planId: "free",
      billingState: "active",
      isLapsed: false,
      hasEverPaid: false,
      stripeCustomerId: null,
      lastCheckedAt: null,
    })

    const handler = vi.fn()
    const action = wrapAction(handler, {
      permission: (role) => role === "owner",
      forbiddenPayload: { createRoleError: "Insufficient permissions." },
    })

    const result = await action({
      request: makeRequestWithFormData(),
      locals: { supabase: {} } as unknown as App.Locals,
      params: {},
    })

    expect(result).toMatchObject({
      status: 403,
      data: { createRoleError: "Insufficient permissions." },
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it("enforces lapsed=view-only by default", async () => {
    vi.mocked(ensureOrgContext).mockResolvedValue({
      orgId: "org-1",
      orgName: "Org",
      membershipRole: "owner",
      userId: "user-1",
    })
    vi.mocked(getOrgBillingSnapshot).mockResolvedValue({
      orgId: "org-1",
      planId: "free",
      billingState: "lapsed",
      isLapsed: true,
      hasEverPaid: true,
      stripeCustomerId: null,
      lastCheckedAt: null,
    })

    // Simulate assertWorkspaceWritable throwing a 403.
    vi.mocked(assertWorkspaceWritable).mockImplementation(() => {
      throw Object.assign(new Error("lapsed"), { status: 403 })
    })

    const handler = vi.fn()
    const action = wrapAction(handler)

    await expect(
      action({
        request: makeRequestWithFormData(),
        locals: { supabase: {} } as unknown as App.Locals,
        params: {},
      }),
    ).rejects.toMatchObject({ status: 403 })
    expect(handler).not.toHaveBeenCalled()
  })

  it("does not enforce lapsed policy when requireWritable=false", async () => {
    vi.mocked(ensureOrgContext).mockResolvedValue({
      orgId: "org-1",
      orgName: "Org",
      membershipRole: "owner",
      userId: "user-1",
    })
    vi.mocked(getOrgBillingSnapshot).mockResolvedValue({
      orgId: "org-1",
      planId: "free",
      billingState: "lapsed",
      isLapsed: true,
      hasEverPaid: true,
      stripeCustomerId: null,
      lastCheckedAt: null,
    })

    const handler = vi.fn().mockResolvedValue({ ok: true })
    const action = wrapAction(handler, { requireWritable: false })

    const result = await action({
      request: makeRequestWithFormData({ a: "b" }),
      locals: { supabase: { client: true } } as unknown as App.Locals,
      params: { slug: "x" },
    })

    expect(assertWorkspaceWritable).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: true })
  })

  it("calls handler with parsed formData, params, and narrowed org context", async () => {
    vi.mocked(ensureOrgContext).mockResolvedValue({
      orgId: "org-1",
      orgName: "Org",
      membershipRole: "admin",
      userId: "user-1",
    })
    vi.mocked(getOrgBillingSnapshot).mockResolvedValue({
      orgId: "org-1",
      planId: "free",
      billingState: "active",
      isLapsed: false,
      hasEverPaid: false,
      stripeCustomerId: null,
      lastCheckedAt: null,
    })

    const handler = vi.fn().mockResolvedValue({ ok: true })
    const action = wrapAction(handler, {
      permission: (role) => role === "admin",
    })

    const request = makeRequestWithFormData({ name: "x" })
    const locals = { supabase: { tag: "supabase" } } as unknown as App.Locals
    const params = { slug: "abc" }

    const result = await action({ request, locals, params })

    expect(result).toEqual({ ok: true })
    expect(handler).toHaveBeenCalledTimes(1)
    const callArg = handler.mock.calls[0]?.[0]
    expect(callArg.params).toEqual({ slug: "abc" })
    expect(callArg.supabase).toBe((locals as any).supabase)
    expect(callArg.context).toEqual({
      orgId: "org-1",
      userId: "user-1",
      membershipRole: "admin",
    })
    expect(callArg.formData).toBeInstanceOf(FormData)
    expect(callArg.formData.get("name")).toBe("x")
  })
})
