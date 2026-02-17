/**
 * cleanup-all-cruft.mjs
 *
 * Removes auto-generated orgs, duplicate workspaces, and orphaned auth users
 * left behind by smoke tests, E2E runs, and onboarding tests.
 *
 * Usage:
 *   node --env-file=.env.local scripts/cleanup-all-cruft.mjs              # dry-run
 *   node --env-file=.env.local scripts/cleanup-all-cruft.mjs --apply      # actually delete
 *
 * Env vars:
 *   PUBLIC_SUPABASE_URL
 *   PRIVATE_SUPABASE_SERVICE_ROLE
 */

import { createClient } from "@supabase/supabase-js"

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

const shouldApply = process.argv.includes("--apply")

const supabase = createClient(
  requireEnv("PUBLIC_SUPABASE_URL"),
  requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE"),
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ---------------------------------------------------------------------------
// Orgs to KEEP — add org IDs here to protect them from cleanup
// ---------------------------------------------------------------------------
const KEEP_ORG_IDS = new Set([
  "7f4a8d02-48ff-4ba4-8514-d9da34e19eb6", // SystemsCraft Demo Org (danielmcgiffin+test — the real demo)
  "851f91e4-7bc0-426c-bf70-b3c0b4687ce4", // SYS (danielmcgiffin+owner)
  "5525cded-c8cd-457e-9ac7-44d40a06655c", // TST (danielmcgiffin+owner)
  "ddf356b8-2b0b-4050-832b-62417820943a", // marymcgiffin's Workspace
  "4af2d62c-9848-413f-b80b-430c3552f559", // Hi Faluting Workspace (1fiyero)
  "59c247db-ab4e-4aa6-9b0e-48fc07ed82bb", // Pan Aristaic Cup (1fiyero)
  "581adda4-da31-4542-92a0-4b3c0629eee1", // Pan Aristaic Cup (1fiyero)
])

// Real user emails — their auth accounts will NOT be deleted
const KEEP_USER_EMAILS = new Set([
  "danielmcgiffin+test@gmail.com",
  "danielmcgiffin.test@gmail.com",
  "danielmcgiffin+owner@gmail.com",
  "danielmcgiffin+admin@gmail.com",
  "danielmcgiffin+editor@gmail.com",
  "danielmcgiffin+member@gmail.com",
  "danielmcgiffin+first@gmail.com",
  "danielmcgiffin+test2@gmail.com",
  "marymcgiffin@gmail.com",
  "1fiyero@gmail.com",
])

// ---------------------------------------------------------------------------
// Detection heuristics
// ---------------------------------------------------------------------------

const isRealEmail = (email) => {
  if (!email || !email.includes("@")) return false
  if (KEEP_USER_EMAILS.has(email.toLowerCase())) return true
  // Normal-looking email addresses (not hashed onboarding test users)
  return /^[a-zA-Z]/.test(email) && !email.includes("example.com")
}

const isCruftOrg = (org, ownerEmail) => {
  if (KEEP_ORG_IDS.has(org.id)) return false

  const name = (org.name ?? "").toLowerCase()
  const email = (ownerEmail ?? "").toLowerCase()

  // Onboarding smoke test orgs (auto-generated timestamp names, fake owners)
  if (/onboarding\d{14}/.test(name)) return true

  // E2E test orgs (e2e-tester@example.com)
  if (email === "e2e-tester@example.com") return true

  // E2E Lapsed Workspaces
  if (name.includes("e2e lapsed")) return true

  // Duplicate SystemsCraft Demo Orgs (not the kept one)
  if (name === "systemscraft demo org") return true

  // If owned by a real email, keep it (conservative — "if in doubt, keep")
  if (isRealEmail(ownerEmail)) return false

  // Anything left owned by a non-real email is cruft
  return true
}

const isCruftUser = (user) => {
  if (KEEP_USER_EMAILS.has((user.email ?? "").toLowerCase())) return false

  const email = (user.email ?? "").toLowerCase()

  // E2E test user
  if (email === "e2e-tester@example.com") return true

  // Onboarding smoke test users (hashed/random email-like strings)
  if (!email.includes("@") || /^[a-z0-9_-]{20,}$/i.test(email.split("@")[0])) return true

  return false
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  console.log(`mode: ${shouldApply ? "APPLY (will delete!)" : "DRY-RUN"}`)
  console.log("")

  // Load all orgs and users
  const { data: orgs } = await supabase
    .from("orgs")
    .select("id, name, slug, owner_id, created_at")
    .order("created_at")

  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })

  const emailMap = Object.fromEntries(users.map((u) => [u.id, u.email]))

  // Classify orgs
  const cruftOrgs = orgs.filter((o) => isCruftOrg(o, emailMap[o.owner_id]))
  const keptOrgs = orgs.filter((o) => !isCruftOrg(o, emailMap[o.owner_id]))

  console.log(`Total orgs: ${orgs.length}`)
  console.log(`Cruft orgs to delete: ${cruftOrgs.length}`)
  console.log(`Orgs to keep: ${keptOrgs.length}`)
  console.log("")

  console.log("=== KEEPING ===")
  for (const o of keptOrgs) {
    console.log(`  ${o.id}  "${o.name}"  owner=${emailMap[o.owner_id] ?? "?"}`)
  }
  console.log("")

  console.log("=== DELETING ===")
  for (const o of cruftOrgs) {
    console.log(`  ${o.id}  "${o.name}"  slug=${o.slug}  owner=${emailMap[o.owner_id] ?? "?"}`)
  }
  console.log("")

  // Classify users
  const cruftUsers = users.filter((u) => isCruftUser(u))
  const keptUsers = users.filter((u) => !isCruftUser(u))

  console.log(`Total auth users: ${users.length}`)
  console.log(`Cruft users to delete: ${cruftUsers.length}`)
  console.log(`Users to keep: ${keptUsers.length}`)
  console.log("")

  if (cruftUsers.length > 0) {
    console.log("=== DELETING USERS ===")
    for (const u of cruftUsers) {
      console.log(`  ${u.id}  ${u.email}`)
    }
    console.log("")
  }

  if (!shouldApply) {
    console.log("Dry run complete. Add --apply to delete.")
    return
  }

  // Delete orgs (CASCADE will handle roles, systems, processes, actions, flags, org_members, etc.)
  console.log("Deleting orgs...")
  let deletedOrgs = 0
  for (const o of cruftOrgs) {
    const { error } = await supabase.from("orgs").delete().eq("id", o.id)
    if (error) {
      console.error(`  FAILED to delete org ${o.id} ("${o.name}"): ${error.message}`)
    } else {
      deletedOrgs++
    }
  }
  console.log(`  Deleted ${deletedOrgs}/${cruftOrgs.length} orgs`)

  // Delete cruft auth users
  console.log("Deleting auth users...")
  let deletedUsers = 0
  for (const u of cruftUsers) {
    const { error } = await supabase.auth.admin.deleteUser(u.id)
    if (error) {
      console.error(`  FAILED to delete user ${u.id} (${u.email}): ${error.message}`)
    } else {
      deletedUsers++
    }
  }
  console.log(`  Deleted ${deletedUsers}/${cruftUsers.length} users`)

  // Final counts
  const { count: remainingOrgs } = await supabase
    .from("orgs")
    .select("id", { count: "exact", head: true })
  const {
    data: { users: remainingUsers },
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })

  console.log("")
  console.log("=== DONE ===")
  console.log(`Remaining orgs: ${remainingOrgs}`)
  console.log(`Remaining users: check Supabase dashboard`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
