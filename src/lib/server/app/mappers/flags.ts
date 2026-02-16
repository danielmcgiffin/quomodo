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
}

export type ActionTarget = { id: string; label: string }

type FlagProcessTarget = FlagsProcessRow | null
type FlagRoleTarget = RolePortalModel | null
type FlagSystemTarget = FlagsSystemRow | null
type FlagActionTarget = ActionTarget | null

export type FlagsDashboardEntry =
  | {
      id: string
      targetType: "process"
      targetId: string
      targetPath: string | null
      flagType: string
      message: string
      createdAt: string
      status: string
      target: FlagProcessTarget
    }
  | {
      id: string
      targetType: "role"
      targetId: string
      targetPath: string | null
      flagType: string
      message: string
      createdAt: string
      status: string
      target: FlagRoleTarget
    }
  | {
      id: string
      targetType: "system"
      targetId: string
      targetPath: string | null
      flagType: string
      message: string
      createdAt: string
      status: string
      target: FlagSystemTarget
    }
  | {
      id: string
      targetType: "action"
      targetId: string
      targetPath: string | null
      flagType: string
      message: string
      createdAt: string
      status: string
      target: FlagActionTarget
    }

const toTargetLabel = (type: string, name: string) => `${type}: ${name}`

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
    return {
      id: action.id,
      label,
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
}: {
  flagsRows: FlagsRow[]
  processById: Map<string, FlagsProcessRow>
  roleRows: FlagsRoleRow[]
  systemById: Map<string, FlagsSystemRow>
  actionTargets: ActionTarget[]
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
    }

    if (flag.target_type === "process") {
      return {
        ...common,
        targetType: "process",
        target: processById.get(flag.target_id) ?? null,
      }
    }
    if (flag.target_type === "role") {
      return {
        ...common,
        targetType: "role",
        target: roleById.get(flag.target_id) ?? null,
      }
    }
    if (flag.target_type === "system") {
      return {
        ...common,
        targetType: "system",
        target: systemById.get(flag.target_id) ?? null,
      }
    }
    return {
      ...common,
      targetType: "action",
      target:
        actionTargets.find((action) => action.id === flag.target_id) ?? null,
    }
  })
}
