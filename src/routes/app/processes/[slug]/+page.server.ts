import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  canCreateFlagType,
  canEditAtlas,
  ensureOrgContext,
  ensureUniqueSlug,
  makeInitials,
  plainToRich,
  richToHtml,
} from "$lib/server/atlas"

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
type FlagRow = { id: string; flag_type: string; message: string }

export const load = async ({ params, locals }) => {
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
        .select("id, flag_type, message")
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

  const roles = ((rolesResult.data ?? []) as RoleRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    initials: makeInitials(row.name),
  }))
  const systems = ((systemsResult.data ?? []) as SystemRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
  }))
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

  const linkedRoleIds = new Set<string>()
  if (processRow.owner_role_id) {
    linkedRoleIds.add(processRow.owner_role_id)
  }
  for (const action of (actionsResult.data ?? []) as ActionRow[]) {
    linkedRoleIds.add(action.owner_role_id)
  }
  const linkedSystemIds = new Set<string>()
  for (const action of (actionsResult.data ?? []) as ActionRow[]) {
    linkedSystemIds.add(action.system_id)
  }

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
    roles: roles.filter((role: { id: string }) => linkedRoleIds.has(role.id)),
    systems: systems.filter((system: { id: string }) =>
      linkedSystemIds.has(system.id),
    ),
    allRoles: roles,
    allSystems: systems,
    processFlags: ((flagsResult.data ?? []) as FlagRow[]).map((flag) => ({
      id: flag.id,
      flagType: flag.flag_type,
      message: flag.message,
    })),
    viewerRole: context.membershipRole,
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
    const sequenceRaw = String(formData.get("sequence") ?? "").trim()

    if (!description || !ownerRoleId || !systemId) {
      return fail(400, {
        createActionError: "Description, role, and system are required.",
      })
    }

    const { data: process, error: processError } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("slug", params.slug)
      .maybeSingle()

    if (processError || !process) {
      return fail(404, { createActionError: "Process not found." })
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
      return fail(400, { createActionError: error.message })
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

    const name = String(formData.get("name") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    const personName = String(formData.get("person_name") ?? "").trim()
    const hoursRaw = String(formData.get("hours_per_week") ?? "").trim()

    if (!name) {
      return fail(400, { createRoleError: "Role name is required." })
    }

    const hours = hoursRaw ? Number(hoursRaw) : null
    if (hoursRaw && Number.isNaN(hours)) {
      return fail(400, { createRoleError: "Hours per week must be numeric." })
    }

    const slug = await ensureUniqueSlug(supabase, "roles", context.orgId, name)
    const { data, error } = await supabase
      .from("roles")
      .insert({
        org_id: context.orgId,
        slug,
        name,
        description_rich: plainToRich(description),
        person_name: personName || null,
        hours_per_week: hours,
      })
      .select("id")
      .single()

    if (error) {
      return fail(400, { createRoleError: error.message })
    }

    return { createRoleSuccess: true, createdRoleId: data.id }
  },

  createSystem: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { createSystemError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()

    const name = String(formData.get("name") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    const location = String(formData.get("location") ?? "").trim()
    const url = String(formData.get("url") ?? "").trim()
    const ownerRoleIdRaw = String(formData.get("owner_role_id") ?? "").trim()

    if (!name) {
      return fail(400, { createSystemError: "System name is required." })
    }

    const slug = await ensureUniqueSlug(
      supabase,
      "systems",
      context.orgId,
      name,
    )
    const ownerRoleId = ownerRoleIdRaw || null

    const { data, error } = await supabase
      .from("systems")
      .insert({
        org_id: context.orgId,
        slug,
        name,
        description_rich: plainToRich(description),
        location: location || null,
        url: url || null,
        owner_role_id: ownerRoleId,
      })
      .select("id")
      .single()

    if (error) {
      return fail(400, { createSystemError: error.message })
    }

    return { createSystemSuccess: true, createdSystemId: data.id }
  },

  createFlag: async ({ request, params, locals }) => {
    const context = await ensureOrgContext(locals)
    const supabase = locals.supabase
    const formData = await request.formData()

    const targetType = String(formData.get("target_type") ?? "").trim()
    const targetId = String(formData.get("target_id") ?? "").trim()
    const message = String(formData.get("message") ?? "").trim()
    const flagType = String(formData.get("flag_type") ?? "comment").trim()
    const targetPath = String(formData.get("target_path") ?? "").trim()

    const failForTarget = (status: number, createFlagError: string) =>
      fail(status, {
        createFlagError,
        createFlagTargetType: targetType,
        createFlagTargetId: targetId,
      })

    if (
      (targetType !== "process" && targetType !== "action") ||
      targetId.length === 0
    ) {
      return failForTarget(400, "Invalid flag target.")
    }
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
