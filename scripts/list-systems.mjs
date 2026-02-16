import { createClient } from "@supabase/supabase-js"

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// We can use .env.local values if we run with `node --env-file=.env.local`
// But we'll just hardcode looking for them in process.env which the tool `run_command` might not populate from .env automatically?
// The tool `run_command` documentation says "The current working directory for the command".
// I usually run with `node --env-file-if-exists=.env.local ...`

const supabaseUrl = requireEnv("PUBLIC_SUPABASE_URL")
const supabaseServiceRole = requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE")

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const main = async () => {
  const email = "danielmcgiffin+test@gmail.com"
  console.log(`Looking up user: ${email}`)

  // 1. Get User ID
  const {
    data: { users },
    error: userError,
  } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000, // Simple way to find one user
  })

  if (userError) throw userError

  const user = users.find((u) => u.email === email)

  if (!user) {
    console.error("User not found!")
    return
  }

  console.log(`User ID: ${user.id}`)

  // 2. Find Orgs/Systems
  // We can just search systems where this user is the owner (via role lookup)
  // OR just find systems in orgs this user belongs to.
  // Let's list ALL systems for orgs this user is a member of.

  const { data: members, error: memberError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)

  if (memberError) throw memberError

  const orgIds = members.map((m) => m.org_id)
  console.log(`Found ${orgIds.length} org memberships.`)

  if (orgIds.length === 0) return

  const { data: systems, error: systemsError } = await supabase
    .from("systems")
    .select("id, name, logo_url")
    .in("org_id", orgIds)

  if (systemsError) throw systemsError

  console.log("\nSystems found:")
  systems.forEach((sys) => {
    console.log(`- ${sys.name} (Current Logo: ${sys.logo_url})`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
