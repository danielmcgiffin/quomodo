import { describe, expect, it } from "vitest"
import {
  canAssignMemberRole,
  canChangeMemberRole,
  canManageMemberRole,
  canRemoveMember,
  getAssignableRolesForActor,
  parseMembershipRole,
} from "./team-rbac"

describe("team-rbac", () => {
  it("parses known membership roles", () => {
    expect(parseMembershipRole("owner")).toBe("owner")
    expect(parseMembershipRole("admin")).toBe("admin")
    expect(parseMembershipRole("editor")).toBe("editor")
    expect(parseMembershipRole("member")).toBe("member")
    expect(parseMembershipRole("invalid")).toBeNull()
  })

  it("enforces target-role management matrix", () => {
    expect(canManageMemberRole("owner", "admin")).toBe(true)
    expect(canManageMemberRole("owner", "editor")).toBe(true)
    expect(canManageMemberRole("owner", "member")).toBe(true)
    expect(canManageMemberRole("owner", "owner")).toBe(false)

    expect(canManageMemberRole("admin", "editor")).toBe(true)
    expect(canManageMemberRole("admin", "member")).toBe(true)
    expect(canManageMemberRole("admin", "admin")).toBe(false)
    expect(canManageMemberRole("admin", "owner")).toBe(false)
  })

  it("enforces assignable-role matrix", () => {
    expect(getAssignableRolesForActor("owner")).toEqual([
      "admin",
      "editor",
      "member",
    ])
    expect(getAssignableRolesForActor("admin")).toEqual(["editor", "member"])
    expect(getAssignableRolesForActor("editor")).toEqual([])
    expect(getAssignableRolesForActor("member")).toEqual([])

    expect(canAssignMemberRole("owner", "admin")).toBe(true)
    expect(canAssignMemberRole("owner", "owner")).toBe(false)
    expect(canAssignMemberRole("admin", "editor")).toBe(true)
    expect(canAssignMemberRole("admin", "admin")).toBe(false)
  })

  it("blocks self role changes and removals", () => {
    expect(canChangeMemberRole("owner", "admin", true)).toBe(false)
    expect(canRemoveMember("admin", "member", true)).toBe(false)
  })

  it("prevents editor/member from managing anyone", () => {
    for (const target of ["owner", "admin", "editor", "member"] as const) {
      expect(canManageMemberRole("editor", target)).toBe(false)
      expect(canManageMemberRole("member", target)).toBe(false)
    }
  })

  it("prevents admin from removing owner and assigning admin/owner", () => {
    expect(canRemoveMember("admin", "owner", false)).toBe(false)
    expect(canAssignMemberRole("admin", "admin")).toBe(false)
    expect(canAssignMemberRole("admin", "owner")).toBe(false)
  })

  it("prevents owner from assigning owner", () => {
    expect(canAssignMemberRole("owner", "owner")).toBe(false)
  })

  it("cannot change own role regardless of role level", () => {
    for (const actor of ["owner", "admin", "editor", "member"] as const) {
      for (const target of ["owner", "admin", "editor", "member"] as const) {
        expect(canChangeMemberRole(actor, target, true)).toBe(false)
      }
    }
  })
})
