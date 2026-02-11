export type Role = {
  id: string
  slug: string
  name: string
  initials: string
  descriptionHtml: string
  personName?: string
  hoursPerWeek?: number
  reportsTo?: string
}

export type System = {
  id: string
  slug: string
  name: string
  descriptionHtml: string
  url?: string
  location?: string
  costMonthly?: number
  adminRoleId?: string
}

export type Process = {
  id: string
  slug: string
  name: string
  descriptionHtml: string
  trigger: string
  endState: string
  ownerRoleId: string
}

export type Action = {
  id: string
  processId: string
  sequence: number
  descriptionHtml: string
  ownerRoleId: string
  systemId: string
}

export type Flag = {
  id: string
  targetType: "role" | "process" | "system" | "step"
  targetId: string
  flagType: "stale" | "incorrect" | "needs_review" | "question"
  message: string
  createdAt: string
  ownerRoleId?: string
  processId?: string
}

export const roles: Role[] = [
  {
    id: "role-founder",
    slug: "founder",
    name: "Founder",
    initials: "DM",
    descriptionHtml:
      "<p>Sets direction, handles escalations, owns critical client trust.</p>",
    personName: "Danny McGiffin",
    hoursPerWeek: 20,
  },
  {
    id: "role-ops",
    slug: "ops-manager",
    name: "Ops Manager",
    initials: "OM",
    descriptionHtml:
      "<p>Owns operational consistency, keeps the atlas current.</p>",
    personName: "Jordan Lee",
    hoursPerWeek: 30,
    reportsTo: "role-founder",
  },
  {
    id: "role-cs",
    slug: "client-success",
    name: "Client Success Lead",
    initials: "CS",
    descriptionHtml:
      "<p>Runs onboarding and renewals, keeps clients moving.</p>",
    personName: "Priya Shah",
    hoursPerWeek: 25,
    reportsTo: "role-ops",
  },
]

export const systems: System[] = [
  {
    id: "system-hubspot",
    slug: "hubspot",
    name: "HubSpot",
    descriptionHtml: "<p>CRM for pipeline and client lifecycle tracking.</p>",
    url: "https://app.hubspot.com",
    location: "CRM",
    costMonthly: 800,
    adminRoleId: "role-ops",
  },
  {
    id: "system-drive",
    slug: "google-drive",
    name: "Google Drive",
    descriptionHtml: "<p>Shared folders, templates, and client assets.</p>",
    url: "https://drive.google.com",
    location: "Shared drive",
    costMonthly: 120,
    adminRoleId: "role-ops",
  },
  {
    id: "system-zoom",
    slug: "zoom",
    name: "Zoom",
    descriptionHtml: "<p>Client calls and internal handoffs.</p>",
    url: "https://zoom.us",
    location: "Video calls",
    costMonthly: 60,
    adminRoleId: "role-ops",
  },
]

export const processes: Process[] = [
  {
    id: "process-onboarding",
    slug: "client-onboarding",
    name: "Client Onboarding",
    descriptionHtml:
      "<p>Move a signed client into delivery with everything set up and visible.</p>",
    trigger: "Contract signed",
    endState: "Kickoff scheduled, materials ready, owner assigned.",
    ownerRoleId: "role-cs",
  },
  {
    id: "process-weekly-ops",
    slug: "weekly-ops-review",
    name: "Weekly Ops Review",
    descriptionHtml:
      "<p>Review open work, stale systems, and unresolved flags every Monday.</p>",
    trigger: "Monday 9:00am",
    endState: "Open issues assigned with clear next steps.",
    ownerRoleId: "role-ops",
  },
  {
    id: "process-renewals",
    slug: "renewal-monitoring",
    name: "Renewal Monitoring",
    descriptionHtml: "<p>Track renewal pipeline and risk signals.</p>",
    trigger: "Thursday 2:00pm",
    endState: "Renewal risks documented with outreach plan.",
    ownerRoleId: "role-cs",
  },
]

export const actions: Action[] = [
  {
    id: "step-drive-folder",
    processId: "process-onboarding",
    sequence: 1,
    descriptionHtml:
      "<p>Create client folder from template and share internally.</p>",
    ownerRoleId: "role-ops",
    systemId: "system-drive",
  },
  {
    id: "step-hubspot-deal",
    processId: "process-onboarding",
    sequence: 2,
    descriptionHtml:
      "<p>Create HubSpot deal and assign onboarding owner.</p>",
    ownerRoleId: "role-cs",
    systemId: "system-hubspot",
  },
  {
    id: "step-kickoff",
    processId: "process-onboarding",
    sequence: 3,
    descriptionHtml: "<p>Schedule kickoff call and confirm attendees.</p>",
    ownerRoleId: "role-founder",
    systemId: "system-zoom",
  },
  {
    id: "step-ops-review",
    processId: "process-weekly-ops",
    sequence: 1,
    descriptionHtml: "<p>Scan flags and decide next actions.</p>",
    ownerRoleId: "role-ops",
    systemId: "system-drive",
  },
  {
    id: "step-renewal-pipeline",
    processId: "process-renewals",
    sequence: 1,
    descriptionHtml: "<p>Review renewal pipeline and outreach cadence.</p>",
    ownerRoleId: "role-cs",
    systemId: "system-hubspot",
  },
]

export const flags: Flag[] = [
  {
    id: "flag-onboarding-template",
    targetType: "process",
    targetId: "process-onboarding",
    flagType: "stale",
    message: "Onboarding template last updated 7 months ago.",
    createdAt: "3 days ago",
    ownerRoleId: "role-ops",
    processId: "process-onboarding",
  },
  {
    id: "flag-hubspot-fields",
    targetType: "system",
    targetId: "system-hubspot",
    flagType: "needs_review",
    message: "Pipeline stages missing renewal status field.",
    createdAt: "1 week ago",
    ownerRoleId: "role-cs",
    processId: "process-renewals",
  },
]

export const roleById = new Map(roles.map((role) => [role.id, role]))
export const roleBySlug = new Map(roles.map((role) => [role.slug, role]))

export const systemById = new Map(systems.map((system) => [system.id, system]))
export const systemBySlug = new Map(
  systems.map((system) => [system.slug, system]),
)

export const processById = new Map(
  processes.map((process) => [process.id, process]),
)
export const processBySlug = new Map(
  processes.map((process) => [process.slug, process]),
)

export const actionsByProcessId = new Map(
  processes.map((process) => [
    process.id,
    actions.filter((action) => action.processId === process.id),
  ]),
)

export const flagsByTarget = new Map(
  flags.map((flag) => [`${flag.targetType}:${flag.targetId}`, flag]),
)
