// src/routes/auth/callback/+server.js
import { redirect } from "@sveltejs/kit"
import { isAuthApiError } from "@supabase/supabase-js"

/** @param {string | null} value */
const resolveNextPath = (value) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null
  }
  return value
}

export const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get("code")
  if (code) {
    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      // If you open in another browser, need to redirect to login.
      // Should not display error
      if (isAuthApiError(error)) {
        redirect(303, "/login/sign_in?verified=true")
      } else {
        throw error
      }
    }
  }

  const next = resolveNextPath(url.searchParams.get("next"))
  if (next) {
    redirect(303, next)
  }

  redirect(303, "/app/processes")
}
