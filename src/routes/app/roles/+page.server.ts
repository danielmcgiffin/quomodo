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
  const [rolesResult, flagsResult, processesResult, actionsResult] = await Promise.all([
    supabase
      .from("roles")
      .select("id, slug, name, description_rich, reports_to")
      .eq("org_id", context.orgId)
      .order("name"),
    supabase
      .from("flags")
      .select("id, target_id, target_path, flag_type, message, created_at")
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

  const rolesData = (rolesResult.data ?? []) as RoleDirectoryRow[]
  const processData = (processesResult.data ?? []) as { id: string, owner_role_id: string | null }[]
  const actionData = (actionsResult.data ?? []) as { process_id: string, owner_role_id: string, system_id: string }[]

  const roles = mapRoleDirectory({
    rows: rolesData,
    makeInitials,
    richToHtml,
    processData,
    actionData,
  })
  const roleById = new Map(roles.map((role) => [role.id, role]))
  const openFlags = (
    (flagsResult.data ?? []) as {
      id: string
      target_id: string
      target_path: string | null
      flag_type: string
      message: string
      created_at: string
    }[]
  )
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
