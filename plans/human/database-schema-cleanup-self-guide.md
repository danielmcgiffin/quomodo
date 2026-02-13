# Database Schema Cleanup (Do-It-Yourself Guide)

This guide covers your requested changes:

1. Merge `systems.location` + `systems.url` into one field
2. Make `processes.trigger` and `processes.end_state` mandatory
3. Remove `roles.person_name` and `roles.hours_per_week`

## 1) Create a new migration

Create:

- `supabase/migrations/20260213_schema_cleanup_fields.sql`

Paste this SQL:

```sql
begin;

-- 1) systems: merge location + url into one field
-- Keep `location` as canonical. If both exist, prefer URL if present.
update public.systems
set location = coalesce(nullif(trim(url), ''), nullif(trim(location), ''))
where coalesce(nullif(trim(location), ''), nullif(trim(url), '')) is not null;

alter table public.systems
  drop column if exists url;

-- Optional: enforce non-blank if you want this required
-- alter table public.systems
--   add constraint systems_location_not_blank check (char_length(trim(location)) > 0);

-- 2) processes: make trigger + end_state required
-- First clean existing null/blank rows (replace TBD with your preferred default)
update public.processes
set trigger = 'TBD'
where trigger is null or char_length(trim(trigger)) = 0;

update public.processes
set end_state = 'TBD'
where end_state is null or char_length(trim(end_state)) = 0;

alter table public.processes
  alter column trigger set not null,
  alter column end_state set not null;

alter table public.processes
  add constraint processes_trigger_not_blank check (char_length(trim(trigger)) > 0),
  add constraint processes_end_state_not_blank check (char_length(trim(end_state)) > 0);

-- 3) roles: remove unwanted columns
alter table public.roles
  drop column if exists person_name,
  drop column if exists hours_per_week;

commit;
```

## 2) Update app code to match the schema

### Roles cleanup

Remove `person_name` and `hours_per_week` from:

- `src/lib/server/app/actions/shared.ts`
- `src/routes/app/roles/+page.server.ts`
- `src/routes/app/roles/[slug]/+page.server.ts`
- `src/lib/server/app/mappers/directory.ts`
- `src/routes/app/roles/+page.svelte`
- `src/routes/app/roles/[slug]/+page.svelte`

### Systems cleanup

Replace `location + url` with one field (`location`) in:

- `src/lib/server/app/actions/shared.ts`
- `src/routes/app/systems/+page.server.ts`
- `src/routes/app/systems/[slug]/+page.server.ts`
- `src/lib/server/app/mappers/directory.ts`
- `src/routes/app/systems/+page.svelte`
- `src/routes/app/systems/[slug]/+page.svelte`
- `src/lib/components/InlineCreateSystemModal.svelte`

### Processes required fields

In these server actions, reject blank `trigger` or `end_state`:

- `src/routes/app/processes/+page.server.ts`
- `src/routes/app/processes/[slug]/+page.server.ts`

## 3) Update seed and smoke scripts

These files still reference fields being removed/merged:

- `supabase/migrations/20260211194500_add_systemscraft_seed_function.sql`
- `scripts/smoke-deployed.mjs`
- `scripts/onboarding-deployed.mjs`

## 4) Regenerate DB typings and verify

Update `src/DatabaseDefinitions.ts` to match the migration.

Then run:

```bash
npm run check
npm run test_run
```

Do a quick manual app pass:

- Create/edit role
- Create/edit system
- Create/edit process

## 5) Keep planning docs aligned (repo rule)

If this scope is completed/changed, update in the same change:

- `plans/V1_CHECKLIST.md`
- `plans/LAUNCH_PLAN.md`
