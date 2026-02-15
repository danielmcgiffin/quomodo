
import { createClient } from "@supabase/supabase-js"

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const supabaseUrl = requireEnv("PUBLIC_SUPABASE_URL")
const supabaseServiceRole = requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE")

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const main = async () => {
  const email = 'danielmcgiffin+test@gmail.com'
  
  // 1. Get User ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000 
  })
  if (userError) throw userError
  const user = users.find(u => u.email === email)
  if (!user) { console.error("User not found"); return; }
  
  // 2. Get Org ID
  const { data: members, error: memberError } = await supabase.from('org_members').select('org_id').eq('user_id', user.id).limit(1)
  if (memberError) throw memberError
  if (!members.length) { console.error("No org found"); return; }
  const orgId = members[0].org_id

  console.log(`Querying for Org ID: ${orgId}`)

  // 3. Run the exact query from +page.server.ts
  const { data, error } = await supabase
      .from("systems")
      .select("id, slug, name, description_rich, location, owner_role_id, logo_url")
      .eq("org_id", orgId)
      .order("name")

  if (error) {
    console.error("Query Error:", error)
  } else {
    // Show the first item fully, and just name/logo_url for others
    console.log("Found items:", data.length)
    if (data.length > 0) {
        console.log("First item:", JSON.stringify(data[0], null, 2))
    }
    data.forEach(item => {
        console.log(`- ${item.name}: ${item.logo_url}`)
    })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
