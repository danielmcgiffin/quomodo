export type FlagTargetType = "process" | "role" | "system" | "action"
export type FlagViewerRole = "owner" | "admin" | "editor" | "member"

export type FlagBadgeFlag = {
  id: string
  targetType: FlagTargetType
  targetId: string
  targetPath: string | null
  flagType: string
  message: string
  createdAt: string
}

export type FlagBadgeGroup = {
  key: string
  label: string
  targetType: FlagTargetType
  targetId: string
  href: string
  flags: FlagBadgeFlag[]
}

export type DirectFlagBadgeData = {
  count: number
  flags: FlagBadgeFlag[]
}

export type RelatedFlagBadgeData = {
  count: number
  groups: FlagBadgeGroup[]
}

export const buildFlagsHref = ({
  targetType,
  targetId,
}: {
  targetType: FlagTargetType
  targetId: string
}) => {
  const query = new URLSearchParams({
    status: "open",
    targetType,
    targetId,
  })

  return `/app/flags?${query.toString()}`
}
