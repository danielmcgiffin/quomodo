export type ProcessListRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  trigger: string | null
  end_state: string | null
  owner_role_id: string | null
}

export type ProcessActionLinkRow = {
  process_id: string
  system_id: string | null
  owner_role_id: string | null
}

export type ProcessFlagLinkRow = {
  id: string
  target_id: string
  target_path: string | null
  flag_type: string
  message: string
  created_at: string
}

type RoleEntity = { id: string; slug: string; name: string; initials: string }
type SystemEntity = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
}

const isDefined = <T>(value: T | null): value is T => value !== null

export const mapProcessCards = ({
  processRows,
  actionRows,
  roleById,
  systemById,
  richToHtml,
}: {
  processRows: ProcessListRow[]
  actionRows: ProcessActionLinkRow[]
  roleById: Map<string, RoleEntity>
  systemById: Map<string, SystemEntity>
  richToHtml: (value: unknown) => string
}) => {
  const roleIdsByProcess = new Map<string, Set<string>>()
  const systemIdsByProcess = new Map<string, Set<string>>()

  for (const action of actionRows) {
    if (action.owner_role_id) {
      const roleSet =
        roleIdsByProcess.get(action.process_id) ?? new Set<string>()
      roleSet.add(action.owner_role_id)
      roleIdsByProcess.set(action.process_id, roleSet)
    }
    if (action.system_id) {
      const systemSet =
        systemIdsByProcess.get(action.process_id) ?? new Set<string>()
      systemSet.add(action.system_id)
      systemIdsByProcess.set(action.process_id, systemSet)
    }
  }

  return processRows
    .map((row) => {
      const ownerRole = row.owner_role_id
        ? (roleById.get(row.owner_role_id) ?? null)
        : null
      const actionRoles = Array.from(roleIdsByProcess.get(row.id) ?? [])
        .map((roleId) => roleById.get(roleId) ?? null)
        .filter(isDefined)
      const roleBadges = ownerRole
        ? [ownerRole, ...actionRoles.filter((role) => role.id !== ownerRole.id)]
        : actionRoles
      const systemBadges = Array.from(systemIdsByProcess.get(row.id) ?? [])
        .map((systemId) => systemById.get(systemId) ?? null)
        .filter(isDefined)

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        descriptionHtml: richToHtml(row.description_rich),
        trigger: row.trigger ?? "",
        endState: row.end_state ?? "",
        roleBadges,
        systemBadges,
      }
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )
}

export const mapOpenProcessFlags = ({
  flagRows,
  processById,
}: {
  flagRows: ProcessFlagLinkRow[]
  processById: Map<string, { id: string; slug: string; name: string }>
}) =>
  flagRows
    .map((flag) => {
      const process = processById.get(flag.target_id)
      if (!process) {
        return null
      }
      return {
        id: flag.id,
        flagType: flag.flag_type,
        message: flag.message,
        targetPath: flag.target_path,
        createdAt: new Date(flag.created_at).toLocaleString(),
        process,
      }
    })
    .filter(isDefined)

export type ProcessDetailActionRow = {
  id: string
  process_id: string
  sequence: number
  description_rich: unknown
  owner_role_id: string
  system_id: string
}

export type ProcessDetailFlagRow = {
  id: string
  flag_type: string
  message: string
  created_at: string
}

export const mapProcessDetailActions = ({
  rows,
  roleById,
  systemById,
  richToHtml,
}: {
  rows: ProcessDetailActionRow[]
  roleById: Map<string, RoleEntity>
  systemById: Map<string, SystemEntity>
  richToHtml: (value: unknown) => string
}) =>
  rows.map((row) => ({
    id: row.id,
    processId: row.process_id,
    sequence: row.sequence,
    descriptionHtml: richToHtml(row.description_rich),
    ownerRole: roleById.get(row.owner_role_id),
    system: systemById.get(row.system_id),
  }))

export const mapProcessDetailFlags = (rows: ProcessDetailFlagRow[]) =>
  rows.map((flag) => ({
    id: flag.id,
    flagType: flag.flag_type,
    message: flag.message,
    createdAt: new Date(flag.created_at).toLocaleString(),
  }))
