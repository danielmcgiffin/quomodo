import { error as kitError, fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  canEditAtlas,
  ensureOrgContext,
  ensureUniqueSlug,
  plainToRich,
  richToHtml,
} from "$lib/server/atlas"
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

type RoleRow = { id: string; slug: string; name: string }
type SystemRow = { id: string; slug: string; name: string }
type ProcessRow = {
  id: string
  slug: string
  name: string
  description_rich: unknown
  trigger: string | null
  end_state: string | null
  owner_role_id: string | null
}
type ActionRow = {
  process_id: string
  system_id: string | null
  owner_role_id: string | null
}
type FlagRow = {
  id: string
  target_id: string
  target_path: string | null
  flag_type: string
  message: string
  created_at: string
}
export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

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
    throw kitError(500, `Failed to load roles: ${rolesResult.error.message}`)
  }
  if (systemsResult.error) {
    throw kitError(
      500,
      `Failed to load systems: ${systemsResult.error.message}`,
    )
  }
  if (processesResult.error) {
    throw kitError(
      500,
      `Failed to load processes: ${processesResult.error.message}`,
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

  const roles = mapRolePortals((rolesResult.data ?? []) as RoleRow[])
  const systems = mapSystemPortals((systemsResult.data ?? []) as SystemRow[])
  const processRows = (processesResult.data ?? []) as ProcessRow[]
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

  const roleIdsByProcess = new Map<string, Set<string>>()
  const systemIdsByProcess = new Map<string, Set<string>>()
  for (const action of (actionsResult.data ?? []) as ActionRow[]) {
    if (action.owner_role_id) {
      const roleSet =
        roleIdsByProcess.get(action.process_id) ?? new Set<string>()
      roleSet.add(action.owner_role_id)
      roleIdsByProcess.set(action.process_id, roleSet)
    }
    if (action.system_id) {
      const systemSet =
        systemIdsByProcess.get(action.process_id) ?? new Set<string>()
      systemSet.add(action.system_id)
      systemIdsByProcess.set(action.process_id, systemSet)
    }
  }

  const processes = processRows
    .map((row) => {
      const ownerRole = row.owner_role_id
        ? (roleById.get(row.owner_role_id) ?? null)
        : null
      const actionRoles = Array.from(roleIdsByProcess.get(row.id) ?? [])
        .map((roleId) => roleById.get(roleId) ?? null)
        .filter(
          (
            role,
          ): role is {
            id: string
            slug: string
            name: string
            initials: string
          } => Boolean(role),
        )
      const roleBadges = ownerRole
        ? [ownerRole, ...actionRoles.filter((role) => role.id !== ownerRole.id)]
        : actionRoles
      const systemBadges = Array.from(systemIdsByProcess.get(row.id) ?? [])
        .map((systemId) => systemById.get(systemId) ?? null)
        .filter(
          (system): system is { id: string; slug: string; name: string } =>
            Boolean(system),
        )

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        descriptionHtml: richToHtml(row.description_rich),
        trigger: row.trigger ?? "",
        endState: row.end_state ?? "",
        roleBadges,
        systemBadges,
      }
    })
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    )

  const openFlags = ((flagsResult.data ?? []) as FlagRow[])
    .map((flag) => {
      const process = processById.get(flag.target_id)
      if (!process) {
        return null
      }
      return {
        id: flag.id,
        flagType: flag.flag_type,
        message: flag.message,
        targetPath: flag.target_path,
        createdAt: new Date(flag.created_at).toLocaleString(),
        process,
      }
    })
    .filter(
      (
        flag,
      ): flag is {
        id: string
        flagType: string
        message: string
        targetPath: string | null
        createdAt: string
        process: {
          id: string
          slug: string
          name: string
        }
      } => Boolean(flag),
    )

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
    const description = String(formData.get("description") ?? "").trim()
    const ownerRoleIdRaw = String(formData.get("owner_role_id") ?? "").trim()

    if (!name) {
      return fail(400, { createProcessError: "Process name is required." })
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
      trigger: trigger || null,
      end_state: endState || null,
      owner_role_id: ownerRoleId,
      description_rich: plainToRich(description),
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
