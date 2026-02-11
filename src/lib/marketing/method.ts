export type MethodAction = {
  title: string
  description: string
}

export type MethodSection = {
  slug: string
  title: string
  summary: string
  intro: string
  actions: MethodAction[]
}

export const methodSections: MethodSection[] = [
  {
    slug: "diagnose-the-break",
    title: "Diagnose The Break",
    summary: "Find the operational bottleneck that creates the most interruptions.",
    intro:
      "Start where the founder or manager is constantly pulled back into execution. That is your highest-leverage entry point.",
    actions: [
      {
        title: "Name the recurring interruption",
        description:
          "Choose the workflow that repeatedly requires tribal knowledge or escalation.",
      },
      {
        title: "Define success and failure",
        description:
          "Write what a clean handoff looks like and what currently fails in production.",
      },
      {
        title: "Set retrieval goal",
        description:
          "Confirm what answer users should be able to retrieve in one interaction.",
      },
    ],
  },
  {
    slug: "map-the-triad",
    title: "Map The Triad",
    summary:
      "Model work as an ordered chain of actions with one role and one system per action.",
    intro:
      "The atlas is not built from documents. It is built from role-action-system chains inside each process.",
    actions: [
      {
        title: "Create process boundary",
        description:
          "Capture trigger and end state so scope is explicit before writing action detail.",
      },
      {
        title: "Capture ordered actions",
        description:
          "Record each action in sequence and keep action descriptions executable.",
      },
      {
        title: "Assign owner and system",
        description:
          "Every action gets exactly one responsible role and one operating system location.",
      },
    ],
  },
  {
    slug: "link-and-traverse",
    title: "Link And Traverse",
    summary:
      "Turn every mention into a portal so users navigate through relationships, not folders.",
    intro:
      "Connections are primary content. Each entity view must reveal its linked roles, processes, systems, and flags.",
    actions: [
      {
        title: "Apply portal pattern",
        description:
          "Role, process, and system mentions must always be clickable links.",
      },
      {
        title: "Preserve view symmetry",
        description:
          "Each entity page shows self first and then connected entities.",
      },
      {
        title: "Validate one-click retrieval",
        description:
          "From any detail page, verify users can jump to a connected answer in one click.",
      },
    ],
  },
  {
    slug: "operationalize-maintenance",
    title: "Operationalize Maintenance",
    summary:
      "Surface drift with flags and comments where work is executed.",
    intro:
      "Maintenance must happen through usage. Comments are stored as flags so context stays attached to the target entity.",
    actions: [
      {
        title: "Create comment flags",
        description:
          "Members can create comment flags on entities or field-level targets.",
      },
      {
        title: "Moderate with clear ownership",
        description:
          "Owner/Admin/Editor resolve or dismiss flags with explicit resolution notes.",
      },
      {
        title: "Track staleness",
        description:
          "Use periodic checks to highlight processes and actions drifting from current reality.",
      },
    ],
  },
  {
    slug: "measure-liberation",
    title: "Measure Liberation",
    summary:
      "Prove that the atlas is reducing retrieval tax and dependence on heroic operators.",
    intro:
      "Measure outcomes that reflect operational clarity: less escalation, faster answers, cleaner handoffs.",
    actions: [
      {
        title: "Track interruption volume",
        description:
          "Monitor how often founders or key operators are interrupted for routine retrieval.",
      },
      {
        title: "Track time-to-answer",
        description:
          "Measure how quickly team members find procedural answers in the atlas.",
      },
      {
        title: "Track handoff reliability",
        description:
          "Measure whether action ownership and system context reduce dropped work.",
      },
    ],
  },
]

export const methodBySlug = new Map(methodSections.map((section) => [section.slug, section]))

export const methodPath = (slug: string) => `/method/${slug}`
