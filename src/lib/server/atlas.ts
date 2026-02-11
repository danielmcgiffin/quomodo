import { error as kitError, redirect } from "@sveltejs/kit"

type SupabaseAny = any

export type MembershipRole = "owner" | "admin" | "editor" | "member"

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

export const assertRole = (
  context: OrgContext,
  allowedRoles: MembershipRole[],
): void => {
  if (!allowedRoles.includes(context.membershipRole)) {
    throw kitError(403, "You do not have permission to perform this action.")
  }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const extractText = (value: unknown): string => {
  if (!value) {
    return ""
  }
  if (typeof value === "string") {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => extractText(item)).join("")
  }
  if (typeof value === "object") {
    const node = value as Record<string, unknown>
    const text = typeof node.text === "string" ? node.text : ""
    const content = extractText(node.content)
    return `${text}${content}`
  }
  return ""
}

export const richToHtml = (value: unknown): string => {
  const text = extractText(value).trim()
  if (!text) {
    return "<p></p>"
  }
  return `<p>${escapeHtml(text).replaceAll("\n", "<br />")}</p>`
}

export const plainToRich = (value: string) => ({
  type: "doc",
  content: value.trim()
    ? [
        {
          type: "paragraph",
          content: [{ type: "text", text: value.trim() }],
        },
      ]
    : [],
})

export const makeInitials = (name: string): string => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
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

const createOrgForUser = async (
  supabase: SupabaseAny,
  userId: string,
  preferredName: string,
) => {
  const baseName = preferredName.trim() || "My Workspace"
  const baseSlug = slugify(baseName) || "workspace"

  for (let i = 0; i < 6; i += 1) {
    const slug = `${baseSlug}-${randomSuffix()}`
    const { data, error } = await supabase
      .from("orgs")
      .insert({
        name: baseName,
        slug,
        owner_id: userId,
      })
      .select("id, name")
      .single()

    if (!error && data) {
      return data
    }
    if (error?.code !== "23505") {
      throw kitError(500, `Failed to create workspace: ${error?.message ?? "unknown error"}`)
    }
  }

  throw kitError(500, "Failed to create workspace slug")
}

export const ensureOrgContext = async (locals: App.Locals): Promise<OrgContext> => {
  const user = locals.user
  if (!user) {
    throw redirect(303, "/login")
  }

  const supabase = locals.supabase as unknown as SupabaseAny
  const { data: memberships, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .order("accepted_at", { ascending: false, nullsFirst: false })
    .limit(1)

  if (membershipError) {
    throw kitError(500, `Failed to load workspace membership: ${membershipError.message}`)
  }

  const membership = memberships?.[0]
  if (!membership) {
    const displayName =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      (typeof user.email === "string" && user.email.split("@")[0]) ||
      "My Workspace"
    const org = await createOrgForUser(supabase, user.id, `${displayName}'s Workspace`)
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
    throw kitError(500, `Failed to load workspace: ${orgError?.message ?? "not found"}`)
  }

  return {
    orgId: org.id,
    orgName: org.name,
    membershipRole: membership.role as MembershipRole,
    userId: user.id,
  }
}

export const ensureUniqueSlug = async (
  supabase: SupabaseAny,
  table: "roles" | "systems" | "processes",
  orgId: string,
  rawName: string,
) => {
  const base = slugify(rawName) || "item"
  let candidate = base
  let suffix = 1

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("org_id", orgId)
      .eq("slug", candidate)
      .limit(1)

    if (error) {
      throw kitError(500, `Failed to validate slug: ${error.message}`)
    }
    if (!data || data.length === 0) {
      return candidate
    }
    suffix += 1
    candidate = `${base}-${suffix}`
  }
}
