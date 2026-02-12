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
