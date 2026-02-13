import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  canCreateFlagType,
  canEditAtlas,
  ensureOrgContext,
  isScFlagType,
  richToJsonString,
  richToHtml,
  type ScFlagType,
} from "$lib/server/atlas"
import { readRichTextFormDraft } from "$lib/server/rich-text"
import type { RichTextDocument } from "$lib/rich-text/document"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { assertWorkspaceWritable, getOrgBillingSnapshot } from "$lib/server/billing"
import {
  createRoleRecord,
  createSystemRecord,
  readRoleDraft,
  readSystemDraft,
} from "$lib/server/app/actions/shared"
import {
  mapRolePortals,
  mapSystemPortals,
} from "$lib/server/app/mappers/portals"
import {
  mapProcessDetailActions,
  mapProcessDetailFlags,
  type ProcessDetailActionRow,
  type ProcessDetailFlagRow,
} from "$lib/server/app/mappers/processes"

type ProcessRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  trigger: string
  end_state: string
  owner_role_id: string | null
}
type RoleRow = { id: string; slug: string; name: string }
type SystemRow = { id: string; slug: string; name: string }
type FlagTargetType = "process" | "action"
type ActionSequenceRow = { id: string; sequence: number }
type ProcessDraft = {
  name: string
  description: string
  descriptionRich: RichTextDocument
  descriptionRichRaw: string
  trigger: string
  endState: string
  ownerRoleIdRaw: string
}

const readProcessDraft = (formData: FormData): ProcessDraft => {
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

const resequenceProcessActions = async ({
  supabase,
  orgId,
  processId,
  orderedActions,
}: {
  supabase: App.Locals["supabase"]
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

export const load = async ({ params, locals, url }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const failLoad = (contextName: string, error: unknown) =>
    throwRuntime500({
      context: contextName,
      error,
      requestId: locals.requestId,
      route: `/app/processes/${params.slug}`,
    })

  const { data: process, error: processError } = await supabase
    .from("processes")
    .select(
      "id, slug, name, description_rich, trigger, end_state, owner_role_id",
    )
    .eq("org_id", context.orgId)
    .eq("slug", params.slug)
    .maybeSingle()

  if (processError) {
    failLoad("app.processes.detail.load.process", processError)
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
        .select("id, flag_type, message, created_at")
        .eq("org_id", context.orgId)
        .eq("target_type", "process")
        .eq("target_id", processRow.id)
        .eq("status", "open")
        .order("created_at", { ascending: false }),
    ])

  if (actionsResult.error) {
    failLoad("app.processes.detail.load.actions", actionsResult.error)
  }
  if (rolesResult.error) {
    failLoad("app.processes.detail.load.roles", rolesResult.error)
  }
  if (systemsResult.error) {
    failLoad("app.processes.detail.load.systems", systemsResult.error)
  }
  if (flagsResult.error) {
    failLoad("app.processes.detail.load.flags", flagsResult.error)
  }

  const roles = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const systems = mapSystemPortals((systemsResult.data ?? []) as SystemRow[])
  const roleById = new Map(roles.map((role) => [role.id, role]))
  const systemById = new Map(systems.map((system) => [system.id, system]))

  const actionRows = (actionsResult.data ?? []) as ProcessDetailActionRow[]
  const actionDescriptionRichById = new Map(
    actionRows.map((row) => [row.id, richToJsonString(row.description_rich)]),
  )
  const actions = mapProcessDetailActions({
    rows: actionRows,
    roleById,
    systemById,
    richToHtml,
  }).map((action) => {
    return {
      ...action,
      descriptionRich:
        actionDescriptionRichById.get(action.id) ?? richToJsonString(null),
    }
  })

  return {
    process: {
      id: processRow.id,
      slug: processRow.slug,
      name: processRow.name,
      descriptionRich: richToJsonString(processRow.description_rich),
      descriptionHtml: richToHtml(processRow.description_rich),
      trigger: processRow.trigger ?? "",
      endState: processRow.end_state ?? "",
      ownerRole: processRow.owner_role_id
        ? (roleById.get(processRow.owner_role_id) ?? null)
        : null,
    },
    actions,
    allRoles: roles,
    allSystems: systems,
    processFlags: mapProcessDetailFlags(
      (flagsResult.data ?? []) as ProcessDetailFlagRow[],
    ),
    viewerRole: context.membershipRole,
    highlightedActionId: url.searchParams.get("actionId") ?? null,
    highlightedFlagId: url.searchParams.get("flagId") ?? null,
  }
}

export const actions = {
  updateProcess: async ({ request, params, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    if (!canEditAtlas(context.membershipRole)) {
      return fail(403, { updateProcessError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
    const processId = String(formData.get("process_id") ?? "").trim()
    const draft = readProcessDraft(formData)

    const failProcess = (status: number, updateProcessError: string) =>
      fail(status, {
        updateProcessError,
        processNameDraft: draft.name,
        processDescriptionDraft: draft.description,
        processDescriptionRichDraft: draft.descriptionRichRaw,
        processTriggerDraft: draft.trigger,
        processEndStateDraft: draft.endState,
        selectedProcessOwnerRoleIdDraft: draft.ownerRoleIdRaw,
      })

    if (!draft.name) {
      return failProcess(400, "Process name is required.")
    }
    if (!draft.trigger) {
      return failProcess(400, "Process trigger is required.")
    }
    if (!draft.endState) {
      return failProcess(400, "Process end state is required.")
    }

    const { data: process, error: processError } = await supabase
      .from("processes")
      .select("id, slug")
      .eq("org_id", context.orgId)
      .eq("slug", params.slug)
      .maybeSingle()

    if (processError || !process) {
      return failProcess(404, "Process not found.")
    }
    if (processId && process.id !== processId) {
      return failProcess(400, "Invalid process target.")
    }

    const ownerRoleId = draft.ownerRoleIdRaw || null
    const { error: updateError } = await supabase
      .from("processes")
      .update({
        name: draft.name,
        description_rich: draft.descriptionRich,
        trigger: draft.trigger,
        end_state: draft.endState,
        owner_role_id: ownerRoleId,
      })
      .eq("org_id", context.orgId)
      .eq("id", process.id)

    if (updateError) {
      return failProcess(400, updateError.message)
    }

    redirect(303, `/app/processes/${process.slug}`)
  },

  deleteProcess: async ({ request, params, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    if (!canEditAtlas(context.membershipRole)) {
      return fail(403, { deleteProcessError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
    const processId = String(formData.get("process_id") ?? "").trim()

    const failDelete = (status: number, deleteProcessError: string) =>
      fail(status, { deleteProcessError })

    const { data: process, error: processError } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("slug", params.slug)
      .maybeSingle()

    if (processError || !process) {
      return failDelete(404, "Process not found.")
    }
    if (processId && process.id !== processId) {
      return failDelete(400, "Invalid process target.")
    }

    const { error: deleteError } = await supabase
      .from("processes")
      .delete()
      .eq("org_id", context.orgId)
      .eq("id", process.id)

    if (deleteError) {
      return failDelete(400, deleteError.message)
    }

    redirect(303, "/app/processes")
  },

  createAction: async ({ request, params, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    if (!canEditAtlas(context.membershipRole)) {
      return fail(403, { createActionError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()

    const descriptionDraft = readRichTextFormDraft({
      formData,
      richField: "description_rich",
      textField: "description",
    })
    const ownerRoleId = String(formData.get("owner_role_id") ?? "").trim()
    const systemId = String(formData.get("system_id") ?? "").trim()
    const actionId = String(formData.get("action_id") ?? "").trim()
    const sequenceRaw = String(formData.get("sequence") ?? "").trim()

    const failAction = (status: number, createActionError: string) =>
      fail(status, {
        createActionError,
        actionDescriptionDraft: descriptionDraft.text,
        actionDescriptionRichDraft: descriptionDraft.richRaw,
        selectedOwnerRoleId: ownerRoleId,
        selectedSystemId: systemId,
        editingActionId: actionId || null,
      })

    if (!descriptionDraft.text || !ownerRoleId || !systemId) {
      return failAction(400, "Description, role, and system are required.")
    }

    const { data: process, error: processError } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("slug", params.slug)
      .maybeSingle()

    if (processError || !process) {
      return failAction(404, "Process not found.")
    }

    if (actionId) {
      const { data: actionTarget, error: actionTargetError } = await supabase
        .from("actions")
        .select("id")
        .eq("org_id", context.orgId)
        .eq("process_id", process.id)
        .eq("id", actionId)
        .maybeSingle()

      if (actionTargetError || !actionTarget) {
        return failAction(404, "Action not found.")
      }

      const { error: updateError } = await supabase
        .from("actions")
        .update({
          description_rich: descriptionDraft.rich,
          owner_role_id: ownerRoleId,
          system_id: systemId,
        })
        .eq("org_id", context.orgId)
        .eq("id", actionId)

      if (updateError) {
        return failAction(400, updateError.message)
      }

      redirect(303, `/app/processes/${params.slug}`)
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
      description_rich: descriptionDraft.rich,
      owner_role_id: ownerRoleId,
      system_id: systemId,
    })

    if (error) {
      return failAction(400, error.message)
    }

    redirect(303, `/app/processes/${params.slug}`)
  },

  deleteAction: async ({ request, params, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    if (!canEditAtlas(context.membershipRole)) {
      return fail(403, { deleteActionError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
    const actionId = String(formData.get("action_id") ?? "").trim()

    const failDelete = (status: number, deleteActionError: string) =>
      fail(status, {
        deleteActionError,
        editingActionId: actionId || null,
      })

    if (!actionId) {
      return failDelete(400, "Action id is required.")
    }

    const { data: process, error: processError } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("slug", params.slug)
      .maybeSingle()

    if (processError || !process) {
      return failDelete(404, "Process not found.")
    }

    const { data: actionTarget, error: actionTargetError } = await supabase
      .from("actions")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("process_id", process.id)
      .eq("id", actionId)
      .maybeSingle()

    if (actionTargetError || !actionTarget) {
      return failDelete(404, "Action not found.")
    }

    const { error: deleteError } = await supabase
      .from("actions")
      .delete()
      .eq("org_id", context.orgId)
      .eq("id", actionId)

    if (deleteError) {
      return failDelete(400, deleteError.message)
    }

    const { data: remainingActions, error: remainingActionsError } =
      await supabase
        .from("actions")
        .select("id, sequence")
        .eq("org_id", context.orgId)
        .eq("process_id", process.id)
        .order("sequence")
        .order("id")

    if (remainingActionsError) {
      return failDelete(400, remainingActionsError.message)
    }

    const resequenceError = await resequenceProcessActions({
      supabase,
      orgId: context.orgId,
      processId: process.id,
      orderedActions: (remainingActions ?? []) as ActionSequenceRow[],
    })

    if (resequenceError) {
      return failDelete(400, resequenceError)
    }

    redirect(303, `/app/processes/${params.slug}`)
  },

  reorderAction: async ({ request, params, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    if (!canEditAtlas(context.membershipRole)) {
      return fail(403, { reorderActionError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
    const actionId = String(formData.get("action_id") ?? "").trim()
    const direction = String(formData.get("direction") ?? "").trim()

    const failReorder = (status: number, reorderActionError: string) =>
      fail(status, { reorderActionError })

    if (!actionId) {
      return failReorder(400, "Action id is required.")
    }
    if (direction !== "up" && direction !== "down") {
      return failReorder(400, "Invalid reorder direction.")
    }

    const { data: process, error: processError } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("slug", params.slug)
      .maybeSingle()

    if (processError || !process) {
      return failReorder(404, "Process not found.")
    }

    const { data: actionRows, error: actionRowsError } = await supabase
      .from("actions")
      .select("id, sequence")
      .eq("org_id", context.orgId)
      .eq("process_id", process.id)
      .order("sequence")
      .order("id")

    if (actionRowsError) {
      return failReorder(400, actionRowsError.message)
    }

    const actionsInOrder = (actionRows ?? []) as ActionSequenceRow[]
    const currentIndex = actionsInOrder.findIndex(
      (action) => action.id === actionId,
    )
    if (currentIndex === -1) {
      return failReorder(404, "Action not found.")
    }

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (nextIndex < 0 || nextIndex >= actionsInOrder.length) {
      redirect(303, `/app/processes/${params.slug}`)
    }

    const reordered = [...actionsInOrder]
    const [movedAction] = reordered.splice(currentIndex, 1)
    reordered.splice(nextIndex, 0, movedAction)

    const resequenceError = await resequenceProcessActions({
      supabase,
      orgId: context.orgId,
      processId: process.id,
      orderedActions: reordered,
    })

    if (resequenceError) {
      return failReorder(400, resequenceError)
    }

    redirect(303, `/app/processes/${params.slug}`)
  },

  createRole: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { createRoleError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
    const roleDraft = readRoleDraft(formData)
    const actionDescriptionDraft = String(
      formData.get("action_description_draft") ?? "",
    )
    const actionDescriptionRichDraft = String(
      formData.get("action_description_rich_draft") ?? "",
    )
    const result = await createRoleRecord({
      supabase,
      orgId: context.orgId,
      draft: roleDraft,
    })

    if (!result.ok) {
      return fail(result.status, {
        createRoleError: result.message,
        actionDescriptionDraft,
        actionDescriptionRichDraft,
      })
    }

    return {
      createRoleSuccess: true,
      createdRoleId: result.id,
      actionDescriptionDraft,
      actionDescriptionRichDraft,
    }
  },

  createSystem: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { createSystemError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()
    const systemDraft = readSystemDraft(formData)
    const actionDescriptionDraft = String(
      formData.get("action_description_draft") ?? "",
    )
    const actionDescriptionRichDraft = String(
      formData.get("action_description_rich_draft") ?? "",
    )
    const result = await createSystemRecord({
      supabase,
      orgId: context.orgId,
      draft: systemDraft,
    })

    if (!result.ok) {
      return fail(result.status, {
        createSystemError: result.message,
        actionDescriptionDraft,
        actionDescriptionRichDraft,
      })
    }

    return {
      createSystemSuccess: true,
      createdSystemId: result.id,
      actionDescriptionDraft,
      actionDescriptionRichDraft,
    }
  },

  createFlag: async ({ request, params, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    const supabase = locals.supabase
    const formData = await request.formData()

    const targetTypeRaw = String(formData.get("target_type") ?? "").trim()
    const targetId = String(formData.get("target_id") ?? "").trim()
    const message = String(formData.get("message") ?? "").trim()
    const flagTypeRaw = String(formData.get("flag_type") ?? "comment").trim()
    const targetPath = String(formData.get("target_path") ?? "").trim()

    const failForTarget = (status: number, createFlagError: string) =>
      fail(status, {
        createFlagError,
        createFlagTargetType: targetTypeRaw,
        createFlagTargetId: targetId,
        createFlagTargetPath: targetPath,
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

    const targetType: FlagTargetType = targetTypeRaw
    const flagType: ScFlagType = flagTypeRaw

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
