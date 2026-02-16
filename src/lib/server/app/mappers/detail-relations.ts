export type RoleDetailProcessRow = {
  id: string
  slug: string
  name: string
  owner_role_id: string | null
}

export type RoleDetailActionRow = {
  id: string
  process_id: string
  sequence: number
  description_rich: unknown
  owner_role_id: string
  system_id: string
}

type RoleOwnedProcess = {
  id: string
  slug: string
  name: string
  ownerRoleId: string | null
}

type SystemPortal = { id: string; slug: string; name: string }

type RoleActionDisplay = {
  id: string
  processId: string
  sequence: number
  descriptionHtml: string
  system: SystemPortal | null
}

export const mapRoleOwnedProcesses = (
  rows: RoleDetailProcessRow[],
): RoleOwnedProcess[] =>
  rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    ownerRoleId: row.owner_role_id,
  }))

export const mapRoleActionsPerformed = ({
  rows,
  systemById,
  richToHtml,
}: {
  rows: RoleDetailActionRow[]
  systemById: Map<string, SystemPortal>
  richToHtml: (value: unknown) => string
}): RoleActionDisplay[] =>
  rows.map((action) => ({
    id: action.id,
    processId: action.process_id,
    sequence: action.sequence,
    descriptionHtml: richToHtml(action.description_rich),
    system: systemById.get(action.system_id) ?? null,
  }))

export const mapSystemsAccessed = ({
  systems,
  actionsPerformed,
}: {
  systems: SystemPortal[]
  actionsPerformed: RoleActionDisplay[]
}) =>
  systems.filter((system) =>
    actionsPerformed.some((action) => action.system?.id === system.id),
  )

export const mapActionsByProcess = ({
  processes,
  actionsPerformed,
  roleId,
}: {
  processes: RoleOwnedProcess[]
  actionsPerformed: RoleActionDisplay[]
  roleId: string
}) => {
  const processById = new Map(processes.map((process) => [process.id, process]))
  const entryByProcessId = new Map<
    string,
    { process: RoleOwnedProcess; actions: RoleActionDisplay[] }
  >()

  for (const process of processes) {
    if (process.ownerRoleId === roleId) {
      entryByProcessId.set(process.id, { process, actions: [] })
    }
  }

  for (const action of actionsPerformed) {
    const process = processById.get(action.processId)
    if (!process) {
      continue
    }
    const existing = entryByProcessId.get(process.id) ?? {
      process,
      actions: [],
    }
    existing.actions.push(action)
    entryByProcessId.set(process.id, existing)
  }

  return Array.from(entryByProcessId.values())
}

export type SystemDetailActionRow = {
  id: string
  process_id: string
  sequence: number
  description_rich: unknown
  owner_role_id: string
  system_id: string
}

type RolePortal = { id: string; slug: string; name: string; initials: string }
type ProcessPortal = { id: string; slug: string; name: string }

export const mapSystemActionsUsing = ({
  rows,
  roleById,
  richToHtml,
}: {
  rows: SystemDetailActionRow[]
  roleById: Map<string, RolePortal>
  richToHtml: (value: unknown) => string
}) =>
  rows.map((action) => ({
    id: action.id,
    processId: action.process_id,
    sequence: action.sequence,
    descriptionHtml: richToHtml(action.description_rich),
    ownerRole: roleById.get(action.owner_role_id) ?? null,
  }))

export const filterProcessesUsing = ({
  processes,
  actionsUsing,
}: {
  processes: ProcessPortal[]
  actionsUsing: { processId: string }[]
}) =>
  processes.filter((process) =>
    actionsUsing.some((action) => action.processId === process.id),
  )

export const filterRolesUsing = ({
  roles,
  actionsUsing,
}: {
  roles: RolePortal[]
  actionsUsing: { ownerRole: RolePortal | null }[]
}) =>
  roles.filter((role) =>
    actionsUsing.some((action) => action.ownerRole?.id === role.id),
  )

export type OpenFlagRow = { id: string; flag_type: string; message: string }
export const mapOpenFlags = (rows: OpenFlagRow[]) =>
  rows.map((flag) => ({
    id: flag.id,
    flagType: flag.flag_type,
    message: flag.message,
  }))
