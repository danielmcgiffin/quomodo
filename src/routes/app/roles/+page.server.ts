import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  makeInitials,
  richToHtml,
} from "$lib/server/atlas"
import {
  createFlagForEntity,
  createRoleRecord,
  readRoleDraft,
} from "$lib/server/app/actions/shared"
import { mapRoleDirectory, type RoleDirectoryRow } from "$lib/server/app/mappers/directory"

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const [rolesResult, flagsResult] = await Promise.all([
    supabase
      .from("roles")
      .select("id, slug, name, description_rich, person_name, hours_per_week")
      .eq("org_id", context.orgId)
      .order("name"),
    supabase
      .from("flags")
      .select("id, target_id, target_path, flag_type, message, created_at")
      .eq("org_id", context.orgId)
      .eq("target_type", "role")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ])

  if (rolesResult.error) {
    throw kitError(500, `Failed to load roles: ${rolesResult.error.message}`)
  }
  if (flagsResult.error) {
    throw kitError(500, `Failed to load flags: ${flagsResult.error.message}`)
  }

  const roles = mapRoleDirectory({
    rows: (rolesResult.data ?? []) as RoleDirectoryRow[],
    makeInitials,
    richToHtml,
  })
  const roleById = new Map(roles.map((role) => [role.id, role]))
  const openFlags = ((flagsResult.data ?? []) as {
    id: string
    target_id: string
    target_path: string | null
    flag_type: string
    message: string
    created_at: string
  }[])
    .map((flag) => {
      const role = roleById.get(flag.target_id)
      if (!role) {
        return null
      }
      return {
        id: flag.id,
        flagType: flag.flag_type,
        message: flag.message,
        targetPath: flag.target_path,
        createdAt: new Date(flag.created_at).toLocaleString(),
        role: {
          slug: role.slug,
          name: role.name,
        },
      }
    })
    .filter((flag): flag is NonNullable<typeof flag> => flag !== null)

  return {
    org: context,
    roles,
    openFlags,
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
    const draft = readRoleDraft(formData)

    const failRole = (status: number, createRoleError: string) =>
      fail(status, {
        createRoleError,
        roleNameDraft: draft.name,
        roleDescriptionDraft: draft.description,
        rolePersonNameDraft: draft.personName,
        roleHoursPerWeekDraft: draft.hoursRaw,
      })
    const result = await createRoleRecord({
      supabase,
      orgId: context.orgId,
      draft,
    })

    if (!result.ok) {
      return failRole(result.status, result.message)
    }

    redirect(303, `/app/roles/${result.slug}`)
  },
  createFlag: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    const supabase = locals.supabase
    const formData = await request.formData()
    const result = await createFlagForEntity({
      context,
      supabase,
      formData,
      expectedTargetType: "role",
      targetTable: "roles",
      missingTargetMessage: "Role not found.",
    })

    if (!result.ok) {
      return fail(result.status, result.payload)
    }

    return { createFlagSuccess: true }
  },
}
