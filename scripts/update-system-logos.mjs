
import { createClient } from "@supabase/supabase-js"

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// We can use .env.local values if we run with `node --env-file=.env.local`
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
  console.log(`Updating systems for user: ${email}`)

  // 1. Get User ID
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000 
  })
  
  if (userError) throw userError
  
  const user = users.find(u => u.email === email)
  
  if (!user) {
    console.error("User not found!")
    return
  }
  
  // 2. Find Orgs
  const { data: members, error: memberError } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)

  if (memberError) throw memberError
  
  const orgIds = members.map(m => m.org_id)
  
  if (orgIds.length === 0) return

  // 3. Update Systems
  const updates = [
    { name: 'HubSpot', logo_url: '/images/systems/hubspot.svg' },
    { name: 'Google Drive', logo_url: '/images/systems/google-drive.svg' },
    { name: 'Zoom', logo_url: '/images/systems/zoom.svg' }
  ]

  for (const update of updates) {
    const { error } = await supabase
        .from('systems')
        .update({ logo_url: update.logo_url })
        .eq('name', update.name)
        .in('org_id', orgIds)

    if (error) {
        console.error(`Failed to update ${update.name}:`, error.message)
    } else {
        console.log(`Updated ${update.name} logo to ${update.logo_url}`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
