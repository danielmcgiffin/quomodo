import {
  canCreateFlagType,
  ensureUniqueSlug,
  isScFlagType,
  plainToRich,
} from "$lib/server/atlas"
import { readRichTextFormDraft } from "$lib/server/rich-text"
import type { RichTextDocument } from "$lib/rich-text/document"

type SupabaseClient = App.Locals["supabase"]
type OrgContext = {
  orgId: string
  userId: string
  membershipRole: "owner" | "admin" | "editor" | "member"
}

export type ActionResult =
  | { success: true; data: { id: string; slug: string } }
  | { success: false; error: string; field?: string }

export type RoleDraft = {
  name: string
  description: string
  descriptionRich?: RichTextDocument
  descriptionRichRaw?: string
}

export const readRoleDraft = (formData: FormData): RoleDraft => {
  const descriptionDraft = readRichTextFormDraft({
    formData,
    richField: "description_rich",
    textField: "description",
  })

  return {
    name: String(formData.get("name") ?? "").trim(),
    description: descriptionDraft.text,
    descriptionRich: descriptionDraft.rich,
    descriptionRichRaw: descriptionDraft.richRaw,
  }
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

  const slug = await ensureUniqueSlug(supabase, "roles", orgId, draft.name)
  const { data, error } = await supabase
    .from("roles")
    .insert({
      org_id: orgId,
      slug,
      name: draft.name,
      description_rich: draft.descriptionRich ?? plainToRich(draft.description),
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
      description_rich: draft.descriptionRich ?? plainToRich(draft.description),
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
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
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
  descriptionRich?: RichTextDocument
  descriptionRichRaw?: string
  location: string
  ownerRoleIdRaw: string
}

export const readSystemDraft = (formData: FormData): SystemDraft => {
  const descriptionDraft = readRichTextFormDraft({
    formData,
    richField: "description_rich",
    textField: "description",
  })

  return {
    name: String(formData.get("name") ?? "").trim(),
    description: descriptionDraft.text,
    descriptionRich: descriptionDraft.rich,
    descriptionRichRaw: descriptionDraft.richRaw,
    location: String(formData.get("location") ?? "").trim(),
    ownerRoleIdRaw: String(formData.get("owner_role_id") ?? "").trim(),
  }
}

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
      description_rich: draft.descriptionRich ?? plainToRich(draft.description),
      location: draft.location,
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
      description_rich: draft.descriptionRich ?? plainToRich(draft.description),
      location: draft.location,
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
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
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

type ProcessDetailFlagTargetType = "process" | "action"

export const createFlagForProcessDetail = async ({
  context,
  supabase,
  formData,
  processSlug,
}: {
  context: OrgContext
  supabase: SupabaseClient
  formData: FormData
  processSlug: string
}) => {
  const targetTypeRaw = String(formData.get("target_type") ?? "").trim()
  const targetId = String(formData.get("target_id") ?? "").trim()
  const message = String(formData.get("message") ?? "").trim()
  const flagTypeRaw = String(formData.get("flag_type") ?? "comment").trim()
  const targetPath = String(formData.get("target_path") ?? "").trim()

  const failForTarget = (status: number, createFlagError: string) => ({
    ok: false as const,
    status,
    payload: {
      createFlagError,
      createFlagTargetType: targetTypeRaw,
      createFlagTargetId: targetId,
      createFlagTargetPath: targetPath,
    },
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

  const targetType: ProcessDetailFlagTargetType = targetTypeRaw

  if (!message) {
    return failForTarget(400, "Flag message is required.")
  }
  if (!canCreateFlagType(context.membershipRole, flagTypeRaw)) {
    return failForTarget(403, "Members can only create comment flags.")
  }

  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("id")
    .eq("org_id", context.orgId)
    .eq("slug", processSlug)
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
    flag_type: flagTypeRaw,
    message,
    created_by: context.userId,
  })

  if (error) {
    return failForTarget(400, error.message)
  }

  return { ok: true as const }
}

export const createRole = async ({
  supabase,
  orgId,
  formData,
}: {
  supabase: SupabaseClient
  orgId: string
  formData: FormData
}): Promise<ActionResult> => {
  const draft = readRoleDraft(formData)
  const result = await createRoleRecord({ supabase, orgId, draft })

  if (!result.ok) {
    return {
      success: false,
      error: result.message,
      field: draft.name ? undefined : "name",
    }
  }

  return { success: true, data: { id: result.id, slug: result.slug } }
}

export const createSystem = async ({
  supabase,
  orgId,
  formData,
}: {
  supabase: SupabaseClient
  orgId: string
  formData: FormData
}): Promise<ActionResult> => {
  const draft = readSystemDraft(formData)
  const result = await createSystemRecord({ supabase, orgId, draft })

  if (!result.ok) {
    return {
      success: false,
      error: result.message,
      field: draft.name ? undefined : "name",
    }
  }

  return { success: true, data: { id: result.id, slug: result.slug } }
}

type CreateFlagTargetType = "process" | "role" | "system" | "action"
type CreateFlagTargetTable = "processes" | "roles" | "systems" | "actions"

const flagTargetTableByType: Record<CreateFlagTargetType, CreateFlagTargetTable> =
  {
    process: "processes",
    role: "roles",
    system: "systems",
    action: "actions",
  }

export const createFlag = async ({
  supabase,
  orgId,
  formData,
  userId,
  membershipRole,
}: {
  supabase: SupabaseClient
  orgId: string
  formData: FormData
  userId: string
  membershipRole: OrgContext["membershipRole"]
}): Promise<ActionResult> => {
  const targetToken = String(formData.get("target") ?? "").trim()
  const targetTypeRaw = String(formData.get("target_type") ?? "").trim()
  const targetIdRaw = String(formData.get("target_id") ?? "").trim()

  const [tokenType, tokenId] = targetToken ? targetToken.split(":") : ["", ""]
  const rawType = targetTypeRaw || tokenType
  const rawId = targetIdRaw || tokenId

  if (!rawType || !rawId) {
    return { success: false, error: "Target is required.", field: "target" }
  }
  if (
    rawType !== "process" &&
    rawType !== "role" &&
    rawType !== "system" &&
    rawType !== "action"
  ) {
    return { success: false, error: "Target type is invalid.", field: "target" }
  }

  const flagTypeRaw = String(formData.get("flag_type") ?? "comment").trim()
  if (!isScFlagType(flagTypeRaw)) {
    return { success: false, error: "Flag type is invalid.", field: "flag_type" }
  }

  const message = String(formData.get("message") ?? "").trim()
  if (!message) {
    return { success: false, error: "Message is required.", field: "message" }
  }

  if (!canCreateFlagType(membershipRole, flagTypeRaw)) {
    return {
      success: false,
      error: "Members can only create comment flags.",
      field: "flag_type",
    }
  }

  const targetType: CreateFlagTargetType = rawType
  const targetId = rawId
  const targetTable = flagTargetTableByType[targetType]

  const { data: target, error: targetError } = await supabase
    .from(targetTable)
    .select("id")
    .eq("org_id", orgId)
    .eq("id", targetId)
    .maybeSingle()

  if (targetError || !target) {
    return { success: false, error: "Target not found.", field: "target" }
  }

  const targetPathRaw = String(formData.get("target_path") ?? "").trim()
  const { data: createdFlag, error } = await supabase
    .from("flags")
    .insert({
      org_id: orgId,
      target_type: targetType,
      target_id: targetId,
      target_path: targetPathRaw || null,
      flag_type: flagTypeRaw,
      message,
      created_by: userId,
    })
    .select("id")
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Flags don't have slugs; return id in both fields to satisfy the shared ActionResult contract.
  return { success: true, data: { id: createdFlag.id, slug: createdFlag.id } }
}
