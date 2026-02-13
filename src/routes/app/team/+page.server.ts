import { error as kitError, fail, redirect } from "@sveltejs/kit"
import { env } from "$env/dynamic/private"
import { WebsiteBaseUrl, WebsiteName } from "../../../config"
import { sendTemplatedEmail } from "$lib/mailer"
import {
  canManageDirectory,
  ensureOrgContext,
  type MembershipRole,
} from "$lib/server/atlas"
import {
  createInviteToken,
  determineInviteStatus,
  isValidInviteEmail,
  normalizeInviteEmail,
  parseInviteRole,
} from "$lib/server/invites"
import {
  createOwnershipTransferToken,
  parsePriorOwnerDisposition,
} from "$lib/server/ownership-transfers"
import { throwRuntime500 } from "$lib/server/runtime-errors"
import {
  canAssignMemberRole,
  canChangeMemberRole,
  canManageMemberRole,
  canRemoveMember,
  getAssignableRolesForActor,
  parseMembershipRole,
} from "$lib/server/team-rbac"

const TEAM_PAGE_PATH = "/app/team"
const TRANSFER_TOKEN_TTL_DAYS = 7

type TeamMemberRow = {
  id: string
  user_id: string
  role: MembershipRole
  invited_at: string
  accepted_at: string | null
  created_at: string
}

type ProfileRow = {
  id: string
  full_name: string | null
}

type OwnershipTransferRow = {
  id: string
  to_owner_id: string
  from_owner_id: string
  status: "pending" | "accepted" | "cancelled"
  created_at: string
  expires_at: string
  prior_owner_leave: boolean
  prior_owner_role_after: MembershipRole | null
}

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

type TeamActionMemberRow = {
  id: string
  user_id: string
  role: MembershipRole
}

const formatMembershipDate = (value: string | null): string =>
  value ? new Date(value).toLocaleDateString() : "Pending acceptance"
const formatDateTime = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : "—"

const loadTeamMember = async (
  locals: App.Locals,
  orgId: string,
  membershipId: string,
): Promise<TeamActionMemberRow | null> => {
  const result = await locals.supabase
    .from("org_members")
    .select("id, user_id, role")
    .eq("org_id", orgId)
    .eq("id", membershipId)
    .maybeSingle()

  if (result.error) {
    throwRuntime500({
      context: "app.team.memberLookup",
      error: result.error,
      requestId: locals.requestId,
      route: TEAM_PAGE_PATH,
      details: { orgId, membershipId },
    })
  }

  return (result.data ?? null) as TeamActionMemberRow | null
}

export const load = async ({ locals, url }) => {
  const context = await ensureOrgContext(locals)
  if (!canManageDirectory(context.membershipRole)) {
    throw kitError(403, "Insufficient permissions.")
  }

  const transferPromise =
    context.membershipRole === "owner"
      ? locals.supabase
          .from("org_ownership_transfers")
          .select(
            "id, to_owner_id, from_owner_id, status, created_at, expires_at, prior_owner_leave, prior_owner_role_after",
          )
          .eq("org_id", context.orgId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null })

  const [membersResult, invitesResult, transferResult] = await Promise.all([
    locals.supabase
      .from("org_members")
      .select("id, user_id, role, invited_at, accepted_at, created_at")
      .eq("org_id", context.orgId)
      .order("created_at", { ascending: true }),
    locals.supabase
      .from("org_invites")
      .select(
        "id, email, role, invited_by_user_id, created_at, expires_at, accepted_at, revoked_at",
      )
      .eq("org_id", context.orgId)
      .order("created_at", { ascending: false }),
    transferPromise,
  ])

  if (membersResult.error) {
    throwRuntime500({
      context: "app.team.load.members",
      error: membersResult.error,
      requestId: locals.requestId,
      route: TEAM_PAGE_PATH,
      details: { orgId: context.orgId },
    })
  }
  if (invitesResult.error) {
    throwRuntime500({
      context: "app.team.load.invites",
      error: invitesResult.error,
      requestId: locals.requestId,
      route: TEAM_PAGE_PATH,
      details: { orgId: context.orgId },
    })
  }
  if (transferResult.error) {
    throwRuntime500({
      context: "app.team.load.transfer",
      error: transferResult.error,
      requestId: locals.requestId,
      route: TEAM_PAGE_PATH,
      details: { orgId: context.orgId },
    })
  }

  const members = (membersResult.data ?? []) as TeamMemberRow[]
  const invites = (invitesResult.data ?? []) as TeamInviteRow[]
  const pendingTransfer = (transferResult.data ?? null) as OwnershipTransferRow | null
  const userIds = [
    ...new Set([
      ...members.map((member) => member.user_id),
      ...invites.map((invite) => invite.invited_by_user_id),
      ...(pendingTransfer
        ? [pendingTransfer.to_owner_id, pendingTransfer.from_owner_id]
        : []),
    ]),
  ]
  const profileById = new Map<string, ProfileRow>()

  if (userIds.length > 0) {
    const profilesResult = await locals.supabaseServiceRole
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds)

    if (profilesResult.error) {
      throwRuntime500({
        context: "app.team.load.profiles",
        error: profilesResult.error,
        requestId: locals.requestId,
        route: TEAM_PAGE_PATH,
        details: { orgId: context.orgId },
      })
    }

    for (const profile of (profilesResult.data ?? []) as ProfileRow[]) {
      profileById.set(profile.id, profile)
    }
  }

  const transferRecipientOptions = members
    .filter((member) => {
      return (
        member.user_id !== context.userId &&
        member.role === "admin" &&
        Boolean(member.accepted_at)
      )
    })
    .map((member) => {
      const profile = profileById.get(member.user_id)
      return {
        userId: member.user_id,
        displayName: profile?.full_name?.trim() || member.user_id,
      }
    })

  return {
    org: context,
    updated: url.searchParams.get("updated") === "1",
    removed: url.searchParams.get("removed") === "1",
    inviteCreated: url.searchParams.get("inviteCreated") === "1",
    inviteRevoked: url.searchParams.get("inviteRevoked") === "1",
    ownershipTransferInitiated:
      url.searchParams.get("ownershipTransferInitiated") === "1",
    ownershipTransferCancelled:
      url.searchParams.get("ownershipTransferCancelled") === "1",
    ownershipTransferAccepted:
      url.searchParams.get("ownershipTransferAccepted") === "1",
    members: members.map((member) => {
      const profile = profileById.get(member.user_id)
      const displayName = profile?.full_name?.trim() || member.user_id
      const isSelf = member.user_id === context.userId
      const canChange = canChangeMemberRole(
        context.membershipRole,
        member.role,
        isSelf,
      )

      return {
        id: member.id,
        userId: member.user_id,
        displayName,
        role: member.role,
        invitedAt: formatMembershipDate(member.invited_at),
        acceptedAt: formatMembershipDate(member.accepted_at),
        isSelf,
        canChangeRole: canChange,
        canRemoveMember: canRemoveMember(
          context.membershipRole,
          member.role,
          isSelf,
        ),
        roleOptions: canChange
          ? getAssignableRolesForActor(context.membershipRole)
          : [],
      }
    }),
    inviteRoleOptions: getAssignableRolesForActor(context.membershipRole),
    invites: invites.map((invite) => {
      const status = determineInviteStatus({
        revokedAt: invite.revoked_at,
        acceptedAt: invite.accepted_at,
        expiresAt: invite.expires_at,
      })
      const invitedByProfile = profileById.get(invite.invited_by_user_id)

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
          invitedByProfile?.full_name?.trim() || invite.invited_by_user_id,
        canRevoke:
          status === "pending" &&
          canManageMemberRole(context.membershipRole, invite.role),
      }
    }),
    canTransferOwnership: context.membershipRole === "owner",
    pendingOwnershipTransfer: pendingTransfer
      ? {
          id: pendingTransfer.id,
          recipientName:
            profileById.get(pendingTransfer.to_owner_id)?.full_name?.trim() ||
            pendingTransfer.to_owner_id,
          recipientUserId: pendingTransfer.to_owner_id,
          createdAt: formatDateTime(pendingTransfer.created_at),
          expiresAt: formatDateTime(pendingTransfer.expires_at),
          priorOwnerDisposition: pendingTransfer.prior_owner_leave
            ? ("leave" as const)
            : pendingTransfer.prior_owner_role_after === "editor"
              ? ("editor" as const)
              : ("admin" as const),
        }
      : null,
    ownershipTransferRecipients: transferRecipientOptions,
  }
}

export const actions = {
  createInvite: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { createInviteError: "Insufficient permissions." })
    }

    const formData = await request.formData()
    const email = normalizeInviteEmail(String(formData.get("email") ?? ""))
    const inviteRole = parseInviteRole(String(formData.get("role") ?? ""))

    if (!email) {
      return fail(400, {
        createInviteError: "Invite email is required.",
        inviteEmailDraft: email,
      })
    }
    if (!isValidInviteEmail(email)) {
      return fail(400, {
        createInviteError: "Enter a valid email address.",
        inviteEmailDraft: email,
      })
    }
    if (!inviteRole) {
      return fail(400, {
        createInviteError: "Invite role is required.",
        inviteEmailDraft: email,
      })
    }
    if (!canAssignMemberRole(context.membershipRole, inviteRole)) {
      return fail(403, {
        createInviteError: "Insufficient permissions.",
        inviteEmailDraft: email,
      })
    }

    const { token, tokenHash } = await createInviteToken()
    const insertResult = await locals.supabase
      .from("org_invites")
      .insert({
        org_id: context.orgId,
        email,
        role: inviteRole,
        token_hash: tokenHash,
        invited_by_user_id: context.userId,
      })
      .select("id")
      .single()

    if (insertResult.error) {
      if (insertResult.error.code === "23505") {
        return fail(400, {
          createInviteError: "An active invite already exists for this email.",
          inviteEmailDraft: email,
        })
      }
      if (insertResult.error.code === "42501") {
        return fail(403, {
          createInviteError: "Insufficient permissions.",
          inviteEmailDraft: email,
        })
      }
      return fail(400, {
        createInviteError: insertResult.error.message,
        inviteEmailDraft: email,
      })
    }

    const inviteLink = `${WebsiteBaseUrl}/invite/${token}`
    const fromEmail =
      env.PRIVATE_FROM_ADMIN_EMAIL ||
      env.PRIVATE_ADMIN_EMAIL ||
      "no-reply@systemscraft.co"

    await sendTemplatedEmail({
      subject: `You're invited to join ${context.orgName} on ${WebsiteName}`,
      to_emails: [email],
      from_email: fromEmail,
      template_name: "team_invite",
      template_properties: {
        workspaceName: context.orgName,
        companyName: WebsiteName,
        inviteLink,
      },
    })

    redirect(303, `${TEAM_PAGE_PATH}?inviteCreated=1`)
  },

  updateMemberRole: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { updateMemberRoleError: "Insufficient permissions." })
    }

    const formData = await request.formData()
    const membershipId = String(formData.get("membershipId") ?? "").trim()
    const requestedRole = parseMembershipRole(
      String(formData.get("role") ?? "").trim(),
    )

    if (!membershipId) {
      return fail(400, { updateMemberRoleError: "Member is required." })
    }
    if (!requestedRole) {
      return fail(400, { updateMemberRoleError: "Role is required." })
    }

    const member = await loadTeamMember(locals, context.orgId, membershipId)
    if (!member) {
      return fail(404, { updateMemberRoleError: "Member not found." })
    }

    const isSelf = member.user_id === context.userId
    if (isSelf) {
      return fail(400, {
        updateMemberRoleError:
          "Self role changes are not available in this flow.",
      })
    }

    if (!canChangeMemberRole(context.membershipRole, member.role, isSelf)) {
      return fail(403, { updateMemberRoleError: "Insufficient permissions." })
    }

    if (!canAssignMemberRole(context.membershipRole, requestedRole)) {
      return fail(403, { updateMemberRoleError: "Insufficient permissions." })
    }

    if (member.role === requestedRole) {
      redirect(303, TEAM_PAGE_PATH)
    }

    const updateResult = await locals.supabase
      .from("org_members")
      .update({ role: requestedRole })
      .eq("org_id", context.orgId)
      .eq("id", member.id)

    if (updateResult.error) {
      if (updateResult.error.code === "42501") {
        return fail(403, { updateMemberRoleError: "Insufficient permissions." })
      }
      return fail(400, { updateMemberRoleError: updateResult.error.message })
    }

    redirect(303, `${TEAM_PAGE_PATH}?updated=1`)
  },

  removeMember: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { removeMemberError: "Insufficient permissions." })
    }

    const formData = await request.formData()
    const membershipId = String(formData.get("membershipId") ?? "").trim()

    if (!membershipId) {
      return fail(400, { removeMemberError: "Member is required." })
    }

    const member = await loadTeamMember(locals, context.orgId, membershipId)
    if (!member) {
      return fail(404, { removeMemberError: "Member not found." })
    }

    const isSelf = member.user_id === context.userId
    if (isSelf) {
      return fail(400, {
        removeMemberError: "Self removal is not available in this flow.",
      })
    }

    if (!canRemoveMember(context.membershipRole, member.role, isSelf)) {
      return fail(403, { removeMemberError: "Insufficient permissions." })
    }

    const deleteResult = await locals.supabase
      .from("org_members")
      .delete()
      .eq("org_id", context.orgId)
      .eq("id", member.id)

    if (deleteResult.error) {
      if (deleteResult.error.code === "42501") {
        return fail(403, { removeMemberError: "Insufficient permissions." })
      }
      return fail(400, { removeMemberError: deleteResult.error.message })
    }

    redirect(303, `${TEAM_PAGE_PATH}?removed=1`)
  },

  revokeInvite: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, { revokeInviteError: "Insufficient permissions." })
    }

    const formData = await request.formData()
    const inviteId = String(formData.get("inviteId") ?? "").trim()
    if (!inviteId) {
      return fail(400, { revokeInviteError: "Invite is required." })
    }

    const inviteResult = await locals.supabase
      .from("org_invites")
      .select("id, role, expires_at, accepted_at, revoked_at")
      .eq("org_id", context.orgId)
      .eq("id", inviteId)
      .maybeSingle()

    if (inviteResult.error) {
      throwRuntime500({
        context: "app.team.revokeInvite.lookup",
        error: inviteResult.error,
        requestId: locals.requestId,
        route: TEAM_PAGE_PATH,
        details: { orgId: context.orgId, inviteId },
      })
    }

    const invite = inviteResult.data as
      | {
          id: string
          role: MembershipRole
          expires_at: string
          accepted_at: string | null
          revoked_at: string | null
        }
      | null
    if (!invite) {
      return fail(404, { revokeInviteError: "Invite not found." })
    }

    if (!canManageMemberRole(context.membershipRole, invite.role)) {
      return fail(403, { revokeInviteError: "Insufficient permissions." })
    }

    const status = determineInviteStatus({
      revokedAt: invite.revoked_at,
      acceptedAt: invite.accepted_at,
      expiresAt: invite.expires_at,
    })
    if (status !== "pending") {
      return fail(400, {
        revokeInviteError: "Only pending invites can be revoked.",
      })
    }

    const revokeResult = await locals.supabase
      .from("org_invites")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by_user_id: context.userId,
      })
      .eq("org_id", context.orgId)
      .eq("id", invite.id)
      .is("accepted_at", null)
      .is("revoked_at", null)

    if (revokeResult.error) {
      if (revokeResult.error.code === "42501") {
        return fail(403, { revokeInviteError: "Insufficient permissions." })
      }
      return fail(400, { revokeInviteError: revokeResult.error.message })
    }

    redirect(303, `${TEAM_PAGE_PATH}?inviteRevoked=1`)
  },

  initiateOwnershipTransfer: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (context.membershipRole !== "owner") {
      return fail(403, {
        ownershipTransferError: "Only owners can transfer ownership.",
      })
    }

    const formData = await request.formData()
    const recipientUserId = String(formData.get("recipientUserId") ?? "").trim()
    const dispositionRaw = String(formData.get("priorOwnerDisposition") ?? "").trim()
    const disposition = parsePriorOwnerDisposition(dispositionRaw)

    if (!recipientUserId) {
      return fail(400, { ownershipTransferError: "Recipient is required." })
    }
    if (!disposition) {
      return fail(400, {
        ownershipTransferError: "Prior owner disposition is required.",
      })
    }

    const recipientLookup =
      await locals.supabaseServiceRole.auth.admin.getUserById(recipientUserId)
    const recipientUser = recipientLookup.data.user
    const recipientEmailVerified = Boolean(
      recipientUser?.email_confirmed_at || recipientUser?.user_metadata?.email_verified,
    )

    if (!recipientUser || !recipientUser.email || !recipientEmailVerified) {
      return fail(400, {
        ownershipTransferError:
          "Recipient must have a verified email address to accept an ownership transfer.",
      })
    }

    // Generate token now; store only the hash in DB.
    const { token, tokenHash } = await createOwnershipTransferToken()
    const expiresAt = new Date(
      Date.now() + TRANSFER_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()

    const rpcResult = await locals.supabase.rpc("sc_create_ownership_transfer", {
      p_org_id: context.orgId,
      p_to_user_id: recipientUserId,
      p_token_hash: tokenHash,
      p_prior_owner_disposition: disposition,
      p_expires_at: expiresAt,
    })

    if (rpcResult.error) {
      return fail(400, {
        ownershipTransferError: rpcResult.error.message,
      })
    }

    const fromEmail =
      env.PRIVATE_FROM_ADMIN_EMAIL ||
      env.PRIVATE_ADMIN_EMAIL ||
      "no-reply@systemscraft.co"
    const transferLink = `${WebsiteBaseUrl}/transfer/${token}`

    // Notify recipient and prior owner (initiator).
    try {
      const [{ data: recipient }, { data: owner }] = await Promise.all([
        Promise.resolve(recipientLookup),
        locals.supabaseServiceRole.auth.admin.getUserById(context.userId),
      ])

      const recipientEmail = recipient.user?.email
      const ownerEmail = owner.user?.email

      if (recipientEmail) {
        await sendTemplatedEmail({
          subject: `Ownership transfer requested for ${context.orgName}`,
          to_emails: [recipientEmail],
          from_email: fromEmail,
          template_name: "ownership_transfer",
          template_properties: {
            workspaceName: context.orgName,
            transferLink,
          },
        })
      }

      if (ownerEmail) {
        await sendTemplatedEmail({
          subject: `Ownership transfer initiated for ${context.orgName}`,
          to_emails: [ownerEmail],
          from_email: fromEmail,
          template_name: "ownership_transfer",
          template_properties: {
            workspaceName: context.orgName,
            transferLink,
          },
        })
      }
    } catch (e) {
      console.log("Failed sending ownership transfer notification email", e)
    }

    redirect(303, `${TEAM_PAGE_PATH}?ownershipTransferInitiated=1`)
  },

  cancelOwnershipTransfer: async ({ locals }) => {
    const context = await ensureOrgContext(locals)
    if (context.membershipRole !== "owner") {
      return fail(403, { cancelOwnershipTransferError: "Only owners can cancel transfers." })
    }

    const rpcResult = await locals.supabase.rpc("sc_cancel_ownership_transfer", {
      p_org_id: context.orgId,
    })

    if (rpcResult.error) {
      return fail(400, { cancelOwnershipTransferError: rpcResult.error.message })
    }

    redirect(303, `${TEAM_PAGE_PATH}?ownershipTransferCancelled=1`)
  },
}
