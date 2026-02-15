import { makeInitials } from "$lib/server/atlas"

export type RolePortalRow = { id: string; slug: string; name: string }
export type RolePortalModel = {
  id: string
  slug: string
  name: string
  initials: string
}

export const toRolePortal = (row: RolePortalRow): RolePortalModel => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  initials: makeInitials(row.name),
})

export const mapRolePortals = (rows: RolePortalRow[]): RolePortalModel[] =>
  rows.map(toRolePortal)

export type SystemPortalRow = {
  id: string
  slug: string
  name: string
  logo_url: string | null
}
export type SystemPortalModel = {
  id: string
  slug: string
  name: string
  logoUrl: string | null
}

export const toSystemPortal = (row: SystemPortalRow): SystemPortalModel => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  logoUrl: row.logo_url,
})

export const mapSystemPortals = (rows: SystemPortalRow[]): SystemPortalModel[] =>
  rows.map(toSystemPortal)
