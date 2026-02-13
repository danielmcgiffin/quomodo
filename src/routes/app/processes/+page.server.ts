import { fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  canEditAtlas,
  ensureOrgContext,
  ensureUniqueSlug,
  richToHtml,
} from "$lib/server/atlas"
import { readRichTextFormDraft } from "$lib/server/rich-text"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { assertWorkspaceWritable, getOrgBillingSnapshot } from "$lib/server/billing"
import {
  createFlagForEntity,
  createRoleRecord,
  readRoleDraft,
} from "$lib/server/app/actions/shared"
import {
  mapRolePortals,
  mapSystemPortals,
  type RolePortalModel,
  type SystemPortalModel,
} from "$lib/server/app/mappers/portals"
import {
  mapOpenProcessFlags,
  mapProcessCards,
  type ProcessActionLinkRow,
  type ProcessFlagLinkRow,
  type ProcessListRow,
} from "$lib/server/app/mappers/processes"

type RoleRow = { id: string; slug: string; name: string }
type SystemRow = { id: string; slug: string; name: string }
export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const failLoad = (contextName: string, error: unknown) =>
    throwRuntime500({
      context: contextName,
      error,
      requestId: locals.requestId,
      route: "/app/processes",
    })

  const [
    rolesResult,
    systemsResult,
    processesResult,
    actionsResult,
    flagsResult,
  ] = await Promise.all([
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
      .from("processes")
      .select(
        "id, slug, name, description_rich, trigger, end_state, owner_role_id",
      )
      .eq("org_id", context.orgId)
      .order("name"),
    supabase
      .from("actions")
      .select("process_id, system_id, owner_role_id")
      .eq("org_id", context.orgId)
      .order("process_id"),
    supabase
      .from("flags")
      .select("id, target_id, target_path, flag_type, message, created_at")
      .eq("org_id", context.orgId)
      .eq("target_type", "process")
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ])

  if (rolesResult.error) {
    failLoad("app.processes.load.roles", rolesResult.error)
  }
  if (systemsResult.error) {
    failLoad("app.processes.load.systems", systemsResult.error)
  }
  if (processesResult.error) {
    failLoad("app.processes.load.processes", processesResult.error)
  }
  if (actionsResult.error) {
    failLoad("app.processes.load.actions", actionsResult.error)
  }
  if (flagsResult.error) {
    failLoad("app.processes.load.flags", flagsResult.error)
  }

  const roles = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const systems = mapSystemPortals((systemsResult.data ?? []) as SystemRow[])
  const processRows = (processesResult.data ?? []) as ProcessListRow[]
  const roleById = new Map(
    roles.map((role: RolePortalModel) => [role.id, role]),
  )
  const systemById = new Map(
    systems.map((system: SystemPortalModel) => [system.id, system]),
  )
  const processById = new Map(
    processRows.map((row) => [
      row.id,
      {
        id: row.id,
        slug: row.slug,
        name: row.name,
      },
    ]),
  )

  const processes = mapProcessCards({
    processRows,
    actionRows: (actionsResult.data ?? []) as ProcessActionLinkRow[],
    roleById,
    systemById,
    richToHtml,
  })

  const openFlags = mapOpenProcessFlags({
    flagRows: (flagsResult.data ?? []) as ProcessFlagLinkRow[],
    processById,
  })

  return {
    org: context,
    roles,
    systems,
    processes,
    openFlags,
  }
}

export const actions = {
  createProcess: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    if (!canEditAtlas(context.membershipRole)) {
      return fail(403, { createProcessError: "Insufficient permissions." })
    }
    const supabase = locals.supabase
    const formData = await request.formData()

    const name = String(formData.get("name") ?? "").trim()
    const trigger = String(formData.get("trigger") ?? "").trim()
    const endState = String(
      formData.get("end_state") ?? formData.get("endstate") ?? "",
    ).trim()
    const descriptionDraft = readRichTextFormDraft({
      formData,
      richField: "description_rich",
      textField: "description",
    })
    const ownerRoleIdRaw = String(formData.get("owner_role_id") ?? "").trim()

    if (!name) {
      return fail(400, { createProcessError: "Process name is required." })
    }
    if (!trigger) {
      return fail(400, { createProcessError: "Process trigger is required." })
    }
    if (!endState) {
      return fail(400, { createProcessError: "Process end state is required." })
    }

    const slug = await ensureUniqueSlug(
      supabase,
      "processes",
      context.orgId,
      name,
    )
    const ownerRoleId = ownerRoleIdRaw || null

    const insertPayload = {
      org_id: context.orgId,
      slug,
      name,
      trigger,
      end_state: endState,
      owner_role_id: ownerRoleId,
      description_rich: descriptionDraft.rich,
    }

    const { data, error } = await supabase
      .from("processes")
      .insert(insertPayload)
      .select("slug")
      .single()

    if (error) {
      return fail(400, { createProcessError: error.message })
    }

    redirect(303, `/app/processes/${data.slug}`)
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
    const draft = readRoleDraft(formData)
    const result = await createRoleRecord({
      supabase,
      orgId: context.orgId,
      draft,
    })

    if (!result.ok) {
      return fail(result.status, { createRoleError: result.message })
    }

    return { createRoleSuccess: true, createdRoleId: result.id }
  },
  createFlag: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    assertWorkspaceWritable(billing)
    const supabase = locals.supabase
    const formData = await request.formData()
    const result = await createFlagForEntity({
      context,
      supabase,
      formData,
      expectedTargetType: "process",
      targetTable: "processes",
      missingTargetMessage: "Process not found.",
    })

    if (!result.ok) {
      return fail(result.status, result.payload)
    }

    return { createFlagSuccess: true }
  },
}
