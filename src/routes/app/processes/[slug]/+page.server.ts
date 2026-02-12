import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  canCreateFlagType,
  canEditAtlas,
  ensureOrgContext,
  isScFlagType,
  plainToRich,
  richToHtml,
  type ScFlagType,
} from "$lib/server/atlas"
import {
  createRoleRecord,
  createSystemRecord,
  readRoleDraft,
  readSystemDraft,
} from "$lib/server/app/actions/shared"
import { mapRolePortals, mapSystemPortals } from "$lib/server/app/mappers/portals"

type ProcessRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  trigger: string | null
  end_state: string | null
  owner_role_id: string | null
}
type ActionRow = {
  id: string
  process_id: string
  sequence: number
  description_rich: unknown
  owner_role_id: string
  system_id: string
}
type RoleRow = { id: string; slug: string; name: string }
type SystemRow = { id: string; slug: string; name: string }
type FlagRow = {
  id: string
  flag_type: string
  message: string
  created_at: string
}
type FlagTargetType = "process" | "action"

export const load = async ({ params, locals, url }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

  const { data: process, error: processError } = await supabase
    .from("processes")
    .select(
      "id, slug, name, description_rich, trigger, end_state, owner_role_id",
    )
    .eq("org_id", context.orgId)
    .eq("slug", params.slug)
    .maybeSingle()

  if (processError) {
    throw kitError(500, `Failed to load process: ${processError.message}`)
  }
  if (!process) {
    throw kitError(404, "Process not found")
  }
  const processRow = process as ProcessRow

  const [actionsResult, rolesResult, systemsResult, flagsResult] =
    await Promise.all([
      supabase
        .from("actions")
        .select(
          "id, process_id, sequence, description_rich, owner_role_id, system_id",
        )
        .eq("org_id", context.orgId)
        .eq("process_id", process.id)
        .order("sequence"),
      supabase
        .from("roles")
        .select("id, slug, name")
        .eq("org_id", context.orgId)
        .order("name"),
      supabase
        .from("systems")
        .select("id, slug, name")
        .eq("org_id", context.orgId)
        .order("name"),
      supabase
        .from("flags")
        .select("id, flag_type, message, created_at")
        .eq("org_id", context.orgId)
        .eq("target_type", "process")
        .eq("target_id", processRow.id)
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
  if (systemsResult.error) {
    throw kitError(
      500,
      `Failed to load systems: ${systemsResult.error.message}`,
    )
  }
  if (flagsResult.error) {
    throw kitError(500, `Failed to load flags: ${flagsResult.error.message}`)
  }

  const roles = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const systems = mapSystemPortals((systemsResult.data ?? []) as SystemRow[])
  const roleById = new Map(roles.map((role: { id: string }) => [role.id, role]))
  const systemById = new Map(
    systems.map((system: { id: string }) => [system.id, system]),
  )

  const actions = ((actionsResult.data ?? []) as ActionRow[]).map((row) => ({
    id: row.id,
    processId: row.process_id,
    sequence: row.sequence,
    descriptionHtml: richToHtml(row.description_rich),
    ownerRole: roleById.get(row.owner_role_id),
    system: systemById.get(row.system_id),
  }))

  return {
    process: {
      id: processRow.id,
      slug: processRow.slug,
      name: processRow.name,
      descriptionHtml: richToHtml(processRow.description_rich),
      trigger: processRow.trigger ?? "",
      endState: processRow.end_state ?? "",
      ownerRole: processRow.owner_role_id
        ? (roleById.get(processRow.owner_role_id) ?? null)
        : null,
    },
    actions,
    allRoles: roles,
    allSystems: systems,
    processFlags: ((flagsResult.data ?? []) as FlagRow[]).map((flag) => ({
      id: flag.id,
      flagType: flag.flag_type,
      message: flag.message,
      createdAt: new Date(flag.created_at).toLocaleString(),
    })),
    viewerRole: context.membershipRole,
    highlightedFlagId: url.searchParams.get("flagId") ?? null,
  }
}

export const actions = {
  createAction: async ({ request, params, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canEditAtlas(context.membershipRole)) {
      return fail(403, { createActionError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()

    const description = String(formData.get("description") ?? "").trim()
    const ownerRoleId = String(formData.get("owner_role_id") ?? "").trim()
    const systemId = String(formData.get("system_id") ?? "").trim()
    const actionId = String(formData.get("action_id") ?? "").trim()
    const sequenceRaw = String(formData.get("sequence") ?? "").trim()

    const failAction = (status: number, createActionError: string) =>
      fail(status, {
        createActionError,
        actionDescriptionDraft: description,
        selectedOwnerRoleId: ownerRoleId,
        selectedSystemId: systemId,
        editingActionId: actionId || null,
      })

    if (!description || !ownerRoleId || !systemId) {
      return failAction(400, "Description, role, and system are required.")
    }

    const { data: process, error: processError } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("slug", params.slug)
      .maybeSingle()

    if (processError || !process) {
      return failAction(404, "Process not found.")
    }

    if (actionId) {
      const { data: actionTarget, error: actionTargetError } = await supabase
        .from("actions")
        .select("id")
        .eq("org_id", context.orgId)
        .eq("process_id", process.id)
        .eq("id", actionId)
        .maybeSingle()

      if (actionTargetError || !actionTarget) {
        return failAction(404, "Action not found.")
      }

      const { error: updateError } = await supabase
        .from("actions")
        .update({
          description_rich: plainToRich(description),
          owner_role_id: ownerRoleId,
          system_id: systemId,
        })
        .eq("org_id", context.orgId)
        .eq("id", actionId)

      if (updateError) {
        return failAction(400, updateError.message)
      }

      redirect(303, `/app/processes/${params.slug}`)
    }

    let sequence = Number(sequenceRaw)
    if (Number.isNaN(sequence) || sequence < 1) {
      const { data: maxRow } = await supabase
        .from("actions")
        .select("sequence")
        .eq("org_id", context.orgId)
        .eq("process_id", process.id)
        .order("sequence", { ascending: false })
        .limit(1)
        .maybeSingle()
      sequence = (maxRow?.sequence ?? 0) + 1
    }

    const { error } = await supabase.from("actions").insert({
      org_id: context.orgId,
      process_id: process.id,
      sequence,
      description_rich: plainToRich(description),
      owner_role_id: ownerRoleId,
      system_id: systemId,
    })

    if (error) {
      return failAction(400, error.message)
    }

    redirect(303, `/app/processes/${params.slug}`)
  },

  createRole: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { createRoleError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
    const roleDraft = readRoleDraft(formData)
    const actionDescriptionDraft = String(
      formData.get("action_description_draft") ?? "",
    )
    const result = await createRoleRecord({
      supabase,
      orgId: context.orgId,
      draft: roleDraft,
    })

    if (!result.ok) {
      return fail(result.status, {
        createRoleError: result.message,
        actionDescriptionDraft,
      })
    }

    return {
      createRoleSuccess: true,
      createdRoleId: result.id,
      actionDescriptionDraft,
    }
  },

  createSystem: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { createSystemError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
    const systemDraft = readSystemDraft(formData)
    const actionDescriptionDraft = String(
      formData.get("action_description_draft") ?? "",
    )
    const result = await createSystemRecord({
      supabase,
      orgId: context.orgId,
      draft: systemDraft,
    })

    if (!result.ok) {
      return fail(result.status, {
        createSystemError: result.message,
        actionDescriptionDraft,
      })
    }

    return {
      createSystemSuccess: true,
      createdSystemId: result.id,
      actionDescriptionDraft,
    }
  },

  createFlag: async ({ request, params, locals }) => {
    const context = await ensureOrgContext(locals)
    const supabase = locals.supabase
    const formData = await request.formData()

    const targetTypeRaw = String(formData.get("target_type") ?? "").trim()
    const targetId = String(formData.get("target_id") ?? "").trim()
    const message = String(formData.get("message") ?? "").trim()
    const flagTypeRaw = String(formData.get("flag_type") ?? "comment").trim()
    const targetPath = String(formData.get("target_path") ?? "").trim()

    const failForTarget = (status: number, createFlagError: string) =>
      fail(status, {
        createFlagError,
        createFlagTargetType: targetTypeRaw,
        createFlagTargetId: targetId,
      })

    if (!targetId) {
      return failForTarget(400, "Invalid flag target.")
    }
    if (targetTypeRaw !== "process" && targetTypeRaw !== "action") {
      return failForTarget(400, "Invalid flag target.")
    }
    if (!isScFlagType(flagTypeRaw)) {
      return failForTarget(400, "Invalid flag type.")
    }

    const targetType: FlagTargetType = targetTypeRaw
    const flagType: ScFlagType = flagTypeRaw

    if (!message) {
      return failForTarget(400, "Flag message is required.")
    }
    if (!canCreateFlagType(context.membershipRole, flagType)) {
      return failForTarget(403, "Members can only create comment flags.")
    }

    const { data: process, error: processError } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("slug", params.slug)
      .maybeSingle()

    if (processError || !process) {
      return failForTarget(404, "Process not found.")
    }

    if (targetType === "process" && process.id !== targetId) {
      return failForTarget(400, "Invalid process target.")
    }

    if (targetType === "action") {
      const { data: actionTarget, error: actionTargetError } = await supabase
        .from("actions")
        .select("id")
        .eq("org_id", context.orgId)
        .eq("process_id", process.id)
        .eq("id", targetId)
        .maybeSingle()

      if (actionTargetError || !actionTarget) {
        return failForTarget(404, "Action not found.")
      }
    }

    const { error } = await supabase.from("flags").insert({
      org_id: context.orgId,
      target_type: targetType,
      target_id: targetId,
      target_path: targetPath || null,
      flag_type: flagType,
      message,
      created_by: context.userId,
    })

    if (error) {
      return failForTarget(400, error.message)
    }

    return { createFlagSuccess: true }
  },
}
