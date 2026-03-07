# SR Work Ownership Guide (Junior vs Advanced)

Date: 2026-02-14  
Context: remaining SR items referenced in `plans/MASTER_PLAN.md` and `plans/archive/SALES_READINESS_PLAN.md`, plus the open SR item in `plans/archive/V1_CHECKLIST.md`.

This doc is a practical split of what a junior dev can own end-to-end vs what should be owned (or at least heavily reviewed) by an experienced dev.

Definitions used here:

- “Junior can own” means: can implement safely with normal code review, using existing patterns in this repo, without needing deep architecture or production-ops experience.
- “Needs advanced help” means: cross-cutting changes, production/ops risk, security/PII risk, or broad migration risk where an experienced dev should drive.

## At A Glance

Junior can own (solo)

- SR-17 Terms of Service page (`/terms`)
- SR-18 Privacy Policy page (`/privacy`)
- SR-20 Uptime monitoring setup (no code)
- SR-23 Final quality gates run + baseline comparison write-up
- SR-24 Pricing page content review
- SR-25 Homepage content review

Junior can own (with review/pairing)

- SR-26 Prepare demo workspace (production data + demo reliability)
- SR-27 Flags dashboard layout refresh (UI/state changes; easy to regress interactions)
- SR-22 Data layer test gap-fill (can be brittle if patterns aren’t followed)

Needs advanced ownership

- SR-19 Error reporting (prod behavior, secrets, rate limiting, PII)
- SR-21 Svelte 5 compatibility audit (broad surface area; regression risk)

## Task-by-Task Guidance

### SR-17: Terms of Service page (`/terms`)

Ownership: Junior can own (solo)

- Why: mostly content + a new route using existing marketing shell.
- Primary work: create `src/routes/(marketing)/terms/+page.svelte` and add footer link (likely `src/lib/marketing/site.ts`).
- Verification:
  - `npm run -s check && npm run -s build`
  - Visit `/terms` on desktop + mobile.
  - Confirm it is linked in footer on all marketing pages.
- Ask for help when:
  - You’re unsure what ToS clauses are required for your jurisdiction or business model.

### SR-18: Privacy Policy page (`/privacy`)

Ownership: Junior can own (solo)

- Why: same shape as SR-17.
- Primary work: create `src/routes/(marketing)/privacy/+page.svelte` and add footer link (likely `src/lib/marketing/site.ts`).
- Verification:
  - `npm run -s check && npm run -s build`
  - Visit `/privacy` on desktop + mobile.
  - Confirm it is linked in footer on all marketing pages.
- Ask for help when:
  - You’re unsure how to describe data processing roles (controller vs processor) or retention policy.

### SR-20: Uptime monitoring

Ownership: Junior can own (solo)

- Why: operational setup, no code changes required.
- Primary work: configure an external monitor + alert channel(s) for:
  - `https://systemscraft.co/`
  - `https://systemscraft.co/pricing` (rendering path, not just DNS)
- Verification:
  - Confirm the monitor is checking every 5 minutes.
  - Trigger a test alert if the provider supports it.
- Ask for help when:
  - You need a more meaningful health check endpoint (for example, checking auth or a dependency).

### SR-23: Final quality gates + baseline comparison (EPI-49)

Ownership: Junior can own (solo)

- Why: mostly running commands and recording results.
- Primary work:
  - Run the gates described in `plans/archive/LAUNCH_PLAN.md` / `plans/MASTER_PLAN.md`.
  - Update the metrics table in the plan doc that owns it (per instructions).
- Verification:
  - All gates pass locally and in CI.
- Ask for help when:
  - Failures are non-obvious (flake vs deterministic failure, dependency/tooling issue).

### SR-24: Pricing page content review

Ownership: Junior can own (solo)

- Why: primarily content correctness and marketing polish; limited code risk.
- Primary work:
  - Confirm plan names/prices/features match Stripe and the actual enforcement rules.
  - Files are under `src/routes/(marketing)/pricing/`.
- Verification:
  - Manual: view `/pricing` on desktop + mobile.
  - Confirm CTA paths are correct (do not leak test-only flows).
- Ask for help when:
  - You’re unsure what the product actually enforces (seat limits, lapsed behavior).

### SR-25: Homepage content review

Ownership: Junior can own (solo)

- Why: content/structure polish using existing marketing theme components/styles.
- Primary work:
  - Update `src/routes/(marketing)/+page.svelte` and/or `src/lib/marketing/site.ts` copy to be crisp and accurate.
- Verification:
  - Manual: view `/` on desktop + mobile.
  - Confirm primary CTA flows to the correct destination.
- Ask for help when:
  - You need a new component/layout pattern (avoid inventing new patterns without design direction).

### SR-26: Prepare demo workspace

Ownership: Junior can own (with review/pairing)

- Why: you can do it, but it touches production data and the “demo experience” can easily regress or become inconsistent.
- Primary work:
  - Create a dedicated demo org in prod.
  - Populate realistic roles/systems/processes/actions/flags.
  - Ensure the demo tells a coherent story quickly.
- Verification:
  - Run a timed demo from cold start (new browser session) in under 5 minutes.
  - Verify lapsed/active billing state is what you expect for the demo.
- Ask for help when:
  - You need deterministic seeding, or a “reset demo workspace” flow.

### SR-27: Flags dashboard centered + filterable grid

Ownership: Junior can own (with review/pairing)

- Why: UI/state work that can introduce subtle regressions (filters, moderation actions, layout breakpoints).
- Primary work:
  - Update `/app/flags` layout to match other app pages (centered main column).
  - Add filters (status/type/target type) without breaking “Resolve”/“Dismiss”.
- Verification:
  - Manual: verify filters work and moderation actions still operate.
  - Mobile: verify layout doesn’t break and controls remain reachable.
  - Automated: add or update Playwright coverage if it exists for flags.
- Ask for help when:
  - You need to change server mappers/query shape, or you see performance issues.

### SR-22: Data layer test coverage (EPI-48)

Ownership: Junior can own (with review)

- Why: tests are easy to write poorly (brittle snapshots, over-mocking) without experience.
- Primary work:
  - Add unit tests for untested mappers/helpers not already covered by SR-08 through SR-14.
- Verification:
  - `npm run -s test_run` passes locally and in CI.
  - Tests cover behavior, not implementation details.
- Ask for help when:
  - You’re not sure what the “public contract” of a helper is, or mocking gets messy.

### SR-19: Error reporting

Ownership: Needs advanced ownership

- Why: production-facing behavior, secrets/config, rate limiting, avoiding PII leaks, avoiding alert storms.
- Risks:
  - Spamming admin email/Slack with unbounded errors.
  - Leaking user/session/DB details into alerts.
  - Breaking error handling paths under load.
- Junior-friendly way to contribute:
  - Wire up basic instrumentation in non-prod first.
  - Add tests around rate limiting and redaction logic once the approach is chosen.

### SR-21: Svelte 5 compatibility audit (EPI-47)

Ownership: Needs advanced ownership

- Why: likely touches many components and Svelte semantics; regressions can be subtle (props/events/slots, hydration).
- Junior-friendly way to contribute:
  - Run `npm run -s check`, collect warnings, and create a ranked list of files/components producing warnings.
  - Fix small, isolated warnings behind an experienced review.
