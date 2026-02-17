import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.PUBLIC_SUPABASE_URL, process.env.PRIVATE_SUPABASE_SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: { users } } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
const user = users.find(u => u.email === "danielmcgiffin+test@gmail.com");
if (!user) { console.log("User not found!"); process.exit(1); }
console.log("User ID:", user.id);

const { data: memberships } = await sb.from("org_members").select("org_id, role, accepted_at").eq("user_id", user.id);
console.log("\nMemberships:", JSON.stringify(memberships, null, 2));

if (memberships?.length) {
  const orgIds = memberships.map(m => m.org_id);
  const { data: orgs } = await sb.from("orgs").select("id, name, slug").in("id", orgIds);
  console.log("\nOrgs:", JSON.stringify(orgs, null, 2));
}

const seededOrg = "5dce3bc3-9c17-4dad-bca0-07b179430e2a";
const inSeeded = memberships?.find(m => m.org_id === seededOrg);
console.log("\nIn seeded org?", inSeeded ? "YES" : "NO");

const { data: org } = await sb.from("orgs").select("owner_id").eq("id", seededOrg).single();
const owner = users.find(u => u.id === org?.owner_id);
console.log("Seeded org owner:", owner?.email ?? org?.owner_id);
