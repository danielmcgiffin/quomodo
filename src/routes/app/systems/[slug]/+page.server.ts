import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  richToHtml,
} from "$lib/server/atlas"
import {
  createFlagForEntity,
  deleteSystemRecord,
  readSystemDraft,
  updateSystemRecord,
} from "$lib/server/app/actions/shared"
import { mapRolePortals, mapSystemPortals } from "$lib/server/app/mappers/portals"
import {
  filterProcessesUsing,
  filterRolesUsing,
  mapOpenFlags,
  mapSystemActionsUsing,
  type OpenFlagRow,
  type SystemDetailActionRow,
} from "$lib/server/app/mappers/detail-relations"

type SystemRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  location: string | null
  url: string | null
  owner_role_id: string | null
}
type RoleRow = { id: string; slug: string; name: string }
type ProcessRow = { id: string; slug: string; name: string }
type SystemFlagRow = {
  id: string
  flag_type: string
  message: string
  target_path: string | null
  created_at: string
}

export const load = async ({ params, locals, url }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

  const { data: system, error: systemError } = await supabase
    .from("systems")
    .select("id, slug, name, description_rich, location, url, owner_role_id")
    .eq("org_id", context.orgId)
    .eq("slug", params.slug)
    .maybeSingle()

  if (systemError) {
    throw kitError(500, `Failed to load system: ${systemError.message}`)
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
        .select("id, flag_type, message, target_path, created_at")
        .eq("org_id", context.orgId)
        .eq("target_type", "system")
        .eq("target_id", systemRow.id)
        .eq("status", "open")
        .order("created_at", { ascending: false }),
    ])

  if (actionsResult.error) {
    throw kitError(
      500,
      `Failed to load actions: ${actionsResult.error.message}`,
    )
  }
  if (rolesResult.error) {
    throw kitError(500, `Failed to load roles: ${rolesResult.error.message}`)
  }
  if (processesResult.error) {
    throw kitError(
      500,
      `Failed to load processes: ${processesResult.error.message}`,
    )
  }
  if (flagsResult.error) {
    throw kitError(500, `Failed to load flags: ${flagsResult.error.message}`)
  }

  const roles = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const roleById = new Map(roles.map((role) => [role.id, role]))
  const processes = mapSystemPortals((processesResult.data ?? []) as ProcessRow[])
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
  const systemFlagRows = (flagsResult.data ?? []) as SystemFlagRow[]
  const openFlags = systemFlagRows.map((flag) => ({
    id: flag.id,
    flagType: flag.flag_type,
    message: flag.message,
    targetPath: flag.target_path,
    createdAt: new Date(flag.created_at).toLocaleString(),
    system: {
      slug: systemRow.slug,
      name: systemRow.name,
    },
  }))

  return {
    org: context,
    system: {
      id: systemRow.id,
      slug: systemRow.slug,
      name: systemRow.name,
      descriptionHtml: richToHtml(systemRow.description_rich),
      location: systemRow.location ?? "",
      url: systemRow.url ?? "",
      ownerRole: systemRow.owner_role_id
        ? (roleById.get(systemRow.owner_role_id) ?? null)
        : null,
    },
    allRoles: roles,
    actionsUsing,
    processesUsing,
    rolesUsing,
    systemFlags: mapOpenFlags(systemFlagRows as OpenFlagRow[]),
    openFlags,
    highlightedFlagId: url.searchParams.get("flagId") ?? null,
  }
}

export const actions = {
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

  updateSystem: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { updateSystemError: "Insufficient permissions." })
    }

    const supabase = locals.supabase
    const formData = await request.formData()
    const systemId = String(formData.get("system_id") ?? "").trim()
    const draft = readSystemDraft(formData)

    const failSystem = (status: number, updateSystemError: string) =>
      fail(status, {
        updateSystemError,
        systemNameDraft: draft.name,
        systemDescriptionDraft: draft.description,
        systemLocationDraft: draft.location,
        systemUrlDraft: draft.url,
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

  deleteSystem: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { deleteSystemError: "Insufficient permissions." })
    }

    const supabase = locals.supabase
    const formData = await request.formData()
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
}
