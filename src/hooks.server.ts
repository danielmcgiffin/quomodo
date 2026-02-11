// src/hooks.server.ts
import { dev } from "$app/environment"
import { env as privateEnv } from "$env/dynamic/private"
import { env as publicEnv } from "$env/dynamic/public"
import { createServerClient } from "@supabase/ssr"
import { createClient, type AMREntry, type User } from "@supabase/supabase-js"
import type { Handle } from "@sveltejs/kit"
import { sequence } from "@sveltejs/kit/hooks"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "./DatabaseDefinitions"

const { PRIVATE_SUPABASE_SERVICE_ROLE } = privateEnv
const { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } = publicEnv
const DEV_AUTH_BYPASS_ENABLED =
  dev && privateEnv.PRIVATE_DEV_AUTH_BYPASS === "true"
const DEV_AUTH_BYPASS_USER_ID = privateEnv.PRIVATE_DEV_AUTH_BYPASS_USER_ID
const DEV_AUTH_BYPASS_USER_EMAIL = privateEnv.PRIVATE_DEV_AUTH_BYPASS_USER_EMAIL

const missingSupabaseEnvMessage =
  "Supabase env vars are missing. Set PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, and PRIVATE_SUPABASE_SERVICE_ROLE."

const makeMissingClient = () =>
  new Proxy(
    {},
    {
      get() {
        throw new Error(missingSupabaseEnvMessage)
      },
    },
  ) as SupabaseClient<Database>

export const supabase: Handle = async ({ event, resolve }) => {
  if (
    !PUBLIC_SUPABASE_URL ||
    !PUBLIC_SUPABASE_ANON_KEY ||
    !PRIVATE_SUPABASE_SERVICE_ROLE
  ) {
    console.warn(missingSupabaseEnvMessage)
    event.locals.supabase = makeMissingClient()
    event.locals.supabaseServiceRole = makeMissingClient()
    event.locals.safeGetSession = async () => ({
      session: null,
      user: null,
      amr: null,
    })

    return resolve(event)
  }

  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        /**
         * SvelteKit's cookies API requires `path` to be explicitly set in
         * the cookie options. Setting `path` to `/` replicates previous/
         * standard behavior.
         */
        setAll: (
          cookiesToSet: {
            name: string
            value: string
            options: Record<string, unknown>
          }[],
        ) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { ...options, path: "/" })
          })
        },
      },
    },
  )

  event.locals.supabaseServiceRole = createClient(
    PUBLIC_SUPABASE_URL,
    PRIVATE_SUPABASE_SERVICE_ROLE,
    { auth: { persistSession: false } },
  )

  // https://github.com/supabase/auth-js/issues/888#issuecomment-2189298518
  if ("suppressGetSessionWarning" in event.locals.supabase.auth) {
    // @ts-expect-error - suppressGetSessionWarning is not part of the official API
    event.locals.supabase.auth.suppressGetSessionWarning = true
  } else {
    console.warn(
      "SupabaseAuthClient#suppressGetSessionWarning was removed. See https://github.com/supabase/auth-js/issues/888.",
    )
  }

  /**
   * Unlike `supabase.auth.getSession()`, which returns the session _without_
   * validating the JWT, this function also calls `getUser()` to validate the
   * JWT before returning the session.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    if (!session) {
      return { session: null, user: null, amr: null }
    }

    const {
      data: { user },
      error: userError,
    } = await event.locals.supabase.auth.getUser()
    if (userError) {
      // JWT validation has failed
      return { session: null, user: null, amr: null }
    }

    const { data: aal, error: amrError } =
      await event.locals.supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (amrError) {
      return { session, user, amr: null }
    }

    return {
      session,
      user,
      amr: aal.currentAuthenticationMethods as AMREntry[],
    }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range" || name === "x-supabase-api-version"
    },
  })
}

// Not called for prerendered marketing pages so generally okay to call on ever server request
// Next-page CSR will mean relatively minimal calls to this hook
const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()
  if (!user && DEV_AUTH_BYPASS_ENABLED) {
    let bypassUserId = DEV_AUTH_BYPASS_USER_ID ?? null

    if (!bypassUserId) {
      const { data: org, error: orgError } =
        await event.locals.supabaseServiceRole
          .from("orgs")
          .select("owner_id")
          .not("owner_id", "is", null)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle()

      if (!orgError && org?.owner_id) {
        bypassUserId = org.owner_id
      }
    }

    if (bypassUserId) {
      // Local-only dev ergonomics: run app data access as service role.
      event.locals.supabase = event.locals.supabaseServiceRole
      event.locals.session = session
      event.locals.user = {
        id: bypassUserId,
        email: DEV_AUTH_BYPASS_USER_EMAIL ?? "local-dev@systemscraft.local",
        user_metadata: { full_name: "Local Dev" },
      } as unknown as User
      return resolve(event)
    }

    console.warn(
      "Dev auth bypass is enabled, but no user id was found. Set PRIVATE_DEV_AUTH_BYPASS_USER_ID or create a workspace with an owner.",
    )
  }

  event.locals.session = session
  event.locals.user = user

  return resolve(event)
}

export const handle: Handle = sequence(supabase, authGuard)
