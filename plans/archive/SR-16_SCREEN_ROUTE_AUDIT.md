# SR-16 Screen + Route Audit (Document Only)

Date: 2026-02-14  
Build: `ac35de4`  
Scope: all 40 `+page.svelte` routes under `src/routes` plus global error page `src/routes/+error.svelte`.

This document lists broken behavior, blockers, and visual/UX grossness. It intentionally does not fix anything. Each item is written so a junior dev can implement the fix.

## How This Was Tested

- Local prod build + preview: `npm run -s build` then `npm run -s preview` (served at `http://localhost:4173`).
- Seeded demo data via `scripts/seed-e2e.mjs` (creates demo org and example triad data; no secrets should be added to this doc).
- Automated crawl of all 40 routes at:
  - Desktop: `1440x900`
  - Mobile: `375x812`
- Evidence artifacts:
  - `/tmp/sr16-audit/audit.json`
  - `/tmp/sr16-audit/desktop/*.png`
  - `/tmp/sr16-audit/mobile/*.png`

Notes:

- Account routes were redirected to `/account/create_profile` until profile fields are set (see `src/routes/(admin)/account/+layout.ts`).
- Dynamic routes were tested with these sample paths:
  - `/method/[slug]` -> `/method/diagnose-the-break`
  - `/app/processes/[slug]` -> `/app/processes/client-onboarding`
  - `/app/roles/[slug]` -> `/app/roles/client-success`
  - `/app/systems/[slug]` -> `/app/systems/google-drive`
  - `/invite/[token]` -> `/invite/invalid-token` (invalid-token state only)
  - `/transfer/[token]` -> `/transfer/invalid-token` (invalid-token state only)

## Executive Summary

P0

- **Hydration failure on `/app/systems`** due to invalid nested anchors (likely breaks client-side interactivity and is console-noisy).

P1

- **Roles directory `/app/roles` doesn’t show role names** (cards are basically anonymous).
- **Role detail `/app/roles/[slug]` has an empty “Role Details” card** (looks broken/unfinished).
- **Account surface is heavily “starter template”** (DaisyUI purple buttons/cards, demo placeholder content, inconsistent styling inside the app shell).
- **Delete account message string interpolation bug** (shows literal `{...}` text to users).

P2

- **Flags dashboard layout** wastes screen space (blank right gutter) and duplicates headings.
- **Team page** shows raw UUIDs as member identity and repeats them (unusable in real teams).
- **Legacy starter routes** (`/blog`, `/search`, `/contact_us`) are unbranded and contain sample/placeholder content; blog post pages have severe contrast/readability problems.
- **Global error page** is unbranded and echoes error message to the user.

P3

- Minor console noise on auth pages (“Autofocus processing was blocked…”).
- Minor HTML/UX polish issues (links wrapping buttons, grammar, etc.).

## Route Coverage (40)

Each route below is verified to load (HTTP 200 in the crawl), but “Loads” does not mean “good”.

Marketing (SystemsCraft themed)

- `/` (`src/routes/(marketing)/+page.svelte`)  
  Screens: `root.png`  
  Notes: visually OK; large vertical spacing on desktop may be intentional.
- `/method` (`src/routes/(marketing)/method/+page.svelte`)  
  Screens: `method.png`  
  Notes: looks consistent with marketing theme.
- `/method/[slug]` (`src/routes/(marketing)/method/[slug]/+page.svelte`)  
  Screens: `method_slug_.png`  
  Notes: looks consistent with marketing theme.
- `/partners` (`src/routes/(marketing)/partners/+page.svelte`)  
  Screens: `partners.png`
- `/contact` (`src/routes/(marketing)/contact/+page.svelte`)  
  Screens: `contact.png`
- `/login` (`src/routes/(marketing)/login/+page.svelte`)  
  Screens: `login.png`  
  Issues: SR16-012
- `/login/sign_in` (`src/routes/(marketing)/login/sign_in/+page.svelte`)  
  Screens: `login_sign_in.png`  
  Issues: SR16-011
- `/login/sign_up` (`src/routes/(marketing)/login/sign_up/+page.svelte`)  
  Screens: `login_sign_up.png`  
  Issues: SR16-011
- `/login/forgot_password` (`src/routes/(marketing)/login/forgot_password/+page.svelte`)  
  Screens: `login_forgot_password.png`  
  Issues: SR16-011
- `/login/current_password_error` (`src/routes/(marketing)/login/current_password_error/+page.svelte`)  
  Screens: `login_current_password_error.png`  
  Notes: copy/grammar polish recommended (SR16-013).
- `/invite/[token]` (`src/routes/(marketing)/invite/[token]/+page.svelte`)  
  Screens: `invite_token_.png`  
  Notes: only invalid-token state tested (valid flow requires a real invite token).
- `/transfer/[token]` (`src/routes/(marketing)/transfer/[token]/+page.svelte`)  
  Screens: `transfer_token_.png`  
  Notes: only invalid-token state tested (valid flow requires a real transfer token).

Legacy starter / unbranded (needs decision: rebrand or remove)

- `/pricing` (`src/routes/(marketing)/pricing/+page.svelte`)  
  Screens: `pricing.png`  
  Issues: SR16-009
- `/search` (`src/routes/(marketing)/search/+page.svelte`)  
  Screens: `search.png`  
  Issues: SR16-009
- `/contact_us` (`src/routes/(marketing)/contact_us/+page.svelte`)  
  Screens: `contact_us.png`  
  Issues: SR16-009
- `/blog` (`src/routes/(marketing)/blog/+page.svelte`)  
  Screens: `blog.png`  
  Issues: SR16-009
- `/blog/how_we_built_our_41kb_saas_website` (`src/routes/(marketing)/blog/(posts)/how_we_built_our_41kb_saas_website/+page.svelte`)  
  Screens: `blog_how_we_built_our_41kb_saas_website.png`  
  Issues: SR16-009
- `/blog/example_blog_post` (`src/routes/(marketing)/blog/(posts)/example_blog_post/+page.svelte`)  
  Screens: `blog_example_blog_post.png`  
  Issues: SR16-009
- `/blog/awesome_post` (`src/routes/(marketing)/blog/(posts)/awesome_post/+page.svelte`)  
  Screens: `blog_awesome_post.png`  
  Issues: SR16-009

App (SystemsCraft app shell)

- `/app/processes` (`src/routes/app/processes/+page.svelte`)  
  Screens: `app_processes.png`  
  Notes: visually OK in crawl; verify CRUD flows manually.
- `/app/processes/[slug]` (`src/routes/app/processes/[slug]/+page.svelte`)  
  Screens: `app_processes_slug_.png`
- `/app/roles` (`src/routes/app/roles/+page.svelte`)  
  Screens: `app_roles.png`  
  Issues: SR16-003
- `/app/roles/[slug]` (`src/routes/app/roles/[slug]/+page.svelte`)  
  Screens: `app_roles_slug_.png`  
  Issues: SR16-004
- `/app/systems` (`src/routes/app/systems/+page.svelte`)  
  Screens: `app_systems.png`  
  Issues: SR16-001
- `/app/systems/[slug]` (`src/routes/app/systems/[slug]/+page.svelte`)  
  Screens: `app_systems_slug_.png`
- `/app/flags` (`src/routes/app/flags/+page.svelte`)  
  Screens: `app_flags.png`  
  Issues: SR16-005
- `/app/workspace` (`src/routes/app/workspace/+page.svelte`)  
  Screens: `app_workspace.png`
- `/app/team` (`src/routes/app/team/+page.svelte`)  
  Screens: `app_team.png`  
  Issues: SR16-006

Account (inside app shell, but starter-template UI)

- `/account/create_profile` (`src/routes/(admin)/account/create_profile/+page.svelte`)  
  Screens: `account_create_profile.png`  
  Issues: SR16-007
- `/account` (`src/routes/(admin)/account/(menu)/+page.svelte`)  
  Screens: `account.png`  
  Issues: SR16-007 (also note redirect behavior)
- `/account/select_plan` (`src/routes/(admin)/account/select_plan/+page.svelte`)  
  Screens: `account_select_plan.png`  
  Issues: SR16-007 (also note redirect behavior)
- `/account/billing` (`src/routes/(admin)/account/(menu)/billing/+page.svelte`)  
  Screens: `account_billing.png`  
  Issues: SR16-007 (also note redirect behavior)
- `/account/settings` (`src/routes/(admin)/account/(menu)/settings/+page.svelte`)  
  Screens: `account_settings.png`  
  Issues: SR16-007 (also note redirect behavior)
- `/account/settings/edit_profile` (`src/routes/(admin)/account/(menu)/settings/edit_profile/+page.svelte`)  
  Screens: `account_settings_edit_profile.png`  
  Issues: SR16-007 (also note redirect behavior)
- `/account/settings/change_email` (`src/routes/(admin)/account/(menu)/settings/change_email/+page.svelte`)  
  Screens: `account_settings_change_email.png`  
  Issues: SR16-007 (also note redirect behavior)
- `/account/settings/change_email_subscription` (`src/routes/(admin)/account/(menu)/settings/change_email_subscription/+page.svelte`)  
  Screens: `account_settings_change_email_subscription.png`  
  Issues: SR16-007 (also note redirect behavior)
- `/account/settings/change_password` (`src/routes/(admin)/account/(menu)/settings/change_password/+page.svelte`)  
  Screens: `account_settings_change_password.png`  
  Issues: SR16-007 (also note redirect behavior)
- `/account/settings/reset_password` (`src/routes/(admin)/account/(menu)/settings/reset_password/+page.svelte`)  
  Screens: `account_settings_reset_password.png`  
  Issues: SR16-007 (also note redirect behavior)
- `/account/settings/delete_account` (`src/routes/(admin)/account/(menu)/settings/delete_account/+page.svelte`)  
  Screens: `account_settings_delete_account.png`  
  Issues: SR16-007 + SR16-008 (also note redirect behavior)
- `/account/sign_out` (`src/routes/(admin)/account/sign_out/+page.svelte`)  
  Screens: `account_sign_out.png`  
  Notes: crawl redirects to `/login` (expected).

System

- Global error page (`src/routes/+error.svelte`)  
  Issues: SR16-010

## Issues (Fixable Work Items)

### SR16-001: `/app/systems` Hydration Failure (Nested Anchors)

Severity: P0 (fix first)  
Routes: `/app/systems`

Repro

1. Open `/app/systems`.
2. Open browser console.
3. Observe warning: `Failed to hydrate: HierarchyRequestError...` (also recorded in `/tmp/sr16-audit/audit.json` under `consoleMessages` for `/app/systems`).

Expected

- No hydration warnings.
- Valid HTML structure (no nested `<a>`).

Actual

- The systems directory card is an `<a>` that contains `SystemPortal` and `RolePortal`, which each render their own `<a>`, producing invalid nested anchors.

Likely cause (code)

- Outer link wrapper:
  - `src/routes/app/systems/+page.svelte:224` to `src/routes/app/systems/+page.svelte:242`
- Inner link components:
  - `src/lib/components/SystemPortal.svelte:25`
  - `src/lib/components/RolePortal.svelte:26`

Fix outline

1. Pick the intended interaction model:
   - Option A: entire card navigates, portals become non-links.
   - Option B: portals navigate, card is not a link (title-only link like processes list).
2. Implement by removing the nested-anchor pattern:
   - Easiest: remove the outer `<a ... class="block">` and use an internal link just for the system name.
   - Or add a prop to `SystemPortal`/`RolePortal` to render as `<span>` (no link) when used inside a clickable parent.
3. Verify:
   - Reload `/app/systems` and confirm the hydration warning is gone.
   - Clickability works as intended (card vs portals).

### SR16-002: Mobile App Nav Hides Current Section + Wastes Vertical Space

Severity: P1  
Routes: all `/app/*` and `/account/*` routes (app shell)

Symptoms (mobile `<= 960px`)

- Sidebar becomes a horizontal scroll row. It does not ensure the active link is scrolled into view.
- On the Systems screen, the “Systems” nav item can be off-screen; the user sees “Flags / Processes / Roles” and may not realize the nav is horizontally scrollable.
- Brand pill becomes a large white capsule containing only the logo, consuming meaningful vertical space.

Likely cause (code)

- Horizontal scroll conversion:
  - `src/app.css:396` to `src/app.css:436` (`@media (max-width: 960px)`)
- Brand-pill label hidden:
  - `src/app.css:411` to `src/app.css:413`
- Shell markup:
  - `src/lib/components/ScShell.svelte:109` to `src/lib/components/ScShell.svelte:151`

Fix outline

1. Ensure active nav item is visible on load/navigation:
   - Add a small client-side effect in `src/lib/components/ScShell.svelte` to `element.scrollIntoView({ block: \"nearest\", inline: \"nearest\" })` for the active `.sc-side-link.is-active`.
2. Improve mobile nav layout to avoid hidden sections:
   - Alternative: change nav to wrap to multiple lines (no horizontal scroll).
   - Alternative: turn the nav into a 2x2 grid for the 4 primary sections.
3. Reduce brand pill height on mobile:
   - Reduce padding/min-height or swap to a compact brand mark without the large white capsule.

### SR16-003: Roles Directory Cards Don’t Show Role Names

Severity: P1  
Routes: `/app/roles`

Repro

1. Open `/app/roles`.
2. Observe the list cards show only the description content. The role name is not rendered anywhere inside the card.

Expected

- Each role card shows at least:
  - Role name (primary)
  - Optional short description (secondary)

Actual

- Role name is only present in `aria-label`; visually the cards are anonymous descriptions.

Likely cause (code)

- `src/routes/app/roles/+page.svelte:128` to `src/routes/app/roles/+page.svelte:152`
  - The link content only renders `RichText html={role.descriptionHtml}`.

Fix outline

1. Add a title row inside the card link:
   - Render `{role.name}` (and optionally initials) above the description.
2. Keep description as secondary text (muted) to match processes directory hierarchy.
3. Verify on mobile and desktop that cards are scannable and distinguishable.

### SR16-004: Role Detail “Role Details” Section is an Empty Card

Severity: P1  
Routes: `/app/roles/[slug]`

Repro

1. Open any role detail page (example: `/app/roles/client-success`).
2. Find “Role Details” section.

Expected

- “Role Details” should contain actual content (even minimal), like:
  - Role portal identity (name/initials)
  - Description
  - Reporting line (“reports to”)
  - Ownership summary counts (processes/actions/systems)

Actual

- The card renders only `InlineEntityFlagControl`, leaving a blank-looking card beneath the section title.

Likely cause (code)

- `src/routes/app/roles/[slug]/+page.svelte:106` to `src/routes/app/roles/[slug]/+page.svelte:122`

Fix outline

1. Either:
   - Remove the section entirely (if `RoleDetailHeader` already covers “details”), or
   - Populate it with real role metadata so the section title makes sense.
2. Keep `InlineEntityFlagControl` as an affordance, but not the only visible content.

### SR16-005: Flags Dashboard Layout Wastes Space + Duplicates Headings

Severity: P2  
Routes: `/app/flags`

Repro

1. Open `/app/flags` on desktop.
2. Observe:
   - Large empty right gutter (layout implies a sidebar that isn’t present).
   - Page title “Flags” plus another “Flags” section title inside the create form.

Expected

- Single, centered content column, or a real second column.
- One “Flags” title hierarchy.

Actual

- Uses `.sc-process-layout` (two columns) with only the main column, leaving unused space.
- Duplicate headings.

Likely cause (code)

- Page layout uses `.sc-process-layout` without an `<aside>`:
  - `src/routes/app/flags/+page.svelte:22` to `src/routes/app/flags/+page.svelte:38`
- Duplicate section title:
  - `src/lib/components/FlagsCreateForm.svelte:21` to `src/lib/components/FlagsCreateForm.svelte:33`

Fix outline

1. Change `/app/flags` layout to a single-column page pattern (like `src/routes/app/team/+page.svelte` uses `.sc-page`).
2. Decide where the page title lives (page head vs create form) and remove the duplicate.
3. Note: there is already a planned item `SR-27` for flags dashboard centering and grid layout (see `plans/archive/V1_CHECKLIST.md`).

### SR16-006: Team Page Member Identity UI Shows UUIDs (Not Usable)

Severity: P2 (could become P1 for real teams)  
Routes: `/app/team`

Repro

1. Open `/app/team`.
2. In “Members”, note `displayName` may be a UUID, and `userId` is printed directly under it.

Expected

- Primary identity: full name or email.
- Secondary: role/status badges.
- Internal IDs should be hidden by default (or behind a “copy” affordance).

Actual

- Member rows can show a UUID as the name and repeat it as a secondary line.

Likely cause (code)

- UI always prints both `displayName` and `userId`:
  - `src/routes/app/team/+page.svelte:329` to `src/routes/app/team/+page.svelte:336`

Fix outline

1. Update the mapper/server to provide a sane `displayName` fallback:
   - Prefer `profiles.full_name`, then `users.email`, else a shortened ID.
2. In UI, remove the unconditional `{member.userId}` line or move it behind a “copy ID” interaction.
3. Verify with:
   - A member with full profile
   - A member without profile (invite acceptance edge case)

### SR16-007: Account Area is Starter-Template UI Inside the App Shell

Severity: P1  
Routes: `/account/*` (all account pages)

Symptoms

- `/account/create_profile` uses DaisyUI `btn btn-primary` (purple) inside the SystemsCraft app shell (green/beige). It feels like a different product.
- `/account` (Dashboard) contains explicit placeholder/demo content and fake stats.
- Many settings modules likely inherit DaisyUI cards, alerts, and buttons rather than `sc-*` components/styles.
- Most `/account/*` routes are blocked by profile completion gating, which makes it easy to miss problems.

Likely cause (code)

- Profile gating redirects almost all account routes until full profile is present:
  - `src/routes/(admin)/account/+layout.ts:47` to `src/routes/(admin)/account/+layout.ts:57`
- DaisyUI theme is still globally defined (purple primary). Any usage of DaisyUI classes like `btn btn-primary` will pull from this theme and clash with SystemsCraft app styles:
  - `src/app.css:5` to `src/app.css:55`
- Create profile uses DaisyUI classes:
  - `src/routes/(admin)/account/create_profile/+page.svelte:58` to `src/routes/(admin)/account/create_profile/+page.svelte:143`
- Account dashboard is explicitly placeholder:
  - `src/routes/(admin)/account/(menu)/+page.svelte:6` to `src/routes/(admin)/account/(menu)/+page.svelte:31`

Fix outline

1. Decide the visual system for account pages:
   - Recommended: re-skin account UI to match SystemsCraft app (`sc-*` components), since it’s inside `ScShell`.
2. Remove placeholder “Demo Content” and fake stats from `/account`.
3. Update create-profile and settings forms to use `sc-field`, `sc-btn`, `sc-card`, and the existing app patterns.
4. For testing, ensure you can reach `/account/*`:
   - Complete `profiles.full_name`, `profiles.company_name`, `profiles.website` for your user (via UI or DB).

### SR16-008: Delete Account Screen Shows Literal Interpolation String

Severity: P1  
Routes: `/account/settings/delete_account`

Repro

1. Ensure profile gating is satisfied (see SR16-007).
2. Open `/account/settings/delete_account`.
3. Observe the “message” text includes literal braces/quotes instead of the user email.

Expected

- Message interpolates the actual email value.

Actual

- The message prop is a multi-line string with `'{data.session?.user?.email}'` inside it, so the user will see that literal text.

Likely cause (code)

- `src/routes/(admin)/account/(menu)/settings/delete_account/+page.svelte:13` to `src/routes/(admin)/account/(menu)/settings/delete_account/+page.svelte:19`

Fix outline

1. Convert the `message="..."` to an expression prop:
   - `message={\`Deleting... You are currently logged in as '${data.session?.user?.email ?? \"\"}'\`}`
2. Verify the email displays correctly and the string doesn’t wrap awkwardly on mobile.

### SR16-009: Legacy Starter Routes Are Unbranded + Contain Placeholder Content

Severity: P2 (P1 for blog readability)  
Routes: `/blog/*`, `/search`, `/contact_us`, `/pricing`

Symptoms

- Blog branding and copy are clearly starter-template:
  - “SaaS Starter Blog”, “A demo blog with sample content.”
- Blog post pages are unreadable due to low contrast (default `prose` colors on dark `mk-shell` background).
- External references to `criticalmoments.io` appear in blog post content.
- `/contact_us` includes an unprofessional aside and emoji.
- `/search` and `/pricing` use DaisyUI theme colors (purple/pink) that clash with the SystemsCraft marketing theme.

Likely cause (code)

- Blog name:
  - `src/routes/(marketing)/blog/posts.ts:1` to `src/routes/(marketing)/blog/posts.ts:4`
- Blog index template UI:
  - `src/routes/(marketing)/blog/+page.svelte:11` to `src/routes/(marketing)/blog/+page.svelte:47`
- Blog post layout missing `prose-invert` (dark background):
  - `src/routes/(marketing)/blog/(posts)/+layout.svelte:68`
  - Marketing shell background is dark:
    - `src/app.css:1392` to `src/app.css:1408`
- Contact us aside:
  - `src/routes/(marketing)/contact_us/+page.svelte:90` to `src/routes/(marketing)/contact_us/+page.svelte:95`
- Search route is explicitly marked legacy and uses DaisyUI classes:
  - `src/routes/(marketing)/search/+page.svelte:2` and `src/routes/(marketing)/search/+page.svelte:95` onward
- Pricing route is explicitly marked legacy and uses DaisyUI structures:
  - `src/routes/(marketing)/pricing/+page.svelte:2` onward

Fix outline

1. Make a decision per route:
   - Remove/redirect (simplest) OR rebrand and restyle to SystemsCraft theme.
2. If keeping blog posts:
   - Add `prose-invert` (or explicit typography colors) so text is readable on `mk-shell` dark background.
   - Replace sample content and external links.
3. If keeping search/pricing/contact_us:
   - Convert styling to `mk-*` marketing components, or wrap DaisyUI blocks in a light “card” container that matches marketing theme.
4. Remove any “demo” language and template leftovers.

### SR16-010: Global Error Page is Unbranded and Echoes Error Message

Severity: P2  
Routes: global error (`src/routes/+error.svelte`)

Symptoms

- Copy: “This is embarrassing…” (not in SystemsCraft voice).
- Displays raw error message to the user (`{$page?.error?.message}`), which can leak internal details.
- Uses DaisyUI `btn btn-primary` styling inconsistent with marketing/app.

Likely cause (code)

- `src/routes/+error.svelte:6` to `src/routes/+error.svelte:13`

Fix outline

1. Replace with SystemsCraft-branded error UI.
2. Do not render raw error message in production UI:
   - Show a generic message and a support/contact link.
   - Log the detailed error server-side (or in console only for dev).

### SR16-011: Auth Pages Emit “Autofocus Processing Was Blocked” Console Noise

Severity: P3  
Routes: `/login/sign_in`, `/login/sign_up`, `/login/forgot_password`

Repro

1. Open any of the routes above.
2. Observe console info: “Autofocus processing was blocked because a document already has a focused element.”

Likely cause

- Multiple focus attempts (likely within `@supabase/auth-ui-svelte`) plus app shell / browser default focus.

Fix outline

1. Ensure only one element is set to autofocus or programmatic focus.
2. If this originates in the Supabase auth component and is harmless, consider suppressing by removing competing focus behavior on the page/layout.

### SR16-012: `/login` Uses Link-Wrapped Buttons (Semantics/Accessibility)

Severity: P3  
Routes: `/login`

Symptoms

- `<a><button ...></button></a>` nesting is not ideal HTML semantics and can confuse screen readers.

Likely cause (code)

- `src/routes/(marketing)/login/+page.svelte:9` to `src/routes/(marketing)/login/+page.svelte:18`

Fix outline

1. Use `<a class="mk-btn ...">Sign Up</a>` instead of wrapping a `<button>` inside a link.
2. Repeat for “Sign In”.

### SR16-013: Minor Copy/Polish Issues (Non-Blocking)

Severity: P3  
Routes: various

Examples

- Grammar on password error page:
  - “You attempted edit your account…” should be “You attempted to edit your account…”
  - `src/routes/(marketing)/login/current_password_error/+page.svelte:9` to `src/routes/(marketing)/login/current_password_error/+page.svelte:12`

Fix outline

1. Clean up copy where it reads like template text.
