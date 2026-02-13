import { fail, redirect } from "@sveltejs/kit"
import { ensureOrgContext, setActiveWorkspaceCookie } from "$lib/server/atlas"
import {
  determineInviteStatus,
  hashInviteToken,
  normalizeInviteEmail,
} from "$lib/server/invites"
import { throwRuntime500 } from "$lib/server/runtime-errors"

type InviteLookupRow = {
  id: string
  org_id: string
  email: string
  role: "admin" | "editor" | "member"
  expires_at: string
  accepted_at: string | null
  revoked_at: string | null
}

const loadInviteByToken = async (
  locals: App.Locals,
  token: string,
): Promise<InviteLookupRow | null> => {
  const tokenHash = await hashInviteToken(token)
  const result = await locals.supabaseServiceRole
    .from("org_invites")
    .select("id, org_id, email, role, expires_at, accepted_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (result.error) {
    throwRuntime500({
      context: "invite.tokenLookup",
      error: result.error,
      requestId: locals.requestId,
      route: "/invite/[token]",
    })
  }

  return (result.data ?? null) as InviteLookupRow | null
}

export const load = async ({ locals, params }) => {
  const token = params.token.trim()
  const nextPath = `/invite/${params.token}`
  const signInUrl = `/login/sign_in?next=${encodeURIComponent(nextPath)}`
  const signUpUrl = `/login/sign_up?next=${encodeURIComponent(nextPath)}`

  if (!token) {
    return {
      invite: null,
      inviteStatus: "invalid" as const,
      signInUrl,
      signUpUrl,
      canAccept: false,
      userAuthenticated: Boolean(locals.user),
      userEmail: locals.user?.email ?? null,
      userEmailMatchesInvite: false,
    }
  }

  const invite = await loadInviteByToken(locals, token)
  if (!invite) {
    return {
      invite: null,
      inviteStatus: "invalid" as const,
      signInUrl,
      signUpUrl,
      canAccept: false,
      userAuthenticated: Boolean(locals.user),
      userEmail: locals.user?.email ?? null,
      userEmailMatchesInvite: false,
    }
  }

  const orgResult = await locals.supabaseServiceRole
    .from("orgs")
    .select("name")
    .eq("id", invite.org_id)
    .maybeSingle()

  if (orgResult.error) {
    throwRuntime500({
      context: "invite.orgLookup",
      error: orgResult.error,
      requestId: locals.requestId,
      route: "/invite/[token]",
      details: { orgId: invite.org_id, inviteId: invite.id },
    })
  }

  const inviteStatus = determineInviteStatus({
    revokedAt: invite.revoked_at,
    acceptedAt: invite.accepted_at,
    expiresAt: invite.expires_at,
  })
  const userEmail = locals.user?.email ?? null
  const userEmailMatchesInvite = Boolean(
    userEmail &&
      normalizeInviteEmail(userEmail) === normalizeInviteEmail(invite.email),
  )

  return {
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      orgId: invite.org_id,
      orgName: orgResult.data?.name ?? "Workspace",
      expiresAt: invite.expires_at,
      acceptedAt: invite.accepted_at,
      revokedAt: invite.revoked_at,
    },
    inviteStatus,
    signInUrl,
    signUpUrl,
    canAccept:
      Boolean(locals.user) &&
      userEmailMatchesInvite &&
      inviteStatus === "pending",
    userAuthenticated: Boolean(locals.user),
    userEmail,
    userEmailMatchesInvite,
  }
}

export const actions = {
  acceptInvite: async ({ locals, params, cookies }) => {
    const token = params.token.trim()
    const nextPath = `/invite/${params.token}`

    if (!locals.user) {
      redirect(303, `/login/sign_in?next=${encodeURIComponent(nextPath)}`)
    }

    const invite = await loadInviteByToken(locals, token)
    if (!invite) {
      return fail(404, { acceptInviteError: "Invite not found." })
    }

    const inviteStatus = determineInviteStatus({
      revokedAt: invite.revoked_at,
      acceptedAt: invite.accepted_at,
      expiresAt: invite.expires_at,
    })
    if (inviteStatus !== "pending") {
      return fail(400, {
        acceptInviteError: "This invite can no longer be accepted.",
      })
    }

    const userEmail = locals.user.email
    if (!userEmail) {
      return fail(400, {
        acceptInviteError: "Your account must have a verified email.",
      })
    }

    if (
      normalizeInviteEmail(userEmail) !== normalizeInviteEmail(invite.email)
    ) {
      return fail(403, {
        acceptInviteError:
          "This invite belongs to a different email address. Sign in with the invited email.",
      })
    }

    const acceptedAt = new Date().toISOString()
    const membershipResult = await locals.supabaseServiceRole
      .from("org_members")
      .upsert(
        {
          org_id: invite.org_id,
          user_id: locals.user.id,
          role: invite.role,
          accepted_at: acceptedAt,
        },
        { onConflict: "org_id,user_id" },
      )
      .select("id")
      .single()

    if (membershipResult.error) {
      throwRuntime500({
        context: "invite.accept.membershipUpsert",
        error: membershipResult.error,
        requestId: locals.requestId,
        route: "/invite/[token]",
        details: { inviteId: invite.id, orgId: invite.org_id },
      })
    }
    const membershipId = membershipResult.data?.id
    if (!membershipId) {
      throwRuntime500({
        context: "invite.accept.membershipUpsert",
        error: new Error("Membership upsert failed."),
        requestId: locals.requestId,
        route: "/invite/[token]",
        details: { inviteId: invite.id, orgId: invite.org_id },
      })
    }

    const updateInviteResult = await locals.supabaseServiceRole
      .from("org_invites")
      .update({
        accepted_at: acceptedAt,
        accepted_by_user_id: locals.user.id,
        org_member_id: membershipId,
      })
      .eq("id", invite.id)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .select("id")
      .maybeSingle()

    if (updateInviteResult.error) {
      throwRuntime500({
        context: "invite.accept.inviteUpdate",
        error: updateInviteResult.error,
        requestId: locals.requestId,
        route: "/invite/[token]",
        details: { inviteId: invite.id, orgId: invite.org_id },
      })
    }

    if (!updateInviteResult.data) {
      return fail(400, {
        acceptInviteError: "This invite can no longer be accepted.",
      })
    }

    setActiveWorkspaceCookie(cookies, invite.org_id)
    locals.activeWorkspaceId = invite.org_id
    locals.orgContext = undefined
    await ensureOrgContext(locals)

    redirect(303, "/app/processes")
  },
}
