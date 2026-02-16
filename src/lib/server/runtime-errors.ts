import { error as kitError } from "@sveltejs/kit"
import { sendAdminEmail } from "$lib/mailer"

export const USER_SAFE_LOAD_ERROR_MESSAGE =
  "We couldn't load this data. Please refresh and try again."
export const USER_SAFE_SEARCH_ERROR_MESSAGE =
  "Search is temporarily unavailable. Please try again."
export const USER_SAFE_WORKSPACE_ERROR_MESSAGE =
  "We couldn't load your workspace. Please refresh and try again."
export const USER_SAFE_WORKSPACE_CREATE_ERROR_MESSAGE =
  "We couldn't initialize your workspace. Please try again."
export const USER_SAFE_REQUEST_ERROR_MESSAGE =
  "We couldn't complete that request. Please try again."

type LogRuntimeErrorArgs = {
  context: string
  error: unknown
  requestId?: string | null
  route?: string | null
  userId?: string | null
  details?: Record<string, unknown>
}

type ThrowRuntime500Args = LogRuntimeErrorArgs & {
  userMessage?: string
}

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  if (typeof error === "string") {
    return { message: error }
  }

  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>
    const message = typeof candidate.message === "string" ? candidate.message : null
    const name = typeof candidate.name === "string" ? candidate.name : null
    const code =
      typeof candidate.code === "string" || typeof candidate.code === "number"
        ? candidate.code
        : null
    const status =
      typeof candidate.status === "number" || typeof candidate.status === "string"
        ? candidate.status
        : null
    const details = candidate.details
    const hint = candidate.hint

    // Common shape for Supabase/Postgrest errors and other SDK error objects.
    if (message || name || code || status) {
      return {
        ...(name ? { name } : {}),
        ...(message ? { message } : { message: "[non-Error object thrown]" }),
        ...(code !== null ? { code } : {}),
        ...(status !== null ? { status } : {}),
        ...(details !== undefined ? { details } : {}),
        ...(hint !== undefined ? { hint } : {}),
      }
    }

    try {
      return { message: JSON.stringify(candidate) }
    } catch {
      return { message: "[non-serializable object thrown]" }
    }
  }

  return {
    message: String(error),
  }
}

// In-memory rate limiting: max 1 email per unique error per 5 minutes.
const errorRateLimitCache = new Map<string, number>()
const FIVE_MINUTES = 5 * 60 * 1000

export const logRuntimeError = ({
  context,
  error,
  requestId = null,
  route = null,
  userId = null,
  details = {},
}: LogRuntimeErrorArgs) => {
  const normalized = normalizeError(error)
  console.error("[runtime-error]", {
    context,
    requestId,
    route,
    userId,
    error: normalized,
    ...details,
  })

  // Rate limiting check
  const cacheKey = `${context}:${route}:${normalized.message}`
  const now = Date.now()
  const lastSent = errorRateLimitCache.get(cacheKey)

  if (!lastSent || now - lastSent > FIVE_MINUTES) {
    errorRateLimitCache.set(cacheKey, now)

    // Fire and forget email (don't block the request)
    const subject = `500 ERROR: ${context}`
    const body = `
Context: ${context}
Route: ${route || "Unknown"}
Request ID: ${requestId || "N/A"}
User ID: ${userId || "Guest/Anonymous"}
Timestamp: ${new Date().toISOString()}

Error: ${normalized.message}
${normalized.stack ? `\nStack Trace:\n${normalized.stack}` : ""}

Details: ${JSON.stringify(details, null, 2)}
    `.trim()

    sendAdminEmail({ subject, body }).catch((err) => {
      console.error("[runtime-error] Failed to send admin email notification:", err)
    })

    // Clean up cache occasionally
    if (errorRateLimitCache.size > 1000) {
      for (const [key, timestamp] of errorRateLimitCache.entries()) {
        if (now - timestamp > FIVE_MINUTES) {
          errorRateLimitCache.delete(key)
        }
      }
    }
  }
}

export const throwRuntime500 = ({
  context,
  error,
  requestId,
  route,
  userId,
  details,
  userMessage = USER_SAFE_LOAD_ERROR_MESSAGE,
}: ThrowRuntime500Args): never => {
  logRuntimeError({
    context,
    error,
    requestId,
    route,
    userId,
    details,
  })

  throw kitError(500, userMessage)
}
