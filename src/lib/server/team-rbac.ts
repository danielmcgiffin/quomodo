import type { MembershipRole } from "$lib/server/atlas"

const MANAGEABLE_TARGET_ROLES_BY_ACTOR: Record<
  MembershipRole,
  readonly MembershipRole[]
> = {
  owner: ["admin", "editor", "member"],
  admin: ["editor", "member"],
  editor: [],
  member: [],
}

const ASSIGNABLE_ROLES_BY_ACTOR: Record<
  MembershipRole,
  readonly MembershipRole[]
> = {
  owner: ["admin", "editor", "member"],
  admin: ["editor", "member"],
  editor: [],
  member: [],
}

export const parseMembershipRole = (value: string): MembershipRole | null => {
  if (value === "owner") return "owner"
  if (value === "admin") return "admin"
  if (value === "editor") return "editor"
  if (value === "member") return "member"
  return null
}

export const canManageMemberRole = (
  actorRole: MembershipRole,
  targetRole: MembershipRole,
): boolean => MANAGEABLE_TARGET_ROLES_BY_ACTOR[actorRole].includes(targetRole)

export const canAssignMemberRole = (
  actorRole: MembershipRole,
  nextRole: MembershipRole,
): boolean => ASSIGNABLE_ROLES_BY_ACTOR[actorRole].includes(nextRole)

export const canChangeMemberRole = (
  actorRole: MembershipRole,
  targetRole: MembershipRole,
  isSelf: boolean,
): boolean => !isSelf && canManageMemberRole(actorRole, targetRole)

export const canRemoveMember = (
  actorRole: MembershipRole,
  targetRole: MembershipRole,
  isSelf: boolean,
): boolean => !isSelf && canManageMemberRole(actorRole, targetRole)

export const getAssignableRolesForActor = (
  actorRole: MembershipRole,
): MembershipRole[] => [...ASSIGNABLE_ROLES_BY_ACTOR[actorRole]]
