import { describe, expect, it } from "vitest"
import { mapRolePortals, mapSystemPortals, toRolePortal } from "./portals"

describe("app portal mappers", () => {
  it("maps role rows into role portal models with initials", () => {
    const roles = mapRolePortals([
      { id: "r1", slug: "accounts-payable", name: "Accounts Payable" },
      { id: "r2", slug: "ops", name: "Operations" },
    ])

    expect(roles).toEqual([
      {
        id: "r1",
        slug: "accounts-payable",
        name: "Accounts Payable",
        initials: "AP",
      },
      { id: "r2", slug: "ops", name: "Operations", initials: "OP" },
    ])
  })

  it("maps system rows into system portal models", () => {
    const systems = mapSystemPortals([
      { id: "s1", slug: "stripe", name: "Stripe", logo_url: null },
      { id: "s2", slug: "hubspot", name: "HubSpot", logo_url: "/img.png" },
    ])

    expect(systems).toEqual([
      { id: "s1", slug: "stripe", name: "Stripe", logoUrl: null },
      { id: "s2", slug: "hubspot", name: "HubSpot", logoUrl: "/img.png" },
    ])
  })

  it("provides SC fallback initials for blank role names", () => {
    const role = toRolePortal({ id: "r3", slug: "blank", name: " " })
    expect(role.initials).toBe("SC")
  })
})
