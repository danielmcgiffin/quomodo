import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  richToHtml,
} from "$lib/server/atlas"
import {
  createFlagForEntity,
  createRoleRecord,
  createSystemRecord,
  readRoleDraft,
  readSystemDraft,
} from "$lib/server/app/actions/shared"
import { mapRolePortals } from "$lib/server/app/mappers/portals"

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

  const roles = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
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
    const draft = readSystemDraft(formData)

    const failSystem = (status: number, createSystemError: string) =>
      fail(status, {
        createSystemError,
        systemNameDraft: draft.name,
        systemDescriptionDraft: draft.description,
        systemLocationDraft: draft.location,
        systemUrlDraft: draft.url,
        selectedOwnerRoleIdDraft: draft.ownerRoleIdRaw,
      })
    const result = await createSystemRecord({
      supabase,
      orgId: context.orgId,
      draft,
    })

    if (!result.ok) {
      return failSystem(result.status, result.message)
    }

    redirect(303, `/app/systems/${result.slug}`)
  },
  createRole: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { createRoleError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
    const draft = readRoleDraft(formData)
    const result = await createRoleRecord({
      supabase,
      orgId: context.orgId,
      draft,
    })

    if (!result.ok) {
      return fail(result.status, { createRoleError: result.message })
    }

    return { createRoleSuccess: true, createdRoleId: result.id }
  },
  createFlag: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    const supabase = locals.supabase
    const formData = await request.formData()
    const result = await createFlagForEntity({
      context,
      supabase,
      formData,
      expectedTargetType: "system",
      targetTable: "systems",
      missingTargetMessage: "System not found.",
    })

    if (!result.ok) {
      return fail(result.status, result.payload)
    }

    return { createFlagSuccess: true }
  },
}
