export type NavItem = { label: string; href: string };
export type CTA = { label: string; href: string };

export type FeatureItem = { title: string; desc: string; icon: string };
export type StepItem = { n: string; title: string; desc: string };
export type FaqItem = { q: string; a: string };

export type PricingPlan = {
  name: string;
  price: string;
  desc: string;
  perks: string[];
  cta: CTA;
  featured: boolean;
  badge?: string;
};

export const site = {
  brand: "Quaestor",

  nav: [
    { label: "Home", href: "/" },
    { label: "Method", href: "/method" },
    { label: "Blog", href: "https://blog.cursus.tools" },
    { label: "Demo", href: "https://qstr.cursus.tools/demo/process" },
    { label: "Partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
  ] satisfies NavItem[],

  navCta: {
    label: "Book a call",
    href: "https://cal.com/danny-cursus/15min",
  } satisfies CTA,

  // ───────────────────────────────────────────
  // HERO
  // ───────────────────────────────────────────
  hero: {
    kicker: "Your Operational Atlas",
    headline: "No more",
    subhead:
      "Quaestor maps who does what, in which system, as a connected graph — so your team finds answers instead of asking you.",
    primaryCta: {
      label: "See it in action",
      href: "https://qstr.cursus.tools",
    },
    secondaryCta: { label: "Read the method", href: "/method" },
  } satisfies {
    kicker: string;
    headline: string;
    subhead: string;
    primaryCta: CTA;
    secondaryCta: CTA;
  },

  // ───────────────────────────────────────────
  // DEMO
  // ───────────────────────────────────────────
  demo: {
    gifSrc: "/role-details.png",
    posterSrc: "/demo-poster.jpg",
    alt: "Quaestor showing connected processes, roles, and systems.",
  },

  // ───────────────────────────────────────────
  // "FOR YOU" — the emotional hook
  // Dual-ICP: owner reads their own pain,
  // consultant reads every client they've inherited
  // ───────────────────────────────────────────
  forYou: {
    eyebrow: "You Know the Feeling",
    headline: "This is how it breaks",
    bullets: [
      "The process lives in someone's head and three Slack threads from 2022.",
      "The SOP exists. It's in a folder somewhere. Nobody's opened it since it was written.",
      "Every question routes to the same person because they're the only one who knows how it actually works.",
      "A key person leaves and three months of context walks out the door with them.",
    ],
    punchline:
      "The problem isn't missing documentation — it's that nothing is connected to anything.",
  } satisfies {
    eyebrow: string;
    headline: string;
    bullets: string[];
    punchline: string;
  },

  // ───────────────────────────────────────────
  // HOW IT WORKS
  // ───────────────────────────────────────────
  howItWorks: {
    eyebrow: "How It Works",
    headline: "Map it once. Keep it alive.",
    subhead:
      "Start with the workflow that hurts the most. Let the structure grow from there.",
    steps: [
      {
        n: "01",
        title: "Start with the bottleneck",
        desc: "Pick the workflow that generates the most interruptions. Map the roles, steps, and systems involved.",
      },
      {
        n: "02",
        title: "Connect everything",
        desc: "Link ownership to steps, steps to systems. The shape of operations becomes visible.",
      },
      {
        n: "03",
        title: "Ship it to the team",
        desc: "Publish the map. Your team searches, finds, and stops asking you. Answers in three clicks.",
      },
      {
        n: "04",
        title: "Keep it honest",
        desc: "Stale steps get flagged. Owners get nudged. The map stays current because the system won't let it rot.",
      },
    ],
  } satisfies {
    eyebrow: string;
    headline: string;
    subhead: string;
    steps: StepItem[];
  },

  // ───────────────────────────────────────────
  // SIDE-BY-SIDE CARDS
  // ───────────────────────────────────────────
  howItWorksSide: {
    cards: [
      {
        title: "What you get",
        items: [
          { k: "Roles", v: "who owns what" },
          { k: "Processes", v: "what happens, step by step" },
          { k: "Systems", v: "where the work lives" },
          { k: "Links", v: "answers in 3 clicks" },
        ],
      },
      {
        title: "What it replaces",
        items: [
          { k: "Wikis", v: "page sprawl nobody reads" },
          { k: "Folders", v: "lost context, stale docs" },
          { k: "Slack", v: "load-bearing threads" },
          { k: "Your head", v: "the real single point of failure" },
        ],
      },
    ],
  },

  // ───────────────────────────────────────────
  // IMPLEMENTATION CALLOUT
  // ───────────────────────────────────────────
  implementationCallout: {
    headline: "Is the idea of setting up a new system giving you a headache already?",
    text: "Most teams get their first bottleneck mapped in a single sitting. If you'd rather have us do it with you, we offer implementation sessions to get your atlas built and your team trained.",
    cta: { label: "Book a call", href: "https://cal.com/danny-cursus/15min" },
  },

  // ───────────────────────────────────────────
  // FEATURES
  // ───────────────────────────────────────────
  features: {
    eyebrow: "Why Quaestor",
    headline: "A map beats a folder. Ownership beats guessing.",
    subhead:
      "Everything connects. Everything has an owner. Everything stays current.",
    items: [
      {
        title: "Onboarding in days, not weeks",
        desc: "Generate role-specific guides from the graph. New hires find answers without finding you.",
        icon: "rocket",
      },
      {
        title: "Clean handoffs",
        desc: "Every handoff point is explicit and owned. No more mystery meat between teams.",
        icon: "refresh-cw",
      },
      {
        title: "The vacation test",
        desc: "When the map is real, the owner can leave for a week without everything falling apart.",
        icon: "palmtree",
      },
      {
        title: "Stale steps get flagged",
        desc: "Ownership is explicit. When a linked system changes, affected steps surface before they hurt.",
        icon: "bell-ring",
      },
      {
        title: "Dynamic outputs",
        desc: "Onboarding guides, role charters, process playbooks — assembled from the graph, not written by hand.",
        icon: "users",
      },
      {
        title: "Deploys across engagements",
        desc: "Same framework, different businesses. The operating model works whether it's one company or ten.",
        icon: "trending-up",
      },
    ],
  } satisfies {
    eyebrow: string;
    headline: string;
    subhead: string;
    items: FeatureItem[];
  },

  // ───────────────────────────────────────────
  // PRICING
  // ───────────────────────────────────────────
  pricing: {
    eyebrow: "Pricing",
    headline: "Simple pricing that scales with you",
    subhead: "Pick your company size. Upgrade when you grow.",
    plans: [
      {
        name: "Starter",
        badge: "Great for getting started",
        price: "$49",
        desc: "For small teams getting their ops out of heads and into links.",
        perks: [
          "Up to 10 employees",
          "Maintenance alerts",
          "Email support",
        ],
        cta: { label: "Get started", href: "https://qstr.cursus.tools" },
        featured: false,
      },
      {
        name: "Growth",
        price: "$99",
        desc: "For teams starting to feel the coordination tax.",
        perks: [
          "10–25 employees",
          "Unlimited viewers",
          "Unlimited editors",
          "Priority support",
        ],
        cta: { label: "Start Growth", href: "https://qstr.cursus.tools" },
        featured: true,
      },
      {
        name: "Scale",
        price: "$299",
        desc: "For multi-team workflows and real cross-department handoffs.",
        perks: [
          "26–100 employees",
          "Unlimited editors",
          "Advanced alerts",
          "Implementation guidance",
        ],
        badge: "Most popular",
        cta: { label: "Start Scale", href: "https://qstr.cursus.tools" },
        featured: false,
      },
      {
        name: "Enterprise",
        price: "Custom",
        desc: "For larger companies, or teams withing larger companies, reach out and let's find a price that makes sense.",
        perks: [
          "Custom-configured workspaces",
          "Dedicated onboarding",
          "Priority support",
        ],
        cta: {
          label: "Talk to us",
          href: "https://cal.com/danny-cursus/15min",
        },
        featured: false,
      },
    ],
  },

  // ───────────────────────────────────────────
  // FAQ — dual-ICP, objection-resolving
  // ───────────────────────────────────────────
  faq: {
    eyebrow: "FAQ",
    headline: "Answers, without the runaround",
    subhead: "Less hunting, less asking, fewer dropped balls.",
    items: [
      {
        q: "How is this different from Notion / Confluence / a wiki?",
        a: "Wikis store pages. Quaestor stores relationships — roles, processes, and systems linked into a single graph. Change a role's responsibilities and every connected process updates. That's not something a wiki can do, because a wiki doesn't know what's connected to what.",
      },
      {
        q: "How long does setup take?",
        a: "Most teams map their first bottleneck workflow in a single sitting. From there, the map grows organically — each new workflow connects to what's already there. You're not building a documentation library from scratch; you're growing a network one link at a time.",
      },
      {
        q: "What if I already have SOPs and docs?",
        a: "Good — that's raw material, not wasted effort. Import the roles, steps, and systems from what you've already built. The docs become references linked from the map, not duplicated inside it. The map replaces the scavenger hunt, not the documents.",
      },
      {
        q: "Is this just another tool I have to maintain?",
        a: "Every workflow has a named owner and a review date. Stale steps get flagged automatically when linked systems change. The maintenance isn't extra work on top of operations — it's built into how the business already runs.",
      },
      {
        q: "Who is this for?",
        a: "Teams where operational knowledge is stuck in one person's head — and anyone helping those teams get unstuck. Whether you're the founder who can't take a week off or the operator building the systems so they can, the map is the same.",
      },
      {
        q: "Can I use this across multiple clients?",
        a: "Yes. The operating model — roles, processes, systems — works the same way regardless of industry or size. If you run ops engagements for multiple businesses, each client gets their own map built on the same framework.",
      },
    ],
  } satisfies {
    eyebrow: string;
    headline: string;
    subhead: string;
    items: FaqItem[];
  },

  // ───────────────────────────────────────────
  // FOOTER
  // ───────────────────────────────────────────
  footer: {
    tagline: "Your Operational Atlas",
    copyrightName: "Quaestor",
  } as const,
} as const;
