import { json, type RequestHandler } from "@sveltejs/kit"
import { ensureOrgContext, makeInitials } from "$lib/server/atlas"
import {
  USER_SAFE_SEARCH_ERROR_MESSAGE,
  throwRuntime500,
} from "$lib/server/runtime-errors"
import {
  mapSearchResults,
  type SearchActionRoute,
  type SearchAllRow,
  type SearchPortalProcess,
  type SearchPortalRole,
  type SearchPortalSystem,
  type SearchResultContext,
} from "$lib/server/app/mappers/search"

type ActionRouteRow = {
  id: string
  sequence: number
  process_id: string
  owner_role_id: string
  system_id: string
}

type ProcessRouteRow = {
  id: string
  slug: string
  name: string
}

type RoleRouteRow = {
  id: string
  slug: string
  name: string
}

type SystemRouteRow = {
  id: string
  slug: string
  name: string
}

const parseLimit = (raw: string | null): number => {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20
  }
  return Math.min(50, Math.floor(parsed))
}

const dedupeSearchRows = (rows: SearchAllRow[]): SearchAllRow[] => {
  const byKey = new Map<string, SearchAllRow>()
  for (const row of rows) {
    byKey.set(`${row.entity_type}:${row.id}`, row)
  }
  return Array.from(byKey.values())
}

const uniqueStrings = (values: (string | null | undefined)[]): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))))

const dedupeActionRows = (rows: ActionRouteRow[]): ActionRouteRow[] => {
  const byId = new Map<string, ActionRouteRow>()
  for (const row of rows) {
    byId.set(row.id, row)
  }
  return Array.from(byId.values())
}

const indexFirstBy = (
  rows: ActionRouteRow[],
  keyOf: (row: ActionRouteRow) => string | null | undefined,
): Map<string, ActionRouteRow> => {
  const byKey = new Map<string, ActionRouteRow>()
  for (const row of rows) {
    const key = keyOf(row)
    if (!key || byKey.has(key)) {
      continue
    }
    byKey.set(key, row)
  }
  return byKey
}

export const GET: RequestHandler = async ({ url, locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase
  const failSearch = (contextName: string, error: unknown) =>
    throwRuntime500({
      context: contextName,
      error,
      requestId: locals.requestId,
      route: "/app/search",
      userMessage: USER_SAFE_SEARCH_ERROR_MESSAGE,
    })
  const queryRaw = String(
    url.searchParams.get("q") ?? url.searchParams.get("query") ?? "",
  )
  const query = queryRaw.trim()
  const limit = parseLimit(url.searchParams.get("limit"))

  if (query.length < 2) {
    return json({
      query,
      results: [],
    })
  }

  const ilikePattern = `%${query}%`
  const [titleResult, bodyResult] = await Promise.all([
    supabase
      .from("search_all")
      .select("entity_type, id, slug, title, body")
      .eq("org_id", context.orgId)
      .ilike("title", ilikePattern)
      .limit(limit * 3),
    supabase
      .from("search_all")
      .select("entity_type, id, slug, title, body")
      .eq("org_id", context.orgId)
      .ilike("body", ilikePattern)
      .limit(limit * 3),
  ])

  if (titleResult.error) {
    failSearch("app.search.query.title", titleResult.error)
  }
  if (bodyResult.error) {
    failSearch("app.search.query.body", bodyResult.error)
  }

  const baseRows = dedupeSearchRows([
    ...((titleResult.data ?? []) as SearchAllRow[]),
    ...((bodyResult.data ?? []) as SearchAllRow[]),
  ])

  const actionIds = uniqueStrings(
    baseRows.filter((row) => row.entity_type === "action").map((row) => row.id),
  )
  const processResultIds = uniqueStrings(
    baseRows
      .filter((row) => row.entity_type === "process")
      .map((row) => row.id),
  )
  const roleResultIds = uniqueStrings(
    baseRows.filter((row) => row.entity_type === "role").map((row) => row.id),
  )
  const systemResultIds = uniqueStrings(
    baseRows.filter((row) => row.entity_type === "system").map((row) => row.id),
  )

  let actionRouteRows: ActionRouteRow[] = []
  if (actionIds.length > 0) {
    const { data, error } = await supabase
      .from("actions")
      .select("id, sequence, process_id, owner_role_id, system_id")
      .eq("org_id", context.orgId)
      .in("id", actionIds)
      .order("sequence")
      .order("id")

    if (error) {
      failSearch("app.search.routes.actions", error)
    }
    actionRouteRows = (data ?? []) as ActionRouteRow[]
  }

  let processContextActionRows: ActionRouteRow[] = []
  if (processResultIds.length > 0) {
    const { data, error } = await supabase
      .from("actions")
      .select("id, sequence, process_id, owner_role_id, system_id")
      .eq("org_id", context.orgId)
      .in("process_id", processResultIds)
      .order("sequence")
      .order("id")

    if (error) {
      failSearch("app.search.context.process_actions", error)
    }
    processContextActionRows = (data ?? []) as ActionRouteRow[]
  }

  let roleContextActionRows: ActionRouteRow[] = []
  if (roleResultIds.length > 0) {
    const { data, error } = await supabase
      .from("actions")
      .select("id, sequence, process_id, owner_role_id, system_id")
      .eq("org_id", context.orgId)
      .in("owner_role_id", roleResultIds)
      .order("sequence")
      .order("id")

    if (error) {
      failSearch("app.search.context.role_actions", error)
    }
    roleContextActionRows = (data ?? []) as ActionRouteRow[]
  }

  let systemContextActionRows: ActionRouteRow[] = []
  if (systemResultIds.length > 0) {
    const { data, error } = await supabase
      .from("actions")
      .select("id, sequence, process_id, owner_role_id, system_id")
      .eq("org_id", context.orgId)
      .in("system_id", systemResultIds)
      .order("sequence")
      .order("id")

    if (error) {
      failSearch("app.search.context.system_actions", error)
    }
    systemContextActionRows = (data ?? []) as ActionRouteRow[]
  }

  const allLinkedActions = dedupeActionRows([
    ...actionRouteRows,
    ...processContextActionRows,
    ...roleContextActionRows,
    ...systemContextActionRows,
  ])

  const linkedProcessIds = uniqueStrings(
    allLinkedActions.map((row) => row.process_id),
  )
  const linkedRoleIds = uniqueStrings(
    allLinkedActions.map((row) => row.owner_role_id),
  )
  const linkedSystemIds = uniqueStrings(
    allLinkedActions.map((row) => row.system_id),
  )

  const processById = new Map<string, SearchPortalProcess>()
  if (linkedProcessIds.length > 0) {
    const { data, error } = await supabase
      .from("processes")
      .select("id, slug, name")
      .eq("org_id", context.orgId)
      .in("id", linkedProcessIds)

    if (error) {
      failSearch("app.search.routes.processes", error)
    }

    for (const process of (data ?? []) as ProcessRouteRow[]) {
      processById.set(process.id, {
        slug: process.slug,
        name: process.name,
      })
    }
  }

  const roleById = new Map<string, SearchPortalRole>()
  if (linkedRoleIds.length > 0) {
    const { data, error } = await supabase
      .from("roles")
      .select("id, slug, name")
      .eq("org_id", context.orgId)
      .in("id", linkedRoleIds)

    if (error) {
      failSearch("app.search.routes.roles", error)
    }

    for (const role of (data ?? []) as RoleRouteRow[]) {
      roleById.set(role.id, {
        slug: role.slug,
        name: role.name,
        initials: makeInitials(role.name),
      })
    }
  }

  const systemById = new Map<string, SearchPortalSystem>()
  if (linkedSystemIds.length > 0) {
    const { data, error } = await supabase
      .from("systems")
      .select("id, slug, name")
      .eq("org_id", context.orgId)
      .in("id", linkedSystemIds)

    if (error) {
      failSearch("app.search.routes.systems", error)
    }

    for (const system of (data ?? []) as SystemRouteRow[]) {
      systemById.set(system.id, {
        slug: system.slug,
        name: system.name,
      })
    }
  }

  const actionRouteById = new Map<string, SearchActionRoute>()
  for (const action of actionRouteRows) {
    const process = processById.get(action.process_id)
    if (!process) {
      continue
    }
    actionRouteById.set(action.id, {
      actionId: action.id,
      sequence: action.sequence,
      process,
      role: roleById.get(action.owner_role_id) ?? null,
      system: systemById.get(action.system_id) ?? null,
    })
  }

  const entityContextByKey = new Map<string, SearchResultContext>()
  const firstActionByProcessId = indexFirstBy(
    processContextActionRows,
    (row) => row.process_id,
  )
  const firstActionByRoleId = indexFirstBy(
    roleContextActionRows,
    (row) => row.owner_role_id,
  )
  const firstActionBySystemId = indexFirstBy(
    systemContextActionRows,
    (row) => row.system_id,
  )

  for (const processId of processResultIds) {
    const linkedAction = firstActionByProcessId.get(processId)
    entityContextByKey.set(`process:${processId}`, {
      process: processById.get(processId) ?? null,
      role: linkedAction
        ? (roleById.get(linkedAction.owner_role_id) ?? null)
        : null,
      system: linkedAction
        ? (systemById.get(linkedAction.system_id) ?? null)
        : null,
    })
  }
  for (const roleId of roleResultIds) {
    const linkedAction = firstActionByRoleId.get(roleId)
    entityContextByKey.set(`role:${roleId}`, {
      process: linkedAction
        ? (processById.get(linkedAction.process_id) ?? null)
        : null,
      role: roleById.get(roleId) ?? null,
      system: linkedAction
        ? (systemById.get(linkedAction.system_id) ?? null)
        : null,
    })
  }
  for (const systemId of systemResultIds) {
    const linkedAction = firstActionBySystemId.get(systemId)
    entityContextByKey.set(`system:${systemId}`, {
      process: linkedAction
        ? (processById.get(linkedAction.process_id) ?? null)
        : null,
      role: linkedAction
        ? (roleById.get(linkedAction.owner_role_id) ?? null)
        : null,
      system: systemById.get(systemId) ?? null,
    })
  }

  const results = mapSearchResults({
    rows: baseRows,
    query,
    actionRouteById,
    entityContextByKey,
    limit,
  })

  return json({
    query,
    results,
  })
}
