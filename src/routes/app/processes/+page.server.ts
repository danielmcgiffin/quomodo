import { fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  canEditAtlas,
  ensureOrgContext,
  richToHtml,
} from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { wrapAction } from "$lib/server/app/actions"
import {
  createFlagForEntity,
  createProcessRecord,
  createRoleRecord,
  readRoleDraft,
  readProcessDraft,
} from "$lib/server/app/actions/shared"
import {
  mapRolePortals,
  mapSystemPortals,
  type RolePortalModel,
  type SystemPortalModel,
} from "$lib/server/app/mappers/portals"
import {
  buildOpenFlagIndex,
  getDirectFlagData,
  getVisibleRelatedFlags,
  type OpenFlagIndexRow,
  type VisibleFlagTarget,
} from "$lib/server/app/mappers/flag-index"
import {
  mapProcessCards,
  type ProcessActionLinkRow,
  type ProcessListRow,
} from "$lib/server/app/mappers/processes"

type RoleRow = { id: string; slug: string; name: string }
type SystemRow = {
  id: string
  slug: string
  name: string
  logo_url: string | null
}
export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const failLoad = (contextName: string, error: unknown) =>
    throwRuntime500({
      context: contextName,
      error,
      requestId: locals.requestId,
      route: "/app/processes",
      userId: context.userId,
    })

  const [
    rolesResult,
    systemsResult,
    processesResult,
    actionsResult,
    flagsResult,
  ] = await Promise.all([
    supabase
      .from("roles")
      .select("id, slug, name")
      .eq("org_id", context.orgId)
      .order("name"),
    supabase
      .from("systems")
      .select("id, slug, name, logo_url")
      .eq("org_id", context.orgId)
      .order("name"),
    supabase
      .from("processes")
      .select(
        "id, slug, name, description_rich, trigger, end_state, owner_role_id",
      )
      .eq("org_id", context.orgId)
      .order("name"),
    supabase
      .from("actions")
      .select("process_id, system_id, owner_role_id")
      .eq("org_id", context.orgId)
      .order("process_id"),
    supabase
      .from("flags")
      .select(
        "id, target_type, target_id, target_path, flag_type, message, created_at",
      )
      .eq("org_id", context.orgId)
      .in("target_type", ["process", "role", "system"])
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ])

  if (rolesResult.error) {
    failLoad("app.processes.load.roles", rolesResult.error)
  }
  if (systemsResult.error) {
    failLoad("app.processes.load.systems", systemsResult.error)
  }
  if (processesResult.error) {
    failLoad("app.processes.load.processes", processesResult.error)
  }
  if (actionsResult.error) {
    failLoad("app.processes.load.actions", actionsResult.error)
  }
  if (flagsResult.error) {
    failLoad("app.processes.load.flags", flagsResult.error)
  }

  const roles = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const systems = mapSystemPortals(
    (systemsResult.data ?? []) as unknown as SystemRow[],
  )
  const processRows = (processesResult.data ?? []) as ProcessListRow[]
  const roleById = new Map(
    roles.map((role: RolePortalModel) => [role.id, role]),
  )
  const systemById = new Map(
    systems.map((system: SystemPortalModel) => [system.id, system]),
  )

  const openFlagIndex = buildOpenFlagIndex(
    (flagsResult.data ?? []) as OpenFlagIndexRow[],
  )

  const processes = mapProcessCards({
    processRows,
    actionRows: (actionsResult.data ?? []) as ProcessActionLinkRow[],
    roleById,
    systemById,
    richToHtml,
  }).map((process) => {
    const visibleTargets: VisibleFlagTarget[] = [
      ...process.roleBadges.map((role) => ({
        targetType: "role" as const,
        targetId: role.id,
        label: role.name,
      })),
      ...process.systemBadges.map((system) => ({
        targetType: "system" as const,
        targetId: system.id,
        label: system.name,
      })),
    ]

    return {
      ...process,
      directFlagData: getDirectFlagData(openFlagIndex, "process", process.id),
      relatedFlagData: getVisibleRelatedFlags(openFlagIndex, visibleTargets),
    }
  })

  return {
    org: context,
    roles,
    processes,
  }
}

export const actions = {
  createProcess: wrapAction(
    async ({ context, supabase, formData }) => {
      const draft = readProcessDraft(formData)
      const result = await createProcessRecord({
        supabase,
        orgId: context.orgId,
        draft,
      })
      if (!result.ok) {
        return fail(result.status, { createProcessError: result.message })
      }
      redirect(303, `/app/processes/${result.slug}`)
    },
    {
      permission: canEditAtlas,
      forbiddenPayload: { createProcessError: "Insufficient permissions." },
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
      expectedTargetType: "process",
      targetTable: "processes",
      missingTargetMessage: "Process not found.",
    })
    if (!result.ok) {
      return fail(result.status, result.payload)
    }
    return { createFlagSuccess: true }
  }),
}
