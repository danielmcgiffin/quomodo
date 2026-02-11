import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  ensureUniqueSlug,
  makeInitials,
  plainToRich,
  richToHtml,
} from "$lib/server/atlas"

type SupabaseAny = any
type RoleRow = { id: string; slug: string; name: string }
type SystemRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  location: string | null
  url: string | null
  owner_role_id: string | null
}

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase as unknown as SupabaseAny

  const [rolesResult, systemsResult] = await Promise.all([
    supabase
      .from("roles")
      .select("id, slug, name")
      .eq("org_id", context.orgId)
      .order("name"),
    supabase
      .from("systems")
      .select("id, slug, name, description_rich, location, url, owner_role_id")
      .eq("org_id", context.orgId)
      .order("name"),
  ])

  if (rolesResult.error) {
    throw kitError(500, `Failed to load roles: ${rolesResult.error.message}`)
  }
  if (systemsResult.error) {
    throw kitError(500, `Failed to load systems: ${systemsResult.error.message}`)
  }

  const roles = ((rolesResult.data ?? []) as RoleRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    initials: makeInitials(row.name),
  }))
  const roleById = new Map(
    roles.map((role: { id: string }) => [role.id, role]),
  )

  const systems = ((systemsResult.data ?? []) as SystemRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    descriptionHtml: richToHtml(row.description_rich),
    location: row.location ?? "",
    url: row.url ?? "",
    ownerRole: row.owner_role_id ? roleById.get(row.owner_role_id) ?? null : null,
  }))

  return {
    org: context,
    roles,
    systems,
  }
}

export const actions = {
  createSystem: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { createSystemError: "Insufficient permissions." })
    }
    const supabase = locals.supabase as unknown as SupabaseAny
    const formData = await request.formData()

    const name = String(formData.get("name") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    const location = String(formData.get("location") ?? "").trim()
    const url = String(formData.get("url") ?? "").trim()
    const ownerRoleIdRaw = String(formData.get("owner_role_id") ?? "").trim()

    if (!name) {
      return fail(400, { createSystemError: "System name is required." })
    }

    const slug = await ensureUniqueSlug(supabase, "systems", context.orgId, name)
    const ownerRoleId = ownerRoleIdRaw || null

    const { data, error } = await supabase
      .from("systems")
      .insert({
        org_id: context.orgId,
        slug,
        name,
        description_rich: plainToRich(description),
        location: location || null,
        url: url || null,
        owner_role_id: ownerRoleId,
      })
      .select("slug")
      .single()

    if (error) {
      return fail(400, { createSystemError: error.message })
    }

    redirect(303, `/app/systems/${data.slug}`)
  },
}
