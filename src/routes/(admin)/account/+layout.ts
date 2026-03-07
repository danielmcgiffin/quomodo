import { env as publicEnv } from "$env/dynamic/public"
import {
  createBrowserClient,
  createServerClient,
  isBrowser,
} from "@supabase/ssr"
import { redirect } from "@sveltejs/kit"
import type { AMREntry } from "@supabase/supabase-js"
import type { Database } from "../../../DatabaseDefinitions.js"
import { CreateProfileStep } from "../../../config"
import { load_helper } from "$lib/load_helpers"

const { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } = publicEnv

export const load = async ({ fetch, data, depends, url }) => {
  depends("supabase:auth")

  const browser = isBrowser()
  const supabase = browser
    ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
      })
    : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: {
          fetch,
        },
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // no-op on server render: auth cookies are managed in hooks.server.ts
          },
        },
      })

  const authState = browser
    ? await load_helper(data.session, supabase)
    : { session: data.session, user: data.user }

  const { session, user } = authState
  if (!session || !user) {
    redirect(303, "/login")
  }

  let profile =
    (data.profile as Database["public"]["Tables"]["profiles"]["Row"] | null) ??
    null
  if (browser) {
    const { data: browserProfile } = await supabase
      .from("profiles")
      .select(`*`)
      .eq("id", user.id)
      .single()

    if (browserProfile) {
      profile = browserProfile
    }
  }

  let amr = (data.amr ?? null) as AMREntry[] | null
  if (browser) {
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    amr = (aal?.currentAuthenticationMethods as AMREntry[] | null) ?? amr
  }

  const createProfilePath = "/account/create_profile"
  const signOutPath = "/account/sign_out"
  if (
    profile &&
    !_hasFullProfile(profile) &&
    url.pathname !== createProfilePath &&
    url.pathname !== signOutPath &&
    CreateProfileStep
  ) {
    redirect(303, createProfilePath)
  }

  return {
    supabase,
    session,
    profile,
    user,
    amr,
    org: data.org,
    navCounts: data.navCounts,
    billing: data.billing,
    workspaceOptions: data.workspaceOptions,
  }
}

export const _hasFullProfile = (
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null,
) => {
  if (!profile) {
    return false
  }
  if (!profile.full_name) {
    return false
  }
  if (!profile.company_name) {
    return false
  }
  if (!profile.website) {
    return false
  }

  return true
}
