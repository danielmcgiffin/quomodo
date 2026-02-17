import { error as kitError } from "@sveltejs/kit"
import {
  canManageDirectory,
  ensureOrgContext,
  type MembershipRole,
} from "../../../../../lib/server/atlas"
import { determineInviteStatus } from "../../../../../lib/server/invites"
import { throwRuntime500 } from "../../../../../lib/server/runtime-errors"

const TEAM_PAGE_PATH = "/app/team/invites/revoked"

type TeamInviteRow = {
  id: string
  email: string
  role: MembershipRole
  invited_by_user_id: string
  created_at: string
  expires_at: string
  accepted_at: string | null
  revoked_at: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
}

const formatDateTime = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : "—"

export const load = async ({ locals }) => {
  const context = await ensureOrgContext(locals)
  if (!canManageDirectory(context.membershipRole)) {
    throw kitError(403, "Insufficient permissions.")
  }

  const invitesResult = await locals.supabase
    .from("org_invites")
    .select(
      "id, email, role, invited_by_user_id, created_at, expires_at, accepted_at, revoked_at",
    )
    .eq("org_id", context.orgId)
    .not("revoked_at", "is", null)
    .order("revoked_at", { ascending: false })

  if (invitesResult.error) {
    throwRuntime500({
      context: "app.team.invites.revoked.load",
      error: invitesResult.error,
      requestId: locals.requestId,
      route: TEAM_PAGE_PATH,
      details: { orgId: context.orgId },
    })
  }

  const invites = (invitesResult.data ?? []) as TeamInviteRow[]
  const userIds = [...new Set(invites.map((invite) => invite.invited_by_user_id))]
  const profileById = new Map<string, ProfileRow>()
  const emailById = new Map<string, string>()

  if (userIds.length > 0) {
    const [profilesResult, ...authUsersResults] = await Promise.all([
      locals.supabaseServiceRole
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds),
      ...userIds.map((id) =>
        locals.supabaseServiceRole.auth.admin.getUserById(id),
      ),
    ])

    if (profilesResult.error) {
      throwRuntime500({
        context: "app.team.invites.revoked.profiles",
        error: profilesResult.error,
        requestId: locals.requestId,
        route: TEAM_PAGE_PATH,
        details: { orgId: context.orgId },
      })
    }

    for (const profile of (profilesResult.data ?? []) as ProfileRow[]) {
      profileById.set(profile.id, profile)
    }

    for (const res of authUsersResults) {
      if (res.data.user) {
        emailById.set(res.data.user.id, res.data.user.email ?? "")
      }
    }
  }

  return {
    org: context,
    invites: invites.map((invite) => {
      const status = determineInviteStatus({
        revokedAt: invite.revoked_at,
        acceptedAt: invite.accepted_at,
        expiresAt: invite.expires_at,
      })
      const invitedByProfile = profileById.get(invite.invited_by_user_id)
      const invitedByEmail = emailById.get(invite.invited_by_user_id)

      return {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status,
        invitedAt: formatDateTime(invite.created_at),
        expiresAt: formatDateTime(invite.expires_at),
        acceptedAt: formatDateTime(invite.accepted_at),
        revokedAt: formatDateTime(invite.revoked_at),
        invitedBy:
          invitedByProfile?.full_name?.trim() ||
          invitedByEmail ||
          `User ${invite.invited_by_user_id.slice(0, 8)}`,
      }
    }),
  }
}
