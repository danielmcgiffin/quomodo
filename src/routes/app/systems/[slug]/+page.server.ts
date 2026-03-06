import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  richToJsonString,
  richToHtml,
} from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { wrapAction } from "$lib/server/app/actions"
import {
  createFlagForEntity,
  deleteSystemRecord,
  readSystemDraft,
  updateSystemRecord,
} from "$lib/server/app/actions/shared"
import {
  mapRolePortals,
  mapSystemPortals,
} from "$lib/server/app/mappers/portals"
import {
  buildOpenFlagIndex,
  getDirectFlagData,
  getVisibleRelatedFlags,
  type OpenFlagIndexRow,
  type VisibleFlagTarget,
} from "$lib/server/app/mappers/flag-index"
import {
  filterProcessesUsing,
  filterRolesUsing,
  mapSystemActionsUsing,
  type SystemDetailActionRow,
} from "$lib/server/app/mappers/detail-relations"

type SystemRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  location: string | null
  owner_role_id: string | null
  logo_url: string | null
}
type RoleRow = { id: string; slug: string; name: string }
export const load = async ({ params, locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const failLoad = (contextName: string, error: unknown) =>
    throwRuntime500({
      context: contextName,
      error,
      requestId: locals.requestId,
      route: `/app/systems/${params.slug}`,
    })

  const { data: system, error: systemError } = await supabase
    .from("systems")
    .select(
      "id, slug, name, description_rich, location, owner_role_id, logo_url",
    )
    .eq("org_id", context.orgId)
    .eq("slug", params.slug)
    .maybeSingle()

  if (systemError) {
    failLoad("app.systems.detail.load.system", systemError)
  }
  if (!system) {
    throw kitError(404, "System not found")
  }
  const systemRow = system as SystemRow

  const [actionsResult, rolesResult, processesResult, flagsResult] =
    await Promise.all([
      supabase
        .from("actions")
        .select(
          "id, process_id, sequence, description_rich, owner_role_id, system_id",
        )
        .eq("org_id", context.orgId)
        .eq("system_id", systemRow.id)
        .order("sequence"),
      supabase
        .from("roles")
        .select("id, slug, name")
        .eq("org_id", context.orgId)
        .order("name"),
      supabase
        .from("processes")
        .select("id, slug, name")
        .eq("org_id", context.orgId)
        .order("name"),
      supabase
        .from("flags")
        .select(
          "id, target_type, target_id, target_path, flag_type, message, created_at",
        )
        .eq("org_id", context.orgId)
        .in("target_type", ["system", "process", "role"])
        .eq("status", "open")
        .order("created_at", { ascending: false }),
    ])

  if (actionsResult.error) {
    failLoad("app.systems.detail.load.actions", actionsResult.error)
  }
  if (rolesResult.error) {
    failLoad("app.systems.detail.load.roles", rolesResult.error)
  }
  if (processesResult.error) {
    failLoad("app.systems.detail.load.processes", processesResult.error)
  }
  if (flagsResult.error) {
    failLoad("app.systems.detail.load.flags", flagsResult.error)
  }

  const roles = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const roleById = new Map(roles.map((role) => [role.id, role]))
  const processes = mapSystemPortals(
    (processesResult.data ?? []).map((p) => ({ ...p, logo_url: null })),
  )
  const actionsUsing = mapSystemActionsUsing({
    rows: (actionsResult.data ?? []) as SystemDetailActionRow[],
    roleById,
    richToHtml,
  })
  const processesUsing = filterProcessesUsing({
    processes,
    actionsUsing,
  })
  const rolesUsing = filterRolesUsing({
    roles,
    actionsUsing,
  })
  const visibleTargets: VisibleFlagTarget[] = []

  for (const process of processesUsing) {
    visibleTargets.push({
      targetType: "process",
      targetId: process.id,
      label: process.name,
    })
  }
  for (const action of actionsUsing) {
    if (!action.ownerRole) {
      continue
    }
    visibleTargets.push({
      targetType: "role",
      targetId: action.ownerRole.id,
      label: action.ownerRole.name,
    })
  }
  for (const role of rolesUsing) {
    visibleTargets.push({
      targetType: "role",
      targetId: role.id,
      label: role.name,
    })
  }

  const visibleFlagIds = new Set([
    systemRow.id,
    ...visibleTargets.map((target) => target.targetId),
  ])
  const openFlagIndex = buildOpenFlagIndex(
    ((flagsResult.data ?? []) as OpenFlagIndexRow[]).filter((flag) =>
      visibleFlagIds.has(flag.target_id),
    ),
  )

  return {
    org: context,
    system: {
      id: systemRow.id,
      slug: systemRow.slug,
      name: systemRow.name,
      descriptionRich: richToJsonString(systemRow.description_rich),
      descriptionHtml: richToHtml(systemRow.description_rich),
      location: systemRow.location ?? "",
      ownerRole: systemRow.owner_role_id
        ? (roleById.get(systemRow.owner_role_id) ?? null)
        : null,
    },
    allRoles: roles,
    actionsUsing,
    processesUsing,
    rolesUsing,
    systemDirectFlagData: getDirectFlagData(
      openFlagIndex,
      "system",
      systemRow.id,
    ),
    systemRelatedFlagData: getVisibleRelatedFlags(
      openFlagIndex,
      visibleTargets,
    ),
  }
}

export const actions = {
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

  updateSystem: wrapAction(
    async ({ context, supabase, formData }) => {
      const systemId = String(formData.get("system_id") ?? "").trim()
      const draft = readSystemDraft(formData)

      const failSystem = (status: number, updateSystemError: string) =>
        fail(status, {
          updateSystemError,
          systemNameDraft: draft.name,
          systemDescriptionDraft: draft.description,
          systemDescriptionRichDraft: draft.descriptionRichRaw,
          systemLocationDraft: draft.location,
          selectedOwnerRoleIdDraft: draft.ownerRoleIdRaw,
        })

      const result = await updateSystemRecord({
        supabase,
        orgId: context.orgId,
        systemId,
        draft,
      })

      if (!result.ok) {
        return failSystem(result.status, result.message)
      }

      redirect(303, `/app/systems/${result.slug}`)
    },
    {
      permission: canManageDirectory,
      forbiddenPayload: { updateSystemError: "Insufficient permissions." },
    },
  ),

  deleteSystem: wrapAction(
    async ({ context, supabase, formData }) => {
      const systemId = String(formData.get("system_id") ?? "").trim()
      const result = await deleteSystemRecord({
        supabase,
        orgId: context.orgId,
        systemId,
      })

      if (!result.ok) {
        return fail(result.status, { deleteSystemError: result.message })
      }

      redirect(303, "/app/systems")
    },
    {
      permission: canManageDirectory,
      forbiddenPayload: { deleteSystemError: "Insufficient permissions." },
    },
  ),
}
