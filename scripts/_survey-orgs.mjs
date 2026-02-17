import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PRIVATE_SUPABASE_SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: orgs } = await sb.from("orgs").select("id, name, slug, owner_id, created_at").order("created_at");
const { data: { users } } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
const emailMap = Object.fromEntries(users.map(u => [u.id, u.email]));

console.log(`Total orgs: ${orgs.length}\n`);
for (const o of orgs) {
  const { count: roles } = await sb.from("roles").select("id", { count: "exact", head: true }).eq("org_id", o.id);
  const { count: members } = await sb.from("org_members").select("id", { count: "exact", head: true }).eq("org_id", o.id);
  console.log(`${o.id}  "${o.name}"  slug=${o.slug}  owner=${emailMap[o.owner_id] ?? o.owner_id}  members=${members}  roles=${roles}  created=${o.created_at.slice(0,10)}`);
}

console.log(`\nTotal auth users: ${users.length}`);
for (const u of users) {
  const { count: orgCount } = await sb.from("org_members").select("id", { count: "exact", head: true }).eq("user_id", u.id);
  console.log(`  ${u.id}  ${u.email}  orgs=${orgCount}  created=${u.created_at.slice(0,10)}`);
}
