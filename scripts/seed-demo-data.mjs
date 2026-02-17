/**
 * seed-demo-data.mjs
 *
 * Fleshes out the "SystemsCraft Demo Org" with realistic data for live demos.
 * Idempotent — uses slug-based dedup so it can be safely rerun.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-demo-data.mjs
 *
 * Env vars required:
 *   PUBLIC_SUPABASE_URL
 *   PRIVATE_SUPABASE_SERVICE_ROLE
 *
 * Optional:
 *   DEMO_ORG_NAME  (default: "SystemsCraft Demo Org")
 *   DEMO_ORG_ID    (target a specific org by ID — skips name lookup)
 */

import { createClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const requireEnv = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env: ${name}`)
  return value
}

const supabase = createClient(
  requireEnv("PUBLIC_SUPABASE_URL"),
  requireEnv("PRIVATE_SUPABASE_SERVICE_ROLE"),
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const slugify = (v) =>
  String(v)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

/** ProseMirror doc with a single paragraph. */
const p = (text) => ({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text }] },
  ],
})

/** ProseMirror doc with multiple paragraphs. */
const pp = (...texts) => ({
  type: "doc",
  content: texts.map((t) => ({
    type: "paragraph",
    content: [{ type: "text", text: t }],
  })),
})

/** ProseMirror doc with a paragraph + bullet list. */
const pBullets = (intro, items) => ({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: intro }] },
    {
      type: "bulletList",
      content: items.map((item) => ({
        type: "listItem",
        content: [
          { type: "paragraph", content: [{ type: "text", text: item }] },
        ],
      })),
    },
  ],
})

// ---------------------------------------------------------------------------
// Data definitions
// ---------------------------------------------------------------------------

const ROLES = [
  {
    slug: "founder",
    name: "Founder",
    desc: p("Sets company direction, owns escalation paths, and makes final calls on strategy and hiring."),
  },
  {
    slug: "ops-manager",
    name: "Ops Manager",
    desc: pp(
      "Maintains process quality and execution reliability across the company.",
      "Responsible for tooling decisions, vendor management, and internal SLA tracking.",
    ),
  },
  {
    slug: "client-success",
    name: "Client Success Lead",
    desc: pp(
      "Owns the post-sale relationship from onboarding through renewal.",
      "Primary point of contact for customer health, expansion opportunities, and churn prevention.",
    ),
  },
  {
    slug: "sales-lead",
    name: "Sales Lead",
    desc: pp(
      "Manages inbound and outbound pipeline from qualification through close.",
      "Owns revenue targets, deal forecasting, and CRM hygiene.",
    ),
  },
  {
    slug: "marketing-lead",
    name: "Marketing Lead",
    desc: pBullets("Owns demand generation, brand, and content strategy.", [
      "Manages website, blog, and SEO",
      "Runs paid campaigns and tracks CAC",
      "Produces case studies and sales collateral",
    ]),
  },
  {
    slug: "engineering-lead",
    name: "Engineering Lead",
    desc: pp(
      "Leads product development, architecture decisions, and release management.",
      "Partners with Product on roadmap prioritization and manages the engineering team's capacity.",
    ),
  },
  {
    slug: "finance-admin",
    name: "Finance & Admin",
    desc: pBullets("Handles billing, contracts, compliance, and corporate admin.", [
      "Invoicing and accounts receivable",
      "Payroll and benefits administration",
      "Contract review and vendor payments",
      "Tax filings and financial reporting",
    ]),
  },
  {
    slug: "support-specialist",
    name: "Support Specialist",
    desc: p("First-line customer support — triages tickets, resolves common issues, and escalates bugs to engineering."),
  },
]

const SYSTEMS = [
  {
    slug: "hubspot",
    name: "HubSpot",
    desc: pp(
      "Primary CRM and sales pipeline tracking.",
      "Used for contact management, deal stages, email sequences, and reporting dashboards.",
    ),
    location: "https://app.hubspot.com",
    ownerSlug: "sales-lead",
  },
  {
    slug: "google-drive",
    name: "Google Drive",
    desc: pp(
      "Shared file storage and collaboration.",
      "Houses SOPs, client folders, templates, and internal documentation. Organized by department with shared drives.",
    ),
    location: "https://drive.google.com",
    ownerSlug: "ops-manager",
  },
  {
    slug: "zoom",
    name: "Zoom",
    desc: p("Video conferencing for client calls, team standups, and all-hands meetings."),
    location: "https://zoom.us",
    ownerSlug: "ops-manager",
  },
  {
    slug: "slack",
    name: "Slack",
    desc: pBullets("Internal communication hub and integration notification center.", [
      "#general — company announcements",
      "#sales — deal updates and pipeline discussions",
      "#engineering — technical discussions and deploy notifications",
      "#support — customer issue triage and escalation",
    ]),
    location: "https://slack.com",
    ownerSlug: "ops-manager",
  },
  {
    slug: "stripe",
    name: "Stripe",
    desc: pp(
      "Payment processing, subscription management, and billing infrastructure.",
      "Handles plan upgrades/downgrades, invoicing, failed payment retries, and revenue reporting.",
    ),
    location: "https://dashboard.stripe.com",
    ownerSlug: "finance-admin",
  },
  {
    slug: "linear",
    name: "Linear",
    desc: pp(
      "Engineering project management and issue tracking.",
      "Organized into cycles with bug, feature, and improvement issue types. Integrates with GitHub for PR tracking.",
    ),
    location: "https://linear.app",
    ownerSlug: "engineering-lead",
  },
  {
    slug: "notion",
    name: "Notion",
    desc: pBullets("Internal wiki, SOPs, and knowledge base.", [
      "Company handbook and policies",
      "Meeting notes and decision logs",
      "Product specs and design docs",
      "Onboarding checklists for new hires",
    ]),
    location: "https://notion.so",
    ownerSlug: "ops-manager",
  },
]

const PROCESSES = [
  // --- Existing (will be upserted with richer data) ---
  {
    slug: "client-onboarding",
    name: "Client Onboarding",
    desc: pp(
      "Moves signed clients from contract to first value delivery with clean handoffs between sales and success.",
      "Target: complete within 5 business days of contract signing.",
    ),
    trigger: "Contract signed in HubSpot",
    endState: "Client has logged in, completed setup, and had kickoff call",
    ownerSlug: "client-success",
    actions: [
      { seq: 1, desc: p("Create client workspace folder from template."), roleSlug: "ops-manager", systemSlug: "google-drive" },
      { seq: 2, desc: p("Move deal to 'Closed Won' and create onboarding task in HubSpot."), roleSlug: "sales-lead", systemSlug: "hubspot" },
      { seq: 3, desc: p("Send welcome email with login credentials and getting-started guide."), roleSlug: "client-success", systemSlug: "hubspot" },
      { seq: 4, desc: p("Schedule and run kickoff call — introduce team, walk through setup."), roleSlug: "client-success", systemSlug: "zoom" },
      { seq: 5, desc: p("Post handoff summary in #sales with key contacts and notes."), roleSlug: "client-success", systemSlug: "slack" },
    ],
  },
  {
    slug: "weekly-ops-review",
    name: "Weekly Ops Review",
    desc: p("Monday ritual to review open work, unblock teams, and assign next actions for the week."),
    trigger: "Monday 9:00 AM",
    endState: "All open items have an owner and a due date",
    ownerSlug: "ops-manager",
    actions: [
      { seq: 1, desc: p("Pull open flags report and unresolved items list."), roleSlug: "ops-manager", systemSlug: "notion" },
      { seq: 2, desc: p("Review engineering sprint status and blockers."), roleSlug: "engineering-lead", systemSlug: "linear" },
      { seq: 3, desc: p("Review sales pipeline changes and forecast."), roleSlug: "sales-lead", systemSlug: "hubspot" },
      { seq: 4, desc: p("Assign owners and deadlines to all unresolved items."), roleSlug: "ops-manager", systemSlug: "notion" },
      { seq: 5, desc: p("Post weekly summary and action items to #general."), roleSlug: "ops-manager", systemSlug: "slack" },
    ],
  },
  // --- New processes ---
  {
    slug: "inbound-lead-qualification",
    name: "Inbound Lead Qualification",
    desc: pp(
      "Evaluates inbound signups and demo requests to determine fit and intent.",
      "Goal: respond to every qualified lead within 4 business hours.",
    ),
    trigger: "New signup or demo request submitted on website",
    endState: "Lead is qualified (or disqualified) with next step scheduled",
    ownerSlug: "sales-lead",
    actions: [
      { seq: 1, desc: p("Review signup details and enrich contact in HubSpot (company size, industry, role)."), roleSlug: "sales-lead", systemSlug: "hubspot" },
      { seq: 2, desc: p("Score lead against ICP criteria — disqualify if no fit, tag reason."), roleSlug: "sales-lead", systemSlug: "hubspot" },
      { seq: 3, desc: p("Send personalized outreach email or book discovery call."), roleSlug: "sales-lead", systemSlug: "hubspot" },
      { seq: 4, desc: p("Post qualified lead summary in #sales channel."), roleSlug: "sales-lead", systemSlug: "slack" },
    ],
  },
  {
    slug: "deal-closing",
    name: "Deal Closing",
    desc: p("Moves a qualified opportunity from proposal through contract signature and payment setup."),
    trigger: "Prospect agrees to move forward after demo/proposal",
    endState: "Contract signed, payment method on file, and onboarding triggered",
    ownerSlug: "sales-lead",
    actions: [
      { seq: 1, desc: p("Generate proposal document from template and customize pricing."), roleSlug: "sales-lead", systemSlug: "google-drive" },
      { seq: 2, desc: p("Send proposal and handle objections — update deal stage in CRM."), roleSlug: "sales-lead", systemSlug: "hubspot" },
      { seq: 3, desc: p("Create Stripe subscription and send payment link."), roleSlug: "finance-admin", systemSlug: "stripe" },
      { seq: 4, desc: p("Confirm payment received and mark deal as Closed Won."), roleSlug: "sales-lead", systemSlug: "hubspot" },
    ],
  },
  {
    slug: "customer-support-escalation",
    name: "Customer Support Escalation",
    desc: pp(
      "Routes customer-reported issues that cannot be resolved at first line to engineering or success.",
      "SLA: acknowledge within 1 hour, resolution within 24 hours for P1.",
    ),
    trigger: "Support ticket exceeds first-line resolution capability",
    endState: "Issue resolved and customer notified, or workaround provided",
    ownerSlug: "support-specialist",
    actions: [
      { seq: 1, desc: p("Document reproduction steps and attach screenshots in support ticket."), roleSlug: "support-specialist", systemSlug: "hubspot" },
      { seq: 2, desc: p("Create engineering issue with severity tag and link to customer ticket."), roleSlug: "support-specialist", systemSlug: "linear" },
      { seq: 3, desc: p("Post in #support with customer context and urgency level."), roleSlug: "support-specialist", systemSlug: "slack" },
      { seq: 4, desc: p("Engineering triages, fixes, and comments resolution on the issue."), roleSlug: "engineering-lead", systemSlug: "linear" },
      { seq: 5, desc: p("Notify customer of resolution and close support ticket."), roleSlug: "support-specialist", systemSlug: "hubspot" },
    ],
  },
  {
    slug: "monthly-revenue-review",
    name: "Monthly Revenue Review",
    desc: p("End-of-month review of MRR, churn, expansion, and pipeline health with leadership."),
    trigger: "First business day of each month",
    endState: "Revenue dashboard updated, variances explained, and action items assigned",
    ownerSlug: "founder",
    actions: [
      { seq: 1, desc: p("Export Stripe MRR, churn, and expansion data for the month."), roleSlug: "finance-admin", systemSlug: "stripe" },
      { seq: 2, desc: p("Pull pipeline and conversion metrics from CRM."), roleSlug: "sales-lead", systemSlug: "hubspot" },
      { seq: 3, desc: p("Compile revenue dashboard and variance notes in shared doc."), roleSlug: "finance-admin", systemSlug: "google-drive" },
      { seq: 4, desc: p("Run review meeting — discuss trends, risks, and targets."), roleSlug: "founder", systemSlug: "zoom" },
      { seq: 5, desc: p("Post summary and action items to #general."), roleSlug: "ops-manager", systemSlug: "slack" },
    ],
  },
  {
    slug: "feature-request-triage",
    name: "Feature Request Triage",
    desc: pp(
      "Evaluates customer feature requests and routes them into the product roadmap or backlog.",
      "Runs weekly as part of the product sync.",
    ),
    trigger: "New feature request logged by customer success or support",
    endState: "Request is prioritized, scheduled, or declined with reasoning",
    ownerSlug: "engineering-lead",
    actions: [
      { seq: 1, desc: p("Log request with customer context, use case, and revenue impact."), roleSlug: "client-success", systemSlug: "linear" },
      { seq: 2, desc: p("Review against roadmap — check for duplicates and related work."), roleSlug: "engineering-lead", systemSlug: "linear" },
      { seq: 3, desc: p("Prioritize in weekly product sync — accept, defer, or decline."), roleSlug: "engineering-lead", systemSlug: "zoom" },
      { seq: 4, desc: p("Update requesting customer with decision and timeline."), roleSlug: "client-success", systemSlug: "hubspot" },
    ],
  },
  {
    slug: "product-release",
    name: "Product Release",
    desc: pp(
      "Ships a new version to production with proper testing, communication, and rollback readiness.",
      "Cadence: weekly releases on Tuesdays.",
    ),
    trigger: "Release branch is ready and all checks pass",
    endState: "New version live in production, changelog published, team notified",
    ownerSlug: "engineering-lead",
    actions: [
      { seq: 1, desc: p("Run full test suite and verify staging deployment."), roleSlug: "engineering-lead", systemSlug: "linear" },
      { seq: 2, desc: p("Write changelog entry and update release notes doc."), roleSlug: "engineering-lead", systemSlug: "notion" },
      { seq: 3, desc: p("Deploy to production and run smoke tests."), roleSlug: "engineering-lead", systemSlug: "linear" },
      { seq: 4, desc: p("Announce release in #general and #support with key changes."), roleSlug: "ops-manager", systemSlug: "slack" },
    ],
  },
  {
    slug: "new-employee-onboarding",
    name: "New Employee Onboarding",
    desc: pBullets("Gets a new hire from offer acceptance to fully productive team member.", [
      "Day 1: accounts, tools, and orientation",
      "Week 1: team introductions and first tasks",
      "Month 1: full ramp with buddy check-ins",
    ]),
    trigger: "Offer accepted and start date confirmed",
    endState: "New hire has access to all tools, completed orientation, and shipped first contribution",
    ownerSlug: "ops-manager",
    actions: [
      { seq: 1, desc: p("Create accounts: Google Workspace, Slack, Linear, Notion, and app access."), roleSlug: "ops-manager", systemSlug: "notion" },
      { seq: 2, desc: p("Send welcome packet with handbook link and Day 1 agenda."), roleSlug: "ops-manager", systemSlug: "slack" },
      { seq: 3, desc: p("Run orientation session — company overview, values, and team intros."), roleSlug: "founder", systemSlug: "zoom" },
      { seq: 4, desc: p("Assign onboarding buddy and first-week tasks."), roleSlug: "ops-manager", systemSlug: "linear" },
    ],
  },
  {
    slug: "customer-renewal",
    name: "Customer Renewal",
    desc: pp(
      "Proactive renewal management starting 60 days before contract expiry.",
      "Goal: 95%+ gross revenue retention.",
    ),
    trigger: "60 days before contract renewal date",
    endState: "Customer renewed (or churn documented with post-mortem)",
    ownerSlug: "client-success",
    actions: [
      { seq: 1, desc: p("Review account health: usage metrics, support tickets, NPS score."), roleSlug: "client-success", systemSlug: "hubspot" },
      { seq: 2, desc: p("Schedule renewal check-in call with primary contact."), roleSlug: "client-success", systemSlug: "zoom" },
      { seq: 3, desc: p("Present renewal terms — handle objections, discuss expansion."), roleSlug: "client-success", systemSlug: "zoom" },
      { seq: 4, desc: p("Process renewal payment or flag at-risk account for founder review."), roleSlug: "finance-admin", systemSlug: "stripe" },
      { seq: 5, desc: p("Update CRM with renewal outcome and next review date."), roleSlug: "client-success", systemSlug: "hubspot" },
    ],
  },
]

const FLAGS = [
  // Open flags
  { targetType: "process", targetSlug: "client-onboarding", flagType: "stale", message: "Onboarding checklist hasn't been reviewed since January — several steps may be outdated.", status: "open" },
  { targetType: "system", targetSlug: "hubspot", flagType: "needs_review", message: "Deal stages were reconfigured last month. Verify all processes reference the correct stage names.", status: "open" },
  { targetType: "role", targetSlug: "support-specialist", flagType: "question", message: "Should support specialists have direct access to Stripe for refund processing, or should that stay with Finance?", status: "open" },
  { targetType: "process", targetSlug: "feature-request-triage", flagType: "comment", message: "Consider adding a step for notifying the marketing team when a frequently-requested feature ships.", status: "open" },
  { targetType: "system", targetSlug: "notion", flagType: "stale", message: "Several SOPs in the Operations workspace are still referencing the old onboarding flow.", status: "open" },
  // Resolved flags
  { targetType: "process", targetSlug: "deal-closing", flagType: "incorrect", message: "Step 3 said 'send invoice' but we switched to Stripe payment links in December.", status: "resolved", resolutionNote: "Updated the action to reference Stripe payment links instead of manual invoicing." },
  { targetType: "system", targetSlug: "google-drive", flagType: "needs_review", message: "Client folder template is missing the new compliance checklist section.", status: "resolved", resolutionNote: "Added compliance checklist tab to the client folder template on Feb 5." },
  { targetType: "role", targetSlug: "ops-manager", flagType: "question", message: "Does the Ops Manager own the vendor evaluation process or does that sit with Finance?", status: "resolved", resolutionNote: "Confirmed: Ops Manager owns vendor evaluation, Finance handles contract/payment only." },
  // Dismissed flags
  { targetType: "process", targetSlug: "weekly-ops-review", flagType: "comment", message: "Could we move this to Tuesday mornings instead?", status: "dismissed" },
  { targetType: "system", targetSlug: "slack", flagType: "comment", message: "Should we consolidate #support and #engineering into one channel?", status: "dismissed" },
]

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  const targetOrgId = process.env.DEMO_ORG_ID
  const orgName = process.env.DEMO_ORG_NAME || "SystemsCraft Demo Org"

  let org
  if (targetOrgId) {
    console.log(`Looking for org by ID: ${targetOrgId}`)
    const { data, error } = await supabase
      .from("orgs")
      .select("id, owner_id")
      .eq("id", targetOrgId)
      .single()
    if (error) throw new Error(`Org lookup failed: ${error.message}`)
    org = data
  } else {
    console.log(`Looking for org by name: "${orgName}"`)
    const { data, error } = await supabase
      .from("orgs")
      .select("id, owner_id")
      .eq("name", orgName)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(`Org lookup failed: ${error.message}`)
    org = data
  }

  if (!org) throw new Error(`No org found. Create it first via the app or sc_seed_demo.`)

  const orgId = org.id
  const ownerId = org.owner_id
  console.log(`Found org: ${orgId} (owner: ${ownerId})`)

  // -----------------------------------------------------------------------
  // Upsert roles
  // -----------------------------------------------------------------------
  console.log("\n--- Roles ---")
  const roleMap = {} // slug -> id

  for (const role of ROLES) {
    const { data: existing } = await supabase
      .from("roles")
      .select("id")
      .eq("org_id", orgId)
      .eq("slug", role.slug)
      .maybeSingle()

    if (existing) {
      roleMap[role.slug] = existing.id
      // Update description to richer version
      await supabase
        .from("roles")
        .update({ description_rich: role.desc })
        .eq("id", existing.id)
      console.log(`  updated: ${role.name}`)
    } else {
      const { data: inserted, error } = await supabase
        .from("roles")
        .insert({
          org_id: orgId,
          slug: role.slug,
          name: role.name,
          description_rich: role.desc,
        })
        .select("id")
        .single()

      if (error) throw new Error(`Role insert failed (${role.slug}): ${error.message}`)
      roleMap[role.slug] = inserted.id
      console.log(`  created: ${role.name}`)
    }
  }

  // -----------------------------------------------------------------------
  // Upsert systems
  // -----------------------------------------------------------------------
  console.log("\n--- Systems ---")
  const systemMap = {} // slug -> id

  for (const sys of SYSTEMS) {
    const ownerRoleId = sys.ownerSlug ? roleMap[sys.ownerSlug] : null

    const { data: existing } = await supabase
      .from("systems")
      .select("id")
      .eq("org_id", orgId)
      .eq("slug", sys.slug)
      .maybeSingle()

    if (existing) {
      systemMap[sys.slug] = existing.id
      await supabase
        .from("systems")
        .update({
          description_rich: sys.desc,
          location: sys.location ?? null,
          owner_role_id: ownerRoleId,
        })
        .eq("id", existing.id)
      console.log(`  updated: ${sys.name}`)
    } else {
      const { data: inserted, error } = await supabase
        .from("systems")
        .insert({
          org_id: orgId,
          slug: sys.slug,
          name: sys.name,
          description_rich: sys.desc,
          location: sys.location ?? null,
          owner_role_id: ownerRoleId,
        })
        .select("id")
        .single()

      if (error) throw new Error(`System insert failed (${sys.slug}): ${error.message}`)
      systemMap[sys.slug] = inserted.id
      console.log(`  created: ${sys.name}`)
    }
  }

  // -----------------------------------------------------------------------
  // Upsert processes + actions
  // -----------------------------------------------------------------------
  console.log("\n--- Processes & Actions ---")
  const processMap = {} // slug -> id

  for (const proc of PROCESSES) {
    const ownerRoleId = proc.ownerSlug ? roleMap[proc.ownerSlug] : null

    const { data: existing } = await supabase
      .from("processes")
      .select("id")
      .eq("org_id", orgId)
      .eq("slug", proc.slug)
      .maybeSingle()

    let processId

    if (existing) {
      processId = existing.id
      await supabase
        .from("processes")
        .update({
          description_rich: proc.desc,
          trigger: proc.trigger,
          end_state: proc.endState,
          owner_role_id: ownerRoleId,
        })
        .eq("id", existing.id)
      console.log(`  updated: ${proc.name}`)
    } else {
      const { data: inserted, error } = await supabase
        .from("processes")
        .insert({
          org_id: orgId,
          slug: proc.slug,
          name: proc.name,
          description_rich: proc.desc,
          trigger: proc.trigger,
          end_state: proc.endState,
          owner_role_id: ownerRoleId,
        })
        .select("id")
        .single()

      if (error) throw new Error(`Process insert failed (${proc.slug}): ${error.message}`)
      processId = inserted.id
      console.log(`  created: ${proc.name}`)
    }

    processMap[proc.slug] = processId

    // Delete existing actions and re-insert (simplest way to handle reordering)
    if (proc.actions?.length) {
      await supabase
        .from("actions")
        .delete()
        .eq("org_id", orgId)
        .eq("process_id", processId)

      for (const action of proc.actions) {
        const { error } = await supabase.from("actions").insert({
          org_id: orgId,
          process_id: processId,
          sequence: action.seq,
          description_rich: action.desc,
          owner_role_id: roleMap[action.roleSlug],
          system_id: systemMap[action.systemSlug],
        })

        if (error) throw new Error(`Action insert failed (${proc.slug} #${action.seq}): ${error.message}`)
      }
      console.log(`    ${proc.actions.length} actions`)
    }
  }

  // -----------------------------------------------------------------------
  // Flags — delete existing seed flags and recreate
  // -----------------------------------------------------------------------
  console.log("\n--- Flags ---")

  // Remove all existing flags in the org (seed-managed)
  await supabase.from("flags").delete().eq("org_id", orgId)

  let flagCount = 0
  for (const flag of FLAGS) {
    // Resolve target id from slug
    let targetId
    if (flag.targetType === "role") targetId = roleMap[flag.targetSlug]
    else if (flag.targetType === "system") targetId = systemMap[flag.targetSlug]
    else if (flag.targetType === "process") targetId = processMap[flag.targetSlug]

    if (!targetId) {
      console.log(`  skipped: ${flag.targetType}/${flag.targetSlug} (not found)`)
      continue
    }

    const row = {
      org_id: orgId,
      target_type: flag.targetType,
      target_id: targetId,
      flag_type: flag.flagType,
      message: flag.message,
      created_by: ownerId,
      status: flag.status,
    }

    if (flag.status === "resolved") {
      row.resolved_by = ownerId
      row.resolved_at = new Date().toISOString()
      row.resolution_note = flag.resolutionNote ?? null
    }

    const { error } = await supabase.from("flags").insert(row)
    if (error) throw new Error(`Flag insert failed: ${error.message}`)
    flagCount++
  }
  console.log(`  ${flagCount} flags created (${FLAGS.filter((f) => f.status === "open").length} open, ${FLAGS.filter((f) => f.status === "resolved").length} resolved, ${FLAGS.filter((f) => f.status === "dismissed").length} dismissed)`)

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  const counts = await Promise.all([
    supabase.from("roles").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("systems").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("processes").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("actions").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase.from("flags").select("id", { count: "exact", head: true }).eq("org_id", orgId),
  ])

  console.log("\n=== Demo org seeded ===")
  console.log(`Org: ${orgName} (${orgId})`)
  console.log(`Roles:     ${counts[0].count}`)
  console.log(`Systems:   ${counts[1].count}`)
  console.log(`Processes: ${counts[2].count}`)
  console.log(`Actions:   ${counts[3].count}`)
  console.log(`Flags:     ${counts[4].count}`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
