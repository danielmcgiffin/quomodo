import { fail, redirect } from "@sveltejs/kit"
import {
  canManageDirectory,
  createWorkspaceForUser,
  ensureOrgContext,
  type MembershipRole,
} from "$lib/server/atlas"
import { throwRuntime500 } from "$lib/server/runtime-errors"

const WORKSPACE_NAME_MAX_LENGTH = 80

type MembershipRow = {
  org_id: string
  role: MembershipRole
  accepted_at: string | null
}

type OrgRow = {
  id: string
  name: string
  owner_id: string
}

const normalizeWorkspaceName = (value: FormDataEntryValue | null): string =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")

export const load = async ({ locals, url }) => {
  const context = await ensureOrgContext(locals)
  const supabase = locals.supabase

  const membershipsResult = await supabase
    .from("org_members")
    .select("org_id, role, accepted_at")
    .eq("user_id", context.userId)
    .order("accepted_at", { ascending: false, nullsFirst: false })

  if (membershipsResult.error) {
    throwRuntime500({
      context: "app.workspace.load.memberships",
      error: membershipsResult.error,
      requestId: locals.requestId,
      route: "/app/workspace",
      details: { userId: context.userId },
    })
  }

  const memberships = (membershipsResult.data ?? []) as MembershipRow[]
  const uniqueOrgIds = [...new Set(memberships.map((membership) => membership.org_id))]
  const orgById = new Map<string, OrgRow>()

  if (uniqueOrgIds.length > 0) {
    const orgsResult = await supabase
      .from("orgs")
      .select("id, name, owner_id")
      .in("id", uniqueOrgIds)

    if (orgsResult.error) {
      throwRuntime500({
        context: "app.workspace.load.orgs",
        error: orgsResult.error,
        requestId: locals.requestId,
        route: "/app/workspace",
        details: { userId: context.userId },
      })
    }

    for (const org of (orgsResult.data ?? []) as OrgRow[]) {
      orgById.set(org.id, org)
    }
  }

  return {
    org: context,
    canRenameWorkspace: canManageDirectory(context.membershipRole),
    created: url.searchParams.get("created") === "1",
    renamed: url.searchParams.get("renamed") === "1",
    workspaces: memberships.map((membership) => {
      const org = orgById.get(membership.org_id)
      return {
        id: membership.org_id,
        name: org?.name ?? "Unknown workspace",
        role: membership.role,
        isCurrent: membership.org_id === context.orgId,
        isOwned: org?.owner_id === context.userId,
      }
    }),
  }
}

export const actions = {
  createWorkspace: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    const formData = await request.formData()
    const name = normalizeWorkspaceName(formData.get("name"))

    if (!name) {
      return fail(400, {
        createWorkspaceError: "Workspace name is required.",
        createWorkspaceNameDraft: name,
      })
    }

    if (name.length > WORKSPACE_NAME_MAX_LENGTH) {
      return fail(400, {
        createWorkspaceError: `Workspace name must be ${WORKSPACE_NAME_MAX_LENGTH} characters or fewer.`,
        createWorkspaceNameDraft: name,
      })
    }

    await createWorkspaceForUser(locals, context.userId, name)
    redirect(303, "/app/workspace?created=1")
  },

  renameWorkspace: async ({ request, locals }) => {
    const context = await ensureOrgContext(locals)
    if (!canManageDirectory(context.membershipRole)) {
      return fail(403, {
        renameWorkspaceError: "Only workspace owners and admins can rename this workspace.",
      })
    }

    const formData = await request.formData()
    const name = normalizeWorkspaceName(formData.get("name"))

    if (!name) {
      return fail(400, {
        renameWorkspaceError: "Workspace name is required.",
        renameWorkspaceNameDraft: name,
      })
    }

    if (name.length > WORKSPACE_NAME_MAX_LENGTH) {
      return fail(400, {
        renameWorkspaceError: `Workspace name must be ${WORKSPACE_NAME_MAX_LENGTH} characters or fewer.`,
        renameWorkspaceNameDraft: name,
      })
    }

    const { error } = await locals.supabase
      .from("orgs")
      .update({ name })
      .eq("id", context.orgId)

    if (error) {
      return fail(400, {
        renameWorkspaceError: error.message,
        renameWorkspaceNameDraft: name,
      })
    }

    redirect(303, "/app/workspace?renamed=1")
  },
}
