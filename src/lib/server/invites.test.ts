import { describe, expect, it } from "vitest"
import {
  createInviteToken,
  determineInviteStatus,
  hashInviteToken,
  isValidInviteEmail,
  normalizeInviteEmail,
  parseInviteRole,
} from "./invites"

describe("invites helpers", () => {
  it("normalizes and validates invite emails", () => {
    expect(normalizeInviteEmail("  USER@Example.COM ")).toBe("user@example.com")
    expect(isValidInviteEmail("user@example.com")).toBe(true)
    expect(isValidInviteEmail("userexample.com")).toBe(false)
  })

  it("parses supported invite roles", () => {
    expect(parseInviteRole("admin")).toBe("admin")
    expect(parseInviteRole("editor")).toBe("editor")
    expect(parseInviteRole("member")).toBe("member")
    expect(parseInviteRole("owner")).toBeNull()
    expect(parseInviteRole("invalid")).toBeNull()
  })

  it("hashes invite tokens deterministically and creates token/hash pairs", async () => {
    const hash1 = await hashInviteToken("token-value")
    const hash2 = await hashInviteToken("token-value")
    expect(hash1).toBe(hash2)

    const { token, tokenHash } = await createInviteToken()
    expect(token.length).toBeGreaterThan(20)
    expect(tokenHash).toHaveLength(64)
    expect(await hashInviteToken(token)).toBe(tokenHash)
  })

  it("computes invite status from timestamps", () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    const past = new Date(Date.now() - 60_000).toISOString()

    expect(
      determineInviteStatus({
        revokedAt: null,
        acceptedAt: null,
        expiresAt: future,
      }),
    ).toBe("pending")
    expect(
      determineInviteStatus({
        revokedAt: past,
        acceptedAt: null,
        expiresAt: future,
      }),
    ).toBe("revoked")
    expect(
      determineInviteStatus({
        revokedAt: null,
        acceptedAt: past,
        expiresAt: future,
      }),
    ).toBe("accepted")
    expect(
      determineInviteStatus({
        revokedAt: null,
        acceptedAt: null,
        expiresAt: past,
      }),
    ).toBe("expired")
  })
})
