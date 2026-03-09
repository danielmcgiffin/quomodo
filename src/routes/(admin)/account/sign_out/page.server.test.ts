import { describe, it, expect, vi, beforeEach } from "vitest"
import { load } from "./+page.server"
import { redirect } from "@sveltejs/kit"

vi.mock("@sveltejs/kit", async () => {
  const actual = await vi.importActual("@sveltejs/kit")
  return {
    ...actual,
    redirect: vi.fn().mockImplementation(() => {
      throw new Error("Redirect error")
    }),
  }
})

describe("account sign out page", () => {
  const signOut = vi.fn().mockResolvedValue({ error: null })
  const safeGetSession = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    signOut.mockResolvedValue({ error: null })
  })

  it("signs out active sessions before redirecting home", async () => {
    safeGetSession.mockResolvedValue({ session: { user: { id: "user123" } } })

    await expect(
      load({
        locals: {
          supabase: { auth: { signOut } },
          safeGetSession,
        },
      } as any),
    ).rejects.toThrow("Redirect")

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(redirect).toHaveBeenCalledWith(303, "/login/sign_in")
  })

  it("redirects home even when no session exists", async () => {
    safeGetSession.mockResolvedValue({ session: null })

    await expect(
      load({
        locals: {
          supabase: { auth: { signOut } },
          safeGetSession,
        },
      } as any),
    ).rejects.toThrow("Redirect")

    expect(signOut).not.toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith(303, "/login/sign_in")
  })
})
