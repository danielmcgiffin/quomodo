export type RoleDirectoryRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
}

type RelatedEntityLink = {
  id: string
  slug: string
  name: string
}

export const mapRoleDirectory = ({
  rows,
  makeInitials,
  richToHtml,
  processData,
  actionData,
  systemById,
}: {
  rows: RoleDirectoryRow[]
  makeInitials: (name: string) => string
  richToHtml: (value: unknown) => string
  processData: { id: string; slug: string; name: string; owner_role_id: string | null }[]
  actionData: { process_id: string; owner_role_id: string; system_id: string }[]
  systemById: Map<string, RelatedEntityLink>
}) => {
  const processById = new Map(processData.map((process) => [process.id, process]))

  return rows.map((row) => {
    const ownedProcessIds = new Set(
      processData.filter((p) => p.owner_role_id === row.id).map((p) => p.id),
    )
    const actionProcessIds = new Set(
      actionData
        .filter((a) => a.owner_role_id === row.id)
        .map((a) => a.process_id),
    )
    const relatedProcesses = [...new Set([...ownedProcessIds, ...actionProcessIds])]
      .map((processId) => processById.get(processId))
      .filter((process): process is NonNullable<typeof process> => Boolean(process))
      .map((process) => ({ id: process.id, slug: process.slug, name: process.name }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const relatedSystems = [
      ...new Set(
        actionData
          .filter((a) => a.owner_role_id === row.id)
          .map((a) => a.system_id),
      ),
    ]
      .map((systemId) => systemById.get(systemId))
      .filter((system): system is RelatedEntityLink => Boolean(system))
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      initials: makeInitials(row.name),
      descriptionHtml: richToHtml(row.description_rich),
      processCount: relatedProcesses.length,
      systemCount: relatedSystems.length,
      relatedProcesses,
      relatedSystems,
    }
  })
}

export type SystemDirectoryRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  location: string | null
  owner_role_id: string | null
  logo_url: string | null
}

type OwnerRole = { id: string; slug: string; name: string; initials: string }

export const mapSystemDirectory = ({
  rows,
  roleById,
  processById,
  richToHtml,
  actionData,
}: {
  rows: SystemDirectoryRow[]
  roleById: Map<string, OwnerRole>
  processById: Map<string, RelatedEntityLink>
  richToHtml: (value: unknown) => string
  actionData: { process_id: string; owner_role_id: string; system_id: string }[]
}) =>
  rows.map((row) => {
    const systemActions = actionData.filter((a) => a.system_id === row.id)

    const relatedProcesses = [...new Set(systemActions.map((a) => a.process_id))]
      .map((processId) => processById.get(processId))
      .filter((process): process is RelatedEntityLink => Boolean(process))
      .sort((a, b) => a.name.localeCompare(b.name))

    const relatedRoles = [...new Set(systemActions.map((a) => a.owner_role_id))]
      .map((roleId) => roleById.get(roleId))
      .filter((role): role is OwnerRole => Boolean(role))
      .sort((a, b) => a.name.localeCompare(b.name))

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      descriptionHtml: richToHtml(row.description_rich),
      location: row.location ?? "",
      logoUrl: row.logo_url ?? null,
      ownerRole: row.owner_role_id
        ? (roleById.get(row.owner_role_id) ?? null)
        : null,
      processCount: relatedProcesses.length,
      roleCount: relatedRoles.length,
      relatedProcesses,
      relatedRoles,
    }
  })
