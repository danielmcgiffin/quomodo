import { describe, expect, it } from "vitest"
import {
  escapeFlagsSearchTerm,
  mapActionTargets,
  mapFlagsDashboard,
  mapFlagsHistoryTimeline,
  mapFlagTargetOptions,
  parseFlagsFilterParams,
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
      {
        id: "a1",
        label: "Action 2 in Onboarding",
        href: "/app/processes/onboarding?actionId=a1",
      },
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

  it("defaults flags filters and keeps legacy status compatibility", () => {
    expect(parseFlagsFilterParams(new URLSearchParams())).toEqual({
      status: "open",
      view: "open",
      historyStatus: "all",
      q: "",
      targetType: null,
      targetId: null,
    })

    expect(
      parseFlagsFilterParams(
        new URLSearchParams({
          status: "dismissed",
          targetType: "role",
          targetId: "r1",
        }),
      ),
    ).toEqual({
      status: "dismissed",
      view: "history",
      historyStatus: "dismissed",
      q: "",
      targetType: "role",
      targetId: "r1",
    })

    expect(
      parseFlagsFilterParams(
        new URLSearchParams({
          view: "history",
          historyStatus: "resolved",
          q: "   some   long   query   ",
        }),
      ),
    ).toEqual({
      status: "open",
      view: "history",
      historyStatus: "resolved",
      q: "some long query",
      targetType: null,
      targetId: null,
    })
  })

  it("groups mapped history entries by day for timeline", () => {
    const processById = new Map(processRows.map((row) => [row.id, row]))
    const systemById = new Map(systemRows.map((row) => [row.id, row]))
    const actionTargets = mapActionTargets({ actionRows, processById })

    const rows = [
      {
        id: "f2",
        target_type: "process" as const,
        target_id: "p1",
        target_path: null,
        flag_type: "risk",
        message: "Later",
        created_at: "2026-03-07T10:00:00.000Z",
        status: "resolved",
        resolved_at: "2026-03-08T10:00:00.000Z",
      },
      {
        id: "f1",
        target_type: "role" as const,
        target_id: "r1",
        target_path: null,
        flag_type: "risk",
        message: "Earlier",
        created_at: "2026-03-07T10:00:00.000Z",
        status: "dismissed",
        resolved_at: "2026-03-08T08:00:00.000Z",
      },
      {
        id: "f0",
        target_type: "system" as const,
        target_id: "s1",
        target_path: null,
        flag_type: "risk",
        message: "Old",
        created_at: "2026-03-06T10:00:00.000Z",
        status: "resolved",
        resolved_at: "2026-03-06T10:00:00.000Z",
      },
    ]

    const entries = mapFlagsDashboard({
      flagsRows: rows,
      processById,
      roleRows,
      systemById,
      actionTargets,
    })

    const timeline = mapFlagsHistoryTimeline({ flagsRows: rows, entries })

    expect(timeline).toHaveLength(2)
    expect(timeline[0]?.key).toBe("2026-03-08")
    expect(timeline[0]?.items).toHaveLength(2)
    expect(timeline[1]?.key).toBe("2026-03-06")
    expect(timeline[1]?.items).toHaveLength(1)
  })

  it("sanitizes history q for ilike/or queries", () => {
    expect(escapeFlagsSearchTerm("  x, y%_z  ")).toBe("x y z")
  })
})
