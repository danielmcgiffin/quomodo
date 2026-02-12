import { json, type RequestHandler } from "@sveltejs/kit"
import { ensureOrgContext } from "$lib/server/atlas"
import {
  USER_SAFE_SEARCH_ERROR_MESSAGE,
  throwRuntime500,
} from "$lib/server/runtime-errors"
import {
  mapSearchResults,
  type SearchActionRoute,
  type SearchAllRow,
} from "$lib/server/app/mappers/search"

type ActionRouteRow = {
  id: string
  sequence: number
  process_id: string
}

type ProcessRouteRow = {
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

  const actionIds = baseRows
    .filter((row) => row.entity_type === "action")
    .map((row) => row.id)
  const actionRouteById = new Map<string, SearchActionRoute>()

  if (actionIds.length > 0) {
    const { data: actionRowsData, error: actionRowsError } = await supabase
      .from("actions")
      .select("id, sequence, process_id")
      .eq("org_id", context.orgId)
      .in("id", actionIds)

    if (actionRowsError) {
      failSearch("app.search.routes.actions", actionRowsError)
    }

    const actionRows = (actionRowsData ?? []) as ActionRouteRow[]
    const processIds = Array.from(
      new Set(actionRows.map((row) => row.process_id).filter(Boolean)),
    )

    const processById = new Map<string, ProcessRouteRow>()
    if (processIds.length > 0) {
      const { data: processRowsData, error: processRowsError } = await supabase
        .from("processes")
        .select("id, slug, name")
        .eq("org_id", context.orgId)
        .in("id", processIds)

      if (processRowsError) {
        failSearch("app.search.routes.processes", processRowsError)
      }

      for (const process of (processRowsData ?? []) as ProcessRouteRow[]) {
        processById.set(process.id, process)
      }
    }

    for (const action of actionRows) {
      const process = processById.get(action.process_id)
      if (!process) {
        continue
      }
      actionRouteById.set(action.id, {
        actionId: action.id,
        sequence: action.sequence,
        processSlug: process.slug,
        processName: process.name,
      })
    }
  }

  const results = mapSearchResults({
    rows: baseRows,
    query,
    actionRouteById,
    limit,
  })

  return json({
    query,
    results,
  })
}
