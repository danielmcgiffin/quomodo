const toHex = (digest: ArrayBuffer): string =>
  Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

export type PriorOwnerDisposition = "admin" | "editor" | "leave"

export const parsePriorOwnerDisposition = (
  value: string,
): PriorOwnerDisposition | null => {
  if (value === "admin") return "admin"
  if (value === "editor") return "editor"
  if (value === "leave") return "leave"
  return null
}

export const hashOwnershipTransferToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token))
  return toHex(digest)
}

export const createOwnershipTransferToken = async (): Promise<{
  token: string
  tokenHash: string
}> => {
  // Long token to make guessing infeasible; store only hash in DB.
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`
  const tokenHash = await hashOwnershipTransferToken(token)
  return { token, tokenHash }
}

