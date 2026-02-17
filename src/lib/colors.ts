export const AVATAR_PALETTE = [
  "#0079BF", // Blue
  "#D29034", // Orange
  "#51A825", // Green
  "#B04632", // Red
  "#89609E", // Purple
  "#CD5A91", // Pink
  "#4BBF6B", // Lime
  "#00AECC", // Sky
]

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_PALETTE[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length
  return AVATAR_PALETTE[index]
}
