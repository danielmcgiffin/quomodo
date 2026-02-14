import { createClient } from "@supabase/supabase-js"

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const isUserMissingError = (error) => {
  const message = String(error?.message ?? "").toLowerCase()
  return (
    error?.status === 404 ||
    message.includes("user not found") ||
    message.includes("not found")
  )
}

const supabaseUrl = requireEnv("PUBLIC_SUPABASE_URL")
const supabaseServiceRole = requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE")
const email = requireEnv("E2E_EMAIL")
const password = requireEnv("E2E_PASSWORD")

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const ensureE2EUser = async () => {
  const preferredUserId = process.env.E2E_USER_ID
  if (preferredUserId) {
    const { data, error } = await supabase.auth.admin.getUserById(preferredUserId)
    if (error && !isUserMissingError(error)) {
      throw new Error(`Unable to lookup E2E user (${preferredUserId}): ${error.message}`)
    }
    if (data?.user) {
      return { userId: data.user.id, created: false }
    }
  }

  // If user already exists (by email), just reuse it.
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (usersError) {
    throw new Error(`Unable to list users: ${usersError.message}`)
  }

  const existing = (usersData?.users ?? []).find(
    (u) => typeof u.email === "string" && u.email.toLowerCase() === email.toLowerCase(),
  )
  if (existing) {
    return { userId: existing.id, created: false }
  }

  const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "SystemsCraft E2E User",
    },
  })

  if (createError || !createdData?.user?.id) {
    throw new Error(`Unable to create E2E user (${email}): ${createError?.message ?? "unknown error"}`)
  }

  return { userId: createdData.user.id, created: true }
}

const main = async () => {
  const user = await ensureE2EUser()

  const { data: seededOrgId, error: seedError } = await supabase.rpc("sc_seed_demo", {
    p_owner_user_id: user.userId,
  })

  if (seedError) {
    if (String(seedError.message).includes("sc_seed_demo")) {
      throw new Error(
        "Seed function is missing. Apply all `supabase/migrations/*` files to the E2E Supabase project, then rerun.",
      )
    }
    throw new Error(`Seed failed: ${seedError.message}`)
  }

  if (!seededOrgId) {
    throw new Error("Seed succeeded but no org id was returned.")
  }

  console.log("SystemsCraft E2E seed complete.")
  console.log(`e2e_user_id=${user.userId} (${user.created ? "created" : "reused"})`)
  console.log(`org_id=${seededOrgId}`)
}

main().catch((error) => {
  console.error(String(error?.message ?? error))
  process.exit(1)
})

