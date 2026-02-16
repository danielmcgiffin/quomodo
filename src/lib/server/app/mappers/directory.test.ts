import { describe, it, expect } from "vitest"
import { mapRoleDirectory, mapSystemDirectory } from "./directory"

describe("mapRoleDirectory", () => {
  it("maps basic fields and uses makeInitials + richToHtml", () => {
    const rows = [
      {
        id: "r1",
        slug: "ops-manager",
        name: "Ops Manager",
        description_rich: { type: "doc" },
      },
    ]

    const result = mapRoleDirectory({
      rows,
      makeInitials: (name) => (name === "Ops Manager" ? "OM" : "??"),
      richToHtml: (value) => (value ? "<p>desc</p>" : ""),
      processData: [],
      actionData: [],
    })

    expect(result).toEqual([
      {
        id: "r1",
        slug: "ops-manager",
        name: "Ops Manager",
        initials: "OM",
        descriptionHtml: "<p>desc</p>",
        processCount: 0,
        systemCount: 0,
      },
    ])
  })
})

describe("mapSystemDirectory", () => {
  it("maps ownerRole when present and normalizes nullable location", () => {
    const ownerRole = { id: "r1", slug: "ops", name: "Ops", initials: "OP" }
    const roleById = new Map([[ownerRole.id, ownerRole]])

    const rows = [
      {
        id: "s1",
        slug: "asana",
        name: "Asana",
        description_rich: null,
        location: null,
        owner_role_id: "r1",
        logo_url: null,
      },
    ]

    const result = mapSystemDirectory({
      rows,
      roleById,
      richToHtml: () => "",
      actionData: [],
    })

    expect(result).toEqual([
      {
        id: "s1",
        slug: "asana",
        name: "Asana",
        descriptionHtml: "",
        location: "",
        logoUrl: null,
        ownerRole,
        processCount: 0,
        roleCount: 0,
      },
    ])
  })

  it("returns null ownerRole when owner_role_id missing or unknown", () => {
    const rows = [
      {
        id: "s1",
        slug: "slack",
        name: "Slack",
        description_rich: { any: "value" },
        location: "Communication",
        owner_role_id: null,
        logo_url: null,
      },
      {
        id: "s2",
        slug: "github",
        name: "GitHub",
        description_rich: { any: "value" },
        location: "Engineering",
        owner_role_id: "missing",
        logo_url: null,
      },
    ]

    const result = mapSystemDirectory({
      rows,
      roleById: new Map(),
      richToHtml: () => "<p>x</p>",
      actionData: [],
    })

    expect(result).toEqual([
      {
        id: "s1",
        slug: "slack",
        name: "Slack",
        descriptionHtml: "<p>x</p>",
        location: "Communication",
        logoUrl: null,
        ownerRole: null,
        processCount: 0,
        roleCount: 0,
      },
      {
        id: "s2",
        slug: "github",
        name: "GitHub",
        descriptionHtml: "<p>x</p>",
        location: "Engineering",
        logoUrl: null,
        ownerRole: null,
        processCount: 0,
        roleCount: 0,
      },
    ])
  })
})
