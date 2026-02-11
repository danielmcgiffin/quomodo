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

type RoleRow = { id: string; slug: string; name: string }
type SystemRow = { id: string; slug: string; name: string }
type ProcessRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  trigger: string | null
  end_state: string | null
  owner_role_id: string | null
}
type ActionRow = { process_id: string; system_id: string; sequence: number }

const toRole = (row: RoleRow) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  initials: makeInitials(row.name),
})

const toSystem = (row: SystemRow) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
})

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

  const [rolesResult, systemsResult, processesResult, actionsResult] =
    await Promise.all([
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
        .from("processes")
        .select(
          "id, slug, name, description_rich, trigger, end_state, owner_role_id",
        )
        .eq("org_id", context.orgId)
        .order("created_at", { ascending: false }),
      supabase
        .from("actions")
        .select("process_id, system_id, sequence")
        .eq("org_id", context.orgId)
        .order("sequence", { ascending: true }),
    ])

  if (rolesResult.error) {
    throw kitError(500, `Failed to load roles: ${rolesResult.error.message}`)
  }
  if (systemsResult.error) {
    throw kitError(
      500,
      `Failed to load systems: ${systemsResult.error.message}`,
    )
  }
  if (processesResult.error) {
    throw kitError(
      500,
      `Failed to load processes: ${processesResult.error.message}`,
    )
  }
  if (actionsResult.error) {
    throw kitError(
      500,
      `Failed to load actions: ${actionsResult.error.message}`,
    )
  }

  const roles = ((rolesResult.data ?? []) as RoleRow[]).map(toRole)
  const systems = ((systemsResult.data ?? []) as SystemRow[]).map(toSystem)
  const roleById = new Map(
    roles.map((role: ReturnType<typeof toRole>) => [role.id, role]),
  )
  const systemById = new Map(
    systems.map((system: ReturnType<typeof toSystem>) => [system.id, system]),
  )

  const firstSystemByProcess = new Map<string, string>()
  for (const action of (actionsResult.data ?? []) as ActionRow[]) {
    if (!firstSystemByProcess.has(action.process_id)) {
      firstSystemByProcess.set(action.process_id, action.system_id)
    }
  }

  const processes = ((processesResult.data ?? []) as ProcessRow[]).map(
    (row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      descriptionHtml: richToHtml(row.description_rich),
      trigger: row.trigger ?? "",
      endState: row.end_state ?? "",
      ownerRole: row.owner_role_id
        ? (roleById.get(row.owner_role_id) ?? null)
        : null,
      primarySystem: firstSystemByProcess.get(row.id)
        ? (systemById.get(firstSystemByProcess.get(row.id)!) ?? null)
        : null,
    }),
  )

  return {
    org: context,
    roles,
    systems,
    processes,
  }
}

export const actions = {
  createProcess: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canEditAtlas(context.membershipRole)) {
      return fail(403, { createProcessError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()

    const name = String(formData.get("name") ?? "").trim()
    const trigger = String(formData.get("trigger") ?? "").trim()
    const endState = String(
      formData.get("end_state") ?? formData.get("endstate") ?? "",
    ).trim()
    const description = String(formData.get("description") ?? "").trim()
    const ownerRoleIdRaw = String(formData.get("owner_role_id") ?? "").trim()

    if (!name) {
      return fail(400, { createProcessError: "Process name is required." })
    }

    const slug = await ensureUniqueSlug(
      supabase,
      "processes",
      context.orgId,
      name,
    )
    const ownerRoleId = ownerRoleIdRaw || null

    const insertPayload = {
      org_id: context.orgId,
      slug,
      name,
      trigger: trigger || null,
      end_state: endState || null,
      owner_role_id: ownerRoleId,
      description_rich: plainToRich(description),
    }

    const { data, error } = await supabase
      .from("processes")
      .insert(insertPayload)
      .select("slug")
      .single()

    if (error) {
      return fail(400, { createProcessError: error.message })
    }

    redirect(303, `/app/processes/${data.slug}`)
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
  createFlag: async ({ request, locals }) => {
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

    if (targetType !== "process" || !targetId) {
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
      .eq("id", targetId)
      .maybeSingle()

    if (processError || !process) {
      return failForTarget(404, "Process not found.")
    }

    const { error } = await supabase.from("flags").insert({
      org_id: context.orgId,
      target_type: "process",
      target_id: process.id,
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
