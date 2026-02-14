import { describe, it, expect } from "vitest"
import {
  mapProcessCards,
  mapOpenProcessFlags,
  mapProcessDetailActions,
  mapProcessDetailFlags,
} from "./processes"

describe("process mappers", () => {
  it("maps process cards, normalizes null fields, and sorts by name", () => {
    const roleById = new Map([
      ["r1", { id: "r1", slug: "ops", name: "Ops", initials: "OP" }],
      ["r2", { id: "r2", slug: "eng", name: "Eng", initials: "EN" }],
    ])
    const systemById = new Map([
      ["s1", { id: "s1", slug: "slack", name: "Slack" }],
      ["s2", { id: "s2", slug: "asana", name: "Asana" }],
    ])

    const cards = mapProcessCards({
      processRows: [
        {
          id: "p2",
          slug: "beta",
          name: "Beta",
          description_rich: null,
          trigger: null,
          end_state: null,
          owner_role_id: null,
        },
        {
          id: "p1",
          slug: "alpha",
          name: "Alpha",
          description_rich: { any: "x" },
          trigger: "T",
          end_state: "E",
          owner_role_id: "r1",
        },
      ],
      actionRows: [
        { process_id: "p1", system_id: "s1", owner_role_id: "r2" },
        { process_id: "p1", system_id: "s2", owner_role_id: "r1" }, // owner should not duplicate in roleBadges
        { process_id: "p2", system_id: null, owner_role_id: null },
      ],
      roleById,
      systemById,
      richToHtml: (value) => (value ? "<p>x</p>" : ""),
    })

    // Sorted by name.
    expect(cards.map((c) => c.name)).toEqual(["Alpha", "Beta"])

    const alpha = cards[0]!
    expect(alpha.trigger).toBe("T")
    expect(alpha.endState).toBe("E")
    expect(alpha.descriptionHtml).toBe("<p>x</p>")
    expect(alpha.roleBadges.map((r) => r.id)).toEqual(["r1", "r2"])
    expect(alpha.systemBadges.map((s) => s.id).sort()).toEqual(["s1", "s2"])

    const beta = cards[1]!
    expect(beta.trigger).toBe("")
    expect(beta.endState).toBe("")
    expect(beta.roleBadges).toEqual([])
    expect(beta.systemBadges).toEqual([])
  })

  it("maps open process flags and drops flags for missing process", () => {
    const processById = new Map([
      ["p1", { id: "p1", slug: "p1", name: "P1" }],
    ])

    const flags = mapOpenProcessFlags({
      flagRows: [
        {
          id: "f1",
          target_id: "p1",
          target_path: "trigger",
          flag_type: "question",
          message: "?",
          created_at: new Date("2026-02-14T00:00:00Z").toISOString(),
        },
        {
          id: "f2",
          target_id: "missing",
          target_path: null,
          flag_type: "comment",
          message: "x",
          created_at: new Date("2026-02-14T00:00:00Z").toISOString(),
        },
      ],
      processById,
    })

    expect(flags).toHaveLength(1)
    expect(flags[0]!.id).toBe("f1")
    expect(flags[0]!.process.id).toBe("p1")
    expect(flags[0]!.targetPath).toBe("trigger")
  })

  it("maps process detail actions/flags", () => {
    const roleById = new Map([
      ["r1", { id: "r1", slug: "ops", name: "Ops", initials: "OP" }],
    ])
    const systemById = new Map([
      ["s1", { id: "s1", slug: "slack", name: "Slack" }],
    ])

    const actions = mapProcessDetailActions({
      rows: [
        {
          id: "a1",
          process_id: "p1",
          sequence: 2,
          description_rich: { any: "x" },
          owner_role_id: "r1",
          system_id: "s1",
        },
      ],
      roleById,
      systemById,
      richToHtml: () => "<p>x</p>",
    })

    expect(actions).toEqual([
      {
        id: "a1",
        processId: "p1",
        sequence: 2,
        descriptionHtml: "<p>x</p>",
        ownerRole: roleById.get("r1"),
        system: systemById.get("s1"),
      },
    ])

    const flags = mapProcessDetailFlags([
      {
        id: "f1",
        flag_type: "question",
        message: "M",
        created_at: new Date("2026-02-14T00:00:00Z").toISOString(),
      },
    ])
    expect(flags[0]!.flagType).toBe("question")
    expect(flags[0]!.message).toBe("M")
  })
})

