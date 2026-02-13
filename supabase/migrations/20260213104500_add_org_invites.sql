create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  role public.sc_membership_role not null default 'member',
  token_hash text not null unique,
  invited_by_user_id uuid not null references auth.users(id) on delete restrict,
  revoked_by_user_id uuid references auth.users(id) on delete set null,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  org_member_id uuid references public.org_members(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(email)) > 0),
  check (role in ('admin', 'editor', 'member')),
  check (not (revoked_at is not null and accepted_at is not null))
);

create index if not exists org_invites_org_id_idx on public.org_invites(org_id);
create index if not exists org_invites_email_idx on public.org_invites(lower(email));

create unique index if not exists org_invites_active_org_email_idx
on public.org_invites (org_id, lower(email))
where revoked_at is null and accepted_at is null;

drop trigger if exists sc_org_invites_touch_updated_at on public.org_invites;
create trigger sc_org_invites_touch_updated_at
before update on public.org_invites
for each row execute function public.sc_touch_updated_at();

alter table public.org_invites enable row level security;

drop policy if exists org_invites_select_owner_admin on public.org_invites;
create policy org_invites_select_owner_admin on public.org_invites
for select to authenticated
using (
  public.sc_has_any_role(
    org_id,
    array['owner','admin']::public.sc_membership_role[]
  )
);

drop policy if exists org_invites_insert_owner on public.org_invites;
create policy org_invites_insert_owner on public.org_invites
for insert to authenticated
with check (
  public.sc_has_any_role(
    org_id,
    array['owner']::public.sc_membership_role[]
  )
  and role in ('admin', 'editor', 'member')
);

drop policy if exists org_invites_insert_admin on public.org_invites;
create policy org_invites_insert_admin on public.org_invites
for insert to authenticated
with check (
  public.sc_has_any_role(
    org_id,
    array['admin']::public.sc_membership_role[]
  )
  and role in ('editor', 'member')
);

drop policy if exists org_invites_update_owner on public.org_invites;
create policy org_invites_update_owner on public.org_invites
for update to authenticated
using (
  public.sc_has_any_role(
    org_id,
    array['owner']::public.sc_membership_role[]
  )
)
with check (
  public.sc_has_any_role(
    org_id,
    array['owner']::public.sc_membership_role[]
  )
  and role in ('admin', 'editor', 'member')
);

drop policy if exists org_invites_update_admin on public.org_invites;
create policy org_invites_update_admin on public.org_invites
for update to authenticated
using (
  public.sc_has_any_role(
    org_id,
    array['admin']::public.sc_membership_role[]
  )
  and role in ('editor', 'member')
)
with check (
  public.sc_has_any_role(
    org_id,
    array['admin']::public.sc_membership_role[]
  )
  and role in ('editor', 'member')
);
