export type MethodItem = {
  id: string;
  title: string;
  desc: string;
};

export type MethodGroup = {
  title?: string;
  items: MethodItem[];
};

export type MethodContentSection = {
  slug: string;
  title: string;
  summary: string;
  intro: string;
  groups: MethodGroup[];
};

export const methodContent: MethodContentSection[] = [
  {
    slug: "diagnosis",
    title: "Why Most Ops Documentation Fails",
    summary:
      "The patterns that kill every documentation effort — and why yours probably already has died.",
    intro:
      "You've seen this before. Maybe you built it yourself, maybe you inherited it. Either way, the result is the same: documentation that looked great on day one and became a liability (or got forgotten) by month three. We've found there are four primary failure modes. We've designed Quaestor to eliminate all of them.",
    groups: [
      {
        items: [
          {
            id: "theater",
            title: "Documentation theater",
            desc: "Long SOPs that look professional in the binder and are abandoned within a month. Everyone's built these. Nobody uses them. The effort goes into the writing, the screenshots, the layout... not the maintaining. And the business leaves the docs behind before the printer ink is dry.",
          },
          {
            id: "duplicates",
            title: "Duplicate systems of record",
            desc: "Copies of copies of copies. The same process described in a Google Doc, a wiki page, and an email thread (and none of them are current). Multiple versions of SOPs is the same as having no SOP. Instead of streamlining the work, we're slowing down to answer questions about what right looks like while the docs just add confusion.",
          },
          {
            id: "unowned",
            title: "Unowned actions, systems, or roles",
            desc: "When writing SOPs, people often veer into using passive voice or stating that 'this will be done' without pinning the rose on a person or a role. These functions that exist on paper but have no clear owner become a drag as everyone is trying to decide whether the action is to them or not. Further, when something breaks, everyone points at someone else and it's very hard to get to the root cause. When something changes, nobody's owning the updates to the map. Accountability isn't optional in business, it's load-bearing.", 
          },
          {
            id: "graveyard",
            title: "The documentation graveyard",
            desc: "Wikis nobody reads. SOPs layered on SOPs from reorgs in ages past. A SharePoint that answers questions nobody's asking anymore. The saddest part: someone, or many someones, spent real time and money building all of it. The why behing no one using could be one of any number of reasons, and in combination. But the fact that the investment was made and the rewards were not gained is painful.",
          },
        ],
      },
    ],
  },
  {
    slug: "model",
    title: "The Operating Model",
    summary:
      "Three primitives. Infinite connections. One source of truth.",
    intro:
      "Every business operation — no matter the industry, no matter the size — reduces to three elements and the relationships between them. Quaestor maps these relationships into a living graph so the picture of how work works is always current, always connected, and always queryable in the simplest, most frictionless way possible.",
    groups: [
      {
        items: [
          {
            id: "primitives",
            title: "Three primitives: Roles, Processes, Systems",
            desc: "Who does what, where. Every action in your business has one accountable role who does it, they have the standard to which the action needs doing, and they have the system (or place) where they do that action. This isn't an over-simplification or abstraction. It's the atomic structure of operations. A person does an action in a place, everything else is detail.",
          },
          {
            id: "connections",
            title: "Everything connected, nothing duplicated",
            desc: "Each element links to every other element it touches. Change a role's responsibilities and every affected process updates. Change a system, and the system is updated across your whole org's process documentation. Realign a role, refine a process, change an activity or a resource, and never worry about what other documents you have to update because you made that one. One change, one place, zero drift.",
          },
          {
            id: "source-of-truth",
            title: "The map is the source of truth",
            desc: "In Quaestor, we've created a framework to organize your operations in a way that helps management see the big picture, and helps your team find exactly what they need at the point of need. It's not another copy of your docs. It's a live graph that connects your systems of record, your people, and your work. Quaestor doesn't replace your tools. It was built specifically as the connective tissue that brings together all the information you need to do your work in they way you actually work, not how you hope it works.",
          },
          {
            id: "outputs",
            title: "Atomic knowledge, dynamic outputs",
            desc: "Something awesome happens when you're capturing knowledge once at the smallest useful level. It allows all these little pieces of knowledge to be assembled into whatever format you need. Instead of writing, saving, and maintaing things like onboarding guides, role manuals, or system desktop guides, you can generate them as needed and it will automatically pull from the latest information in your system. Docs on demand — assembled from the graph, not written by hand. Write it once, use it everywhere.",
          },
        ],
      },
    ],
  },
  {
    slug: "method",
    title: "How to Map Your Operations",
    summary: "Four steps. Start where it hurts. Ship before it's perfect.",
    intro:
      "This isn't a six-month implementation. Start with the workflow that costs the most time, map it in a sitting, and let the structure grow from there. The method works whether you're mapping your own business or deploying it across multiple client engagements.",
    groups: [
      {
        items: [
          {
            id: "bottleneck",
            title: "Start with the bottleneck",
            desc: "Find the workflow that generates the most interruptions — the process where the owner gets pulled in every time. Map that first. It proves immediate value, sets the pattern for everything else, and builds the momentum to keep going.",
          },
          {
            id: "interfaces",
            title: "Define the handoffs",
            desc: "Where work passes between people is where operations break down. Make those edges explicit: who hands off to whom, what triggers the handoff, and who owns the next step. Handoffs without owners are just hopes.",
          },
          {
            id: "commands",
            title: "Write steps as commands",
            desc: "Verbs, not paragraphs. Each step should be executable without a meeting and linked to the system where the work actually happens. If a step requires interpretation, it's not a step — it's a suggestion.",
          },
          {
            id: "ship",
            title: "Ship the 80%",
            desc: "A working map you can react to beats a perfect map you never finish. Publish the draft. Let the team push back, fill gaps, and correct what's wrong. The map gets better through use, not through editing in isolation.",
          },
        ],
      },
    ],
  },
  {
    slug: "alive",
    title: "How It Stays Alive",
    summary:
      "Light rhythms and automatic signals that prevent decay.",
    intro:
      "The reason most documentation efforts fail isn't the initial build — it's the first month after. Quaestor builds maintenance into the structure itself: review cadences that are light enough to stick, and automatic signals that surface problems before they become surprises.",
    groups: [
      {
        title: "The Cadence",
        items: [
          {
            id: "weekly",
            title: "Weekly: unblock",
            desc: "Open the map, spot friction, assign ownership, close the loop. Fifteen minutes. No heroics.",
          },
          {
            id: "monthly",
            title: "Monthly: consolidate",
            desc: "Combine duplicate workflows, standardize templates, and cut noise. Keep the map lean enough to trust.",
          },
          {
            id: "quarterly",
            title: "Quarterly: audit",
            desc: "Review the highest-impact workflows against how work actually happened. Update what drifted. Retire what's dead.",
          },
        ],
      },
      {
        title: "The Safety Net",
        items: [
          {
            id: "stale",
            title: "Stale steps surface automatically",
            desc: "When a linked system changes or a review date passes, affected steps get flagged. Nobody has to remember to check — the map tells you what's drifting before it becomes a problem.",
          },
          {
            id: "retire",
            title: "Retire on purpose",
            desc: "Archive obsolete workflows cleanly so new hires don't follow ghosts from two reorgs ago. A clean map is a trustworthy map.",
          },
        ],
      },
    ],
  },
  {
    slug: "signals",
    title: "How You Know It's Working",
    summary:
      "Four metrics that prove the map is reducing friction, not just adding pages.",
    intro:
      "Documentation for its own sake is busywork. These are the signals that tell you whether the map is actually making operations run better — and they're the same metrics you'd use to prove the ROI to anyone who asks.",
    groups: [
      {
        items: [
          {
            id: "time-to-answer",
            title: "Time to answer",
            desc: "How long before someone finds what they need without asking the person who 'just knows.' If this number isn't dropping, the map isn't working.",
          },
          {
            id: "interruptions",
            title: "Interruptions per week",
            desc: "The number of questions routed to a single person — usually the owner. Track it before, track it after. That delta is the ROI.",
          },
          {
            id: "handoff-delay",
            title: "Handoff delay",
            desc: "Time between a request and the next owned action. Every hour of delay is a hour of lost momentum. Shorter is better. Zero is the goal.",
          },
          {
            id: "vacation-test",
            title: "The vacation test",
            desc: "Can the owner leave for a week without everything falling apart? If not, the map isn't done yet. This is the only metric that ultimately matters.",
          },
        ],
      },
      {
        title: "What We Won't Do",
        items: [
          {
            id: "no-theater",
            title: "No documentation theater",
            desc: "We won't help you build long, static docs that look impressive in a deliverable and go stale in a month. Everyone's built those. Never again.",
          },
          {
            id: "no-duplicates",
            title: "No duplicate systems of record",
            desc: "If work happens in a system, the map links to it — it doesn't copy it. One source of truth means one source of truth.",
          },
          {
            id: "no-unowned",
            title: "No unowned workflows",
            desc: "If a process doesn't have an owner, it doesn't get published. Period. Ambiguity is not a feature.",
          },
        ],
      },
    ],
  },
];
