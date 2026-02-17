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

export type ProcessDraft = {
  name: string
  description: string
  descriptionRich?: RichTextDocument
  descriptionRichRaw?: string
  trigger: string
  endState: string
  ownerRoleIdRaw: string
}

export const readProcessDraft = (formData: FormData): ProcessDraft => {
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
    trigger: String(formData.get("trigger") ?? "").trim(),
    endState: String(
      formData.get("end_state") ?? formData.get("endstate") ?? "",
    ).trim(),
    ownerRoleIdRaw: String(formData.get("owner_role_id") ?? "").trim(),
  }
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

export const createProcessRecord = async ({
  supabase,
  orgId,
  draft,
}: {
  supabase: SupabaseClient
  orgId: string
  draft: ProcessDraft
}): Promise<
  | { ok: true; id: string; slug: string }
  | { ok: false; status: number; message: string }
> => {
  if (!draft.name) {
    return { ok: false, status: 400, message: "Process name is required." }
  }
  if (!draft.trigger) {
    return { ok: false, status: 400, message: "Process trigger is required." }
  }
  if (!draft.endState) {
    return { ok: false, status: 400, message: "Process end state is required." }
  }

  const slug = await ensureUniqueSlug(supabase, "processes", orgId, draft.name)
  const ownerRoleId = draft.ownerRoleIdRaw || null

  const { data, error } = await supabase
    .from("processes")
    .insert({
      org_id: orgId,
      slug,
      name: draft.name,
      trigger: draft.trigger,
      end_state: draft.endState,
      owner_role_id: ownerRoleId,
      description_rich: draft.descriptionRich ?? plainToRich(draft.description),
    })
    .select("id, slug")
    .single()

  if (error) {
    return { ok: false, status: 400, message: error.message }
  }

  return { ok: true, id: data.id, slug: data.slug }
}

export const updateProcessRecord = async ({
  supabase,
  orgId,
  processSlug,
  expectedProcessId,
  draft,
}: {
  supabase: SupabaseClient
  orgId: string
  processSlug: string
  expectedProcessId: string
  draft: ProcessDraft
}): Promise<
  | { ok: true; id: string; slug: string }
  | { ok: false; status: number; message: string }
> => {
  if (!draft.name) {
    return { ok: false, status: 400, message: "Process name is required." }
  }
  if (!draft.trigger) {
    return { ok: false, status: 400, message: "Process trigger is required." }
  }
  if (!draft.endState) {
    return { ok: false, status: 400, message: "Process end state is required." }
  }

  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("id, slug")
    .eq("org_id", orgId)
    .eq("slug", processSlug)
    .maybeSingle()

  if (processError || !process) {
    return { ok: false, status: 404, message: "Process not found." }
  }
  if (expectedProcessId && process.id !== expectedProcessId) {
    return { ok: false, status: 400, message: "Invalid process target." }
  }

  const ownerRoleId = draft.ownerRoleIdRaw || null
  const { error: updateError } = await supabase
    .from("processes")
    .update({
      name: draft.name,
      description_rich: draft.descriptionRich ?? plainToRich(draft.description),
      trigger: draft.trigger,
      end_state: draft.endState,
      owner_role_id: ownerRoleId,
    })
    .eq("org_id", orgId)
    .eq("id", process.id)

  if (updateError) {
    return { ok: false, status: 400, message: updateError.message }
  }

  return { ok: true, id: process.id, slug: process.slug }
}

export const deleteProcessRecord = async ({
  supabase,
  orgId,
  processSlug,
  expectedProcessId,
}: {
  supabase: SupabaseClient
  orgId: string
  processSlug: string
  expectedProcessId: string
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", processSlug)
    .maybeSingle()

  if (processError || !process) {
    return { ok: false, status: 404, message: "Process not found." }
  }
  if (expectedProcessId && process.id !== expectedProcessId) {
    return { ok: false, status: 400, message: "Invalid process target." }
  }

  const { count: actionCount, error: actionCountError } = await supabase
    .from("actions")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("process_id", process.id)

  if (actionCountError) {
    return { ok: false, status: 400, message: actionCountError.message }
  }

  if ((actionCount ?? 0) > 0) {
    const plural = actionCount === 1 ? "action is" : "actions are"
    return {
      ok: false,
      status: 409,
      message: `Cannot delete process while ${actionCount} ${plural} linked to it.`,
    }
  }

  const { error: deleteError } = await supabase
    .from("processes")
    .delete()
    .eq("org_id", orgId)
    .eq("id", process.id)

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

export type ActionDraft = {
  title: string
  description: string
  descriptionRich?: RichTextDocument
  descriptionRichRaw?: string
  ownerRoleId: string
  systemId: string
  actionId: string
  sequenceRaw: string
}

export const readActionDraft = (formData: FormData): ActionDraft => {
  const descriptionDraft = readRichTextFormDraft({
    formData,
    richField: "description_rich",
    textField: "description",
  })

  return {
    title: String(formData.get("title") ?? "").trim(),
    description: descriptionDraft.text,
    descriptionRich: descriptionDraft.rich,
    descriptionRichRaw: descriptionDraft.richRaw,
    ownerRoleId: String(formData.get("owner_role_id") ?? "").trim(),
    systemId: String(formData.get("system_id") ?? "").trim(),
    actionId: String(formData.get("action_id") ?? "").trim(),
    sequenceRaw: String(formData.get("sequence") ?? "").trim(),
  }
}

export type ActionSequenceRow = { id: string; sequence: number }

export const resequenceProcessActions = async ({
  supabase,
  orgId,
  processId,
  orderedActions,
}: {
  supabase: SupabaseClient
  orgId: string
  processId: string
  orderedActions: ActionSequenceRow[]
}): Promise<string | null> => {
  if (orderedActions.length === 0) {
    return null
  }

  const maxCurrentSequence = orderedActions.reduce(
    (max, action) => Math.max(max, action.sequence),
    0,
  )
  const stageBase = maxCurrentSequence + orderedActions.length + 50

  for (const [index, action] of orderedActions.entries()) {
    const stagedSequence = stageBase + index
    const { error: stageError } = await supabase
      .from("actions")
      .update({ sequence: stagedSequence })
      .eq("org_id", orgId)
      .eq("process_id", processId)
      .eq("id", action.id)

    if (stageError) {
      return stageError.message
    }
  }

  for (const [index, action] of orderedActions.entries()) {
    const finalSequence = index + 1
    const { error: finalError } = await supabase
      .from("actions")
      .update({ sequence: finalSequence })
      .eq("org_id", orgId)
      .eq("process_id", processId)
      .eq("id", action.id)

    if (finalError) {
      return finalError.message
    }
  }

  return null
}

export const createOrUpdateActionRecord = async ({
  supabase,
  orgId,
  processSlug,
  draft,
}: {
  supabase: SupabaseClient
  orgId: string
  processSlug: string
  draft: ActionDraft
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
  if (!draft.description || !draft.ownerRoleId || !draft.systemId) {
    return {
      ok: false,
      status: 400,
      message: "Description, role, and system are required.",
    }
  }

  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", processSlug)
    .maybeSingle()

  if (processError || !process) {
    return { ok: false, status: 404, message: "Process not found." }
  }

  if (draft.actionId) {
    const { data: actionTarget, error: actionTargetError } = await supabase
      .from("actions")
      .select("id")
      .eq("org_id", orgId)
      .eq("process_id", process.id)
      .eq("id", draft.actionId)
      .maybeSingle()

    if (actionTargetError || !actionTarget) {
      return { ok: false, status: 404, message: "Action not found." }
    }

    const { error: updateError } = await supabase
      .from("actions")
      .update({
        description_rich: draft.descriptionRich,
        owner_role_id: draft.ownerRoleId,
        system_id: draft.systemId,
      })
      .eq("org_id", orgId)
      .eq("id", draft.actionId)

    if (updateError) {
      return { ok: false, status: 400, message: updateError.message }
    }

    return { ok: true }
  }

  let sequence = Number(draft.sequenceRaw)
  if (Number.isNaN(sequence) || sequence < 1) {
    const { data: maxRow } = await supabase
      .from("actions")
      .select("sequence")
      .eq("org_id", orgId)
      .eq("process_id", process.id)
      .order("sequence", { ascending: false })
      .limit(1)
      .maybeSingle()
    sequence = (maxRow?.sequence ?? 0) + 1
  }

  const { error } = await supabase.from("actions").insert({
    org_id: orgId,
    process_id: process.id,
    sequence,
    description_rich: draft.descriptionRich,
    owner_role_id: draft.ownerRoleId,
    system_id: draft.systemId,
  })

  if (error) {
    return { ok: false, status: 400, message: error.message }
  }

  return { ok: true }
}

export const deleteActionRecord = async ({
  supabase,
  orgId,
  processSlug,
  actionId,
}: {
  supabase: SupabaseClient
  orgId: string
  processSlug: string
  actionId: string
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
  if (!actionId) {
    return { ok: false, status: 400, message: "Action id is required." }
  }

  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", processSlug)
    .maybeSingle()

  if (processError || !process) {
    return { ok: false, status: 404, message: "Process not found." }
  }

  const { data: actionTarget, error: actionTargetError } = await supabase
    .from("actions")
    .select("id")
    .eq("org_id", orgId)
    .eq("process_id", process.id)
    .eq("id", actionId)
    .maybeSingle()

  if (actionTargetError || !actionTarget) {
    return { ok: false, status: 404, message: "Action not found." }
  }

  const { error: deleteError } = await supabase
    .from("actions")
    .delete()
    .eq("org_id", orgId)
    .eq("id", actionId)

  if (deleteError) {
    return { ok: false, status: 400, message: deleteError.message }
  }

  const { data: remainingActions, error: remainingActionsError } =
    await supabase
      .from("actions")
      .select("id, sequence")
      .eq("org_id", orgId)
      .eq("process_id", process.id)
      .order("sequence")
      .order("id")

  if (remainingActionsError) {
    return { ok: false, status: 400, message: remainingActionsError.message }
  }

  const resequenceError = await resequenceProcessActions({
    supabase,
    orgId,
    processId: process.id,
    orderedActions: (remainingActions ?? []) as ActionSequenceRow[],
  })

  if (resequenceError) {
    return { ok: false, status: 400, message: resequenceError }
  }

  return { ok: true }
}

export const reorderActionRecord = async ({
  supabase,
  orgId,
  processSlug,
  actionId,
  direction,
}: {
  supabase: SupabaseClient
  orgId: string
  processSlug: string
  actionId: string
  direction: "up" | "down"
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> => {
  if (!actionId) {
    return { ok: false, status: 400, message: "Action id is required." }
  }
  if (direction !== "up" && direction !== "down") {
    return { ok: false, status: 400, message: "Invalid reorder direction." }
  }

  const { data: process, error: processError } = await supabase
    .from("processes")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", processSlug)
    .maybeSingle()

  if (processError || !process) {
    return { ok: false, status: 404, message: "Process not found." }
  }

  const { data: actionRows, error: actionRowsError } = await supabase
    .from("actions")
    .select("id, sequence")
    .eq("org_id", orgId)
    .eq("process_id", process.id)
    .order("sequence")
    .order("id")

  if (actionRowsError) {
    return { ok: false, status: 400, message: actionRowsError.message }
  }

  const actionsInOrder = (actionRows ?? []) as ActionSequenceRow[]
  const currentIndex = actionsInOrder.findIndex(
    (action) => action.id === actionId,
  )
  if (currentIndex === -1) {
    return { ok: false, status: 404, message: "Action not found." }
  }

  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (nextIndex < 0 || nextIndex >= actionsInOrder.length) {
    return { ok: true }
  }

  const reordered = [...actionsInOrder]
  const [movedAction] = reordered.splice(currentIndex, 1)
  reordered.splice(nextIndex, 0, movedAction)

  const resequenceError = await resequenceProcessActions({
    supabase,
    orgId,
    processId: process.id,
    orderedActions: reordered,
  })

  if (resequenceError) {
    return { ok: false, status: 400, message: resequenceError }
  }

  return { ok: true }
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

const flagTargetTableByType: Record<
  CreateFlagTargetType,
  CreateFlagTargetTable
> = {
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
    return {
      success: false,
      error: "Flag type is invalid.",
      field: "flag_type",
    }
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
