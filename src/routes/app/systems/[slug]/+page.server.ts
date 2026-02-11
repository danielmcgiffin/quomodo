import { error as kitError } from "@sveltejs/kit"
import { ensureOrgContext, makeInitials, richToHtml } from "$lib/server/atlas"

type SupabaseAny = any
type SystemRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  location: string | null
  url: string | null
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
type ProcessRow = { id: string; slug: string; name: string }
type FlagRow = { id: string; flag_type: string; message: string }

export const load = async ({ params, locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase as unknown as SupabaseAny

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

  const [actionsResult, rolesResult, processesResult, flagsResult] = await Promise.all([
    supabase
      .from("actions")
      .select("id, process_id, sequence, description_rich, owner_role_id, system_id")
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
      .select("id, flag_type, message")
      .eq("org_id", context.orgId)
      .eq("target_type", "system")
      .eq("target_id", systemRow.id)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ])

  if (actionsResult.error) {
    throw kitError(500, `Failed to load actions: ${actionsResult.error.message}`)
  }
  if (rolesResult.error) {
    throw kitError(500, `Failed to load roles: ${rolesResult.error.message}`)
  }
  if (processesResult.error) {
    throw kitError(500, `Failed to load processes: ${processesResult.error.message}`)
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
  const roleById = new Map(
    roles.map((role: { id: string }) => [role.id, role]),
  )

  const processes = ((processesResult.data ?? []) as ProcessRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
  }))
  const actionsUsing = ((actionsResult.data ?? []) as ActionRow[]).map((action) => ({
    id: action.id,
    processId: action.process_id,
    sequence: action.sequence,
    descriptionHtml: richToHtml(action.description_rich),
    ownerRole: roleById.get(action.owner_role_id) ?? null,
  }))
  const processesUsing = processes.filter((process: { id: string }) =>
    actionsUsing.some((action: { processId: string }) => action.processId === process.id),
  )
  const rolesUsing = roles.filter((role: { id: string }) =>
    actionsUsing.some(
      (action: { ownerRole: { id: string } | null }) => action.ownerRole?.id === role.id,
    ),
  )

  return {
    system: {
      id: systemRow.id,
      slug: systemRow.slug,
      name: systemRow.name,
      descriptionHtml: richToHtml(systemRow.description_rich),
      location: systemRow.location ?? "",
      url: systemRow.url ?? "",
    },
    actionsUsing,
    processesUsing,
    rolesUsing,
    systemFlags: ((flagsResult.data ?? []) as FlagRow[]).map((flag) => ({
      id: flag.id,
      flagType: flag.flag_type,
      message: flag.message,
    })),
  }
}
