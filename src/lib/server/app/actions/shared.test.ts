import { describe, expect, it, vi } from "vitest"
import {
  createFlagForEntity,
  createRoleRecord,
  createSystemRecord,
} from "./shared"

const createTargetLookupChain = (data: { id: string } | null, error = null) => {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.maybeSingle.mockResolvedValue({ data, error })
  return chain
}

describe("shared app actions", () => {
  it("rejects role creation when role name is missing", async () => {
    const result = await createRoleRecord({
      supabase: {} as App.Locals["supabase"],
      orgId: "org-1",
      draft: {
        name: "",
        description: "x",
        personName: "",
        hoursRaw: "",
      },
    })

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Role name is required.",
    })
  })

  it("rejects role creation when hours are non-numeric", async () => {
    const result = await createRoleRecord({
      supabase: {} as App.Locals["supabase"],
      orgId: "org-1",
      draft: {
        name: "Operator",
        description: "x",
        personName: "",
        hoursRaw: "abc",
      },
    })

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "Hours per week must be numeric.",
    })
  })

  it("rejects system creation when name is missing", async () => {
    const result = await createSystemRecord({
      supabase: {} as App.Locals["supabase"],
      orgId: "org-1",
      draft: {
        name: "",
        description: "",
        location: "",
        url: "",
        ownerRoleIdRaw: "",
      },
    })

    expect(result).toEqual({
      ok: false,
      status: 400,
      message: "System name is required.",
    })
  })

  it("enforces member flag restrictions (positive/negative RBAC case)", async () => {
    const denied = await createFlagForEntity({
      context: {
        orgId: "org-1",
        userId: "user-1",
        membershipRole: "member",
      },
      supabase: {} as App.Locals["supabase"],
      formData: new FormData(),
      expectedTargetType: "role",
      targetTable: "roles",
      missingTargetMessage: "Role not found.",
    })

    expect(denied).toEqual({
      ok: false,
      status: 400,
      payload: {
        createFlagError: "Invalid flag target.",
        createFlagTargetType: "",
        createFlagTargetId: "",
      },
    })

    const formData = new FormData()
    formData.set("target_type", "role")
    formData.set("target_id", "role-1")
    formData.set("flag_type", "stale")
    formData.set("message", "Outdated")

    const deniedByRole = await createFlagForEntity({
      context: {
        orgId: "org-1",
        userId: "user-1",
        membershipRole: "member",
      },
      supabase: {} as App.Locals["supabase"],
      formData,
      expectedTargetType: "role",
      targetTable: "roles",
      missingTargetMessage: "Role not found.",
    })

    expect(deniedByRole).toEqual({
      ok: false,
      status: 403,
      payload: {
        createFlagError: "Members can only create comment flags.",
        createFlagTargetType: "role",
        createFlagTargetId: "role-1",
      },
    })
  })

  it("creates an entity flag when inputs are valid", async () => {
    const targetChain = createTargetLookupChain({ id: "role-1" })
    const insert = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "flags") {
          return { insert }
        }
        return targetChain
      }),
    } as unknown as App.Locals["supabase"]

    const formData = new FormData()
    formData.set("target_type", "role")
    formData.set("target_id", "role-1")
    formData.set("flag_type", "comment")
    formData.set("message", "Needs owner update")
    formData.set("target_path", "description")

    const result = await createFlagForEntity({
      context: {
        orgId: "org-1",
        userId: "user-1",
        membershipRole: "member",
      },
      supabase,
      formData,
      expectedTargetType: "role",
      targetTable: "roles",
      missingTargetMessage: "Role not found.",
    })

    expect(result).toEqual({ ok: true })
    expect(insert).toHaveBeenCalledWith({
      org_id: "org-1",
      target_type: "role",
      target_id: "role-1",
      target_path: "description",
      flag_type: "comment",
      message: "Needs owner update",
      created_by: "user-1",
    })
  })
})
