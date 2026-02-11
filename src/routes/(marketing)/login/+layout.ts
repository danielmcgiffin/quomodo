import { env as publicEnv } from "$env/dynamic/public"
import {
  createBrowserClient,
  isBrowser,
} from "@supabase/ssr"
import { redirect } from "@sveltejs/kit"

const { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } = publicEnv

export const load = async ({ fetch, data, depends }) => {
  depends("supabase:auth")

  const authConfigured = Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY)
  const supabase =
    isBrowser() && authConfigured
      ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
          global: {
            fetch,
          },
        })
      : null

  // Server session from hooks is enough for redirect on login routes.
  if (data.session) {
    redirect(303, "/app/processes")
  }

  const url = data.url

  return { supabase, url, authConfigured }
}
