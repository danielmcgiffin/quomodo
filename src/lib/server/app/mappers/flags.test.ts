import { describe, expect, it } from "vitest"
import {
  mapActionTargets,
  mapFlagsDashboard,
  mapFlagTargetOptions,
  type FlagsActionRow,
  type FlagsProcessRow,
  type FlagsRoleRow,
  type FlagsSystemRow,
} from "./flags"

describe("flags mappers", () => {
  const processRows: FlagsProcessRow[] = [
    { id: "p1", slug: "onboarding", name: "Onboarding" },
  ]
  const roleRows: FlagsRoleRow[] = [
    { id: "r1", slug: "ops", name: "Operations" },
  ]
  const systemRows: FlagsSystemRow[] = [
    { id: "s1", slug: "hubspot", name: "HubSpot" },
  ]
  const actionRows: FlagsActionRow[] = [
    { id: "a1", process_id: "p1", sequence: 2 },
  ]

  it("maps action targets with process context in label", () => {
    const processById = new Map(processRows.map((row) => [row.id, row]))
    expect(mapActionTargets({ actionRows, processById })).toEqual([
      { id: "a1", label: "Action 2 in Onboarding" },
    ])
  })

  it("builds target options in process/role/system/action order", () => {
    const processById = new Map(processRows.map((row) => [row.id, row]))
    const actionTargets = mapActionTargets({ actionRows, processById })
    expect(
      mapFlagTargetOptions({
        processRows,
        roleRows,
        systemRows,
        actionTargets,
      }),
    ).toEqual([
      { value: "process:p1", label: "Process: Onboarding" },
      { value: "role:r1", label: "Role: Operations" },
      { value: "system:s1", label: "System: HubSpot" },
      { value: "action:a1", label: "Action: Action 2 in Onboarding" },
    ])
  })

  it("maps dashboard flags to typed targets", () => {
    const processById = new Map(processRows.map((row) => [row.id, row]))
    const systemById = new Map(systemRows.map((row) => [row.id, row]))
    const actionTargets = mapActionTargets({ actionRows, processById })
    const flags = mapFlagsDashboard({
      flagsRows: [
        {
          id: "f1",
          target_type: "role",
          target_id: "r1",
          target_path: "description",
          flag_type: "comment",
          message: "Needs clarification",
          created_at: "2026-02-12T10:00:00.000Z",
          status: "open",
        },
      ],
      processById,
      roleRows,
      systemById,
      actionTargets,
    })

    expect(flags[0]?.targetType).toBe("role")
    expect(flags[0]?.target).toEqual({
      id: "r1",
      slug: "ops",
      name: "Operations",
      initials: "OP",
    })
  })
})
