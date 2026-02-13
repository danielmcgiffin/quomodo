import { createClient } from "@supabase/supabase-js"

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const args = process.argv.slice(2)
const shouldApply = args.includes("--apply")

const readArg = (flag) => {
  const index = args.indexOf(flag)
  if (index === -1) {
    return null
  }
  const value = args[index + 1]
  return value && !value.startsWith("--") ? value : null
}

const ownerEmailArg = readArg("--owner-email")

const publicSupabaseUrl = requireEnv("PUBLIC_SUPABASE_URL")
const privateSupabaseServiceRole = requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE")
const ownerEmail =
  ownerEmailArg || process.env.SMOKE_OWNER_EMAIL || process.env.DEV_OWNER_EMAIL

if (!ownerEmail) {
  throw new Error(
    "Provide owner email via --owner-email <email> or SMOKE_OWNER_EMAIL/DEV_OWNER_EMAIL env var.",
  )
}

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

const canonicalWorkspaceName = (value) =>
  value
    .toLowerCase()
    .replace(/'s\b/g, "")
    .replace(/[^a-z0-9]/g, "")

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

const loadCurrentOwnerOrgId = async (ownerUserId) => {
  const { data, error } = await serviceSupabase
    .from("org_members")
    .select("org_id, accepted_at")
    .eq("user_id", ownerUserId)
    .eq("role", "owner")
    .order("accepted_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load owner membership: ${error.message}`)
  }

  return data?.org_id ?? null
}

const countByOrg = async (table, orgId) => {
  const { count, error } = await serviceSupabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)

  if (error) {
    throw new Error(`Failed to count ${table} for org ${orgId}: ${error.message}`)
  }
  return count ?? 0
}

const countMembers = async (orgId) => {
  const { count, error } = await serviceSupabase
    .from("org_members")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)

  if (error) {
    throw new Error(
      `Failed to count org_members for org ${orgId}: ${error.message}`,
    )
  }
  return count ?? 0
}

const deleteOrg = async (orgId) => {
  const { error } = await serviceSupabase.from("orgs").delete().eq("id", orgId)
  if (error) {
    throw new Error(`Failed to delete org ${orgId}: ${error.message}`)
  }
}

const run = async () => {
  const ownerUser = await findUserByEmail(ownerEmail)
  if (!ownerUser?.id) {
    throw new Error(`Owner user ${ownerEmail} was not found.`)
  }

  const ownerUserId = ownerUser.id
  const currentOrgId = await loadCurrentOwnerOrgId(ownerUserId)

  const { data: orgs, error: orgsError } = await serviceSupabase
    .from("orgs")
    .select("id, name, created_at, owner_id")
    .eq("owner_id", ownerUserId)
    .order("created_at", { ascending: false })

  if (orgsError) {
    throw new Error(`Failed to load owner orgs: ${orgsError.message}`)
  }

  const ownerOrgs = orgs ?? []
  console.log("workspace dedupe run")
  console.log(`mode=${shouldApply ? "apply" : "dry-run"}`)
  console.log(`owner_email=${ownerEmail}`)
  console.log(`owner_user_id=${ownerUserId}`)
  console.log(`owned_workspace_count=${ownerOrgs.length}`)
  console.log(`current_owner_org_id=${currentOrgId ?? "none"}`)
  console.log("")

  const grouped = new Map()
  for (const org of ownerOrgs) {
    const canonical = canonicalWorkspaceName(org.name ?? "")
    if (!grouped.has(canonical)) {
      grouped.set(canonical, [])
    }
    grouped.get(canonical).push(org)
  }

  let deletedCount = 0
  let skippedCount = 0
  let candidateCount = 0

  for (const [canonical, list] of grouped.entries()) {
    if (!canonical || list.length < 2) {
      continue
    }

    candidateCount += list.length - 1

    let keep = list[0]
    if (currentOrgId) {
      const current = list.find((org) => org.id === currentOrgId)
      if (current) {
        keep = current
      }
    }

    console.log(`group=${canonical}`)
    console.log(`keep=${keep.id} name="${keep.name}"`)

    for (const org of list) {
      if (org.id === keep.id) {
        continue
      }

      const [rolesCount, systemsCount, processesCount, actionsCount, flagsCount, accessCount, memberCount] =
        await Promise.all([
          countByOrg("roles", org.id),
          countByOrg("systems", org.id),
          countByOrg("processes", org.id),
          countByOrg("actions", org.id),
          countByOrg("flags", org.id),
          countByOrg("role_system_access", org.id),
          countMembers(org.id),
        ])

      const hasAtlasData =
        rolesCount > 0 ||
        systemsCount > 0 ||
        processesCount > 0 ||
        actionsCount > 0 ||
        flagsCount > 0 ||
        accessCount > 0
      const hasExtraMembers = memberCount > 1

      if (hasAtlasData || hasExtraMembers) {
        skippedCount += 1
        console.log(
          `skip=${org.id} name="${org.name}" reason=${hasAtlasData ? "has_data" : "has_extra_members"} counts={roles:${rolesCount},systems:${systemsCount},processes:${processesCount},actions:${actionsCount},flags:${flagsCount},access:${accessCount},members:${memberCount}}`,
        )
        continue
      }

      if (shouldApply) {
        await deleteOrg(org.id)
        deletedCount += 1
        console.log(`deleted=${org.id} name="${org.name}"`)
      } else {
        console.log(`would_delete=${org.id} name="${org.name}"`)
      }
    }

    console.log("")
  }

  console.log("summary")
  console.log(`duplicate_candidates=${candidateCount}`)
  console.log(`deleted=${deletedCount}`)
  console.log(`skipped=${skippedCount}`)
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
