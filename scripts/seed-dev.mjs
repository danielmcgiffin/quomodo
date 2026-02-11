import { randomUUID } from "node:crypto"
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

const isDuplicateEmailError = (error) => {
  const message = String(error?.message ?? "").toLowerCase()
  return (
    message.includes("already") ||
    message.includes("duplicate") ||
    message.includes("exists")
  )
}

const supabaseUrl = requireEnv("PUBLIC_SUPABASE_URL")
const supabaseServiceRole = requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE")

const preferredOwnerId =
  process.env.SEED_DEV_OWNER_USER_ID ||
  process.env.PRIVATE_DEV_AUTH_BYPASS_USER_ID ||
  "00000000-0000-0000-0000-000000000000"

const preferredOwnerEmail =
  process.env.SEED_DEV_OWNER_EMAIL ||
  process.env.PRIVATE_DEV_AUTH_BYPASS_USER_EMAIL ||
  "dev-owner@systemscraft.local"

const preferredOwnerPassword =
  process.env.SEED_DEV_OWNER_PASSWORD || `DevSeed!${randomUUID()}Aa1`

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const ensureOwnerUser = async () => {
  const { data: existingData, error: existingError } =
    await supabase.auth.admin.getUserById(preferredOwnerId)

  if (existingError && !isUserMissingError(existingError)) {
    throw new Error(
      `Unable to lookup owner user (${preferredOwnerId}): ${existingError.message}`,
    )
  }

  if (existingData?.user) {
    return { userId: existingData.user.id, created: false }
  }

  const { data: createdData, error: createError } =
    await supabase.auth.admin.createUser({
      id: preferredOwnerId,
      email: preferredOwnerEmail,
      password: preferredOwnerPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "SystemsCraft Dev Owner",
      },
    })

  if (!createError && createdData?.user) {
    return { userId: createdData.user.id, created: true }
  }

  if (!isDuplicateEmailError(createError)) {
    throw new Error(
      `Unable to create owner user (${preferredOwnerEmail}): ${createError?.message ?? "unknown error"}`,
    )
  }

  const { data: usersData, error: usersError } =
    await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

  if (usersError) {
    throw new Error(
      `Owner email already exists, but users list failed: ${usersError.message}`,
    )
  }

  const existingUsers = usersData?.users ?? []

  const existingByEmail = existingUsers.find(
    (user) =>
      typeof user.email === "string" &&
      user.email.toLowerCase() === preferredOwnerEmail.toLowerCase(),
  )

  if (!existingByEmail) {
    throw new Error(
      `Owner email already exists, but no user was returned for ${preferredOwnerEmail}.`,
    )
  }

  return { userId: existingByEmail.id, created: false }
}

const countByOrg = async (table, orgId) => {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)

  if (error) {
    throw new Error(`Unable to count ${table}: ${error.message}`)
  }

  return count ?? 0
}

const main = async () => {
  const owner = await ensureOwnerUser()
  const { data: seededOrgId, error: seedError } = await supabase.rpc(
    "sc_seed_demo",
    {
      p_owner_user_id: owner.userId,
    },
  )

  if (seedError) {
    if (String(seedError.message).includes("sc_seed_demo")) {
      throw new Error(
        "Seed function is missing. Apply all `supabase/migrations/*` files, then rerun `npm run seed:dev`.",
      )
    }
    throw new Error(`Seed failed: ${seedError.message}`)
  }

  if (!seededOrgId) {
    throw new Error("Seed succeeded but no org id was returned.")
  }

  const [roles, systems, processes, actions, flags] = await Promise.all([
    countByOrg("roles", seededOrgId),
    countByOrg("systems", seededOrgId),
    countByOrg("processes", seededOrgId),
    countByOrg("actions", seededOrgId),
    countByOrg("flags", seededOrgId),
  ])

  console.log("SystemsCraft dev seed complete.")
  console.log(`owner_user_id=${owner.userId} (${owner.created ? "created" : "reused"})`)
  console.log(`org_id=${seededOrgId}`)
  console.log(
    `counts roles=${roles} systems=${systems} processes=${processes} actions=${actions} flags=${flags}`,
  )
}

main().catch((error) => {
  console.error(String(error?.message ?? error))
  process.exit(1)
})
