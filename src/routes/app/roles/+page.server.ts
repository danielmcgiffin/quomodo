import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  ensureUniqueSlug,
  makeInitials,
  plainToRich,
  richToHtml,
} from "$lib/server/atlas"

type RoleRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  person_name: string | null
  hours_per_week: number | null
}

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const { data, error } = await supabase
    .from("roles")
    .select("id, slug, name, description_rich, person_name, hours_per_week")
    .eq("org_id", context.orgId)
    .order("name")

  if (error) {
    throw kitError(500, `Failed to load roles: ${error.message}`)
  }

  const roles = ((data ?? []) as RoleRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    initials: makeInitials(row.name),
    descriptionHtml: richToHtml(row.description_rich),
    personName: row.person_name ?? "",
    hoursPerWeek: row.hours_per_week ?? null,
  }))

  return {
    org: context,
    roles,
  }
}

export const actions = {
  createRole: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { createRoleError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()

    const name = String(formData.get("name") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    const personName = String(formData.get("person_name") ?? "").trim()
    const hoursRaw = String(formData.get("hours_per_week") ?? "").trim()

    if (!name) {
      return fail(400, { createRoleError: "Role name is required." })
    }

    const hours = hoursRaw ? Number(hoursRaw) : null
    if (hoursRaw && Number.isNaN(hours)) {
      return fail(400, { createRoleError: "Hours per week must be numeric." })
    }

    const slug = await ensureUniqueSlug(supabase, "roles", context.orgId, name)
    const { data, error } = await supabase
      .from("roles")
      .insert({
        org_id: context.orgId,
        slug,
        name,
        description_rich: plainToRich(description),
        person_name: personName || null,
        hours_per_week: hours,
      })
      .select("slug")
      .single()

    if (error) {
      return fail(400, { createRoleError: error.message })
    }

    redirect(303, `/app/roles/${data.slug}`)
  },
}
