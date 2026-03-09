import {
  buildFlagsHref,
  type DirectFlagBadgeData,
  type FlagBadgeFlag,
  type FlagTargetType,
  type RelatedFlagBadgeData,
} from "$lib/flags"

export type OpenFlagIndexRow = {
  id: string
  target_type: FlagTargetType
  target_id: string
  target_path: string | null
  flag_type: string
  message: string
  created_at: string
}

export type VisibleFlagTarget = {
  targetType: FlagTargetType
  targetId: string
  label: string
  href: string
}

type OpenFlagIndex = Map<string, FlagBadgeFlag[]>

const toEntityKey = (targetType: FlagTargetType, targetId: string) =>
  `${targetType}:${targetId}`

const toFlagBadgeFlag = (row: OpenFlagIndexRow): FlagBadgeFlag => ({
  id: row.id,
  targetType: row.target_type,
  targetId: row.target_id,
  targetPath: row.target_path,
  flagType: row.flag_type,
  message: row.message,
  createdAt: new Date(row.created_at).toLocaleString(),
})

export const buildOpenFlagIndex = (rows: OpenFlagIndexRow[]): OpenFlagIndex => {
  const index = new Map<string, FlagBadgeFlag[]>()

  for (const row of rows) {
    const key = toEntityKey(row.target_type, row.target_id)
    const existing = index.get(key) ?? []
    existing.push(toFlagBadgeFlag(row))
    index.set(key, existing)
  }

  return index
}

export const getEntityFlags = (
  index: OpenFlagIndex,
  targetType: FlagTargetType,
  targetId: string,
): FlagBadgeFlag[] => index.get(toEntityKey(targetType, targetId)) ?? []

export const getEntityFlagCount = (
  index: OpenFlagIndex,
  targetType: FlagTargetType,
  targetId: string,
): number => getEntityFlags(index, targetType, targetId).length

export const getDirectFlagData = (
  index: OpenFlagIndex,
  targetType: FlagTargetType,
  targetId: string,
): DirectFlagBadgeData => {
  const flags = getEntityFlags(index, targetType, targetId)
  return { count: flags.length, flags }
}

export const getVisibleRelatedFlags = (
  index: OpenFlagIndex,
  visibleTargets: VisibleFlagTarget[],
): RelatedFlagBadgeData => {
  const orderedTargets = new Map<string, VisibleFlagTarget>()

  for (const target of visibleTargets) {
    const key = toEntityKey(target.targetType, target.targetId)
    if (!orderedTargets.has(key)) {
      orderedTargets.set(key, target)
    }
  }

  const groups = Array.from(orderedTargets.values())
    .map((target) => {
      const flags = getEntityFlags(index, target.targetType, target.targetId)
      if (flags.length === 0) {
        return null
      }

      return {
        key: toEntityKey(target.targetType, target.targetId),
        label: target.label,
        targetType: target.targetType,
        targetId: target.targetId,
        href:
          target.href ||
          buildFlagsHref({
            targetType: target.targetType,
            targetId: target.targetId,
          }),
        flags,
      }
    })
    .filter((group): group is NonNullable<typeof group> => group !== null)

  const uniqueFlagIds = new Set<string>()
  for (const group of groups) {
    for (const flag of group.flags) {
      uniqueFlagIds.add(flag.id)
    }
  }

  return {
    count: uniqueFlagIds.size,
    groups,
  }
}
