import { error as kitError } from "@sveltejs/kit"
import { ensureOrgContext, makeInitials, richToHtml } from "$lib/server/atlas"

type SupabaseAny = any
type RoleRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  person_name: string | null
  hours_per_week: number | null
}
type ProcessRow = { id: string; slug: string; name: string; owner_role_id: string | null }
type ActionRow = {
  id: string
  process_id: string
  sequence: number
  description_rich: unknown
  owner_role_id: string
  system_id: string
}
type SystemRow = { id: string; slug: string; name: string }
type FlagRow = { id: string; flag_type: string; message: string }

export const load = async ({ params, locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase as unknown as SupabaseAny

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, slug, name, description_rich, person_name, hours_per_week")
    .eq("org_id", context.orgId)
    .eq("slug", params.slug)
    .maybeSingle()

  if (roleError) {
    throw kitError(500, `Failed to load role: ${roleError.message}`)
  }
  if (!role) {
    throw kitError(404, "Role not found")
  }
  const roleRow = role as RoleRow

  const [processesResult, actionsResult, systemsResult, flagsResult] = await Promise.all([
    supabase
      .from("processes")
      .select("id, slug, name, owner_role_id")
      .eq("org_id", context.orgId)
      .order("name"),
    supabase
      .from("actions")
      .select("id, process_id, sequence, description_rich, owner_role_id, system_id")
      .eq("org_id", context.orgId)
      .eq("owner_role_id", roleRow.id)
      .order("sequence"),
    supabase
      .from("systems")
      .select("id, slug, name")
      .eq("org_id", context.orgId)
      .order("name"),
    supabase
      .from("flags")
      .select("id, flag_type, message")
      .eq("org_id", context.orgId)
      .eq("target_type", "role")
      .eq("target_id", roleRow.id)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ])

  if (processesResult.error) {
    throw kitError(500, `Failed to load processes: ${processesResult.error.message}`)
  }
  if (actionsResult.error) {
    throw kitError(500, `Failed to load actions: ${actionsResult.error.message}`)
  }
  if (systemsResult.error) {
    throw kitError(500, `Failed to load systems: ${systemsResult.error.message}`)
  }
  if (flagsResult.error) {
    throw kitError(500, `Failed to load flags: ${flagsResult.error.message}`)
  }

  const systems = ((systemsResult.data ?? []) as SystemRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
  }))
  const systemById = new Map(
    systems.map((system: { id: string }) => [system.id, system]),
  )
  const processes = ((processesResult.data ?? []) as ProcessRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    ownerRoleId: row.owner_role_id,
  }))
  const processById = new Map(
    processes.map((process: { id: string }) => [process.id, process]),
  )

  const ownedProcesses = processes.filter(
    (process: { ownerRoleId: string | null }) => process.ownerRoleId === roleRow.id,
  )
  const actionsPerformed = ((actionsResult.data ?? []) as ActionRow[]).map((action) => ({
    id: action.id,
    processId: action.process_id,
    sequence: action.sequence,
    descriptionHtml: richToHtml(action.description_rich),
    system: systemById.get(action.system_id) ?? null,
  }))
  const systemsAccessed = systems.filter((system: { id: string }) =>
    actionsPerformed.some((action: { system: { id: string } | null }) => action.system?.id === system.id),
  )
  const actionsByProcess = ownedProcesses.map((process: { id: string }) => ({
    process,
    actions: actionsPerformed.filter(
      (action: { processId: string }) => action.processId === process.id,
    ),
  }))

  for (const action of actionsPerformed) {
    const process = processById.get(action.processId)
    if (!process) {
      continue
    }
    if (!actionsByProcess.some((entry: { process: { id: string } }) => entry.process.id === process.id)) {
      actionsByProcess.push({
        process,
        actions: actionsPerformed.filter(
          (entry: { processId: string }) => entry.processId === process.id,
        ),
      })
    }
  }

  return {
    role: {
      id: roleRow.id,
      slug: roleRow.slug,
      name: roleRow.name,
      initials: makeInitials(roleRow.name),
      descriptionHtml: richToHtml(roleRow.description_rich),
      personName: roleRow.person_name ?? "",
      hoursPerWeek: roleRow.hours_per_week ?? null,
    },
    ownedProcesses,
    actionsPerformed,
    systemsAccessed,
    actionsByProcess,
    roleFlags: ((flagsResult.data ?? []) as FlagRow[]).map((flag) => ({
      id: flag.id,
      flagType: flag.flag_type,
      message: flag.message,
    })),
    reportsTo: null,
  }
}
