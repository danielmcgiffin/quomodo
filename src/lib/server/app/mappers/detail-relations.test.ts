import { describe, it, expect } from "vitest"
import {
  mapActionsByProcess,
  mapRoleActionsPerformed,
  mapRoleOwnedProcesses,
  mapSystemsAccessed,
  mapSystemActionsUsing,
  filterProcessesUsing,
  filterRolesUsing,
  mapOpenFlags,
} from "./detail-relations"

describe("detail-relations mappers", () => {
  it("groups actions by process and includes role-owned processes even with no actions", () => {
    const processes = mapRoleOwnedProcesses([
      { id: "p1", slug: "p1", name: "P1", owner_role_id: "r1" },
      { id: "p2", slug: "p2", name: "P2", owner_role_id: "r2" },
    ])

    const actionsPerformed = mapRoleActionsPerformed({
      rows: [
        {
          id: "a1",
          process_id: "p1",
          sequence: 1,
          description_rich: { any: "x" },
          owner_role_id: "r1",
          system_id: "s1",
        },
        {
          id: "a2",
          process_id: "p2",
          sequence: 2,
          description_rich: { any: "y" },
          owner_role_id: "r1",
          system_id: "s1",
        },
      ],
      systemById: new Map([["s1", { id: "s1", slug: "slack", name: "Slack" }]]),
      richToHtml: () => "<p>x</p>",
    })

    const grouped = mapActionsByProcess({
      processes,
      actionsPerformed,
      roleId: "r1",
    })

    // Includes p1 because role owns it; includes p2 because it has an action performed by the role.
    expect(grouped.map((entry) => entry.process.id).sort()).toEqual(["p1", "p2"])
    expect(grouped.find((x) => x.process.id === "p1")?.actions.map((a) => a.id)).toEqual(["a1"])
    expect(grouped.find((x) => x.process.id === "p2")?.actions.map((a) => a.id)).toEqual(["a2"])
  })

  it("filters systems/processes/roles based on actions and maps open flags", () => {
    const systems = [
      { id: "s1", slug: "slack", name: "Slack" },
      { id: "s2", slug: "asana", name: "Asana" },
    ]

    const actionsPerformed = [
      { id: "a1", processId: "p1", sequence: 1, descriptionHtml: "", system: systems[0]! },
    ]

    expect(mapSystemsAccessed({ systems, actionsPerformed }).map((s) => s.id)).toEqual(["s1"])

    const roles = [
      { id: "r1", slug: "ops", name: "Ops", initials: "OP" },
      { id: "r2", slug: "eng", name: "Eng", initials: "EN" },
    ]
    const roleById = new Map(roles.map((r) => [r.id, r]))

    const actionsUsing = mapSystemActionsUsing({
      rows: [
        {
          id: "a1",
          process_id: "p1",
          sequence: 1,
          description_rich: null,
          owner_role_id: "r1",
          system_id: "s1",
        },
      ],
      roleById,
      richToHtml: () => "",
    })

    const processes = [
      { id: "p1", slug: "p1", name: "P1" },
      { id: "p2", slug: "p2", name: "P2" },
    ]

    expect(filterProcessesUsing({ processes, actionsUsing }).map((p) => p.id)).toEqual(["p1"])
    expect(filterRolesUsing({ roles, actionsUsing }).map((r) => r.id)).toEqual(["r1"])

    expect(
      mapOpenFlags([{ id: "f1", flag_type: "question", message: "?" }]),
    ).toEqual([{ id: "f1", flagType: "question", message: "?" }])
  })
})

