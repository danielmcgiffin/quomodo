import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  makeInitials,
  richToJsonString,
  richToHtml,
} from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { wrapAction } from "$lib/server/app/actions"
import {
  createFlagForEntity,
  deleteRoleRecord,
  readRoleDraft,
  updateRoleRecord,
} from "$lib/server/app/actions/shared"
import { mapSystemPortals } from "$lib/server/app/mappers/portals"
import {
  buildOpenFlagIndex,
  getDirectFlagData,
  getVisibleRelatedFlags,
  type OpenFlagIndexRow,
  type VisibleFlagTarget,
} from "$lib/server/app/mappers/flag-index"
import {
  mapActionsByProcess,
  mapRoleActionsPerformed,
  mapRoleOwnedProcesses,
  mapSystemsAccessed,
  type RoleDetailActionRow,
  type RoleDetailProcessRow,
} from "$lib/server/app/mappers/detail-relations"

type RoleRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
}
type SystemRow = {
  id: string
  slug: string
  name: string
  logo_url: string | null
}
export const load = async ({ params, locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const failLoad = (contextName: string, error: unknown) =>
    throwRuntime500({
      context: contextName,
      error,
      requestId: locals.requestId,
      route: `/app/roles/${params.slug}`,
    })

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, slug, name, description_rich")
    .eq("org_id", context.orgId)
    .eq("slug", params.slug)
    .maybeSingle()

  if (roleError) {
    failLoad("app.roles.detail.load.role", roleError)
  }
  if (!role) {
    throw kitError(404, "Role not found")
  }
  const roleRow = role as RoleRow

  const [processesResult, actionsResult, systemsResult, flagsResult] =
    await Promise.all([
      supabase
        .from("processes")
        .select("id, slug, name, owner_role_id")
        .eq("org_id", context.orgId)
        .order("name"),
      supabase
        .from("actions")
        .select(
          "id, process_id, sequence, description_rich, owner_role_id, system_id",
        )
        .eq("org_id", context.orgId)
        .eq("owner_role_id", roleRow.id)
        .order("sequence"),
      supabase
        .from("systems")
        .select("id, slug, name, logo_url")
        .eq("org_id", context.orgId)
        .order("name"),
      supabase
        .from("flags")
        .select(
          "id, target_type, target_id, target_path, flag_type, message, created_at",
        )
        .eq("org_id", context.orgId)
        .in("target_type", ["role", "process", "system"])
        .eq("status", "open")
        .order("created_at", { ascending: false }),
    ])

  if (processesResult.error) {
    failLoad("app.roles.detail.load.processes", processesResult.error)
  }
  if (actionsResult.error) {
    failLoad("app.roles.detail.load.actions", actionsResult.error)
  }
  if (systemsResult.error) {
    failLoad("app.roles.detail.load.systems", systemsResult.error)
  }
  if (flagsResult.error) {
    failLoad("app.roles.detail.load.flags", flagsResult.error)
  }

  const systems = mapSystemPortals((systemsResult.data ?? []) as SystemRow[])
  const systemById = new Map(systems.map((system) => [system.id, system]))
  const processes = mapRoleOwnedProcesses(
    (processesResult.data ?? []) as RoleDetailProcessRow[],
  )
  const ownedProcesses = processes.filter(
    (process) => process.ownerRoleId === roleRow.id,
  )
  const actionsPerformed = mapRoleActionsPerformed({
    rows: (actionsResult.data ?? []) as RoleDetailActionRow[],
    systemById,
    richToHtml,
  })
  const systemsAccessed = mapSystemsAccessed({
    systems,
    actionsPerformed,
  })
  const actionsByProcess = mapActionsByProcess({
    processes,
    actionsPerformed,
    roleId: roleRow.id,
  })
  const visibleTargets: VisibleFlagTarget[] = []

  for (const entry of actionsByProcess) {
    visibleTargets.push({
      targetType: "process",
      targetId: entry.process.id,
      label: entry.process.name,
      href: `/app/processes/${entry.process.slug}`,
    })
    for (const action of entry.actions) {
      if (!action.system) {
        continue
      }
      visibleTargets.push({
        targetType: "system",
        targetId: action.system.id,
        label: action.system.name,
        href: `/app/systems/${action.system.slug}`,
      })
    }
  }

  const visibleFlagIds = new Set([
    roleRow.id,
    ...visibleTargets.map((target) => target.targetId),
  ])
  const openFlagIndex = buildOpenFlagIndex(
    ((flagsResult.data ?? []) as OpenFlagIndexRow[]).filter((flag) =>
      visibleFlagIds.has(flag.target_id),
    ),
  )

  return {
    role: {
      id: roleRow.id,
      slug: roleRow.slug,
      name: roleRow.name,
      initials: makeInitials(roleRow.name),
      descriptionRich: richToJsonString(roleRow.description_rich),
      descriptionHtml: richToHtml(roleRow.description_rich),
    },
    ownedProcesses,
    actionsPerformed,
    systemsAccessed,
    actionsByProcess,
    roleDirectFlagData: getDirectFlagData(openFlagIndex, "role", roleRow.id),
    actionsRelatedFlagData: getVisibleRelatedFlags(
      openFlagIndex,
      visibleTargets,
    ),
    org: context,
  }
}

export const actions = {
  createFlag: wrapAction(async ({ context, supabase, formData }) => {
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
  }),

  updateRole: wrapAction(
    async ({ context, supabase, formData }) => {
      const roleId = String(formData.get("role_id") ?? "").trim()
      const draft = readRoleDraft(formData)

      const failUpdate = (status: number, updateRoleError: string) =>
        fail(status, {
          updateRoleError,
          roleNameDraft: draft.name,
          roleDescriptionDraft: draft.description,
          roleDescriptionRichDraft: draft.descriptionRichRaw,
        })

      const result = await updateRoleRecord({
        supabase,
        orgId: context.orgId,
        roleId,
        draft,
      })

      if (!result.ok) {
        return failUpdate(result.status, result.message)
      }

      redirect(303, `/app/roles/${result.slug}`)
    },
    {
      permission: canManageDirectory,
      forbiddenPayload: { updateRoleError: "Insufficient permissions." },
    },
  ),

  deleteRole: wrapAction(
    async ({ context, supabase, formData }) => {
      const roleId = String(formData.get("role_id") ?? "").trim()
      const result = await deleteRoleRecord({
        supabase,
        orgId: context.orgId,
        roleId,
      })

      if (!result.ok) {
        return fail(result.status, { deleteRoleError: result.message })
      }

      redirect(303, "/app/roles")
    },
    {
      permission: canManageDirectory,
      forbiddenPayload: { deleteRoleError: "Insufficient permissions." },
    },
  ),
}
