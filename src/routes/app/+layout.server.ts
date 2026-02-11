import { ensureOrgContext, makeInitials } from "$lib/server/atlas"

const countTable = async (
  supabase: App.Locals["supabase"],
  table: string,
  orgId: string,
) => {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)

  if (error) {
    throw new Error(`Failed to count ${table}: ${error.message}`)
  }
  return count ?? 0
}

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

  const [processCount, roleCount, systemCount, flagCount, profileResult] =
    await Promise.all([
      countTable(supabase, "processes", context.orgId),
      countTable(supabase, "roles", context.orgId),
      countTable(supabase, "systems", context.orgId),
      countTable(supabase, "flags", context.orgId),
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", context.userId)
        .maybeSingle(),
    ])

  const displayName =
    profileResult?.data?.full_name || locals.user?.email || "SystemsCraft"

  return {
    org: {
      id: context.orgId,
      name: context.orgName,
      role: context.membershipRole,
    },
    navCounts: {
      processes: processCount,
      roles: roleCount,
      systems: systemCount,
      flags: flagCount,
    },
    viewerInitials: makeInitials(displayName),
  }
}
