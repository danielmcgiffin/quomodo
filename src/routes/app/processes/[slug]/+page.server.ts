import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  canEditAtlas,
  ensureOrgContext,
  richToJsonString,
  richToHtml,
} from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { wrapAction } from "$lib/server/app/actions"
import {
  createOrUpdateActionRecord,
  deleteActionRecord,
  createFlagForProcessDetail,
  deleteProcessRecord,
  reorderActionRecord,
  resequenceProcessActions,
  createRoleRecord,
  createSystemRecord,
  readActionDraft,
  readProcessDraft,
  readRoleDraft,
  readSystemDraft,
  updateProcessRecord,
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
type SystemRow = {
  id: string
  slug: string
  name: string
  logo_url: string | null
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
        .select("id, slug, name, logo_url")
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
  const systems = mapSystemPortals(
    (systemsResult.data ?? []) as unknown as SystemRow[],
  )
  const roleById = new Map(roles.map((role) => [role.id, role]))
  const systemById = new Map(systems.map((system) => [system.id, system]))

  const actionRows = (((actionsResult.data ?? []) as unknown) as Array<
    Omit<ProcessDetailActionRow, "title"> & { title?: string; action_name?: string }
  >).map((row) => ({
    ...row,
    title: row.title || row.action_name || `Action ${row.sequence}`,
  })) as ProcessDetailActionRow[]
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
  updateProcess: wrapAction(
    async ({ context, supabase, formData, params }) => {
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

      const result = await updateProcessRecord({
        supabase,
        orgId: context.orgId,
        processSlug: params.slug,
        expectedProcessId: processId,
        draft,
      })

      if (!result.ok) {
        return failProcess(result.status, result.message)
      }

      redirect(303, `/app/processes/${result.slug}`)
    },
    {
      permission: canEditAtlas,
      forbiddenPayload: { updateProcessError: "Insufficient permissions." },
    },
  ),

  deleteProcess: wrapAction(
    async ({ context, supabase, formData, params }) => {
      const processId = String(formData.get("process_id") ?? "").trim()
      const failDelete = (status: number, deleteProcessError: string) =>
        fail(status, { deleteProcessError })

      const result = await deleteProcessRecord({
        supabase,
        orgId: context.orgId,
        processSlug: params.slug,
        expectedProcessId: processId,
      })

      if (!result.ok) {
        return failDelete(result.status, result.message)
      }

      redirect(303, "/app/processes")
    },
    {
      permission: canEditAtlas,
      forbiddenPayload: { deleteProcessError: "Insufficient permissions." },
    },
  ),

  createAction: wrapAction(
    async ({ context, supabase, formData, params }) => {
      const draft = readActionDraft(formData)
      const failAction = (status: number, createActionError: string) =>
        fail(status, {
          createActionError,
          actionTitleDraft: draft.title,
          actionDescriptionDraft: draft.description,
          actionDescriptionRichDraft: draft.descriptionRichRaw,
          selectedOwnerRoleId: draft.ownerRoleId,
          selectedSystemId: draft.systemId,
          editingActionId: draft.actionId || null,
        })

      const result = await createOrUpdateActionRecord({
        supabase,
        orgId: context.orgId,
        processSlug: params.slug,
        draft,
      })

      if (!result.ok) {
        return failAction(result.status, result.message)
      }

      redirect(303, `/app/processes/${params.slug}`)
    },
    {
      permission: canEditAtlas,
      forbiddenPayload: { createActionError: "Insufficient permissions." },
    },
  ),

  deleteAction: wrapAction(
    async ({ context, supabase, formData, params }) => {
      const actionId = String(formData.get("action_id") ?? "").trim()
      const failDelete = (status: number, deleteActionError: string) =>
        fail(status, {
          deleteActionError,
          editingActionId: actionId || null,
        })

      if (!actionId) {
        return failDelete(400, "Action id is required.")
      }

      const result = await deleteActionRecord({
        supabase,
        orgId: context.orgId,
        processSlug: params.slug,
        actionId,
      })

      if (!result.ok) {
        return failDelete(result.status, result.message)
      }

      redirect(303, `/app/processes/${params.slug}`)
    },
    {
      permission: canEditAtlas,
      forbiddenPayload: { deleteActionError: "Insufficient permissions." },
    },
  ),

  reorderAction: wrapAction(
    async ({ context, supabase, formData, params }) => {
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

      const result = await reorderActionRecord({
        supabase,
        orgId: context.orgId,
        processSlug: params.slug,
        actionId,
        direction,
      })

      if (!result.ok) {
        return failReorder(result.status, result.message)
      }

      redirect(303, `/app/processes/${params.slug}`)
    },
    {
      permission: canEditAtlas,
      forbiddenPayload: { reorderActionError: "Insufficient permissions." },
    },
  ),

  updateActionOrder: wrapAction(
    async ({ context, supabase, formData, params }) => {
      const actionIdsRaw = String(formData.get("action_ids") ?? "").trim()
      const failUpdate = (status: number, reorderActionError: string) =>
        fail(status, { reorderActionError })

      if (!actionIdsRaw) {
        return failUpdate(400, "Action ids are required.")
      }

      const actionIds = actionIdsRaw.split(",")
      const { data: process, error: processError } = await supabase
        .from("processes")
        .select("id")
        .eq("org_id", context.orgId)
        .eq("slug", params.slug)
        .maybeSingle()

      if (processError || !process) {
        return failUpdate(404, "Process not found.")
      }

      const orderedActions = actionIds.map((id, index) => ({
        id,
        sequence: index + 1,
      }))

      const resequenceError = await resequenceProcessActions({
        supabase,
        orgId: context.orgId,
        processId: process.id,
        orderedActions,
      })

      if (resequenceError) {
        return failUpdate(400, resequenceError)
      }

      return { updateActionOrderSuccess: true }
    },
    {
      permission: canEditAtlas,
      forbiddenPayload: { reorderActionError: "Insufficient permissions." },
    },
  ),

  createRole: wrapAction(
    async ({ context, supabase, formData }) => {
      const roleDraft = readRoleDraft(formData)
      const actionTitleDraft = String(
        formData.get("action_title_draft") ?? "",
      )
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
          actionTitleDraft,
          actionDescriptionDraft,
          actionDescriptionRichDraft,
        })
      }

      return {
        createRoleSuccess: true,
        createdRoleId: result.id,
        actionTitleDraft,
        actionDescriptionDraft,
        actionDescriptionRichDraft,
      }
    },
    {
      permission: canManageDirectory,
      forbiddenPayload: { createRoleError: "Insufficient permissions." },
    },
  ),

  createSystem: wrapAction(
    async ({ context, supabase, formData }) => {
      const systemDraft = readSystemDraft(formData)
      const actionTitleDraft = String(
        formData.get("action_title_draft") ?? "",
      )
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
          actionTitleDraft,
          actionDescriptionDraft,
          actionDescriptionRichDraft,
        })
      }

      return {
        createSystemSuccess: true,
        createdSystemId: result.id,
        actionTitleDraft,
        actionDescriptionDraft,
        actionDescriptionRichDraft,
      }
    },
    {
      permission: canManageDirectory,
      forbiddenPayload: { createSystemError: "Insufficient permissions." },
    },
  ),

  createFlag: wrapAction(async ({ context, supabase, formData, params }) => {
    const result = await createFlagForProcessDetail({
      context,
      supabase,
      formData,
      processSlug: params.slug,
    })

    if (!result.ok) {
      return fail(result.status, result.payload)
    }

    return { createFlagSuccess: true }
  }),
}
