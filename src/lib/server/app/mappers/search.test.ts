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
      entityContextByKey: new Map(),
      limit: 20,
    })

    expect(results[0]).toEqual({
      id: "p1",
      type: "process",
      title: "Weekly Ops Review",
      snippet: "Review unresolved flags and assign next steps.",
      href: "/app/processes/weekly-ops-review",
      actionSequence: null,
      portalProcess: {
        slug: "weekly-ops-review",
        name: "Weekly Ops Review",
      },
      portalRole: null,
      portalSystem: null,
      contextProcess: null,
      contextRole: null,
      contextSystem: null,
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
              content: [
                { type: "text", text: "Send onboarding reminder email." },
              ],
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
            process: {
              slug: "client-onboarding",
              name: "Client Onboarding",
            },
            role: {
              slug: "ops-manager",
              name: "Ops Manager",
              initials: "OM",
            },
            system: {
              slug: "hubspot",
              name: "HubSpot",
            },
          },
        ],
      ]),
      entityContextByKey: new Map(),
      limit: 20,
    })

    expect(results[0]).toEqual({
      id: "a1",
      type: "action",
      title: "Action 2 in Client Onboarding",
      snippet: "Send onboarding reminder email.",
      href: "/app/processes/client-onboarding?actionId=a1",
      actionSequence: 2,
      portalProcess: {
        slug: "client-onboarding",
        name: "Client Onboarding",
      },
      portalRole: null,
      portalSystem: null,
      contextProcess: null,
      contextRole: {
        slug: "ops-manager",
        name: "Ops Manager",
        initials: "OM",
      },
      contextSystem: {
        slug: "hubspot",
        name: "HubSpot",
      },
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
      entityContextByKey: new Map(),
      limit: 20,
    })

    expect(results.map((result) => result.id)).toEqual(["r1", "r2"])
  })

  it("adds linked context portals for role results", () => {
    const rows: SearchAllRow[] = [
      {
        entity_type: "role",
        id: "r1",
        slug: "operations-manager",
        title: "Operations Manager",
        body: "Coordinates workflow execution.",
      },
    ]

    const results = mapSearchResults({
      rows,
      query: "operations",
      actionRouteById: new Map(),
      entityContextByKey: new Map([
        [
          "role:r1",
          {
            process: {
              slug: "incident-review",
              name: "Incident Review",
            },
            role: {
              slug: "operations-manager",
              name: "Operations Manager",
              initials: "OM",
            },
            system: {
              slug: "pagerduty",
              name: "PagerDuty",
            },
          },
        ],
      ]),
      limit: 20,
    })

    expect(results[0]).toMatchObject({
      id: "r1",
      type: "role",
      portalRole: {
        slug: "operations-manager",
        name: "Operations Manager",
        initials: "OM",
      },
      contextProcess: {
        slug: "incident-review",
        name: "Incident Review",
      },
      contextRole: null,
      contextSystem: {
        slug: "pagerduty",
        name: "PagerDuty",
      },
    })
  })
})
