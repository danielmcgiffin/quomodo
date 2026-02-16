import type { LayoutServerLoad } from "./$types"
import {
  ACTIVE_WORKSPACE_COOKIE,
  ensureOrgContext,
  makeInitials,
  setActiveWorkspaceCookie,
} from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import { getOrgBillingSnapshot } from "$lib/server/billing"

type MembershipRow = {
  org_id: string
  role: "owner" | "admin" | "editor" | "member"
  accepted_at: string | null
}

type OrgRow = {
  id: string
  name: string
}

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
      context: "account.layout.countTable",
      error,
      requestId,
      route: "/account",
      details: { table, orgId },
    })
  }
  return count ?? 0
}

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  // Session here is from authGuard hook

  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

  if (
    typeof locals.activeWorkspaceId === "string" &&
    locals.activeWorkspaceId.trim().length > 0 &&
    cookies.get(ACTIVE_WORKSPACE_COOKIE) !== locals.activeWorkspaceId
  ) {
    setActiveWorkspaceCookie(cookies, locals.activeWorkspaceId)
  }

  const [
    processCount,
    roleCount,
    systemCount,
    flagCount,
    billing,
    profileResult,
    membershipsResult,
  ] = await Promise.all([
    countTable(supabase, "processes", context.orgId, locals.requestId),
    countTable(supabase, "roles", context.orgId, locals.requestId),
    countTable(supabase, "systems", context.orgId, locals.requestId),
    countTable(supabase, "flags", context.orgId, locals.requestId),
    getOrgBillingSnapshot(locals, context.orgId),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle(),
    supabase
      .from("org_members")
      .select("org_id, role, accepted_at")
      .eq("user_id", context.userId)
      .order("accepted_at", { ascending: false, nullsFirst: false }),
  ])

  if (profileResult.error) {
    throwRuntime500({
      context: "account.layout.profileLookup",
      error: profileResult.error,
      requestId: locals.requestId,
      route: "/account",
      details: { userId: context.userId },
    })
  }

  if (membershipsResult.error) {
    throwRuntime500({
      context: "account.layout.workspaceMemberships",
      error: membershipsResult.error,
      requestId: locals.requestId,
      route: "/account",
      details: { userId: context.userId },
    })
  }

  const memberships = (membershipsResult.data ?? []) as MembershipRow[]
  const uniqueOrgIds = [
    ...new Set(memberships.map((membership) => membership.org_id)),
  ]
  const orgById = new Map<string, OrgRow>()

  if (uniqueOrgIds.length > 0) {
    const orgsResult = await supabase
      .from("orgs")
      .select("id, name")
      .in("id", uniqueOrgIds)

    if (orgsResult.error) {
      throwRuntime500({
        context: "account.layout.workspaceOrgs",
        error: orgsResult.error,
        requestId: locals.requestId,
        route: "/account",
        details: { userId: context.userId },
      })
    }

    for (const org of (orgsResult.data ?? []) as OrgRow[]) {
      orgById.set(org.id, org)
    }
  }

  const displayName =
    profileResult?.data?.full_name || locals.user?.email || "SystemsCraft"

  return {
    session: locals.session,
    cookies: cookies.getAll(),
    org: {
      id: context.orgId,
      name: context.orgName,
      role: context.membershipRole,
    },
    billing,
    navCounts: {
      processes: processCount,
      roles: roleCount,
      systems: systemCount,
      flags: flagCount,
    },
    workspaceOptions: memberships.map((membership) => ({
      id: membership.org_id,
      name: orgById.get(membership.org_id)?.name ?? "Unknown workspace",
      role: membership.role,
    })),
    viewerInitials: makeInitials(displayName),
  }
}
