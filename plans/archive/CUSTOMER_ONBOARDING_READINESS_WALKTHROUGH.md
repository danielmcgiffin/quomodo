# Customer Onboarding Readiness Walkthrough (V1)

This doc operationalizes the open V1 blockers in:

- `plans/V1_CHECKLIST.md` (Customer Onboarding Readiness section)
- `plans/LAUNCH_PLAN.md` (`LP-065` through `LP-069`)

## LP-065: Production Domain + Auth Callback Alignment

Acceptance reference: `plans/LAUNCH_PLAN.md` (`LP-065`).

1. Confirm Cloudflare custom domain `systemscraft.co` is attached to the production worker and serving HTTPS.
2. Confirm `WebsiteBaseUrl` matches canonical domain in `src/config.ts`.
   - Current value: `https://systemscraft.co`
3. In Supabase Auth URL settings, ensure allowlist includes:
   - `https://systemscraft.co/auth/callback`
   - `https://systemscraft.co/auth/callback?*`
   - local dev callback entries (for example `http://localhost:5173/auth/callback`).
4. Validate signup/login redirect flow from production domain:
   - user lands via `/auth/callback`
   - then reaches `/app/processes`

Check off `LP-065` only after all four steps are verified.

## LP-066: Stripe Catalog + Pricing Mapping Hardening

Acceptance reference: `plans/LAUNCH_PLAN.md` (`LP-066`).

1. Replace demo/test plan copy and placeholders in:
   - `src/routes/(marketing)/pricing/pricing_plans.ts`
2. Remove starter/demo pricing FAQ text in:
   - `src/routes/(marketing)/pricing/+page.svelte`
3. Confirm each paid plan has valid live values:
   - `stripe_price_id`
   - `stripe_product_id`
4. Validate mapping logic remains correct:
   - `src/routes/(admin)/account/subscription_helpers.server.ts`
   - active Stripe subscription product must map to an app plan.
5. Stripe Billing Portal launch safety:
   - customer email editing disabled
   - plan-change path verified
6. Verify checkout + billing portal return URLs resolve to canonical production domain paths.

Check off `LP-066` only after all six steps pass.

## LP-067: Production Email Deliverability + Branding

Acceptance reference: `plans/LAUNCH_PLAN.md` (`LP-067`).

1. Configure Supabase Auth SMTP for production-domain auth emails.
2. Configure Resend with verified sending domain and production sender identity.
3. Ensure Cloudflare secrets exist in production and preview:
   - `PRIVATE_RESEND_API_KEY`
   - `PRIVATE_ADMIN_EMAIL`
   - `PRIVATE_FROM_ADMIN_EMAIL`
4. Remove starter sender/template defaults from app flows:
   - `src/routes/(admin)/account/api/+page.server.ts`
   - replace `no-reply@saasstarter.work`
   - replace `"SaaS Starter"` template company value
5. Update secret sync automation to include email secrets:
   - `scripts/cloudflare-sync-secrets.sh`
6. Send and verify a real welcome/admin email from production-equivalent environment.

Check off `LP-067` only after all six steps pass.

## LP-068: First-Customer Onboarding Runbook + Validation

Acceptance reference: `plans/LAUNCH_PLAN.md` (`LP-068`).

1. Create one runbook doc that covers the complete external user path:
   - sign up
   - verify email
   - create profile
   - land in `/app/processes`
   - create first role/system/process/action
   - run search
   - file a flag
2. Execute the runbook once on production (or production-equivalent preview).
3. Record timestamped pass/fail notes for each step.
4. For any failures, include:
   - remediation owner
   - retest step and result

Check off `LP-068` only when documentation and one full validation run are complete.

## LP-069: Multi-User Workspace Provisioning Path

Acceptance reference: `plans/LAUNCH_PLAN.md` (`LP-069`).

1. Define a tested provisioning path to add non-owner users to an existing org and assign:
   - `admin`
   - `editor`
   - `member`
2. If invite UX is deferred, document an operational procedure (including rollback).
3. Run smoke validation with at least one non-owner user:
   - complete core `/app` traversal
   - verify role-appropriate permissions
4. Capture evidence of role policy behavior against expected RBAC outcomes.

Check off `LP-069` only when provisioning procedure and non-owner validation are both complete.

## Required Closeout Updates

Per repo instructions in `AGENTS.md`, whenever scope/progress changes:

1. Update `plans/V1_CHECKLIST.md` checkbox status for each completed LP.
2. Update `plans/LAUNCH_PLAN.md` with completion status, date, and verification evidence.
