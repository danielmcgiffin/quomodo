import { fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  makeInitials,
  richToHtml,
} from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { wrapAction } from "$lib/server/app/actions"
import {
  createFlagForEntity,
  createRoleRecord,
  readRoleDraft,
} from "$lib/server/app/actions/shared"
import {
  mapRoleDirectory,
  type RoleDirectoryRow,
} from "$lib/server/app/mappers/directory"
import {
  buildOpenFlagIndex,
  getDirectFlagData,
  type OpenFlagIndexRow,
} from "$lib/server/app/mappers/flag-index"

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const failLoad = (contextName: string, error: unknown) =>
    throwRuntime500({
      context: contextName,
      error,
      requestId: locals.requestId,
      route: "/app/roles",
    })
  const [rolesResult, flagsResult, processesResult, actionsResult] =
    await Promise.all([
      supabase
        .from("roles")
        .select("id, slug, name, description_rich")
        .eq("org_id", context.orgId)
        .order("name"),
      supabase
        .from("flags")
        .select(
          "id, target_type, target_id, target_path, flag_type, message, created_at",
        )
        .eq("org_id", context.orgId)
        .eq("target_type", "role")
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      supabase
        .from("processes")
        .select("id, owner_role_id")
        .eq("org_id", context.orgId),
      supabase
        .from("actions")
        .select("process_id, owner_role_id, system_id")
        .eq("org_id", context.orgId),
    ])

  if (rolesResult.error) {
    failLoad("app.roles.load.roles", rolesResult.error)
  }
  if (flagsResult.error) {
    failLoad("app.roles.load.flags", flagsResult.error)
  }
  if (processesResult.error) {
    failLoad("app.roles.load.processes", processesResult.error)
  }
  if (actionsResult.error) {
    failLoad("app.roles.load.actions", actionsResult.error)
  }

  const rolesData = (rolesResult.data ?? []) as unknown as RoleDirectoryRow[]
  const processData = (processesResult.data ?? []) as {
    id: string
    owner_role_id: string | null
  }[]
  const actionData = (actionsResult.data ?? []) as {
    process_id: string
    owner_role_id: string
    system_id: string
  }[]
  const openFlagIndex = buildOpenFlagIndex(
    (flagsResult.data ?? []) as OpenFlagIndexRow[],
  )

  const roles = mapRoleDirectory({
    rows: rolesData,
    makeInitials,
    richToHtml,
    processData,
    actionData,
  }).map((role) => ({
    ...role,
    directFlagData: getDirectFlagData(openFlagIndex, "role", role.id),
  }))

  return {
    org: context,
    roles,
  }
}

export const actions = {
  createRole: wrapAction(
    async ({ context, supabase, formData }) => {
      const draft = readRoleDraft(formData)
      const failRole = (status: number, createRoleError: string) =>
        fail(status, {
          createRoleError,
          roleNameDraft: draft.name,
          roleDescriptionDraft: draft.description,
          roleDescriptionRichDraft: draft.descriptionRichRaw,
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
    {
      permission: canManageDirectory,
      forbiddenPayload: { createRoleError: "Insufficient permissions." },
    },
  ),
  createFlag: wrapAction(
    async ({ context, supabase, formData }) => {
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
    { forbiddenPayload: { createFlagError: "Insufficient permissions." } },
  ),
}
