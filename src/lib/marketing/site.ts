export type NavItem = { label: string; href: string };
export type CTA = { label: string; href: string };

export type FeatureItem = { title: string; desc: string; icon: string };
export type StepItem = { n: string; title: string; desc: string };
export type FaqItem = { q: string; a: string };

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  desc: string;
  perks: string[];
  cta: CTA;
  featured: boolean;
  badge?: string;
  stripe_price_id?: string | null;
  stripe_product_id?: string | null;
};

export const marketingSite = {
  brand: "SystemsCraft",
  tagline: "Your Operational Atlas",
  defaultPlanId: "free",

  nav: [
    { label: "Home", href: "/" },
    { label: "Method", href: "/method" },
    { label: "Partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
  ] satisfies NavItem[],

  primaryCta: {
    label: "Start Free",
    href: "/login/sign_up",
  } satisfies CTA,

  secondaryCta: {
    label: "Book Intro Call",
    href: "https://cal.com/danny-cursus/15min",
  } satisfies CTA,

  // ───────────────────────────────────────────
  // HERO
  // ───────────────────────────────────────────
  hero: {
    eyebrow: "No more documentation theater",
    kicker: "Your Operational Atlas",
    headline: "No more",
    title: "Map once. Use everywhere.",
    subtitle:
      "SystemsCraft maps who does what, in which system, as a connected graph — so your team finds answers instead of asking you.",
    audience:
      "Built for founders and operators who are tired of being the human router for process questions.",
  },

  // ───────────────────────────────────────────
  // DEMO
  // ───────────────────────────────────────────
  demo: {
    gifSrc: "/images/example-home.png", // Using existing image
    alt: "SystemsCraft showing connected processes, roles, and systems.",
  },

  // ───────────────────────────────────────────
  // "FOR YOU" — the emotional hook
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
  // FEATURES / PILLARS
  // ───────────────────────────────────────────
  features: {
    eyebrow: "Why SystemsCraft",
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
        id: "free",
        name: "Free",
        price: "$0",
        desc: "One workspace to map your first operational atlas.",
        perks: [
          "1 workspace",
          "Core atlas functions (roles, systems, processes, actions, flags)",
          "Single user",
        ],
        cta: { label: "Get started", href: "/login/sign_up" },
        featured: false,
        stripe_price_id: null,
        stripe_product_id: null,
      },
      {
        id: "starter",
        name: "Starter",
        badge: "Great for getting started",
        price: "$49",
        desc: "For small teams getting their ops out of heads and into links.",
        perks: [
          "Up to 10 employees",
          "Maintenance alerts",
          "Email support",
        ],
        cta: { label: "Get started", href: "/login/sign_up" },
        featured: false,
        stripe_price_id: "price_1T0MQHLeepTzGf1NbD28pMhu",
        stripe_product_id: "prod_TyJ2z0btpQXugh",
      },
      {
        id: "growth",
        name: "Growth",
        price: "$99",
        desc: "For teams starting to feel the coordination tax.",
        perks: [
          "10–25 employees",
          "Unlimited viewers",
          "Unlimited editors",
          "Priority support",
        ],
        cta: { label: "Start Growth", href: "/login/sign_up" },
        featured: true,
        stripe_price_id: "price_1T0MS3LeepTzGf1NDO7Pl11a",
        stripe_product_id: "prod_TyJ4L2QxWhOsPg",
      },
      {
        id: "scale",
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
        cta: { label: "Start Scale", href: "/login/sign_up" },
        featured: false,
      },
    ],
  },

  // ───────────────────────────────────────────
  // FAQ
  // ───────────────────────────────────────────
  faq: {
    eyebrow: "FAQ",
    headline: "Answers, without the runaround",
    subhead: "Less hunting, less asking, fewer dropped balls.",
    items: [
      {
        q: "How is this different from Notion / Confluence / a wiki?",
        a: "Wikis store pages. SystemsCraft stores relationships — roles, processes, and systems linked into a single graph. Change a role's responsibilities and every connected process updates. That's not something a wiki can do, because a wiki doesn't know what's connected to what.",
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

  footerLinks: [
    { label: "Method", href: "/method" },
    { label: "Partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
    { label: "Product", href: "/app/processes" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ] satisfies NavItem[],

  footer: {
    tagline: "Your Operational Atlas",
    copyrightName: "SystemsCraft",
  } as const,
}
