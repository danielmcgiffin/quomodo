export type SearchEntityType = "role" | "system" | "process" | "action"

export type SearchAllRow = {
  entity_type: SearchEntityType
  id: string
  slug: string | null
  title: string
  body: string
}

export type SearchActionRoute = {
  actionId: string
  sequence: number
  processSlug: string
  processName: string
}

export type SearchResult = {
  id: string
  type: SearchEntityType
  title: string
  snippet: string
  href: string
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
    return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`
  }

  const loweredText = text.toLowerCase()
  const tokens = [normalizedQuery, ...normalizedQuery.split(" ")].filter(Boolean)
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
    return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`
  }

  const start = Math.max(0, matchIndex - 55)
  const minEnd = matchIndex + matchToken.length + 80
  const end = Math.min(text.length, Math.max(start + maxLength, minEnd))
  const snippet = text.slice(start, end).trim()
  const prefix = start > 0 ? "..." : ""
  const suffix = end < text.length ? "..." : ""

  return `${prefix}${snippet}${suffix}`
}

const scoreTitle = (title: string, query: string) => {
  const normalizedTitle = normalizeWhitespace(title).toLowerCase()
  const normalizedQuery = normalizeWhitespace(query).toLowerCase()
  if (!normalizedQuery) {
    return 4
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
  return 3
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
    return `/app/processes/${actionRoute.processSlug}?actionId=${actionRoute.actionId}`
  }
  return "/app/processes"
}

export const mapSearchResults = ({
  rows,
  query,
  actionRouteById,
  limit,
}: {
  rows: SearchAllRow[]
  query: string
  actionRouteById: Map<string, SearchActionRoute>
  limit: number
}): SearchResult[] =>
  rows
    .map((row) => {
      const actionRoute =
        row.entity_type === "action"
          ? actionRouteById.get(row.id)
          : undefined
      const fallbackSnippet = buildSnippet({
        body: row.body,
        query,
      })
      const title =
        row.entity_type === "action" && actionRoute
          ? `Action ${actionRoute.sequence} in ${actionRoute.processName}`
          : row.title
      return {
        id: row.id,
        type: row.entity_type,
        title,
        snippet: fallbackSnippet || title,
        href: buildHref({
          type: row.entity_type,
          slug: row.slug,
          actionRoute,
        }),
        score: scoreTitle(title, query),
      }
    })
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score
      }
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    })
    .slice(0, limit)
    .map(({ score: _score, ...result }) => result)
