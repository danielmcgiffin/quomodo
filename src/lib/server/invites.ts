import type { MembershipRole } from "$lib/server/atlas"

export type InviteRole = Exclude<MembershipRole, "owner">
export type InviteStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired"
  | "invalid"

const EMAIL_BASIC_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const toHex = (digest: ArrayBuffer): string =>
  Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

export const hashInviteToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token))
  return toHex(digest)
}

export const createInviteToken = async (): Promise<{
  token: string
  tokenHash: string
}> => {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`
  const tokenHash = await hashInviteToken(token)
  return { token, tokenHash }
}

export const parseInviteRole = (value: string): InviteRole | null => {
  if (value === "admin") return "admin"
  if (value === "editor") return "editor"
  if (value === "member") return "member"
  return null
}

export const normalizeInviteEmail = (value: string): string =>
  value.trim().toLowerCase()

export const isValidInviteEmail = (value: string): boolean =>
  EMAIL_BASIC_PATTERN.test(value)

export const determineInviteStatus = ({
  revokedAt,
  acceptedAt,
  expiresAt,
}: {
  revokedAt: string | null
  acceptedAt: string | null
  expiresAt: string | null
}): InviteStatus => {
  if (acceptedAt) {
    return "accepted"
  }
  if (revokedAt) {
    return "revoked"
  }
  if (!expiresAt) {
    return "invalid"
  }
  return new Date(expiresAt).getTime() <= Date.now() ? "expired" : "pending"
}
