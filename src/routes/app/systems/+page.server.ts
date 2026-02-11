import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  canCreateFlagType,
  ensureOrgContext,
  ensureUniqueSlug,
  makeInitials,
  plainToRich,
  richToHtml,
} from "$lib/server/atlas"

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
  const supabase = locals.supabase

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
    throw kitError(
      500,
      `Failed to load systems: ${systemsResult.error.message}`,
    )
  }

  const roles = ((rolesResult.data ?? []) as RoleRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    initials: makeInitials(row.name),
  }))
  const roleById = new Map(roles.map((role: { id: string }) => [role.id, role]))

  const systems = ((systemsResult.data ?? []) as SystemRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    descriptionHtml: richToHtml(row.description_rich),
    location: row.location ?? "",
    url: row.url ?? "",
    ownerRole: row.owner_role_id
      ? (roleById.get(row.owner_role_id) ?? null)
      : null,
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
    const supabase = locals.supabase
    const formData = await request.formData()

    const name = String(formData.get("name") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    const location = String(formData.get("location") ?? "").trim()
    const url = String(formData.get("url") ?? "").trim()
    const ownerRoleIdRaw = String(formData.get("owner_role_id") ?? "").trim()

    if (!name) {
      return fail(400, { createSystemError: "System name is required." })
    }

    const slug = await ensureUniqueSlug(
      supabase,
      "systems",
      context.orgId,
      name,
    )
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
      .select("id")
      .single()

    if (error) {
      return fail(400, { createRoleError: error.message })
    }

    return { createRoleSuccess: true, createdRoleId: data.id }
  },
  createFlag: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    const supabase = locals.supabase
    const formData = await request.formData()

    const targetType = String(formData.get("target_type") ?? "").trim()
    const targetId = String(formData.get("target_id") ?? "").trim()
    const message = String(formData.get("message") ?? "").trim()
    const flagType = String(formData.get("flag_type") ?? "comment").trim()
    const targetPath = String(formData.get("target_path") ?? "").trim()

    const failForTarget = (status: number, createFlagError: string) =>
      fail(status, {
        createFlagError,
        createFlagTargetType: targetType,
        createFlagTargetId: targetId,
      })

    if (targetType !== "system" || !targetId) {
      return failForTarget(400, "Invalid flag target.")
    }
    if (!message) {
      return failForTarget(400, "Flag message is required.")
    }
    if (!canCreateFlagType(context.membershipRole, flagType)) {
      return failForTarget(403, "Members can only create comment flags.")
    }

    const { data: system, error: systemError } = await supabase
      .from("systems")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("id", targetId)
      .maybeSingle()

    if (systemError || !system) {
      return failForTarget(404, "System not found.")
    }

    const { error } = await supabase.from("flags").insert({
      org_id: context.orgId,
      target_type: "system",
      target_id: system.id,
      target_path: targetPath || null,
      flag_type: flagType,
      message,
      created_by: context.userId,
    })

    if (error) {
      return failForTarget(400, error.message)
    }

    return { createFlagSuccess: true }
  },
}
