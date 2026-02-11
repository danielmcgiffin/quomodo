import { error as kitError, fail } from "@sveltejs/kit"
import {
  canCreateFlagType,
  canModerateFlags,
  ensureOrgContext,
  makeInitials,
} from "$lib/server/atlas"

type ProcessRow = { id: string; slug: string; name: string }
type RoleRow = { id: string; slug: string; name: string }
type SystemRow = { id: string; slug: string; name: string }
type ActionRow = { id: string; process_id: string; sequence: number }
type FlagRow = {
  id: string
  target_type: "process" | "role" | "system" | "action"
  target_id: string
  target_path: string | null
  flag_type: string
  message: string
  created_at: string
  status: string
}
type ActionTarget = { id: string; label: string }

const toTargetLabel = (type: string, name: string) => `${type}: ${name}`

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
    ((processesResult.data ?? []) as ProcessRow[]).map((x) => [x.id, x]),
  )
  const roleById = new Map(
    ((rolesResult.data ?? []) as RoleRow[]).map((x) => [
      x.id,
      { ...x, initials: makeInitials(x.name) },
    ]),
  )
  const systemById = new Map(
    ((systemsResult.data ?? []) as SystemRow[]).map((x) => [x.id, x]),
  )

  const actionTargets: ActionTarget[] = (
    (actionsResult.data ?? []) as ActionRow[]
  ).map((action) => {
    const process = processById.get(action.process_id)
    const label = process
      ? `Action ${action.sequence} in ${process.name}`
      : `Action ${action.sequence}`
    return {
      id: action.id,
      label,
    }
  })

  const targetOptions = [
    ...((processesResult.data ?? []) as ProcessRow[]).map((process) => ({
      value: `process:${process.id}`,
      label: toTargetLabel("Process", process.name),
    })),
    ...((rolesResult.data ?? []) as RoleRow[]).map((role) => ({
      value: `role:${role.id}`,
      label: toTargetLabel("Role", role.name),
    })),
    ...((systemsResult.data ?? []) as SystemRow[]).map((system) => ({
      value: `system:${system.id}`,
      label: toTargetLabel("System", system.name),
    })),
    ...actionTargets.map((action) => ({
      value: `action:${action.id}`,
      label: toTargetLabel("Action", action.label),
    })),
  ]

  const flags = ((flagsResult.data ?? []) as FlagRow[]).map((flag) => {
    const target =
      flag.target_type === "process"
        ? processById.get(flag.target_id)
        : flag.target_type === "role"
          ? roleById.get(flag.target_id)
          : flag.target_type === "system"
            ? systemById.get(flag.target_id)
            : actionTargets.find((action) => action.id === flag.target_id)

    return {
      id: flag.id,
      targetType: flag.target_type,
      targetId: flag.target_id,
      targetPath: flag.target_path,
      flagType: flag.flag_type,
      message: flag.message,
      createdAt: new Date(flag.created_at).toLocaleString(),
      status: flag.status,
      target,
    }
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
    const [targetType, targetId] = targetToken.split(":")
    const flagType = String(formData.get("flag_type") ?? "comment").trim()
    const message = String(formData.get("message") ?? "").trim()
    const targetPathRaw = String(formData.get("target_path") ?? "").trim()

    if (!targetType || !targetId) {
      return fail(400, { createFlagError: "Target is required." })
    }
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
