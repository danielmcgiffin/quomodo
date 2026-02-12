import { describe, expect, it } from "vitest"
import { mapSearchResults, type SearchAllRow } from "./search"

describe("search mappers", () => {
  it("maps process results with a targeted snippet from rich text", () => {
    const rows: SearchAllRow[] = [
      {
        entity_type: "process",
        id: "p1",
        slug: "weekly-ops-review",
        title: "Weekly Ops Review",
        body: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Review unresolved flags and assign next steps.",
                },
              ],
            },
          ],
        }),
      },
    ]

    const results = mapSearchResults({
      rows,
      query: "flags",
      actionRouteById: new Map(),
      limit: 20,
    })

    expect(results[0]).toEqual({
      id: "p1",
      type: "process",
      title: "Weekly Ops Review",
      snippet: "Review unresolved flags and assign next steps.",
      href: "/app/processes/weekly-ops-review",
    })
  })

  it("maps action results to process deep-links with enriched action title", () => {
    const rows: SearchAllRow[] = [
      {
        entity_type: "action",
        id: "a1",
        slug: null,
        title: "Action 2",
        body: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Send onboarding reminder email." }],
            },
          ],
        }),
      },
    ]

    const results = mapSearchResults({
      rows,
      query: "onboarding",
      actionRouteById: new Map([
        [
          "a1",
          {
            actionId: "a1",
            sequence: 2,
            processSlug: "client-onboarding",
            processName: "Client Onboarding",
          },
        ],
      ]),
      limit: 20,
    })

    expect(results[0]).toEqual({
      id: "a1",
      type: "action",
      title: "Action 2 in Client Onboarding",
      snippet: "Send onboarding reminder email.",
      href: "/app/processes/client-onboarding?actionId=a1",
    })
  })

  it("ranks exact title matches before partial matches", () => {
    const rows: SearchAllRow[] = [
      {
        entity_type: "role",
        id: "r1",
        slug: "ops",
        title: "Ops",
        body: "Operations owner",
      },
      {
        entity_type: "role",
        id: "r2",
        slug: "daily-ops",
        title: "Daily Ops",
        body: "Daily operations coordinator",
      },
    ]

    const results = mapSearchResults({
      rows,
      query: "Ops",
      actionRouteById: new Map(),
      limit: 20,
    })

    expect(results.map((result) => result.id)).toEqual(["r1", "r2"])
  })
})
