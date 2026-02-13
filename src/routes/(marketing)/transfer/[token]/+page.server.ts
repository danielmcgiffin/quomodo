import { fail, redirect } from "@sveltejs/kit"
import { env } from "$env/dynamic/private"
import { WebsiteBaseUrl, WebsiteName } from "../../../../config"
import { sendTemplatedEmail } from "$lib/mailer"
import {
  ensureOrgContext,
  setActiveWorkspaceCookie,
} from "$lib/server/atlas"
import { hashOwnershipTransferToken } from "$lib/server/ownership-transfers"
import { throwRuntime500 } from "$lib/server/runtime-errors"

type TransferLookupRow = {
  id: string
  org_id: string
  from_owner_id: string
  to_owner_id: string
  status: "pending" | "accepted" | "cancelled"
  expires_at: string
  accepted_at: string | null
  cancelled_at: string | null
}

const determineTransferStatus = (row: TransferLookupRow | null) => {
  if (!row) return "invalid" as const
  if (row.status === "accepted") return "accepted" as const
  if (row.status === "cancelled") return "cancelled" as const
  if (new Date(row.expires_at).getTime() <= Date.now()) return "expired" as const
  return "pending" as const
}

const loadTransferByToken = async (
  locals: App.Locals,
  token: string,
): Promise<TransferLookupRow | null> => {
  const tokenHash = await hashOwnershipTransferToken(token)
  const result = await locals.supabaseServiceRole
    .from("org_ownership_transfers")
    .select(
      "id, org_id, from_owner_id, to_owner_id, status, expires_at, accepted_at, cancelled_at",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (result.error) {
    throwRuntime500({
      context: "transfer.tokenLookup",
      error: result.error,
      requestId: locals.requestId,
      route: "/transfer/[token]",
    })
  }

  return (result.data ?? null) as TransferLookupRow | null
}

export const load = async ({ locals, params }) => {
  const token = params.token.trim()
  const nextPath = `/transfer/${params.token}`
  const signInUrl = `/login/sign_in?next=${encodeURIComponent(nextPath)}`

  if (!token) {
    return {
      transfer: null,
      transferStatus: "invalid" as const,
      signInUrl,
      canAccept: false,
      userAuthenticated: Boolean(locals.user),
      userId: locals.user?.id ?? null,
      userMatchesRecipient: false,
    }
  }

  const transfer = await loadTransferByToken(locals, token)
  const transferStatus = determineTransferStatus(transfer)

  if (!transfer) {
    return {
      transfer: null,
      transferStatus,
      signInUrl,
      canAccept: false,
      userAuthenticated: Boolean(locals.user),
      userId: locals.user?.id ?? null,
      userMatchesRecipient: false,
    }
  }

  const orgResult = await locals.supabaseServiceRole
    .from("orgs")
    .select("name")
    .eq("id", transfer.org_id)
    .maybeSingle()

  if (orgResult.error) {
    throwRuntime500({
      context: "transfer.orgLookup",
      error: orgResult.error,
      requestId: locals.requestId,
      route: "/transfer/[token]",
      details: { orgId: transfer.org_id, transferId: transfer.id },
    })
  }

  const userId = locals.user?.id ?? null
  const userMatchesRecipient = Boolean(userId && userId === transfer.to_owner_id)

  return {
    transfer: {
      id: transfer.id,
      orgId: transfer.org_id,
      orgName: orgResult.data?.name ?? "Workspace",
      recipientUserId: transfer.to_owner_id,
      fromOwnerUserId: transfer.from_owner_id,
      expiresAt: transfer.expires_at,
    },
    transferStatus,
    signInUrl,
    canAccept: Boolean(locals.user) && userMatchesRecipient && transferStatus === "pending",
    userAuthenticated: Boolean(locals.user),
    userId,
    userMatchesRecipient,
  }
}

export const actions = {
  acceptOwnershipTransfer: async ({ locals, params, cookies }) => {
    const token = params.token.trim()
    const nextPath = `/transfer/${params.token}`

    if (!locals.user) {
      redirect(303, `/login/sign_in?next=${encodeURIComponent(nextPath)}`)
    }

    const tokenHash = await hashOwnershipTransferToken(token)
    const rpcResult = await locals.supabase.rpc("sc_accept_ownership_transfer", {
      p_token_hash: tokenHash,
    })

    if (rpcResult.error) {
      return fail(400, { acceptTransferError: rpcResult.error.message })
    }

    const orgId = rpcResult.data as string | null
    if (!orgId) {
      return fail(400, { acceptTransferError: "Transfer could not be accepted." })
    }

    // Best-effort notifications to prior/new owners.
    try {
      const transferRow = await locals.supabaseServiceRole
        .from("org_ownership_transfers")
        .select("org_id, from_owner_id, to_owner_id")
        .eq("token_hash", tokenHash)
        .maybeSingle()

      const orgResult = await locals.supabaseServiceRole
        .from("orgs")
        .select("name")
        .eq("id", orgId)
        .maybeSingle()

      const fromEmail =
        env.PRIVATE_FROM_ADMIN_EMAIL ||
        env.PRIVATE_ADMIN_EMAIL ||
        "no-reply@systemscraft.co"

      const workspaceName = orgResult.data?.name ?? "Workspace"
      const workspaceLink = `${WebsiteBaseUrl}/app/team?ownershipTransferAccepted=1`

      const fromOwnerId = transferRow.data?.from_owner_id
      const toOwnerId = transferRow.data?.to_owner_id

      const users = await Promise.all([
        fromOwnerId
          ? locals.supabaseServiceRole.auth.admin.getUserById(fromOwnerId)
          : Promise.resolve({ data: { user: null } }),
        toOwnerId
          ? locals.supabaseServiceRole.auth.admin.getUserById(toOwnerId)
          : Promise.resolve({ data: { user: null } }),
      ])

      const priorOwnerEmail = users[0].data.user?.email
      const newOwnerEmail = users[1].data.user?.email

      if (priorOwnerEmail) {
        await sendTemplatedEmail({
          subject: `Ownership transfer complete for ${workspaceName} on ${WebsiteName}`,
          to_emails: [priorOwnerEmail],
          from_email: fromEmail,
          template_name: "ownership_transfer_complete",
          template_properties: { workspaceName, workspaceLink },
        })
      }
      if (newOwnerEmail) {
        await sendTemplatedEmail({
          subject: `You're now the owner of ${workspaceName} on ${WebsiteName}`,
          to_emails: [newOwnerEmail],
          from_email: fromEmail,
          template_name: "ownership_transfer_complete",
          template_properties: { workspaceName, workspaceLink },
        })
      }
    } catch (e) {
      console.log("Failed sending ownership transfer completion email", e)
    }

    setActiveWorkspaceCookie(cookies, orgId)
    locals.activeWorkspaceId = orgId
    locals.orgContext = undefined
    await ensureOrgContext(locals)

    redirect(303, "/app/team?ownershipTransferAccepted=1")
  },
}
