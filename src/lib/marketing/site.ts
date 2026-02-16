export type NavItem = {
  label: string
  href: string
}

export type CTA = {
  label: string
  href: string
}

export type Feature = {
  title: string
  description: string
}

export const marketingSite = {
  brand: "SystemsCraft",
  tagline: "Operational Atlas for SMB teams",
  nav: [
    { label: "Home", href: "/" },
    { label: "Method", href: "/method" },
    { label: "Partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
  ] satisfies NavItem[],
  primaryCta: {
    label: "Enter App",
    href: "/app/processes",
  } satisfies CTA,
  secondaryCta: {
    label: "Book Intro Call",
    href: "https://cal.com/danny-cursus/15min",
  } satisfies CTA,
  hero: {
    eyebrow: "No more documentation theater",
    title: "Map once. Use everywhere.",
    subtitle:
      "SystemsCraft maps roles, processes, and systems as a connected atlas so teams retrieve answers in context, not from stale folders.",
  },
  pillars: [
    {
      title: "Enter from any angle",
      description:
        "Start from a role, process, system, or flag and get the answer in one interaction.",
    },
    {
      title: "Triad model",
      description:
        "Role-action-system chains make ownership and execution visible at every step.",
    },
    {
      title: "Maintenance by design",
      description:
        "Comments and alerts are flags on the atlas, so rot surfaces where work actually happens.",
    },
  ] satisfies Feature[],
  outcomes: [
    "Shadow Ops become explicit ownership.",
    "Documentation Graveyards become connected portals.",
    "Heroic Operations become repeatable systems.",
  ],
  footerLinks: [
    { label: "Method", href: "/method" },
    { label: "Partners", href: "/partners" },
    { label: "Contact", href: "/contact" },
    { label: "Product", href: "/app/processes" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
  ] satisfies NavItem[],
}
