# Bug Hunt Report

## Findings

1.  **Location/identifier:** `src/routes/(admin)/account/+layout.server.ts:137`, `src/routes/(marketing)/login/+layout.server.ts:10`, consumed in `src/routes/(admin)/account/+layout.ts:29`  
    **Description:** Server load returns `cookies.getAll()` into page data, which can serialize httpOnly auth cookies to client-visible payloads.  
    **Impact level:** Critical  
    **Points awarded:** +10  
    **Adversarial annotation (Pi):** **ACCEPT** — Verified `cookies.getAll()` is serialized to client data; this can expose httpOnly cookies (e.g. `sc_active_workspace`) to client-side JS.  
    **Confidence:** 97%  
    **Risk math:** DISPROVE would be `+10 / -20`; chose ACCEPT.

2.  **Location/identifier:** `supabase/migrations/20240730010101_initial.sql:71-72`  
    **Description:** Storage policy "Anyone can upload an avatar." allows inserts to `storage.objects` for `avatars` bucket without auth/user ownership checks (abuse/cost risk).  
    **Impact level:** Critical  
    **Points awarded:** +10  
    **Adversarial annotation (Pi):** **ACCEPT** — Policy is open insert with only `bucket_id='avatars'`; no auth or ownership checks are present.  
    **Confidence:** 95%  
    **Risk math:** DISPROVE would be `+10 / -20`; chose ACCEPT.

3.  **Location/identifier:** `supabase/migrations/20260211183000_systemscraft_triad_foundation.sql:387-447` (`sc_reorder_action`)  
    **Description:** `security definer` function mutates action ordering but has no auth checks and no explicit revoke/grant hardening shown. Potential RPC privilege bypass.  
    **Impact level:** Critical  
    **Points awarded:** +10  
    **Adversarial annotation (Pi):** **ACCEPT** — `security definer` + no caller auth check + no explicit function grant hardening in migration set = credible privilege escalation surface.  
    **Confidence:** 92%  
    **Risk math:** DISPROVE would be `+10 / -20`; chose ACCEPT.

4.  **Location/identifier:** `supabase/migrations/20260211194500_add_systemscraft_seed_function.sql:6-...` (`sc_seed_demo`)  
    **Description:** `security definer` seed function lacks `auth.uid()` ownership checks and no explicit function privilege lockdown; could be abused to create seeded orgs for arbitrary user IDs.  
    **Impact level:** Critical  
    **Points awarded:** +10  
    **Adversarial annotation (Pi):** **ACCEPT** — Function is `security definer`, takes arbitrary user id input, and migration does not lock down execute privileges.  
    **Confidence:** 94%  
    **Risk math:** DISPROVE would be `+10 / -20`; chose ACCEPT.

5.  **Location/identifier:** `supabase/migrations/20260211183000_systemscraft_triad_foundation.sql:510-514` (`orgs_update_owner_admin` policy)  
    **Description:** Admins can update `orgs` rows broadly, including `owner_id`, enabling ownership reassignment outside transfer flow.  
    **Impact level:** Critical  
    **Points awarded:** +10  
    **Adversarial annotation (Pi):** **ACCEPT** — Policy grants broad `update` to owner/admin with no column restriction; `owner_id` reassignment is possible.  
    **Confidence:** 90%  
    **Risk math:** DISPROVE would be `+10 / -20`; chose ACCEPT.

6.  **Location/identifier:** `supabase/migrations/20260211183000_systemscraft_triad_foundation.sql:324-335` (`sc_is_org_member`)  
    **Description:** Membership helper does not require `accepted_at is not null`; any `org_members` row is treated as active membership.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Helper only checks `(org_id, user_id)` existence; unaccepted rows still satisfy membership checks.  
    **Confidence:** 72%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

7.  **Location/identifier:** `supabase/migrations/20260213104500_add_org_invites.sql:24-26`, `src/routes/app/team/+page.server.ts:309,394`  
    **Description:** Unique “active invite” index ignores expiry (`expires_at`), so expired invites still block reinvite; UI revoke path only permits status `pending`.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Index predicate excludes `expires_at`; expired-but-unrevoked/unaccepted rows still violate uniqueness and cannot be revoked by current flow.  
    **Confidence:** 88%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

8.  **Location/identifier:** `src/routes/(marketing)/invite/[token]/+page.server.ts:180-185`  
    **Description:** Invite acceptance upsert always writes `role: invite.role`; existing members can be unintentionally downgraded (including self-demotion scenarios).  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Upsert on `(org_id,user_id)` unconditionally sets `role` from invite; existing higher-role members can be downgraded.  
    **Confidence:** 87%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

9.  **Location/identifier:** `src/routes/app/team/+page.server.ts:116-123,314`, `supabase/migrations/20260213123000_add_org_ownership_transfers.sql:202`  
    **Description:** Team load fetches pending transfers without expiry filter; cancel RPC only cancels unexpired pending transfers. Expired pending rows can wedge UI state.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Server load can surface expired `pending` row while cancel RPC intentionally ignores expired rows (`expires_at > now()`), causing stale pending UI.  
    **Confidence:** 85%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

10. **Location/identifier:** `src/routes/app/team/+page.server.ts:498-541`  
    **Description:** `removeMember` mutates org membership but skips billing lapsed/read-only enforcement used elsewhere in same file.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — `removeMember` lacks lapsed billing gate present on adjacent mutating actions; inconsistent enforcement likely bypasses read-only posture.  
    **Confidence:** 64%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

11. **Location/identifier:** `src/routes/app/processes/[slug]/+page.server.ts:344-375`  
    **Description:** `updateActionOrder` trusts client-supplied ID list; no strict validation that list is complete/unique/in-process, risking inconsistent sequence state.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Input is split and passed through without validating uniqueness/completeness; malformed lists can produce invalid sequencing behavior.  
    **Confidence:** 78%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

12. **Location/identifier:** `src/lib/server/app/actions/shared.ts:762-806` (`resequenceProcessActions`)  
    **Description:** Two-phase resequence is non-transactional; failure mid-flight can leave staged/high sequence values.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Staging and finalization happen over multiple independent updates; no transaction means partial failure leaves inconsistent sequences.  
    **Confidence:** 93%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

13. **Location/identifier:** `src/routes/app/processes/[slug]/+page.server.ts:103-106`, `src/lib/server/app/actions/shared.ts:668-699`  
    **Description:** Process detail page loads only process-target flags while action-target flags are creatable; action flags can become effectively hidden in that view.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Load query filters `target_type='process'`; action flags are created in same flow but not listed on page.  
    **Confidence:** 85%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

14. **Location/identifier:** `src/lib/server/app/mappers/search.ts:263-267`, migration `20260217000000_add_action_title.sql:43`  
    **Description:** Search mapper overrides stored action titles with synthetic `"Action N in X"` titles, reducing search relevance and hiding authored titles.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Mapper deliberately replaces action row title when route context exists, bypassing authored/stored action titles from `search_all`.  
    **Confidence:** 84%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

15. **Location/identifier:** `src/routes/app/search/+server.ts:109,115,121`  
    **Description:** Raw `%${query}%` `ilike` pattern allows wildcard-heavy input (`%`, `_`) and broad scans; query expansion/DoS risk.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **DISPROVE** — This is parameterized SQL (not injection), scoped by `org_id`, with minimum query length and capped result limits. Wildcards are expected semantics for contains search.  
    **Confidence:** 76%  
    **Risk math:** DISPROVE chosen: `+5 / -10`.

16. **Location/identifier:** `supabase/migrations/20260211183000_systemscraft_triad_foundation.sql` (view at ~242, indexes at ~214-238)  
    **Description:** `search_all` text search uses `ilike` over title/body but no dedicated trigram/full-text indexing visible; likely performance degradation at scale.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **DISPROVE** — This is an unproven scalability concern, not a demonstrated bug/regression. No failing behavior or threshold evidence is provided.  
    **Confidence:** 82%  
    **Risk math:** DISPROVE chosen: `+5 / -10`.

17. **Location/identifier:** `src/lib/mailer.ts:9-27,50-52`, usage `src/routes/app/team/+page.server.ts:422,711,724`  
    **Description:** Email templates use unescaped triple-brace replacement for HTML/text. User-controlled fields (workspace/org names) can inject markup into outbound emails.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Templating performs raw substitution without escaping; user-controlled workspace names can inject markup in HTML emails.  
    **Confidence:** 80%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

18. **Location/identifier:** `src/lib/server/billing.ts:233-245`, callers in `src/routes/app/+layout.server.ts:55` and `src/lib/server/app/actions/wrapAction.ts:56`  
    **Description:** Stripe API failure escalates to 500 for core app load/actions instead of graceful fallback to cached billing snapshot. External outage can take app down.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — On refresh-needed path, Stripe list failure triggers runtime 500; this can impact core app load/action gating when Stripe is unavailable.  
    **Confidence:** 68%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

19. **Location/identifier:** `src/routes/(admin)/account/subscribe/[slug]/+page.server.ts:61-64`  
    **Description:** Price ID is taken directly from URL param (`params.slug`) with no plan whitelist validation.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Route uses `params.slug` as Stripe price id directly. Owner-only access reduces severity, but missing allowlist validation is real.  
    **Confidence:** 73%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

20. **Location/identifier:** `src/routes/app/workspace/+page.server.ts:117-118`  
    **Description:** Creating a new workspace is blocked by current workspace billing state (`assertWorkspaceWritable`), preventing escape hatch to a fresh/free workspace.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **DISPROVE** — Blocking create while in lapsed read-only mode appears consistent with explicit product policy (“workspace is read-only because billing lapsed”), not clearly an implementation defect.  
    **Confidence:** 72%  
    **Risk math:** DISPROVE chosen: `+5 / -10`.

21. **Location/identifier:** `scripts/seed-e2e.mjs:36-37`  
    **Description:** Regex mistakenly escapes whitespace token (`/\\s/`), causing slug normalization anomalies.  
    **Impact level:** Low  
    **Points awarded:** +1  
    **Adversarial annotation (Pi):** **ACCEPT** — Confirmed: `/\\s+/g` in a regex literal matches the two-char sequence `\s`, not whitespace; spaces are removed by previous regex rather than normalized to `-`.  
    **Confidence:** 96%  
    **Risk math:** DISPROVE would be `+1 / -2`; chose ACCEPT.

22. **Location/identifier:** `supabase/migrations/20260213190854_populate_daniel_dev_shop.sql` (empty file)  
    **Description:** Empty migration in sequence suggests missing/aborted migration artifact; can create migration-history confusion.  
    **Impact level:** Low  
    **Points awarded:** +1  
    **Adversarial annotation (Pi):** **DISPROVE** — Empty/no-op migration files are valid artifacts in ordered migration systems; this is process hygiene, not necessarily a software bug.  
    **Confidence:** 95%  
    **Risk math:** DISPROVE chosen: `+1 / -2`.

23. **Location/identifier:** `src/DatabaseDefinitions.ts` actions table section (~402 onward) vs `supabase/migrations/20260217000000_add_action_title.sql:3`  
    **Description:** Generated DB typings are stale (`actions.title` missing), reducing type safety and increasing risk of silent schema drift bugs.  
    **Impact level:** Low  
    **Points awarded:** +1  
    **Adversarial annotation (Pi):** **ACCEPT** — Migration adds `actions.title`; generated typings still omit it. This is clear schema/type drift.  
    **Confidence:** 90%  
    **Risk math:** DISPROVE would be `+1 / -2`; chose ACCEPT.

24. **Location/identifier:** `npm audit --omit=dev --json` (current dependency graph)  
    **Description:** Production dependency advisories present (e.g., Svelte SSR XSS advisories, minimatch ReDoS chain).  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Re-ran audit and advisories are currently present in prod graph (including `svelte` SSR and `minimatch` chain).  
    **Confidence:** 99%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

25. **Location/identifier:** `src/routes/app/team/+page.server.ts:189-195`  
    **Description:** N+1 auth admin lookups (`getUserById` per user) in team load path can cause avoidable latency/rate-limit pressure at larger team sizes.  
    **Impact level:** Medium  
    **Points awarded:** +5  
    **Adversarial annotation (Pi):** **ACCEPT** — Team load does per-id admin lookup in `Promise.all`; this is still N+1 and can become expensive at scale.  
    **Confidence:** 70%  
    **Risk math:** DISPROVE would be `+5 / -10`; chose ACCEPT.

---

## Total Score

**138 points**

---

## Adversarial Review Summary (Pi)

- **Disproved:** 4 (`#15`, `#16`, `#20`, `#22`)
- **Accepted as real:** 21
- **Adversarial score from this pass:** **+16**
