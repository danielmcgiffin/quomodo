import { fail } from "@sveltejs/kit"
import { ensureOrgContext } from "$lib/server/atlas"
import {
  assertWorkspaceWritable,
  getOrgBillingSnapshot,
} from "$lib/server/billing"

type MembershipRole = "owner" | "admin" | "editor" | "member"

export type OrgContext = {
  orgId: string
  userId: string
  membershipRole: MembershipRole
}

type ActionContext = {
  context: OrgContext
  supabase: App.Locals["supabase"]
  formData: FormData
  params: Record<string, string>
}

type PermissionCheck = (role: MembershipRole) => boolean

type WrapActionOptions = {
  permission?: PermissionCheck
  forbiddenPayload?: Record<string, unknown>
  requireWritable?: boolean
}

/**
 * Standard app action wrapper:
 * 1) ensures org context
 * 2) enforces lapsed=view-only (unless requireWritable=false)
 * 3) checks permission (if provided)
 * 4) parses FormData
 */
export const wrapAction = (
  handler: (ctx: ActionContext) => Promise<unknown>,
  {
    permission,
    forbiddenPayload = { error: "Insufficient permissions." },
    requireWritable = true,
  }: WrapActionOptions = {},
) => {
  return async ({
    request,
    locals,
    params,
  }: {
    request: Request
    locals: App.Locals
    params: Record<string, string>
  }) => {
    const context = await ensureOrgContext(locals)
    const billing = await getOrgBillingSnapshot(locals, context.orgId)
    if (requireWritable) {
      assertWorkspaceWritable(billing)
    }
    if (permission && !permission(context.membershipRole)) {
      return fail(403, forbiddenPayload)
    }
    const formData = await request.formData()
    return handler({
      context: {
        orgId: context.orgId,
        userId: context.userId,
        membershipRole: context.membershipRole,
      },
      supabase: locals.supabase,
      formData,
      params,
    })
  }
}
