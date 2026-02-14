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

const slugify = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

const randomSuffix = () => Math.random().toString(36).slice(2, 8)

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

const ensureLapsedWorkspace = async ({ userId }) => {
  const workspaceName = process.env.E2E_LAPSED_WORKSPACE_NAME || "E2E Lapsed Workspace"

  const existingOrg = await supabase
    .from("orgs")
    .select("id")
    .eq("owner_id", userId)
    .eq("name", workspaceName)
    .maybeSingle()

  if (existingOrg.error) {
    throw new Error(`Unable to lookup lapsed org: ${existingOrg.error.message}`)
  }

  let orgId = existingOrg.data?.id
  if (!orgId) {
    const baseSlug = slugify(workspaceName) || "e2e-lapsed"

    let inserted = null
    for (let i = 0; i < 6; i += 1) {
      const attemptSlug = `${baseSlug}-${randomSuffix()}`
      const insertResult = await supabase
        .from("orgs")
        .insert({ name: workspaceName, slug: attemptSlug, owner_id: userId })
        .select("id")
        .single()

      if (!insertResult.error && insertResult.data?.id) {
        inserted = insertResult.data
        break
      }
      if (insertResult.error?.code !== "23505") {
        throw new Error(`Unable to create lapsed org: ${insertResult.error.message}`)
      }
    }

    if (!inserted?.id) {
      throw new Error("Unable to create lapsed org: slug generation exhausted")
    }

    orgId = inserted.id

    // Ensure owner membership exists.
    const upsertMemberResult = await supabase
      .from("org_members")
      .upsert(
        {
          org_id: orgId,
          user_id: userId,
          role: "owner",
          accepted_at: new Date().toISOString(),
        },
        { onConflict: "org_id,user_id" },
      )

    if (upsertMemberResult.error) {
      throw new Error(`Unable to upsert lapsed org member: ${upsertMemberResult.error.message}`)
    }
  }

  const upsertBillingResult = await supabase.from("org_billing").upsert(
    {
      org_id: orgId,
      stripe_customer_id: null,
      plan_id: "free",
      billing_state: "lapsed",
      has_ever_paid: true,
      last_checked_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "org_id" },
  )

  if (upsertBillingResult.error) {
    throw new Error(`Unable to mark org as lapsed: ${upsertBillingResult.error.message}`)
  }

  return { orgId, workspaceName }
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

  const lapsed = await ensureLapsedWorkspace({ userId: user.userId })

  console.log("SystemsCraft E2E seed complete.")
  console.log(`e2e_user_id=${user.userId} (${user.created ? "created" : "reused"})`)
  console.log(`org_id=${seededOrgId}`)
  console.log(`lapsed_org_id=${lapsed.orgId} (${lapsed.workspaceName})`)
}

main().catch((error) => {
  console.error(String(error?.message ?? error))
  process.exit(1)
})
