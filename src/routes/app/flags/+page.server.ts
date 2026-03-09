import { fail } from "@sveltejs/kit"
import { canModerateFlags, ensureOrgContext } from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { wrapAction, createFlag } from "$lib/server/app/actions"
import {
  escapeFlagsSearchTerm,
  mapActionTargets,
  mapFlagsDashboard,
  mapFlagsHistoryTimeline,
  mapFlagTargetOptions,
  parseFlagsFilterParams,
  type FlagsActionRow,
  type FlagsProcessRow,
  type FlagsRoleRow,
  type FlagsRow,
  type FlagsSystemRow,
} from "$lib/server/app/mappers/flags"

export const load = async ({ locals, url }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const filters = parseFlagsFilterParams(url.searchParams)
  const failLoad = (contextName: string, error: unknown) =>
    throwRuntime500({
      context: contextName,
      error,
      requestId: locals.requestId,
      route: "/app/flags",
    })

  const flagsQuery = supabase
    .from("flags")
    .select(
      "id, target_type, target_id, target_path, flag_type, message, created_at, status, resolved_at, resolved_by, resolution_note",
    )
    .eq("org_id", context.orgId)
    .eq("status", "open")
    .order("created_at", { ascending: false })

  if (filters.targetType) {
    flagsQuery.eq("target_type", filters.targetType)
  }
  if (filters.targetId) {
    flagsQuery.eq("target_id", filters.targetId)
  }

  const historyQuery = supabase
    .from("flags")
    .select(
      "id, target_type, target_id, target_path, flag_type, message, created_at, status, resolved_at, resolved_by, resolution_note",
    )
    .eq("org_id", context.orgId)
    .in("status", ["resolved", "dismissed"])
    .order("resolved_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(300)

  if (filters.historyStatus !== "all") {
    historyQuery.eq("status", filters.historyStatus)
  }
  if (filters.targetType) {
    historyQuery.eq("target_type", filters.targetType)
  }
  if (filters.targetId) {
    historyQuery.eq("target_id", filters.targetId)
  }
  if (filters.q) {
    const q = escapeFlagsSearchTerm(filters.q)
    if (q) {
      historyQuery.or(`message.ilike.%${q}%,resolution_note.ilike.%${q}%`)
    }
  }

  const [
    processesResult,
    rolesResult,
    systemsResult,
    actionsResult,
    flagsResult,
    resolvedHistoryResult,
  ] = await Promise.all([
    supabase
      .from("processes")
      .select("id, slug, name")
      .eq("org_id", context.orgId)
      .order("name"),
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
      .from("actions")
      .select("id, process_id, sequence")
      .eq("org_id", context.orgId)
      .order("sequence", { ascending: true }),
    flagsQuery,
    historyQuery,
  ])

  if (processesResult.error) {
    failLoad("app.flags.load.processes", processesResult.error)
  }
  if (rolesResult.error) {
    failLoad("app.flags.load.roles", rolesResult.error)
  }
  if (systemsResult.error) {
    failLoad("app.flags.load.systems", systemsResult.error)
  }
  if (actionsResult.error) {
    failLoad("app.flags.load.actions", actionsResult.error)
  }
  if (flagsResult.error) {
    failLoad("app.flags.load.flags", flagsResult.error)
  }
  if (resolvedHistoryResult.error) {
    failLoad("app.flags.load.resolvedHistory", resolvedHistoryResult.error)
  }

  const processById = new Map(
    ((processesResult.data ?? []) as FlagsProcessRow[]).map((x) => [x.id, x]),
  )
  const systemById = new Map(
    ((systemsResult.data ?? []) as FlagsSystemRow[]).map((x) => [x.id, x]),
  )

  const actionTargets = mapActionTargets({
    actionRows: (actionsResult.data ?? []) as FlagsActionRow[],
    processById,
  })

  const resolverNameById = new Map<string, string>()
  const resolvedByIds = [
    ...new Set(
      [
        ...((flagsResult.data ?? []) as FlagsRow[]).map((flag) =>
          flag.resolved_by?.trim(),
        ),
        ...((resolvedHistoryResult.data ?? []) as FlagsRow[]).map((flag) =>
          flag.resolved_by?.trim(),
        ),
      ].filter((id): id is string => Boolean(id)),
    ),
  ]

  if (resolvedByIds.length > 0) {
    const { data: resolverProfiles, error: resolverProfilesError } =
      await locals.supabaseServiceRole
        .from("profiles")
        .select("id, full_name")
        .in("id", resolvedByIds)

    if (resolverProfilesError) {
      failLoad("app.flags.load.resolverProfiles", resolverProfilesError)
    }

    for (const profile of
      (resolverProfiles ?? []) as { id: string; full_name: string | null }[]) {
      resolverNameById.set(profile.id, profile.full_name?.trim() ?? "")
    }
  }

  const targetOptions = mapFlagTargetOptions({
    processRows: (processesResult.data ?? []) as FlagsProcessRow[],
    roleRows: (rolesResult.data ?? []) as FlagsRoleRow[],
    systemRows: (systemsResult.data ?? []) as FlagsSystemRow[],
    actionTargets,
  })
  const flags = mapFlagsDashboard({
    flagsRows: (flagsResult.data ?? []) as FlagsRow[],
    processById,
    roleRows: (rolesResult.data ?? []) as FlagsRoleRow[],
    systemById,
    actionTargets,
    resolverNameById,
  })

  const resolvedHistoryRows = (resolvedHistoryResult.data ?? []) as FlagsRow[]
  const resolvedHistory = mapFlagsDashboard({
    flagsRows: resolvedHistoryRows,
    processById,
    roleRows: (rolesResult.data ?? []) as FlagsRoleRow[],
    systemById,
    actionTargets,
    resolverNameById,
  })
  const historyTimeline = mapFlagsHistoryTimeline({
    flagsRows: resolvedHistoryRows,
    entries: resolvedHistory,
  })

  return {
    viewerRole: context.membershipRole,
    flags,
    resolvedHistory,
    historyTimeline,
    targetOptions,
    filters,
  }
}

export const actions = {
  createFlag: wrapAction(async ({ context, supabase, formData }) => {
    const result = await createFlag({
      supabase,
      orgId: context.orgId,
      formData,
      userId: context.userId,
      membershipRole: context.membershipRole,
    })

    if (!result.success) {
      return fail(400, { createFlagError: result.error })
    }

    return { ok: true }
  }),

  resolveFlag: wrapAction(
    async ({ context, supabase, formData }) => {
      const id = String(formData.get("id") ?? "").trim()
      const resolution = String(formData.get("resolution_note") ?? "").trim()

      if (!id) {
        return fail(400, { resolveFlagError: "Flag id is required." })
      }

      const { error } = await supabase
        .from("flags")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: context.userId,
          resolution_note: resolution || null,
        })
        .eq("id", id)
        .eq("org_id", context.orgId)

      if (error) {
        return fail(400, { resolveFlagError: error.message })
      }

      return { ok: true }
    },
    {
      permission: canModerateFlags,
      forbiddenPayload: { resolveFlagError: "Insufficient permissions." },
    },
  ),

  dismissFlag: wrapAction(
    async ({ context, supabase, formData }) => {
      const id = String(formData.get("id") ?? "").trim()

      if (!id) {
        return fail(400, { dismissFlagError: "Flag id is required." })
      }

      const { error } = await supabase
        .from("flags")
        .update({
          status: "dismissed",
          resolved_at: new Date().toISOString(),
          resolved_by: context.userId,
        })
        .eq("id", id)
        .eq("org_id", context.orgId)

      if (error) {
        return fail(400, { dismissFlagError: error.message })
      }

      return { ok: true }
    },
    {
      permission: canModerateFlags,
      forbiddenPayload: { dismissFlagError: "Insufficient permissions." },
    },
  ),

  deleteFlag: wrapAction(
    async ({ context, supabase, formData }) => {
      const id = String(formData.get("id") ?? "").trim()

      if (!id) {
        return fail(400, { deleteFlagError: "Flag id is required." })
      }

      const { error } = await supabase
        .from("flags")
        .delete()
        .eq("id", id)
        .eq("org_id", context.orgId)

      if (error) {
        return fail(400, { deleteFlagError: error.message })
      }

      return { ok: true }
    },
    {
      permission: canModerateFlags,
      forbiddenPayload: { deleteFlagError: "Insufficient permissions." },
    },
  ),
}
