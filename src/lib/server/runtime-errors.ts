import { error as kitError } from "@sveltejs/kit"

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

export const logRuntimeError = ({
  context,
  error,
  requestId = null,
  route = null,
  details = {},
}: LogRuntimeErrorArgs) => {
  console.error("[runtime-error]", {
    context,
    requestId,
    route,
    error: normalizeError(error),
    ...details,
  })
}

export const throwRuntime500 = ({
  context,
  error,
  requestId,
  route,
  details,
  userMessage = USER_SAFE_LOAD_ERROR_MESSAGE,
}: ThrowRuntime500Args): never => {
  logRuntimeError({
    context,
    error,
    requestId,
    route,
    details,
  })

  throw kitError(500, userMessage)
}
