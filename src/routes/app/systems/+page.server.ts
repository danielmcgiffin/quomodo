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
  buildOpenFlagIndex,
  getDirectFlagData,
  getVisibleRelatedFlags,
  type OpenFlagIndexRow,
  type VisibleFlagTarget,
} from "$lib/server/app/mappers/flag-index"
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

  const [rolesResult, systemsResult, flagsResult, actionsResult, processesResult] =
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
        .select(
          "id, target_type, target_id, target_path, flag_type, message, created_at",
        )
        .eq("org_id", context.orgId)
        .in("target_type", ["system", "role"])
        .eq("status", "open")
        .order("created_at", { ascending: false }),
      supabase
        .from("actions")
        .select("process_id, owner_role_id, system_id")
        .eq("org_id", context.orgId),
      supabase
        .from("processes")
        .select("id, slug, name")
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
  if (processesResult.error) {
    failLoad("app.systems.load.processes", processesResult.error)
  }

  const rolesResultData = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const roleById = new Map(rolesResultData.map((role) => [role.id, role]))

  const processById = new Map(
    ((processesResult.data ?? []) as { id: string; slug: string; name: string }[]).map(
      (process) => [process.id, process],
    ),
  )

  const systemsData = systemsResult.data ?? []
  const actionData = (actionsResult.data ?? []) as {
    process_id: string
    owner_role_id: string
    system_id: string
  }[]

  const openFlagIndex = buildOpenFlagIndex(
    (flagsResult.data ?? []) as OpenFlagIndexRow[],
  )

  const systems = mapSystemDirectory({
    rows: systemsData as SystemDirectoryRow[],
    roleById,
    processById,
    richToHtml,
    actionData,
  }).map((system) => {
    const visibleTargets: VisibleFlagTarget[] = system.ownerRole
      ? [
          {
            targetType: "role",
            targetId: system.ownerRole.id,
            label: system.ownerRole.name,
          },
        ]
      : []

    return {
      ...system,
      directFlagData: getDirectFlagData(openFlagIndex, "system", system.id),
      relatedFlagData: getVisibleRelatedFlags(openFlagIndex, visibleTargets),
    }
  })

  return {
    org: context,
    roles: rolesResultData,
    systems,
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
