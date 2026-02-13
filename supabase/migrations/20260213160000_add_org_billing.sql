-- Per-workspace billing state (LP-080)
-- Tracks Stripe customer linkage and a cached billing state used to enforce
-- lapsed=view-only policies without requiring a Stripe call on every request.

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'sc_billing_state'
  ) then
    create type public.sc_billing_state as enum (
      'active',
      'lapsed'
    );
  end if;
end
$$;

create table if not exists public.org_billing (
  org_id uuid primary key references public.orgs(id) on delete cascade,
  stripe_customer_id text unique,
  plan_id text not null default 'free',
  billing_state public.sc_billing_state not null default 'active',
  has_ever_paid boolean not null default false,
  last_checked_at timestamptz,
  updated_at timestamptz not null default now(),
  check (char_length(trim(plan_id)) > 0)
);

create index if not exists org_billing_state_idx
  on public.org_billing(billing_state);

alter table public.org_billing enable row level security;

drop policy if exists org_billing_select_org_members on public.org_billing;
create policy org_billing_select_org_members on public.org_billing
for select to authenticated
using (
  exists (
    select 1
    from public.org_members m
    where m.org_id = org_id
      and m.user_id = auth.uid()
      and m.accepted_at is not null
  )
);

drop policy if exists org_billing_update_org_owner on public.org_billing;
create policy org_billing_update_org_owner on public.org_billing
for update to authenticated
using (
  exists (
    select 1
    from public.orgs o
    where o.id = org_id
      and o.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.orgs o
    where o.id = org_id
      and o.owner_id = auth.uid()
  )
);

