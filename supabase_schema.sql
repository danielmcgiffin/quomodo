-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type membership_role as enum ('owner','admin','editor','member');
create type process_status as enum ('active','paused','deprecated');
create type flag_type as enum ('stale','incorrect','needs_review','question','comment');
create type flag_status as enum ('open','resolved','dismissed');
create type entity_type as enum ('process','action','role','system');

-- Orgs + members
create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table org_members (
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role membership_role not null default 'member',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (org_id, user_id)
);

-- Roles
create table roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  initials text not null,
  description text,
  person_name text,
  hourly_cost numeric(10,2) check (hourly_cost is null or hourly_cost >= 0),
  hours_per_week numeric(5,1) check (hours_per_week is null or hours_per_week >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name),
  unique (org_id, id)
);

-- Systems
create table systems (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  description text,
  url text,
  cost_monthly numeric(10,2) check (cost_monthly is null or cost_monthly >= 0),
  admin_role_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name),
  unique (org_id, id),
  foreign key (org_id, admin_role_id) references roles(org_id, id)
);

-- Processes
create table processes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  description text,
  trigger text,
  end_state text,
  owner_role_id uuid,
  status process_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name),
  unique (org_id, id),
  foreign key (org_id, owner_role_id) references roles(org_id, id)
);

-- Actions (one role, one system)
create table actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  process_id uuid not null,
  sequence integer not null check (sequence > 0),
  description text not null,
  rich_content jsonb,
  owner_role_id uuid not null,
  system_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (process_id, sequence),
  unique (org_id, id),
  foreign key (org_id, process_id) references processes(org_id, id) on delete cascade,
  foreign key (org_id, owner_role_id) references roles(org_id, id),
  foreign key (org_id, system_id) references systems(org_id, id)
);

-- Role ↔ System access
create table role_system_access (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  role_id uuid not null,
  system_id uuid not null,
  access_level text default 'user',
  created_at timestamptz not null default now(),
  unique (role_id, system_id),
  unique (org_id, id),
  foreign key (org_id, role_id) references roles(org_id, id) on delete cascade,
  foreign key (org_id, system_id) references systems(org_id, id) on delete cascade
);

-- Flags (polymorphic target)
create table flags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  target_type entity_type not null,
  target_id uuid not null,
  target_path text,
  flag_type flag_type not null,
  message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  status flag_status not null default 'open',
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  resolution_note text
);

-- Search view (Phase 2+)
create view search_all as
  select 'role' as entity_type, id, org_id, name as title,
         coalesce(description, '') as body
    from roles
  union all
  select 'process', id, org_id, name, coalesce(description, '')
    from processes
  union all
  select 'action', id, org_id, 'Action ' || sequence::text, coalesce(description, '')
    from actions
  union all
  select 'system', id, org_id, name, coalesce(description, '')
    from systems;

-- Indexes
create index on roles(org_id);
create index on systems(org_id);
create index on processes(org_id);
create index on actions(process_id);
create index on actions(owner_role_id);
create index on actions(system_id);
create index on flags(org_id, status);
create index on flags(target_type, target_id);
create index on flags(target_type, target_id, target_path);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_orgs before update on orgs
for each row execute procedure set_updated_at();
create trigger set_updated_at_roles before update on roles
for each row execute procedure set_updated_at();
create trigger set_updated_at_systems before update on systems
for each row execute procedure set_updated_at();
create trigger set_updated_at_processes before update on processes
for each row execute procedure set_updated_at();
create trigger set_updated_at_actions before update on actions
for each row execute procedure set_updated_at();

-- RLS helper (use per table)
create or replace function is_org_member(org uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from org_members m
    where m.org_id = org and m.user_id = auth.uid()
  );
$$;
