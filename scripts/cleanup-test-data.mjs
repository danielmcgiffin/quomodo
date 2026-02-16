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
const shouldAll = args.includes("--all")

const readArg = (flag) => {
  const index = args.indexOf(flag)
  if (index === -1) {
    return null
  }
  const value = args[index + 1]
  return value && !value.startsWith("--") ? value : null
}

const orgIdArg = readArg("--org")

const publicSupabaseUrl = requireEnv("PUBLIC_SUPABASE_URL")
const privateSupabaseServiceRole = requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE")

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

const PATTERNS = {
  roles: ["Smoke Role %", "Smoke Admin Role %", "Onboarding Role %"],
  systems: ["Smoke System %", "Onboarding System %"],
  processes: ["Smoke Process %", "Onboarding Process %"],
  flags: ["Smoke flag %", "Smoke member comment %", "Onboarding flag %"],
}

const countLike = async ({ table, column, orgId, pattern }) => {
  const { count, error } = await serviceSupabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .ilike(column, pattern)

  if (error) {
    throw new Error(
      `Failed to count ${table} for org ${orgId} (${column} ilike "${pattern}"): ${error.message}`,
    )
  }

  return count ?? 0
}

const deleteLike = async ({ table, column, orgId, pattern }) => {
  const { error } = await serviceSupabase
    .from(table)
    .delete()
    .eq("org_id", orgId)
    .ilike(column, pattern)

  if (error) {
    throw new Error(
      `Failed to delete from ${table} for org ${orgId} (${column} ilike "${pattern}"): ${error.message}`,
    )
  }
}

const listOrgIdsWithArtifacts = async () => {
  const orgIds = new Set()

  const collectOrgIds = async ({ table, column, pattern }) => {
    const { data, error } = await serviceSupabase
      .from(table)
      .select("org_id")
      .ilike(column, pattern)
      .limit(1000)

    if (error) {
      throw new Error(
        `Failed to scan ${table} (${column} ilike "${pattern}"): ${error.message}`,
      )
    }

    for (const row of data ?? []) {
      if (row?.org_id) {
        orgIds.add(row.org_id)
      }
    }
  }

  await Promise.all([
    ...PATTERNS.roles.map((pattern) =>
      collectOrgIds({ table: "roles", column: "name", pattern }),
    ),
    ...PATTERNS.systems.map((pattern) =>
      collectOrgIds({ table: "systems", column: "name", pattern }),
    ),
    ...PATTERNS.processes.map((pattern) =>
      collectOrgIds({ table: "processes", column: "name", pattern }),
    ),
    ...PATTERNS.flags.map((pattern) =>
      collectOrgIds({ table: "flags", column: "message", pattern }),
    ),
  ])

  return Array.from(orgIds)
}

const loadOrgMeta = async (orgId) => {
  const { data, error } = await serviceSupabase
    .from("orgs")
    .select("id, name, slug")
    .eq("id", orgId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load org ${orgId}: ${error.message}`)
  }

  return data ?? { id: orgId, name: null, slug: null }
}

const summarizeOrg = async (orgId) => {
  const [org, flags, processes, systems, roles] = await Promise.all([
    loadOrgMeta(orgId),
    Promise.all(
      PATTERNS.flags.map((pattern) =>
        countLike({ table: "flags", column: "message", orgId, pattern }),
      ),
    ).then((counts) => counts.reduce((sum, value) => sum + value, 0)),
    Promise.all(
      PATTERNS.processes.map((pattern) =>
        countLike({ table: "processes", column: "name", orgId, pattern }),
      ),
    ).then((counts) => counts.reduce((sum, value) => sum + value, 0)),
    Promise.all(
      PATTERNS.systems.map((pattern) =>
        countLike({ table: "systems", column: "name", orgId, pattern }),
      ),
    ).then((counts) => counts.reduce((sum, value) => sum + value, 0)),
    Promise.all(
      PATTERNS.roles.map((pattern) =>
        countLike({ table: "roles", column: "name", orgId, pattern }),
      ),
    ).then((counts) => counts.reduce((sum, value) => sum + value, 0)),
  ])

  return {
    org,
    counts: { flags, processes, systems, roles },
  }
}

const cleanupOrg = async (orgId) => {
  const { org, counts } = await summarizeOrg(orgId)

  console.log(
    `org=${org.id} name="${org.name ?? "unknown"}" slug="${org.slug ?? "unknown"}"`,
  )
  console.log(
    `counts flags=${counts.flags} processes=${counts.processes} systems=${counts.systems} roles=${counts.roles}`,
  )

  if (!shouldApply) {
    console.log("mode=dry-run (add --apply to delete)")
    console.log("")
    return
  }

  // Delete in order to satisfy FK constraints:
  // flags are standalone; processes cascade actions; systems/roles are referenced by actions.
  for (const pattern of PATTERNS.flags) {
    await deleteLike({ table: "flags", column: "message", orgId, pattern })
  }
  for (const pattern of PATTERNS.processes) {
    await deleteLike({ table: "processes", column: "name", orgId, pattern })
  }
  for (const pattern of PATTERNS.systems) {
    await deleteLike({ table: "systems", column: "name", orgId, pattern })
  }
  for (const pattern of PATTERNS.roles) {
    await deleteLike({ table: "roles", column: "name", orgId, pattern })
  }

  const after = await summarizeOrg(orgId)
  console.log(
    `after flags=${after.counts.flags} processes=${after.counts.processes} systems=${after.counts.systems} roles=${after.counts.roles}`,
  )
  console.log("")
}

const main = async () => {
  console.log("cleanup test-data run")
  console.log(`mode=${shouldApply ? "apply" : "dry-run"}`)
  console.log(`scoped_org=${orgIdArg ?? "none"}`)
  console.log("")

  if (shouldApply && !orgIdArg && !shouldAll) {
    throw new Error("Refusing to apply without --org <uuid> or --all.")
  }

  const orgIds = orgIdArg ? [orgIdArg] : await listOrgIdsWithArtifacts()
  if (orgIds.length === 0) {
    console.log("No smoke/onboarding artifacts found.")
    return
  }

  if (!orgIdArg) {
    console.log(`candidate_orgs=${orgIds.length}`)
    console.log(
      `hint=rerun with --org <uuid> to target one workspace, or add --apply --all to clean all candidates`,
    )
    console.log("")
  }

  for (const orgId of orgIds) {
    await cleanupOrg(orgId)
  }
}

main().catch((error) => {
  console.error(String(error?.message ?? error))
  process.exitCode = 1
})
