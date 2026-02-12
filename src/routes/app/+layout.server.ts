import { ensureOrgContext, makeInitials } from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"

const countTable = async (
  supabase: App.Locals["supabase"],
  table: "processes" | "roles" | "systems" | "flags",
  orgId: string,
  requestId?: string,
) => {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)

  if (error) {
    throwRuntime500({
      context: "app.layout.countTable",
      error,
      requestId,
      route: "/app",
      details: { table, orgId },
    })
  }
  return count ?? 0
}

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

  const [processCount, roleCount, systemCount, flagCount, profileResult] =
    await Promise.all([
      countTable(supabase, "processes", context.orgId, locals.requestId),
      countTable(supabase, "roles", context.orgId, locals.requestId),
      countTable(supabase, "systems", context.orgId, locals.requestId),
      countTable(supabase, "flags", context.orgId, locals.requestId),
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", context.userId)
        .maybeSingle(),
    ])

  if (profileResult.error) {
    throwRuntime500({
      context: "app.layout.profileLookup",
      error: profileResult.error,
      requestId: locals.requestId,
      route: "/app",
      details: { userId: context.userId },
    })
  }

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
