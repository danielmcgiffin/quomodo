import { createClient } from "@supabase/supabase-js"

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const mode = process.argv.includes("--rollback") ? "rollback" : "provision"
const runDateIso = new Date().toISOString()

const publicSupabaseUrl = requireEnv("PUBLIC_SUPABASE_URL")
const privateSupabaseServiceRole = requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE")
const ownerEmail = requireEnv("SMOKE_OWNER_EMAIL")
const adminEmail = requireEnv("SMOKE_ADMIN_EMAIL")
const adminPassword = requireEnv("SMOKE_ADMIN_PASSWORD")
const editorEmail = requireEnv("SMOKE_EDITOR_EMAIL")
const editorPassword = requireEnv("SMOKE_EDITOR_PASSWORD")
const memberEmail = requireEnv("SMOKE_MEMBER_EMAIL")
const memberPassword = requireEnv("SMOKE_MEMBER_PASSWORD")

const serviceSupabase = createClient(
  publicSupabaseUrl,
  privateSupabaseServiceRole,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

const normalizeEmail = (value) => value.trim().toLowerCase()

const findUserByEmail = async (email) => {
  const normalized = normalizeEmail(email)
  const perPage = 200
  let page = 1
  while (true) {
    const { data, error } = await serviceSupabase.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`)
    }

    const users = data?.users ?? []
    const matched = users.find(
      (user) => normalizeEmail(user.email ?? "") === normalized,
    )
    if (matched) {
      return matched
    }

    if (users.length < perPage) {
      break
    }
    page += 1
  }
  return null
}

const ensureUser = async ({ email, password, fullName }) => {
  const existing = await findUserByEmail(email)
  if (existing) {
    return {
      user: existing,
      created: false,
    }
  }

  const { data, error } = await serviceSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  })

  if (error || !data?.user) {
    throw new Error(`Failed to create user ${email}: ${error?.message}`)
  }

  return {
    user: data.user,
    created: true,
  }
}

const loadOwnerOrg = async (ownerUserId) => {
  const { data: membership, error: membershipError } = await serviceSupabase
    .from("org_members")
    .select("org_id, role, accepted_at")
    .eq("user_id", ownerUserId)
    .eq("role", "owner")
    .order("accepted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    throw new Error(
      `Failed to load owner membership: ${membershipError.message}`,
    )
  }

  if (!membership?.org_id) {
    throw new Error(
      "Owner user has no owner membership. Sign in as owner once to initialize a workspace before provisioning.",
    )
  }

  const { data: org, error: orgError } = await serviceSupabase
    .from("orgs")
    .select("id, name")
    .eq("id", membership.org_id)
    .single()

  if (orgError || !org) {
    throw new Error(`Failed to load owner org: ${orgError?.message}`)
  }

  return {
    orgId: org.id,
    orgName: org.name,
  }
}

const provisionMembership = async ({ orgId, userId, role }) => {
  const acceptedAt = new Date().toISOString()
  const { data, error } = await serviceSupabase
    .from("org_members")
    .upsert(
      {
        org_id: orgId,
        user_id: userId,
        role,
        accepted_at: acceptedAt,
      },
      { onConflict: "org_id,user_id" },
    )
    .select("id, role, accepted_at, updated_at")
    .single()

  if (error || !data) {
    throw new Error(
      `Failed to upsert membership for ${userId} as ${role}: ${error?.message}`,
    )
  }

  return data
}

const rollbackMembership = async ({ orgId, userId }) => {
  const { error } = await serviceSupabase
    .from("org_members")
    .delete()
    .eq("org_id", orgId)
    .eq("user_id", userId)

  if (error) {
    throw new Error(
      `Failed to remove membership for ${userId}: ${error.message}`,
    )
  }
}

const printHeader = ({ orgId, orgName }) => {
  console.log("LP-069 workspace provisioning run")
  console.log(`run_date_utc=${runDateIso}`)
  console.log(`mode=${mode}`)
  console.log(`org_id=${orgId}`)
  console.log(`org_name=${orgName}`)
  console.log("")
}

const run = async () => {
  const ownerUser = await findUserByEmail(ownerEmail)
  if (!ownerUser?.id) {
    throw new Error(
      `Owner user ${ownerEmail} was not found in Supabase Auth users.`,
    )
  }

  const { orgId, orgName } = await loadOwnerOrg(ownerUser.id)
  printHeader({ orgId, orgName })

  const targets = [
    {
      role: "admin",
      email: adminEmail,
      password: adminPassword,
      fullName: "SystemsCraft Admin",
    },
    {
      role: "editor",
      email: editorEmail,
      password: editorPassword,
      fullName: "SystemsCraft Editor",
    },
    {
      role: "member",
      email: memberEmail,
      password: memberPassword,
      fullName: "SystemsCraft Member",
    },
  ]

  if (mode === "rollback") {
    for (const target of targets) {
      const user = await findUserByEmail(target.email)
      if (!user?.id) {
        console.log(`SKIP | ${target.role} (${target.email}) user not found`)
        continue
      }
      await rollbackMembership({ orgId, userId: user.id })
      console.log(
        `PASS | removed ${target.role} membership for ${target.email}`,
      )
    }
    return
  }

  for (const target of targets) {
    const ensured = await ensureUser({
      email: target.email,
      password: target.password,
      fullName: target.fullName,
    })

    const membership = await provisionMembership({
      orgId,
      userId: ensured.user.id,
      role: target.role,
    })

    console.log(
      `PASS | ${target.role} ${target.email} (${ensured.created ? "created" : "existing"})`,
    )
    console.log(
      `      membership_id=${membership.id} accepted_at=${membership.accepted_at}`,
    )
  }

  const targetUsers = await Promise.all(
    targets.map(async (target) => {
      const user = await findUserByEmail(target.email)
      return {
        ...target,
        userId: user?.id ?? null,
      }
    }),
  )
  const targetUserIds = targetUsers
    .map((target) => target.userId)
    .filter((id) => typeof id === "string")

  const { data: memberships, error: membershipsError } = await serviceSupabase
    .from("org_members")
    .select("user_id, role, accepted_at")
    .eq("org_id", orgId)
    .in("user_id", targetUserIds)

  if (membershipsError) {
    throw new Error(
      `Failed to verify provisioned memberships: ${membershipsError.message}`,
    )
  }

  console.log("")
  console.log("membership verification")
  for (const target of targetUsers) {
    const row = memberships?.find((entry) => entry.user_id === target.userId)
    if (!row) {
      console.log(`FAIL | ${target.role} ${target.email} membership missing`)
      continue
    }
    console.log(
      `PASS | ${target.role} ${target.email} accepted_at=${row.accepted_at}`,
    )
  }
}

run().catch((error) => {
  console.error(String(error instanceof Error ? error.message : error))
  process.exit(1)
})
