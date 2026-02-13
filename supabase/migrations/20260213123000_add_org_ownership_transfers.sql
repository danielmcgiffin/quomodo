-- Ownership transfer flow (LP-079)
-- Provides an in-app, owner-initiated transfer with recipient acceptance and
-- prior-owner stay/leave options.

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'sc_ownership_transfer_status'
  ) then
    create type public.sc_ownership_transfer_status as enum (
      'pending',
      'accepted',
      'cancelled'
    );
  end if;
end
$$;

create table if not exists public.org_ownership_transfers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  token_hash text not null unique,
  from_owner_id uuid not null references auth.users(id) on delete restrict,
  to_owner_id uuid not null references auth.users(id) on delete restrict,
  initiated_by_user_id uuid not null references auth.users(id) on delete restrict,
  prior_owner_role_after public.sc_membership_role,
  prior_owner_leave boolean not null default false,
  status public.sc_ownership_transfer_status not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  cancelled_by_user_id uuid references auth.users(id) on delete set null,
  check (
    (prior_owner_leave = true and prior_owner_role_after is null)
    or (
      prior_owner_leave = false
      and prior_owner_role_after in ('admin', 'editor')
    )
  )
);

create index if not exists org_ownership_transfers_org_status_idx
  on public.org_ownership_transfers(org_id, status);

alter table public.org_ownership_transfers enable row level security;

drop policy if exists org_ownership_transfers_select_owner_or_recipient on public.org_ownership_transfers;
create policy org_ownership_transfers_select_owner_or_recipient on public.org_ownership_transfers
for select to authenticated
using (
  to_owner_id = auth.uid()
  or exists (
    select 1 from public.orgs o
    where o.id = org_id and o.owner_id = auth.uid()
  )
);

create or replace function public.sc_create_ownership_transfer(
  p_org_id uuid,
  p_to_user_id uuid,
  p_token_hash text,
  p_prior_owner_disposition text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.orgs%rowtype;
  v_now timestamptz := now();
  v_transfer_id uuid;
  v_prior_owner_leave boolean := false;
  v_prior_owner_role_after public.sc_membership_role := null;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_org
  from public.orgs
  where id = p_org_id
  for update;

  if not found then
    raise exception 'Workspace not found';
  end if;

  if v_org.owner_id <> auth.uid() then
    raise exception 'Only the current owner can initiate a transfer';
  end if;

  if p_to_user_id is null or p_to_user_id = v_org.owner_id then
    raise exception 'Recipient must be a different user';
  end if;

  if p_expires_at is null or p_expires_at <= v_now then
    raise exception 'Expiry must be in the future';
  end if;

  -- Recipient must be an existing accepted admin member.
  if not exists (
    select 1
    from public.org_members m
    where m.org_id = p_org_id
      and m.user_id = p_to_user_id
      and m.role = 'admin'
      and m.accepted_at is not null
  ) then
    raise exception 'Recipient must be an accepted admin member of the workspace';
  end if;

  -- Enforce at most one pending transfer at a time.
  if exists (
    select 1
    from public.org_ownership_transfers t
    where t.org_id = p_org_id
      and t.status = 'pending'
      and t.expires_at > v_now
  ) then
    raise exception 'A pending ownership transfer already exists';
  end if;

  if p_prior_owner_disposition = 'leave' then
    v_prior_owner_leave := true;
    v_prior_owner_role_after := null;
  elsif p_prior_owner_disposition = 'admin' then
    v_prior_owner_leave := false;
    v_prior_owner_role_after := 'admin';
  elsif p_prior_owner_disposition = 'editor' then
    v_prior_owner_leave := false;
    v_prior_owner_role_after := 'editor';
  else
    raise exception 'Invalid prior owner disposition';
  end if;

  insert into public.org_ownership_transfers (
    org_id,
    token_hash,
    from_owner_id,
    to_owner_id,
    initiated_by_user_id,
    prior_owner_role_after,
    prior_owner_leave,
    status,
    expires_at
  ) values (
    p_org_id,
    p_token_hash,
    v_org.owner_id,
    p_to_user_id,
    auth.uid(),
    v_prior_owner_role_after,
    v_prior_owner_leave,
    'pending',
    p_expires_at
  )
  returning id into v_transfer_id;

  return v_transfer_id;
end;
$$;

create or replace function public.sc_cancel_ownership_transfer(
  p_org_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.orgs%rowtype;
  v_now timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_org
  from public.orgs
  where id = p_org_id;

  if not found then
    raise exception 'Workspace not found';
  end if;

  if v_org.owner_id <> auth.uid() then
    raise exception 'Only the current owner can cancel a transfer';
  end if;

  update public.org_ownership_transfers
  set
    status = 'cancelled',
    cancelled_at = v_now,
    cancelled_by_user_id = auth.uid()
  where org_id = p_org_id
    and status = 'pending'
    and expires_at > v_now;
end;
$$;

create or replace function public.sc_accept_ownership_transfer(
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_transfer public.org_ownership_transfers%rowtype;
  v_org public.orgs%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_transfer
  from public.org_ownership_transfers t
  where t.token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'Transfer not found';
  end if;

  if v_transfer.status <> 'pending' then
    raise exception 'Transfer is not pending';
  end if;

  if v_transfer.expires_at <= v_now then
    raise exception 'Transfer expired';
  end if;

  if v_transfer.to_owner_id <> auth.uid() then
    raise exception 'Only the recipient can accept this transfer';
  end if;

  select * into v_org
  from public.orgs o
  where o.id = v_transfer.org_id
  for update;

  if not found then
    raise exception 'Workspace not found';
  end if;

  if v_org.owner_id <> v_transfer.from_owner_id then
    raise exception 'Workspace ownership has changed; transfer cannot be accepted';
  end if;

  -- Recipient must still be an accepted admin.
  if not exists (
    select 1
    from public.org_members m
    where m.org_id = v_transfer.org_id
      and m.user_id = v_transfer.to_owner_id
      and m.role = 'admin'
      and m.accepted_at is not null
  ) then
    raise exception 'Recipient must be an accepted admin member';
  end if;

  -- Promote recipient to owner and update org owner id.
  update public.org_members
  set role = 'owner'
  where org_id = v_transfer.org_id
    and user_id = v_transfer.to_owner_id;

  update public.orgs
  set owner_id = v_transfer.to_owner_id
  where id = v_transfer.org_id;

  -- Apply prior owner stay/leave disposition.
  if v_transfer.prior_owner_leave then
    delete from public.org_members
    where org_id = v_transfer.org_id
      and user_id = v_transfer.from_owner_id;
  else
    update public.org_members
    set role = v_transfer.prior_owner_role_after
    where org_id = v_transfer.org_id
      and user_id = v_transfer.from_owner_id;
  end if;

  update public.org_ownership_transfers
  set
    status = 'accepted',
    accepted_at = v_now,
    accepted_by_user_id = auth.uid()
  where id = v_transfer.id
    and status = 'pending';

  return v_transfer.org_id;
end;
$$;

revoke all on function public.sc_create_ownership_transfer(uuid, uuid, text, text, timestamptz) from public;
revoke all on function public.sc_cancel_ownership_transfer(uuid) from public;
revoke all on function public.sc_accept_ownership_transfer(text) from public;
grant execute on function public.sc_create_ownership_transfer(uuid, uuid, text, text, timestamptz) to authenticated;
grant execute on function public.sc_cancel_ownership_transfer(uuid) to authenticated;
grant execute on function public.sc_accept_ownership_transfer(text) to authenticated;

