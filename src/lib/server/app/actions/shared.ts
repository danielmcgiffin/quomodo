import { canCreateFlagType, ensureUniqueSlug, isScFlagType, plainToRich } from "$lib/server/atlas"

type SupabaseClient = App.Locals["supabase"]
type OrgContext = {
  orgId: string
  userId: string
  membershipRole: "owner" | "admin" | "editor" | "member"
}

export type RoleDraft = {
  name: string
  description: string
  personName: string
  hoursRaw: string
}

export const readRoleDraft = (formData: FormData): RoleDraft => ({
  name: String(formData.get("name") ?? "").trim(),
  description: String(formData.get("description") ?? "").trim(),
  personName: String(formData.get("person_name") ?? "").trim(),
  hoursRaw: String(formData.get("hours_per_week") ?? "").trim(),
})

const parseHoursPerWeek = (
  hoursRaw: string,
): { ok: true; value: number | null } | { ok: false; message: string } => {
  const hours = hoursRaw ? Number(hoursRaw) : null
  if (hoursRaw && Number.isNaN(hours)) {
    return {
      ok: false,
      message: "Hours per week must be numeric.",
    }
  }
  return { ok: true, value: hours }
}

export const createRoleRecord = async ({
  supabase,
  orgId,
  draft,
}: {
  supabase: SupabaseClient
  orgId: string
  draft: RoleDraft
}): Promise<
  | { ok: true; id: string; slug: string }
  | { ok: false; status: number; message: string }
> => {
  if (!draft.name) {
    return { ok: false, status: 400, message: "Role name is required." }
  }

  const parsedHours = parseHoursPerWeek(draft.hoursRaw)
  if (!parsedHours.ok) {
    return { ok: false, status: 400, message: parsedHours.message }
  }

  const slug = await ensureUniqueSlug(supabase, "roles", orgId, draft.name)
  const { data, error } = await supabase
    .from("roles")
    .insert({
      org_id: orgId,
      slug,
      name: draft.name,
      description_rich: plainToRich(draft.description),
      person_name: draft.personName || null,
      hours_per_week: parsedHours.value,
    })
    .select("id, slug")
    .single()

  if (error) {
    return { ok: false, status: 400, message: error.message }
  }

  return { ok: true, id: data.id, slug: data.slug }
}

export const updateRoleRecord = async ({
  supabase,
  orgId,
  roleId,
  draft,
}: {
  supabase: SupabaseClient
  orgId: string
  roleId: string
  draft: RoleDraft
}): Promise<
  | { ok: true; id: string; slug: string }
  | { ok: false; status: number; message: string }
> => {
  if (!roleId) {
    return { ok: false, status: 400, message: "Role id is required." }
  }
  if (!draft.name) {
    return { ok: false, status: 400, message: "Role name is required." }
  }

  const parsedHours = parseHoursPerWeek(draft.hoursRaw)
  if (!parsedHours.ok) {
    return { ok: false, status: 400, message: parsedHours.message }
  }

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id, slug")
    .eq("org_id", orgId)
    .eq("id", roleId)
    .maybeSingle()

  if (roleError) {
    return { ok: false, status: 400, message: roleError.message }
  }
  if (!role) {
    return { ok: false, status: 404, message: "Role not found." }
  }

  const { error: updateError } = await supabase
    .from("roles")
    .update({
      name: draft.name,
      description_rich: plainToRich(draft.description),
      person_name: draft.personName || null,
      hours_per_week: parsedHours.value,
    })
    .eq("org_id", orgId)
    .eq("id", role.id)

  if (updateError) {
    return { ok: false, status: 400, message: updateError.message }
  }

  return { ok: true, id: role.id, slug: role.slug }
}

export const deleteRoleRecord = async ({
  supabase,
  orgId,
  roleId,
}: {
  supabase: SupabaseClient
  orgId: string
  roleId: string
}): Promise<
  | { ok: true }
  | { ok: false; status: number; message: string }
> => {
  if (!roleId) {
    return { ok: false, status: 400, message: "Role id is required." }
  }

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("org_id", orgId)
    .eq("id", roleId)
    .maybeSingle()

  if (roleError) {
    return { ok: false, status: 400, message: roleError.message }
  }
  if (!role) {
    return { ok: false, status: 404, message: "Role not found." }
  }

  const { count: actionCount, error: actionCountError } = await supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("owner_role_id", role.id)

  if (actionCountError) {
    return { ok: false, status: 400, message: actionCountError.message }
  }

  if ((actionCount ?? 0) > 0) {
    const plural = actionCount === 1 ? "action is" : "actions are"
    return {
      ok: false,
      status: 409,
      message: `Cannot delete role while ${actionCount} ${plural} assigned to it.`,
    }
  }

  const { error: deleteError } = await supabase
    .from("roles")
    .delete()
    .eq("org_id", orgId)
    .eq("id", role.id)

  if (deleteError) {
    return { ok: false, status: 400, message: deleteError.message }
  }

  return { ok: true }
}

export type SystemDraft = {
  name: string
  description: string
  location: string
  url: string
  ownerRoleIdRaw: string
}

export const readSystemDraft = (formData: FormData): SystemDraft => ({
  name: String(formData.get("name") ?? "").trim(),
  description: String(formData.get("description") ?? "").trim(),
  location: String(formData.get("location") ?? "").trim(),
  url: String(formData.get("url") ?? "").trim(),
  ownerRoleIdRaw: String(formData.get("owner_role_id") ?? "").trim(),
})

export const createSystemRecord = async ({
  supabase,
  orgId,
  draft,
}: {
  supabase: SupabaseClient
  orgId: string
  draft: SystemDraft
}): Promise<
  | { ok: true; id: string; slug: string }
  | { ok: false; status: number; message: string }
> => {
  if (!draft.name) {
    return { ok: false, status: 400, message: "System name is required." }
  }

  const slug = await ensureUniqueSlug(supabase, "systems", orgId, draft.name)
  const ownerRoleId = draft.ownerRoleIdRaw || null

  const { data, error } = await supabase
    .from("systems")
    .insert({
      org_id: orgId,
      slug,
      name: draft.name,
      description_rich: plainToRich(draft.description),
      location: draft.location || null,
      url: draft.url || null,
      owner_role_id: ownerRoleId,
    })
    .select("id, slug")
    .single()

  if (error) {
    return { ok: false, status: 400, message: error.message }
  }

  return { ok: true, id: data.id, slug: data.slug }
}

export const updateSystemRecord = async ({
  supabase,
  orgId,
  systemId,
  draft,
}: {
  supabase: SupabaseClient
  orgId: string
  systemId: string
  draft: SystemDraft
}): Promise<
  | { ok: true; id: string; slug: string }
  | { ok: false; status: number; message: string }
> => {
  if (!systemId) {
    return { ok: false, status: 400, message: "System id is required." }
  }
  if (!draft.name) {
    return { ok: false, status: 400, message: "System name is required." }
  }

  const { data: system, error: systemError } = await supabase
    .from("systems")
    .select("id, slug")
    .eq("org_id", orgId)
    .eq("id", systemId)
    .maybeSingle()

  if (systemError) {
    return { ok: false, status: 400, message: systemError.message }
  }
  if (!system) {
    return { ok: false, status: 404, message: "System not found." }
  }

  const ownerRoleId = draft.ownerRoleIdRaw || null
  const { error: updateError } = await supabase
    .from("systems")
    .update({
      name: draft.name,
      description_rich: plainToRich(draft.description),
      location: draft.location || null,
      url: draft.url || null,
      owner_role_id: ownerRoleId,
    })
    .eq("org_id", orgId)
    .eq("id", system.id)

  if (updateError) {
    return { ok: false, status: 400, message: updateError.message }
  }

  return { ok: true, id: system.id, slug: system.slug }
}

export const deleteSystemRecord = async ({
  supabase,
  orgId,
  systemId,
}: {
  supabase: SupabaseClient
  orgId: string
  systemId: string
}): Promise<
  | { ok: true }
  | { ok: false; status: number; message: string }
> => {
  if (!systemId) {
    return { ok: false, status: 400, message: "System id is required." }
  }

  const { data: system, error: systemError } = await supabase
    .from("systems")
    .select("id")
    .eq("org_id", orgId)
    .eq("id", systemId)
    .maybeSingle()

  if (systemError) {
    return { ok: false, status: 400, message: systemError.message }
  }
  if (!system) {
    return { ok: false, status: 404, message: "System not found." }
  }

  const { count: actionCount, error: actionCountError } = await supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("system_id", system.id)

  if (actionCountError) {
    return { ok: false, status: 400, message: actionCountError.message }
  }

  if ((actionCount ?? 0) > 0) {
    const plural = actionCount === 1 ? "action is" : "actions are"
    return {
      ok: false,
      status: 409,
      message: `Cannot delete system while ${actionCount} ${plural} linked to it.`,
    }
  }

  const { error: deleteError } = await supabase
    .from("systems")
    .delete()
    .eq("org_id", orgId)
    .eq("id", system.id)

  if (deleteError) {
    return { ok: false, status: 400, message: deleteError.message }
  }

  return { ok: true }
}

type EntityFlagTargetType = "process" | "role" | "system"
type EntityTargetTable = "processes" | "roles" | "systems"

export const createFlagForEntity = async ({
  context,
  supabase,
  formData,
  expectedTargetType,
  targetTable,
  missingTargetMessage,
}: {
  context: OrgContext
  supabase: SupabaseClient
  formData: FormData
  expectedTargetType: EntityFlagTargetType
  targetTable: EntityTargetTable
  missingTargetMessage: string
}) => {
  const targetType = String(formData.get("target_type") ?? "").trim()
  const targetId = String(formData.get("target_id") ?? "").trim()
  const message = String(formData.get("message") ?? "").trim()
  const flagTypeRaw = String(formData.get("flag_type") ?? "comment").trim()
  const targetPath = String(formData.get("target_path") ?? "").trim()

  const failForTarget = (status: number, createFlagError: string) => ({
    ok: false as const,
    status,
    payload: {
      createFlagError,
      createFlagTargetType: targetType,
      createFlagTargetId: targetId,
      createFlagTargetPath: targetPath,
    },
  })

  if (targetType !== expectedTargetType || !targetId) {
    return failForTarget(400, "Invalid flag target.")
  }
  if (!isScFlagType(flagTypeRaw)) {
    return failForTarget(400, "Invalid flag type.")
  }
  if (!message) {
    return failForTarget(400, "Flag message is required.")
  }
  if (!canCreateFlagType(context.membershipRole, flagTypeRaw)) {
    return failForTarget(403, "Members can only create comment flags.")
  }

  const { data: target, error: targetError } = await supabase
    .from(targetTable)
    .select("id")
    .eq("org_id", context.orgId)
    .eq("id", targetId)
    .maybeSingle()

  if (targetError || !target) {
    return failForTarget(404, missingTargetMessage)
  }

  const { error } = await supabase.from("flags").insert({
    org_id: context.orgId,
    target_type: expectedTargetType,
    target_id: target.id,
    target_path: targetPath || null,
    flag_type: flagTypeRaw,
    message,
    created_by: context.userId,
  })

  if (error) {
    return failForTarget(400, error.message)
  }

  return { ok: true as const }
}
