import { error as kitError, redirect } from "@sveltejs/kit"
import {
  logRuntimeError,
  USER_SAFE_REQUEST_ERROR_MESSAGE,
  USER_SAFE_WORKSPACE_CREATE_ERROR_MESSAGE,
  USER_SAFE_WORKSPACE_ERROR_MESSAGE,
} from "$lib/server/runtime-errors"
export {
  plainToRich,
  richToHtml,
  richToJsonString,
  readRichTextFormDraft,
} from "$lib/server/rich-text"

export type MembershipRole = "owner" | "admin" | "editor" | "member"
export const SC_FLAG_TYPES = [
  "comment",
  "question",
  "needs_review",
  "stale",
  "incorrect",
] as const
export type ScFlagType = (typeof SC_FLAG_TYPES)[number]

export type OrgContext = {
  orgId: string
  orgName: string
  membershipRole: MembershipRole
  userId: string
}

const MANAGE_DIRECTORY_ROLES: MembershipRole[] = ["owner", "admin"]
const EDIT_ATLAS_ROLES: MembershipRole[] = ["owner", "admin", "editor"]
const MODERATE_FLAGS_ROLES: MembershipRole[] = ["owner", "admin", "editor"]

export const canManageDirectory = (role: MembershipRole): boolean =>
  MANAGE_DIRECTORY_ROLES.includes(role)

export const canEditAtlas = (role: MembershipRole): boolean =>
  EDIT_ATLAS_ROLES.includes(role)

export const canModerateFlags = (role: MembershipRole): boolean =>
  MODERATE_FLAGS_ROLES.includes(role)

export const canCreateFlagType = (
  role: MembershipRole,
  flagType: string,
): boolean => role !== "member" || flagType === "comment"

export const isScFlagType = (value: string): value is ScFlagType =>
  SC_FLAG_TYPES.includes(value as ScFlagType)

export const assertRole = (
  context: OrgContext,
  allowedRoles: MembershipRole[],
): void => {
  if (!allowedRoles.includes(context.membershipRole)) {
    throw kitError(403, "You do not have permission to perform this action.")
  }
}

export const makeInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return "SC"
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

const randomSuffix = () => Math.random().toString(36).slice(2, 8)

const TRIAD_TABLES_HINT =
  "SystemsCraft triad tables are missing. Apply `supabase/migrations/20260211183000_systemscraft_triad_foundation.sql` to this Supabase project."

const createOrgForUser = async (
  supabase: App.Locals["supabase"],
  supabaseServiceRole: App.Locals["supabaseServiceRole"],
  userId: string,
  preferredName: string,
  requestId?: string,
) => {
  const baseName = preferredName.trim() || "My Workspace"
  const baseSlug = slugify(baseName) || "workspace"

  for (let i = 0; i < 6; i += 1) {
    const slug = `${baseSlug}-${randomSuffix()}`
    const insertPayload = {
      name: baseName,
      slug,
      owner_id: userId,
    }

    const { data, error } = await supabase
      .from("orgs")
      .insert(insertPayload)
      .select("id, name")
      .single()

    if (!error && data) {
      return data
    }

    // Fallback for first-workspace bootstrap when RLS blocks anon-key insert.
    if (error?.code === "42501") {
      const { data: adminData, error: adminError } = await supabaseServiceRole
        .from("orgs")
        .insert(insertPayload)
        .select("id, name")
        .single()

      if (!adminError && adminData) {
        // Defensive upsert in case DB trigger wasn't present during insert.
        const { error: ownerMembershipError } = await supabaseServiceRole
          .from("org_members")
          .upsert(
            {
              org_id: adminData.id,
              user_id: userId,
              role: "owner",
              accepted_at: new Date().toISOString(),
            },
            {
              onConflict: "org_id,user_id",
            },
          )

        if (ownerMembershipError) {
          logRuntimeError({
            context: "atlas.createOrgForUser.ownerMembership",
            error: ownerMembershipError,
            requestId,
            details: { userId, orgId: adminData.id },
          })
          throw kitError(500, USER_SAFE_WORKSPACE_CREATE_ERROR_MESSAGE)
        }

        return adminData
      }
    }

    if (error?.code === "42P01") {
      logRuntimeError({
        context: "atlas.createOrgForUser.schemaMissing",
        error,
        requestId,
        details: { hint: TRIAD_TABLES_HINT },
      })
      throw kitError(500, USER_SAFE_WORKSPACE_CREATE_ERROR_MESSAGE)
    }
    if (error?.code !== "23505") {
      logRuntimeError({
        context: "atlas.createOrgForUser.insert",
        error,
        requestId,
        details: { userId, slug },
      })
      throw kitError(500, USER_SAFE_WORKSPACE_CREATE_ERROR_MESSAGE)
    }
  }

  logRuntimeError({
    context: "atlas.createOrgForUser.slugExhausted",
    error: new Error("Failed to generate unique org slug after retries."),
    requestId,
    details: { userId, preferredName },
  })
  throw kitError(500, USER_SAFE_WORKSPACE_CREATE_ERROR_MESSAGE)
}

export const ensureOrgContext = async (
  locals: App.Locals,
): Promise<OrgContext> => {
  const user = locals.user
  if (!user) {
    throw redirect(303, "/login")
  }

  const supabase = locals.supabase
  const { data: memberships, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .order("accepted_at", { ascending: false, nullsFirst: false })
    .limit(1)

  if (membershipError) {
    if (membershipError.code === "42P01") {
      logRuntimeError({
        context: "atlas.ensureOrgContext.schemaMissing",
        error: membershipError,
        requestId: locals.requestId,
        details: { hint: TRIAD_TABLES_HINT, userId: user.id },
      })
      throw kitError(500, USER_SAFE_WORKSPACE_ERROR_MESSAGE)
    }
    logRuntimeError({
      context: "atlas.ensureOrgContext.membershipLookup",
      error: membershipError,
      requestId: locals.requestId,
      details: { userId: user.id },
    })
    throw kitError(500, USER_SAFE_WORKSPACE_ERROR_MESSAGE)
  }

  const membership = memberships?.[0]
  if (!membership) {
    const displayName =
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name) ||
      (typeof user.email === "string" && user.email.split("@")[0]) ||
      "My Workspace"
    const org = await createOrgForUser(
      supabase,
      locals.supabaseServiceRole,
      user.id,
      `${displayName}'s Workspace`,
      locals.requestId,
    )
    return {
      orgId: org.id,
      orgName: org.name,
      membershipRole: "owner",
      userId: user.id,
    }
  }

  const { data: org, error: orgError } = await supabase
    .from("orgs")
    .select("id, name")
    .eq("id", membership.org_id)
    .single()

  if (orgError || !org) {
    logRuntimeError({
      context: "atlas.ensureOrgContext.orgLookup",
      error: orgError ?? new Error("Workspace record not found."),
      requestId: locals.requestId,
      details: { userId: user.id, orgId: membership.org_id },
    })
    throw kitError(500, USER_SAFE_WORKSPACE_ERROR_MESSAGE)
  }

  return {
    orgId: org.id,
    orgName: org.name,
    membershipRole: membership.role as MembershipRole,
    userId: user.id,
  }
}

export const ensureUniqueSlug = async (
  supabase: App.Locals["supabase"],
  table: "roles" | "systems" | "processes",
  orgId: string,
  rawName: string,
) => {
  const base = slugify(rawName) || "item"
  let candidate = base
  let suffix = 1

  for (let attempts = 0; attempts < 1000; attempts += 1) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("org_id", orgId)
      .eq("slug", candidate)
      .limit(1)

    if (error) {
      logRuntimeError({
        context: "atlas.ensureUniqueSlug.validate",
        error,
        requestId: null,
        details: { table, orgId, candidate },
      })
      throw kitError(500, USER_SAFE_REQUEST_ERROR_MESSAGE)
    }
    if (!data || data.length === 0) {
      return candidate
    }
    suffix += 1
    candidate = `${base}-${suffix}`
  }

  logRuntimeError({
    context: "atlas.ensureUniqueSlug.exhausted",
    error: new Error("Failed to generate unique slug after retries."),
    requestId: null,
    details: { table, orgId, rawName },
  })
  throw kitError(500, USER_SAFE_REQUEST_ERROR_MESSAGE)
}
