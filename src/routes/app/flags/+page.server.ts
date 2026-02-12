import { error as kitError, fail } from "@sveltejs/kit"
import {
  canCreateFlagType,
  canModerateFlags,
  ensureOrgContext,
  isScFlagType,
  type ScFlagType,
} from "$lib/server/atlas"
import {
  mapActionTargets,
  mapFlagsDashboard,
  mapFlagTargetOptions,
  type FlagsActionRow,
  type FlagsProcessRow,
  type FlagsRoleRow,
  type FlagsRow,
  type FlagsSystemRow,
  type FlagTargetType,
} from "$lib/server/app/mappers/flags"

const isFlagTargetType = (value: string): value is FlagTargetType =>
  ["process", "role", "system", "action"].includes(value)

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

  const [
    processesResult,
    rolesResult,
    systemsResult,
    actionsResult,
    flagsResult,
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
    supabase
      .from("flags")
      .select(
        "id, target_type, target_id, target_path, flag_type, message, created_at, status",
      )
      .eq("org_id", context.orgId)
      .order("created_at", { ascending: false }),
  ])

  if (processesResult.error) {
    throw kitError(
      500,
      `Failed to load processes: ${processesResult.error.message}`,
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
  if (actionsResult.error) {
    throw kitError(
      500,
      `Failed to load actions: ${actionsResult.error.message}`,
    )
  }
  if (flagsResult.error) {
    throw kitError(500, `Failed to load flags: ${flagsResult.error.message}`)
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
  })

  return {
    org: context,
    viewerRole: context.membershipRole,
    flags,
    targetOptions,
  }
}

export const actions = {
  createFlag: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    const supabase = locals.supabase
    const formData = await request.formData()

    const targetToken = String(formData.get("target") ?? "").trim()
    const [targetTypeRaw, targetId] = targetToken.split(":")
    const flagTypeRaw = String(formData.get("flag_type") ?? "comment").trim()
    const message = String(formData.get("message") ?? "").trim()
    const targetPathRaw = String(formData.get("target_path") ?? "").trim()

    if (!targetTypeRaw || !targetId) {
      return fail(400, { createFlagError: "Target is required." })
    }
    if (!isFlagTargetType(targetTypeRaw)) {
      return fail(400, { createFlagError: "Target type is invalid." })
    }
    if (!isScFlagType(flagTypeRaw)) {
      return fail(400, { createFlagError: "Flag type is invalid." })
    }

    const targetType: FlagTargetType = targetTypeRaw
    const flagType: ScFlagType = flagTypeRaw

    if (!message) {
      return fail(400, { createFlagError: "Message is required." })
    }
    if (!canCreateFlagType(context.membershipRole, flagType)) {
      return fail(403, {
        createFlagError: "Members can only create comment flags.",
      })
    }

    const { error } = await supabase.from("flags").insert({
      org_id: context.orgId,
      target_type: targetType,
      target_id: targetId,
      target_path: targetPathRaw || null,
      flag_type: flagType,
      message,
      created_by: context.userId,
    })

    if (error) {
      return fail(400, { createFlagError: error.message })
    }

    return { ok: true }
  },

  resolveFlag: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canModerateFlags(context.membershipRole)) {
      return fail(403, { resolveFlagError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
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

  dismissFlag: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canModerateFlags(context.membershipRole)) {
      return fail(403, { dismissFlagError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
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
}
