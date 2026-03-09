import { buildFlagsHref } from "$lib/flags"
import {
  mapRolePortals,
  type RolePortalModel,
} from "$lib/server/app/mappers/portals"

export type FlagTargetType = "process" | "role" | "system" | "action"

export type FlagsProcessRow = { id: string; slug: string; name: string }
export type FlagsRoleRow = { id: string; slug: string; name: string }
export type FlagsSystemRow = { id: string; slug: string; name: string }
export type FlagsActionRow = {
  id: string
  process_id: string
  sequence: number
}
export type FlagsRow = {
  id: string
  target_type: FlagTargetType
  target_id: string
  target_path: string | null
  flag_type: string
  message: string
  created_at: string
  status: string
  resolved_at?: string | null
  resolved_by?: string | null
  resolution_note?: string | null
}

export type ActionTarget = { id: string; label: string; href: string }

type FlagProcessTarget = FlagsProcessRow | null
type FlagRoleTarget = RolePortalModel | null
type FlagSystemTarget = FlagsSystemRow | null
type FlagActionTarget = ActionTarget | null

type FlagsDashboardBase = {
  id: string
  targetId: string
  targetPath: string | null
  flagType: string
  message: string
  createdAt: string
  status: string
  resolvedAt: string | null
  resolvedBy: string | null
  resolvedByLabel: string | null
  resolutionNote: string | null
  originHref: string
}

export type FlagsDashboardEntry =
  | (FlagsDashboardBase & {
      targetType: "process"
      target: FlagProcessTarget
    })
  | (FlagsDashboardBase & {
      targetType: "role"
      target: FlagRoleTarget
    })
  | (FlagsDashboardBase & {
      targetType: "system"
      target: FlagSystemTarget
    })
  | (FlagsDashboardBase & {
      targetType: "action"
      target: FlagActionTarget
    })

export type FlagsFilterStatus = "open" | "resolved" | "dismissed"
export type FlagsFilterView = "open" | "history"
export type FlagsHistoryStatus = "all" | "resolved" | "dismissed"

export type FlagsFilterParams = {
  status: FlagsFilterStatus
  view: FlagsFilterView
  historyStatus: FlagsHistoryStatus
  q: string
  targetType: FlagTargetType | null
  targetId: string | null
}

export type FlagsHistoryTimelineGroup = {
  key: string
  label: string
  railLabel: string
  items: FlagsDashboardEntry[]
}

const toTargetLabel = (type: string, name: string) => `${type}: ${name}`

const formatResolverName = (
  resolvedBy: string | null,
  resolverNameById?: Map<string, string>,
) => {
  if (!resolvedBy) {
    return null
  }

  const profileName = resolverNameById?.get(resolvedBy)?.trim()
  if (profileName) {
    return profileName
  }

  return `User ${resolvedBy.slice(0, 8)}`
}

const normalizeSearch = (value: string | null) =>
  (value ?? "").trim().replace(/\s+/g, " ").slice(0, 120)

const isValidHistoryStatus = (value: string | null): value is FlagsHistoryStatus =>
  value === "all" || value === "resolved" || value === "dismissed"

const isValidView = (value: string | null): value is FlagsFilterView =>
  value === "open" || value === "history"

export const parseFlagsFilterParams = (
  searchParams: URLSearchParams,
): FlagsFilterParams => {
  const rawStatus = searchParams.get("status")
  const rawView = searchParams.get("view")
  const rawHistoryStatus = searchParams.get("historyStatus")
  const rawTargetType = searchParams.get("targetType")
  const rawTargetId = searchParams.get("targetId")

  const status: FlagsFilterStatus =
    rawStatus === "resolved" || rawStatus === "dismissed" ? rawStatus : "open"

  const view: FlagsFilterView = isValidView(rawView)
    ? rawView
    : status === "open"
      ? "open"
      : "history"

  const historyStatus: FlagsHistoryStatus = isValidHistoryStatus(rawHistoryStatus)
    ? rawHistoryStatus
    : status === "resolved" || status === "dismissed"
      ? status
      : "all"

  const targetType: FlagTargetType | null =
    rawTargetType === "process" ||
    rawTargetType === "role" ||
    rawTargetType === "system" ||
    rawTargetType === "action"
      ? rawTargetType
      : null
  const targetId = rawTargetId?.trim() ? rawTargetId.trim() : null

  return {
    status,
    view,
    historyStatus,
    q: normalizeSearch(searchParams.get("q")),
    targetType,
    targetId: targetType ? targetId : null,
  }
}

export const mapActionTargets = ({
  actionRows,
  processById,
}: {
  actionRows: FlagsActionRow[]
  processById: Map<string, FlagsProcessRow>
}): ActionTarget[] =>
  actionRows.map((action) => {
    const process = processById.get(action.process_id)
    const label = process
      ? `Action ${action.sequence} in ${process.name}`
      : `Action ${action.sequence}`

    const href = process
      ? `/app/processes/${process.slug}?actionId=${action.id}`
      : buildFlagsHref({
          targetType: "action",
          targetId: action.id,
        })

    return {
      id: action.id,
      label,
      href,
    }
  })

export const mapFlagTargetOptions = ({
  processRows,
  roleRows,
  systemRows,
  actionTargets,
}: {
  processRows: FlagsProcessRow[]
  roleRows: FlagsRoleRow[]
  systemRows: FlagsSystemRow[]
  actionTargets: ActionTarget[]
}) => [
  ...processRows.map((process) => ({
    value: `process:${process.id}`,
    label: toTargetLabel("Process", process.name),
  })),
  ...roleRows.map((role) => ({
    value: `role:${role.id}`,
    label: toTargetLabel("Role", role.name),
  })),
  ...systemRows.map((system) => ({
    value: `system:${system.id}`,
    label: toTargetLabel("System", system.name),
  })),
  ...actionTargets.map((action) => ({
    value: `action:${action.id}`,
    label: toTargetLabel("Action", action.label),
  })),
]

export const mapFlagsDashboard = ({
  flagsRows,
  processById,
  roleRows,
  systemById,
  actionTargets,
  resolverNameById,
}: {
  flagsRows: FlagsRow[]
  processById: Map<string, FlagsProcessRow>
  roleRows: FlagsRoleRow[]
  systemById: Map<string, FlagsSystemRow>
  actionTargets: ActionTarget[]
  resolverNameById?: Map<string, string>
}): FlagsDashboardEntry[] => {
  const roleById = new Map<string, RolePortalModel>(
    mapRolePortals(roleRows).map((role) => [role.id, role]),
  )

  return flagsRows.map((flag) => {
    const common = {
      id: flag.id,
      targetId: flag.target_id,
      targetPath: flag.target_path,
      flagType: flag.flag_type,
      message: flag.message,
      createdAt: new Date(flag.created_at).toLocaleString(),
      status: flag.status,
      resolvedAt: flag.resolved_at
        ? new Date(flag.resolved_at).toLocaleString()
        : null,
      resolvedBy: flag.resolved_by ?? null,
      resolvedByLabel: formatResolverName(
        flag.resolved_by ?? null,
        resolverNameById,
      ),
      resolutionNote: flag.resolution_note ?? null,
    }

    if (flag.target_type === "process") {
      const processTarget = processById.get(flag.target_id) ?? null
      return {
        ...common,
        targetType: "process",
        target: processTarget,
        originHref: processTarget
          ? `/app/processes/${processTarget.slug}`
          : buildFlagsHref({ targetType: "process", targetId: flag.target_id }),
      }
    }

    if (flag.target_type === "role") {
      const roleTarget = roleById.get(flag.target_id) ?? null
      return {
        ...common,
        targetType: "role",
        target: roleTarget,
        originHref: roleTarget
          ? `/app/roles/${roleTarget.slug}`
          : buildFlagsHref({ targetType: "role", targetId: flag.target_id }),
      }
    }

    if (flag.target_type === "system") {
      const systemTarget = systemById.get(flag.target_id) ?? null
      return {
        ...common,
        targetType: "system",
        target: systemTarget,
        originHref: systemTarget
          ? `/app/systems/${systemTarget.slug}`
          : buildFlagsHref({ targetType: "system", targetId: flag.target_id }),
      }
    }

    const actionTarget =
      actionTargets.find((action) => action.id === flag.target_id) ?? null

    return {
      ...common,
      targetType: "action",
      target: actionTarget,
      originHref:
        actionTarget?.href ??
        buildFlagsHref({ targetType: "action", targetId: flag.target_id }),
    }
  })
}

const historyKeyFromIso = (iso: string) => iso.slice(0, 10)

const formatHistoryLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

const formatHistoryRailLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

export const mapFlagsHistoryTimeline = ({
  flagsRows,
  entries,
}: {
  flagsRows: FlagsRow[]
  entries: FlagsDashboardEntry[]
}): FlagsHistoryTimelineGroup[] => {
  const groups: FlagsHistoryTimelineGroup[] = []
  const indexByKey = new Map<string, number>()

  flagsRows.forEach((row, idx) => {
    const iso = row.resolved_at ?? row.created_at
    const key = historyKeyFromIso(iso)
    const existingIdx = indexByKey.get(key)

    if (existingIdx == null) {
      indexByKey.set(key, groups.length)
      groups.push({
        key,
        label: formatHistoryLabel(iso),
        railLabel: formatHistoryRailLabel(iso),
        items: entries[idx] ? [entries[idx]] : [],
      })
      return
    }

    if (entries[idx]) {
      groups[existingIdx]?.items.push(entries[idx])
    }
  })

  return groups
}

export const escapeFlagsSearchTerm = (q: string) =>
  normalizeSearch(q)
    .replace(/[%,_']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
