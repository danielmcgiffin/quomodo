export type RoleDirectoryRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
}

export const mapRoleDirectory = ({
  rows,
  makeInitials,
  richToHtml,
}: {
  rows: RoleDirectoryRow[]
  makeInitials: (name: string) => string
  richToHtml: (value: unknown) => string
}) =>
  rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    initials: makeInitials(row.name),
    descriptionHtml: richToHtml(row.description_rich),
  }))

export type SystemDirectoryRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  location: string | null
  owner_role_id: string | null
}

type OwnerRole = { id: string; slug: string; name: string; initials: string }

export const mapSystemDirectory = ({
  rows,
  roleById,
  richToHtml,
}: {
  rows: SystemDirectoryRow[]
  roleById: Map<string, OwnerRole>
  richToHtml: (value: unknown) => string
}) =>
  rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    descriptionHtml: richToHtml(row.description_rich),
    location: row.location ?? "",
    ownerRole: row.owner_role_id
      ? (roleById.get(row.owner_role_id) ?? null)
      : null,
  }))
