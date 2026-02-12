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
import { mapSystemDirectory, type SystemDirectoryRow } from "$lib/server/app/mappers/directory"

type RoleRow = { id: string; slug: string; name: string }
export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

  const [rolesResult, systemsResult, flagsResult] = await Promise.all([
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
    supabase
      .from("flags")
      .select("id, target_id, target_path, flag_type, message, created_at")
      .eq("org_id", context.orgId)
      .eq("target_type", "system")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
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
  if (flagsResult.error) {
    throw kitError(500, `Failed to load flags: ${flagsResult.error.message}`)
  }

  const roles = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const roleById = new Map(roles.map((role) => [role.id, role]))

  const systems = mapSystemDirectory({
    rows: (systemsResult.data ?? []) as SystemDirectoryRow[],
    roleById,
    richToHtml,
  })
  const systemById = new Map(systems.map((system) => [system.id, system]))
  const openFlags = ((flagsResult.data ?? []) as {
    id: string
    target_id: string
    target_path: string | null
    flag_type: string
    message: string
    created_at: string
  }[])
    .map((flag) => {
      const system = systemById.get(flag.target_id)
      if (!system) {
        return null
      }
      return {
        id: flag.id,
        flagType: flag.flag_type,
        message: flag.message,
        targetPath: flag.target_path,
        createdAt: new Date(flag.created_at).toLocaleString(),
        system: {
          slug: system.slug,
          name: system.name,
        },
      }
    })
    .filter((flag): flag is NonNullable<typeof flag> => flag !== null)

  return {
    org: context,
    roles,
    systems,
    openFlags,
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
