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
