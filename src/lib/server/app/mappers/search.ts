export type SearchEntityType = "role" | "system" | "process" | "action"

export type SearchAllRow = {
  entity_type: SearchEntityType
  id: string
  slug: string | null
  title: string
  body: string
}

export type SearchPortalProcess = {
  slug: string
  name: string
}

export type SearchPortalRole = {
  slug: string
  name: string
  initials: string
}

export type SearchPortalSystem = {
  slug: string
  name: string
}

export type SearchActionRoute = {
  actionId: string
  sequence: number
  process: SearchPortalProcess
  role: SearchPortalRole | null
  system: SearchPortalSystem | null
}

export type SearchResultContext = {
  process: SearchPortalProcess | null
  role: SearchPortalRole | null
  system: SearchPortalSystem | null
}

export type SearchResult = {
  id: string
  type: SearchEntityType
  title: string
  snippet: string
  href: string
  actionSequence: number | null
  portalProcess: SearchPortalProcess | null
  portalRole: SearchPortalRole | null
  portalSystem: SearchPortalSystem | null
  contextProcess: SearchPortalProcess | null
  contextRole: SearchPortalRole | null
  contextSystem: SearchPortalSystem | null
}

const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, " ").trim()

const extractText = (value: unknown): string => {
  if (!value) {
    return ""
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) {
      return ""
    }
    const isLikelyJson =
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    if (isLikelyJson) {
      try {
        return extractText(JSON.parse(trimmed))
      } catch {
        return normalizeWhitespace(trimmed)
      }
    }
    return normalizeWhitespace(trimmed)
  }
  if (Array.isArray(value)) {
    return normalizeWhitespace(value.map((item) => extractText(item)).join(" "))
  }
  if (typeof value === "object") {
    const node = value as Record<string, unknown>
    const text = typeof node.text === "string" ? node.text : ""
    return normalizeWhitespace(`${text} ${extractText(node.content)}`)
  }
  return ""
}

const buildSnippet = ({
  body,
  query,
  maxLength = 180,
}: {
  body: string
  query: string
  maxLength?: number
}) => {
  const text = extractText(body)
  if (!text) {
    return ""
  }

  const normalizedQuery = normalizeWhitespace(query).toLowerCase()
  if (!normalizedQuery) {
    return text.length <= maxLength
      ? text
      : `${text.slice(0, maxLength - 3)}...`
  }

  const loweredText = text.toLowerCase()
  const tokens = [normalizedQuery, ...normalizedQuery.split(" ")].filter(
    Boolean,
  )
  let matchToken = ""
  let matchIndex = -1
  for (const token of tokens) {
    const index = loweredText.indexOf(token)
    if (index !== -1) {
      matchToken = token
      matchIndex = index
      break
    }
  }

  if (matchIndex === -1) {
    return text.length <= maxLength
      ? text
      : `${text.slice(0, maxLength - 3)}...`
  }

  const start = Math.max(0, matchIndex - 55)
  const minEnd = matchIndex + matchToken.length + 80
  const end = Math.min(text.length, Math.max(start + maxLength, minEnd))
  const snippet = text.slice(start, end).trim()
  const prefix = start > 0 ? "..." : ""
  const suffix = end < text.length ? "..." : ""

  return `${prefix}${snippet}${suffix}`
}

const makeInitials = (value: string): string => {
  const letters = normalizeWhitespace(value)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  return letters || "?"
}

const buildTokens = (query: string): string[] => {
  const normalized = normalizeWhitespace(query).toLowerCase()
  if (!normalized) {
    return []
  }
  return Array.from(
    new Set([normalized, ...normalized.split(" ").filter(Boolean)]),
  )
}

const tokenCoverage = (text: string, tokens: string[]): number => {
  if (!text || tokens.length === 0) {
    return 0
  }
  return tokens.reduce(
    (count, token) => count + (text.includes(token) ? 1 : 0),
    0,
  )
}

const scoreTitleRank = (title: string, query: string, tokens: string[]) => {
  const normalizedTitle = normalizeWhitespace(title).toLowerCase()
  const normalizedQuery = normalizeWhitespace(query).toLowerCase()
  if (!normalizedQuery) {
    return 5
  }
  if (normalizedTitle === normalizedQuery) {
    return 0
  }
  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 1
  }
  if (normalizedTitle.includes(normalizedQuery)) {
    return 2
  }
  if (
    tokens.length > 0 &&
    tokens.every((token) => normalizedTitle.includes(token))
  ) {
    return 3
  }
  if (
    tokens.length > 0 &&
    tokens.some((token) => normalizedTitle.includes(token))
  ) {
    return 4
  }
  return 5
}

const buildHref = ({
  type,
  slug,
  actionRoute,
}: {
  type: SearchEntityType
  slug: string | null
  actionRoute: SearchActionRoute | undefined
}) => {
  if (type === "role" && slug) {
    return `/app/roles/${slug}`
  }
  if (type === "system" && slug) {
    return `/app/systems/${slug}`
  }
  if (type === "process" && slug) {
    return `/app/processes/${slug}`
  }
  if (type === "action" && actionRoute) {
    return `/app/processes/${actionRoute.process.slug}?actionId=${actionRoute.actionId}`
  }
  return "/app/processes"
}

const entityTypePriority: Record<SearchEntityType, number> = {
  process: 0,
  role: 1,
  system: 2,
  action: 3,
}

export const mapSearchResults = ({
  rows,
  query,
  actionRouteById,
  entityContextByKey,
  limit,
}: {
  rows: SearchAllRow[]
  query: string
  actionRouteById: Map<string, SearchActionRoute>
  entityContextByKey: Map<string, SearchResultContext>
  limit: number
}): SearchResult[] => {
  const queryTokens = buildTokens(query)
  return rows
    .map((row) => {
      const actionRoute =
        row.entity_type === "action" ? actionRouteById.get(row.id) : undefined
      const context = entityContextByKey.get(
        `${row.entity_type}:${row.id}`,
      ) ?? {
        process: null,
        role: null,
        system: null,
      }
      const fallbackSnippet = buildSnippet({
        body: row.body,
        query,
      })
      const snippet = fallbackSnippet || row.title
      const title =
        row.entity_type === "action" && actionRoute
          ? `Action ${actionRoute.sequence} in ${actionRoute.process.name}`
          : row.title

      let actionSequence: number | null = null
      let portalProcess: SearchPortalProcess | null = null
      let portalRole: SearchPortalRole | null = null
      let portalSystem: SearchPortalSystem | null = null
      let contextProcess: SearchPortalProcess | null = context.process
      let contextRole: SearchPortalRole | null = context.role
      let contextSystem: SearchPortalSystem | null = context.system

      if (row.entity_type === "process" && row.slug) {
        portalProcess = { slug: row.slug, name: row.title }
        contextProcess = null
      }
      if (row.entity_type === "role" && row.slug) {
        portalRole = {
          slug: row.slug,
          name: row.title,
          initials: makeInitials(row.title),
        }
        contextRole = null
      }
      if (row.entity_type === "system" && row.slug) {
        portalSystem = { slug: row.slug, name: row.title }
        contextSystem = null
      }
      if (row.entity_type === "action" && actionRoute) {
        actionSequence = actionRoute.sequence
        portalProcess = actionRoute.process
        contextProcess = null
        contextRole = actionRoute.role
        contextSystem = actionRoute.system
      }

      const normalizedTitle = normalizeWhitespace(title).toLowerCase()
      const normalizedSnippet = normalizeWhitespace(snippet).toLowerCase()
      const titleRank = scoreTitleRank(title, query, queryTokens)
      const titleCoverage = tokenCoverage(normalizedTitle, queryTokens)
      const snippetCoverage = tokenCoverage(normalizedSnippet, queryTokens)

      return {
        id: row.id,
        type: row.entity_type,
        title,
        snippet,
        href: buildHref({
          type: row.entity_type,
          slug: row.slug,
          actionRoute,
        }),
        actionSequence,
        portalProcess,
        portalRole,
        portalSystem,
        contextProcess,
        contextRole,
        contextSystem,
        score: {
          titleRank,
          titleCoverage,
          snippetCoverage,
          typePriority: entityTypePriority[row.entity_type],
        },
      }
    })
    .sort((a, b) => {
      if (a.score.titleRank !== b.score.titleRank) {
        return a.score.titleRank - b.score.titleRank
      }
      if (a.score.titleCoverage !== b.score.titleCoverage) {
        return b.score.titleCoverage - a.score.titleCoverage
      }
      if (a.score.snippetCoverage !== b.score.snippetCoverage) {
        return b.score.snippetCoverage - a.score.snippetCoverage
      }
      if (a.score.typePriority !== b.score.typePriority) {
        return a.score.typePriority - b.score.typePriority
      }
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    })
    .slice(0, limit)
    .map((result) => {
      const { score, ...mapped } = result
      void score
      return mapped
    })
}
