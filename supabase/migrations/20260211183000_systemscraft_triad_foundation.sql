-- SystemsCraft V1 triad data foundation
-- Covers LP-010, LP-011, LP-012, LP-014, and LP-016.

create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'sc_membership_role'
  ) then
    create type public.sc_membership_role as enum (
      'owner',
      'admin',
      'editor',
      'member'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'sc_flag_type'
  ) then
    create type public.sc_flag_type as enum (
      'stale',
      'incorrect',
      'needs_review',
      'question',
      'comment'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'sc_flag_status'
  ) then
    create type public.sc_flag_status as enum (
      'open',
      'resolved',
      'dismissed'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'sc_entity_type'
  ) then
    create type public.sc_entity_type as enum (
      'role',
      'system',
      'process',
      'action'
    );
  end if;
end
$$;

-- Tables ---------------------------------------------------------------------
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(name)) > 0),
  check (char_length(trim(slug)) > 0)
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.sc_membership_role not null default 'member',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  slug text not null,
  name text not null,
  description_rich jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  person_name text,
  hours_per_week numeric(5,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, slug),
  unique (org_id, name),
  check (char_length(trim(name)) > 0),
  check (char_length(trim(slug)) > 0),
  check (hours_per_week is null or hours_per_week >= 0)
);

create table if not exists public.systems (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  slug text not null,
  name text not null,
  description_rich jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  location text,
  url text,
  owner_role_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, slug),
  unique (org_id, name),
  foreign key (org_id, owner_role_id)
    references public.roles(org_id, id)
    on delete set null,
  check (char_length(trim(name)) > 0),
  check (char_length(trim(slug)) > 0)
);

create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  slug text not null,
  name text not null,
  description_rich jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  trigger text,
  end_state text,
  owner_role_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, slug),
  unique (org_id, name),
  foreign key (org_id, owner_role_id)
    references public.roles(org_id, id)
    on delete set null,
  check (char_length(trim(name)) > 0),
  check (char_length(trim(slug)) > 0)
);

create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  process_id uuid not null,
  sequence integer not null,
  description_rich jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  owner_role_id uuid not null,
  system_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id),
  constraint actions_process_sequence_unique
    unique (process_id, sequence)
    deferrable initially immediate,
  foreign key (org_id, process_id)
    references public.processes(org_id, id)
    on delete cascade,
  foreign key (org_id, owner_role_id)
    references public.roles(org_id, id)
    on delete restrict,
  foreign key (org_id, system_id)
    references public.systems(org_id, id)
    on delete restrict,
  check (sequence > 0)
);

create table if not exists public.role_system_access (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  role_id uuid not null,
  system_id uuid not null,
  access_level text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id),
  unique (role_id, system_id),
  foreign key (org_id, role_id)
    references public.roles(org_id, id)
    on delete cascade,
  foreign key (org_id, system_id)
    references public.systems(org_id, id)
    on delete cascade
);

create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  target_type public.sc_entity_type not null,
  target_id uuid not null,
  target_path text,
  flag_type public.sc_flag_type not null,
  message text not null,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  status public.sc_flag_status not null default 'open',
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  resolution_note text,
  check (char_length(trim(message)) > 0),
  check (target_path is null or char_length(trim(target_path)) > 0)
);

-- Indexes --------------------------------------------------------------------
create index if not exists org_members_org_id_idx on public.org_members(org_id);
create index if not exists org_members_user_id_idx on public.org_members(user_id);

create index if not exists roles_org_id_idx on public.roles(org_id);
create index if not exists roles_org_slug_idx on public.roles(org_id, slug);

create index if not exists systems_org_id_idx on public.systems(org_id);
create index if not exists systems_org_slug_idx on public.systems(org_id, slug);
create index if not exists systems_owner_role_idx on public.systems(owner_role_id);

create index if not exists processes_org_id_idx on public.processes(org_id);
create index if not exists processes_org_slug_idx on public.processes(org_id, slug);
create index if not exists processes_owner_role_idx on public.processes(owner_role_id);

create index if not exists actions_org_id_idx on public.actions(org_id);
create index if not exists actions_process_id_idx on public.actions(process_id);
create index if not exists actions_owner_role_idx on public.actions(owner_role_id);
create index if not exists actions_system_idx on public.actions(system_id);

create index if not exists role_system_access_org_idx on public.role_system_access(org_id);

create index if not exists flags_org_status_idx on public.flags(org_id, status);
create index if not exists flags_target_idx on public.flags(target_type, target_id)
  where status = 'open';
create index if not exists flags_target_path_idx on public.flags(target_type, target_id, target_path)
  where status = 'open';

-- Helper view for retrieval/search -------------------------------------------
create or replace view public.search_all
with (security_invoker = true) as
  select
    'role'::text as entity_type,
    r.id,
    r.org_id,
    r.slug,
    r.name as title,
    coalesce(r.description_rich::text, '') as body
  from public.roles r
  union all
  select
    'system'::text as entity_type,
    s.id,
    s.org_id,
    s.slug,
    s.name as title,
    coalesce(s.description_rich::text, '') as body
  from public.systems s
  union all
  select
    'process'::text as entity_type,
    p.id,
    p.org_id,
    p.slug,
    p.name as title,
    coalesce(p.description_rich::text, '') as body
  from public.processes p
  union all
  select
    'action'::text as entity_type,
    a.id,
    a.org_id,
    null::text as slug,
    'Action ' || a.sequence::text as title,
    coalesce(a.description_rich::text, '') as body
  from public.actions a;

-- Utility functions -----------------------------------------------------------
create or replace function public.sc_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sc_add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.org_members (org_id, user_id, role, accepted_at)
  values (new.id, new.owner_id, 'owner', now())
  on conflict (org_id, user_id)
  do update set
    role = 'owner',
    accepted_at = coalesce(public.org_members.accepted_at, now()),
    updated_at = now();

  return new;
end;
$$;

create or replace function public.sc_current_membership_role(p_org_id uuid)
returns public.sc_membership_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.org_members m
  where m.org_id = p_org_id
    and m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.sc_is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members m
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.sc_has_any_role(
  p_org_id uuid,
  p_roles public.sc_membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.sc_current_membership_role(p_org_id) = any(p_roles), false);
$$;

create or replace function public.sc_can_create_flag(
  p_org_id uuid,
  p_flag_type public.sc_flag_type
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_current_role public.sc_membership_role;
begin
  v_current_role := public.sc_current_membership_role(p_org_id);

  if v_current_role is null then
    return false;
  end if;

  if v_current_role = any(
    array[
      'owner'::public.sc_membership_role,
      'admin'::public.sc_membership_role,
      'editor'::public.sc_membership_role
    ]
  ) then
    return true;
  end if;

  return
    (v_current_role = 'member'::public.sc_membership_role)
    and (p_flag_type = 'comment'::public.sc_flag_type);
end;
$$;

create or replace function public.sc_reorder_action(
  p_action_id uuid,
  p_new_sequence integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_process_id uuid;
  v_current_sequence integer;
  v_max_sequence integer;
  v_target_sequence integer;
begin
  if p_new_sequence < 1 then
    raise exception 'Sequence must be >= 1';
  end if;

  select a.process_id, a.sequence
  into v_process_id, v_current_sequence
  from public.actions a
  where a.id = p_action_id;

  if v_process_id is null then
    raise exception 'Action % not found', p_action_id;
  end if;

  select max(a.sequence)
  into v_max_sequence
  from public.actions a
  where a.process_id = v_process_id;

  v_target_sequence := least(p_new_sequence, coalesce(v_max_sequence, p_new_sequence));

  if v_target_sequence = v_current_sequence then
    return;
  end if;

  set constraints actions_process_sequence_unique deferred;

  if v_target_sequence < v_current_sequence then
    update public.actions a
    set sequence = a.sequence + 1
    where a.process_id = v_process_id
      and a.sequence >= v_target_sequence
      and a.sequence < v_current_sequence;
  else
    update public.actions a
    set sequence = a.sequence - 1
    where a.process_id = v_process_id
      and a.sequence <= v_target_sequence
      and a.sequence > v_current_sequence;
  end if;

  update public.actions
  set sequence = v_target_sequence
  where id = p_action_id;
end;
$$;

-- Triggers -------------------------------------------------------------------
drop trigger if exists sc_orgs_add_owner_membership_trigger on public.orgs;
create trigger sc_orgs_add_owner_membership_trigger
after insert on public.orgs
for each row execute function public.sc_add_owner_membership();

drop trigger if exists sc_orgs_touch_updated_at on public.orgs;
create trigger sc_orgs_touch_updated_at
before update on public.orgs
for each row execute function public.sc_touch_updated_at();

drop trigger if exists sc_org_members_touch_updated_at on public.org_members;
create trigger sc_org_members_touch_updated_at
before update on public.org_members
for each row execute function public.sc_touch_updated_at();

drop trigger if exists sc_roles_touch_updated_at on public.roles;
create trigger sc_roles_touch_updated_at
before update on public.roles
for each row execute function public.sc_touch_updated_at();

drop trigger if exists sc_systems_touch_updated_at on public.systems;
create trigger sc_systems_touch_updated_at
before update on public.systems
for each row execute function public.sc_touch_updated_at();

drop trigger if exists sc_processes_touch_updated_at on public.processes;
create trigger sc_processes_touch_updated_at
before update on public.processes
for each row execute function public.sc_touch_updated_at();

drop trigger if exists sc_actions_touch_updated_at on public.actions;
create trigger sc_actions_touch_updated_at
before update on public.actions
for each row execute function public.sc_touch_updated_at();

drop trigger if exists sc_role_system_access_touch_updated_at on public.role_system_access;
create trigger sc_role_system_access_touch_updated_at
before update on public.role_system_access
for each row execute function public.sc_touch_updated_at();

-- RLS ------------------------------------------------------------------------
alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.roles enable row level security;
alter table public.systems enable row level security;
alter table public.processes enable row level security;
alter table public.actions enable row level security;
alter table public.role_system_access enable row level security;
alter table public.flags enable row level security;

-- orgs policies
drop policy if exists orgs_select_member on public.orgs;
create policy orgs_select_member on public.orgs
for select to authenticated
using (public.sc_is_org_member(id));

drop policy if exists orgs_insert_owner on public.orgs;
create policy orgs_insert_owner on public.orgs
for insert to authenticated
with check (auth.uid() = owner_id);

drop policy if exists orgs_update_owner_admin on public.orgs;
create policy orgs_update_owner_admin on public.orgs
for update to authenticated
using (public.sc_has_any_role(id, array['owner','admin']::public.sc_membership_role[]))
with check (public.sc_has_any_role(id, array['owner','admin']::public.sc_membership_role[]));

drop policy if exists orgs_delete_owner on public.orgs;
create policy orgs_delete_owner on public.orgs
for delete to authenticated
using (public.sc_has_any_role(id, array['owner']::public.sc_membership_role[]));

-- org_members policies
drop policy if exists org_members_select_member on public.org_members;
create policy org_members_select_member on public.org_members
for select to authenticated
using (public.sc_is_org_member(org_id));

drop policy if exists org_members_insert_owner on public.org_members;
create policy org_members_insert_owner on public.org_members
for insert to authenticated
with check (public.sc_has_any_role(org_id, array['owner']::public.sc_membership_role[]));

drop policy if exists org_members_insert_admin on public.org_members;
create policy org_members_insert_admin on public.org_members
for insert to authenticated
with check (
  public.sc_has_any_role(org_id, array['admin']::public.sc_membership_role[])
  and role in ('editor', 'member')
);

drop policy if exists org_members_update_owner on public.org_members;
create policy org_members_update_owner on public.org_members
for update to authenticated
using (public.sc_has_any_role(org_id, array['owner']::public.sc_membership_role[]))
with check (public.sc_has_any_role(org_id, array['owner']::public.sc_membership_role[]));

drop policy if exists org_members_update_admin on public.org_members;
create policy org_members_update_admin on public.org_members
for update to authenticated
using (
  public.sc_has_any_role(org_id, array['admin']::public.sc_membership_role[])
  and role in ('editor', 'member')
)
with check (
  public.sc_has_any_role(org_id, array['admin']::public.sc_membership_role[])
  and role in ('editor', 'member')
);

drop policy if exists org_members_delete_owner on public.org_members;
create policy org_members_delete_owner on public.org_members
for delete to authenticated
using (public.sc_has_any_role(org_id, array['owner']::public.sc_membership_role[]));

drop policy if exists org_members_delete_admin on public.org_members;
create policy org_members_delete_admin on public.org_members
for delete to authenticated
using (
  public.sc_has_any_role(org_id, array['admin']::public.sc_membership_role[])
  and role in ('editor', 'member')
);

-- roles policies
drop policy if exists roles_select_member on public.roles;
create policy roles_select_member on public.roles
for select to authenticated
using (public.sc_is_org_member(org_id));

drop policy if exists roles_write_owner_admin on public.roles;
create policy roles_write_owner_admin on public.roles
for all to authenticated
using (public.sc_has_any_role(org_id, array['owner','admin']::public.sc_membership_role[]))
with check (public.sc_has_any_role(org_id, array['owner','admin']::public.sc_membership_role[]));

-- systems policies
drop policy if exists systems_select_member on public.systems;
create policy systems_select_member on public.systems
for select to authenticated
using (public.sc_is_org_member(org_id));

drop policy if exists systems_write_owner_admin on public.systems;
create policy systems_write_owner_admin on public.systems
for all to authenticated
using (public.sc_has_any_role(org_id, array['owner','admin']::public.sc_membership_role[]))
with check (public.sc_has_any_role(org_id, array['owner','admin']::public.sc_membership_role[]));

-- processes policies
drop policy if exists processes_select_member on public.processes;
create policy processes_select_member on public.processes
for select to authenticated
using (public.sc_is_org_member(org_id));

drop policy if exists processes_write_owner_admin_editor on public.processes;
create policy processes_write_owner_admin_editor on public.processes
for all to authenticated
using (public.sc_has_any_role(org_id, array['owner','admin','editor']::public.sc_membership_role[]))
with check (public.sc_has_any_role(org_id, array['owner','admin','editor']::public.sc_membership_role[]));

-- actions policies
drop policy if exists actions_select_member on public.actions;
create policy actions_select_member on public.actions
for select to authenticated
using (public.sc_is_org_member(org_id));

drop policy if exists actions_write_owner_admin_editor on public.actions;
create policy actions_write_owner_admin_editor on public.actions
for all to authenticated
using (public.sc_has_any_role(org_id, array['owner','admin','editor']::public.sc_membership_role[]))
with check (public.sc_has_any_role(org_id, array['owner','admin','editor']::public.sc_membership_role[]));

-- role_system_access policies
drop policy if exists role_system_access_select_member on public.role_system_access;
create policy role_system_access_select_member on public.role_system_access
for select to authenticated
using (public.sc_is_org_member(org_id));

drop policy if exists role_system_access_write_owner_admin on public.role_system_access;
create policy role_system_access_write_owner_admin on public.role_system_access
for all to authenticated
using (public.sc_has_any_role(org_id, array['owner','admin']::public.sc_membership_role[]))
with check (public.sc_has_any_role(org_id, array['owner','admin']::public.sc_membership_role[]));

-- flags policies
drop policy if exists flags_select_member on public.flags;
create policy flags_select_member on public.flags
for select to authenticated
using (public.sc_is_org_member(org_id));

drop policy if exists flags_insert_by_permission on public.flags;
create policy flags_insert_by_permission on public.flags
for insert to authenticated
with check (
  created_by = auth.uid()
  and public.sc_can_create_flag(org_id, flag_type)
);

drop policy if exists flags_update_owner_admin_editor on public.flags;
create policy flags_update_owner_admin_editor on public.flags
for update to authenticated
using (public.sc_has_any_role(org_id, array['owner','admin','editor']::public.sc_membership_role[]))
with check (public.sc_has_any_role(org_id, array['owner','admin','editor']::public.sc_membership_role[]));

drop policy if exists flags_delete_owner_admin_editor on public.flags;
create policy flags_delete_owner_admin_editor on public.flags
for delete to authenticated
using (public.sc_has_any_role(org_id, array['owner','admin','editor']::public.sc_membership_role[]));
