export type RoleDirectoryRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  reports_to: string | null
}

export const mapRoleDirectory = ({
  rows,
  makeInitials,
  richToHtml,
  processData,
  actionData,
}: {
  rows: RoleDirectoryRow[]
  makeInitials: (name: string) => string
  richToHtml: (value: unknown) => string
  processData: { id: string; owner_role_id: string | null }[]
  actionData: { process_id: string; owner_role_id: string; system_id: string }[]
}) => {
  const roleById = new Map(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        slug: row.slug,
        name: row.name,
        initials: makeInitials(row.name),
      },
    ]),
  )

  return rows.map((row) => {
    // Process count: owned processes + processes where they own at least one action
    const ownedProcessIds = new Set(
      processData.filter((p) => p.owner_role_id === row.id).map((p) => p.id),
    )
    const actionProcessIds = new Set(
      actionData
        .filter((a) => a.owner_role_id === row.id)
        .map((a) => a.process_id),
    )
    const involvedProcessCount = new Set([
      ...ownedProcessIds,
      ...actionProcessIds,
    ]).size

    // System count: unique systems where they own an action
    const touchedSystemCount = new Set(
      actionData
        .filter((a) => a.owner_role_id === row.id)
        .map((a) => a.system_id),
    ).size

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      initials: makeInitials(row.name),
      descriptionHtml: richToHtml(row.description_rich),
      processCount: involvedProcessCount,
      systemCount: touchedSystemCount,
      ownerRole: row.reports_to ? (roleById.get(row.reports_to) ?? null) : null,
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
  richToHtml,
  actionData,
}: {
  rows: SystemDirectoryRow[]
  roleById: Map<string, OwnerRole>
  richToHtml: (value: unknown) => string
  actionData: { process_id: string; owner_role_id: string; system_id: string }[]
}) =>
  rows.map((row) => {
    // Process count: unique processes that have at least one action using this system
    const involvedProcessCount = new Set(
      actionData.filter((a) => a.system_id === row.id).map((a) => a.process_id),
    ).size

    // Role count: unique roles that own an action using this system
    const touchingRoleCount = new Set(
      actionData
        .filter((a) => a.system_id === row.id)
        .map((a) => a.owner_role_id),
    ).size

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
      processCount: involvedProcessCount,
      roleCount: touchingRoleCount,
    }
  })
