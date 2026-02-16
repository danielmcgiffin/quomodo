import { fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  richToHtml,
} from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { wrapAction } from "$lib/server/app/actions"
import {
  createFlagForEntity,
  createRoleRecord,
  createSystemRecord,
  readRoleDraft,
  readSystemDraft,
} from "$lib/server/app/actions/shared"
import { mapRolePortals } from "$lib/server/app/mappers/portals"
import {
  mapSystemDirectory,
  type SystemDirectoryRow,
} from "$lib/server/app/mappers/directory"

type RoleRow = { id: string; slug: string; name: string }
export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const failLoad = (contextName: string, error: unknown) =>
    throwRuntime500({
      context: contextName,
      error,
      requestId: locals.requestId,
      route: "/app/systems",
    })

  const [rolesResult, systemsResult, flagsResult, actionsResult] =
    await Promise.all([
      supabase
        .from("roles")
        .select("id, slug, name")
        .eq("org_id", context.orgId)
        .order("name"),
      supabase
        .from("systems")
        .select(
          "id, slug, name, description_rich, location, owner_role_id, logo_url",
        )
        .eq("org_id", context.orgId)
        .order("name"),
      supabase
        .from("flags")
        .select("id, target_id, target_path, flag_type, message, created_at")
        .eq("org_id", context.orgId)
        .eq("target_type", "system")
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      supabase
        .from("actions")
        .select("process_id, owner_role_id, system_id")
        .eq("org_id", context.orgId),
    ])

  if (rolesResult.error) {
    failLoad("app.systems.load.roles", rolesResult.error)
  }
  if (systemsResult.error) {
    failLoad("app.systems.load.systems", systemsResult.error)
  }
  if (flagsResult.error) {
    failLoad("app.systems.load.flags", flagsResult.error)
  }
  if (actionsResult.error) {
    failLoad("app.systems.load.actions", actionsResult.error)
  }

  const rolesResultData = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const roleById = new Map(rolesResultData.map((role) => [role.id, role]))

  const systemsData = systemsResult.data ?? []
  const actionData = (actionsResult.data ?? []) as {
    process_id: string
    owner_role_id: string
    system_id: string
  }[]

  const systems = mapSystemDirectory({
    rows: systemsData as SystemDirectoryRow[],
    roleById,
    richToHtml,
    actionData,
  })
  const systemById = new Map(systems.map((system) => [system.id, system]))
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
    roles: rolesResultData,
    systems,
    openFlags,
  }
}

export const actions = {
  createSystem: wrapAction(
    async ({ context, supabase, formData }) => {
      const draft = readSystemDraft(formData)
      const failSystem = (status: number, createSystemError: string) =>
        fail(status, {
          createSystemError,
          systemNameDraft: draft.name,
          systemDescriptionDraft: draft.description,
          systemDescriptionRichDraft: draft.descriptionRichRaw,
          systemLocationDraft: draft.location,
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
    {
      permission: canManageDirectory,
      forbiddenPayload: { createSystemError: "Insufficient permissions." },
    },
  ),
  createRole: wrapAction(
    async ({ context, supabase, formData }) => {
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
    {
      permission: canManageDirectory,
      forbiddenPayload: { createRoleError: "Insufficient permissions." },
    },
  ),
  createFlag: wrapAction(async ({ context, supabase, formData }) => {
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
  }),
}
