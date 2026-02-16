-- SystemsCraft dev seed helper (LP-013)
--
-- This function is intentionally deterministic in shape (fixed sample model)
-- but creates a fresh org each run so local teams can reseed without cleanup.

create or replace function public.sc_seed_demo(p_owner_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_role_founder uuid;
  v_role_ops uuid;
  v_role_cs uuid;
  v_system_hubspot uuid;
  v_system_drive uuid;
  v_system_zoom uuid;
  v_process_onboarding uuid;
  v_process_ops_review uuid;
begin
  if p_owner_user_id is null then
    raise exception 'p_owner_user_id is required';
  end if;

  if not exists (select 1 from auth.users u where u.id = p_owner_user_id) then
    raise exception 'auth user % does not exist', p_owner_user_id;
  end if;

  insert into public.orgs (name, slug, owner_id)
  values (
    'SystemsCraft Demo Org',
    'systemscraft-demo-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
    p_owner_user_id
  )
  returning id into v_org_id;

  insert into public.org_members (org_id, user_id, role, accepted_at)
  values (v_org_id, p_owner_user_id, 'owner', now())
  on conflict (org_id, user_id)
  do update set
    role = 'owner',
    accepted_at = coalesce(org_members.accepted_at, now()),
    updated_at = now();

  insert into public.roles (org_id, slug, name, description_rich)
  values
    (v_org_id, 'founder', 'Founder', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Sets direction and owns escalation paths."}]}]}'::jsonb),
    (v_org_id, 'ops-manager', 'Ops Manager', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Maintains process quality and execution reliability."}]}]}'::jsonb),
    (v_org_id, 'client-success', 'Client Success Lead', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Owns onboarding and renewal outcomes."}]}]}'::jsonb);

  select id into v_role_founder from public.roles where org_id = v_org_id and slug = 'founder';
  select id into v_role_ops from public.roles where org_id = v_org_id and slug = 'ops-manager';
  select id into v_role_cs from public.roles where org_id = v_org_id and slug = 'client-success';

  insert into public.systems (org_id, slug, name, description_rich, location, owner_role_id)
  values
    (v_org_id, 'hubspot', 'HubSpot', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Primary CRM and pipeline tracking."}]}]}'::jsonb, 'CRM', v_role_ops),
    (v_org_id, 'google-drive', 'Google Drive', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Google Drive is a free Google file storage service in the cloud. Launched in 2012 to replace Google Docs, which only had 1GB of storage, it meant a wide increase in capacity for users reaching up to 15GB completely free. In addition, Google Drive incorporates several applications such as a spreadsheet program, a program to create presentations and a text editing program, all 3 very similar to the Microsoft Office package, in this case assimilating Microsoft Excel, Microsoft Powerpoint and Microsoft Word."}]},{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"1 Origin and evolution of Google Drive"}]},{"type":"paragraph","content":[{"type":"text","text":"Google Drive was officially launched on April 24, 2012, but its roots go back much earlier, when Google began exploring ways to improve online collaboration and storage. Prior to Google Drive, Google Docs already offered some cloud storage and editing capabilities, but was limited to 1 GB of space. The need for a more robust solution led to the development of Google Drive, which not only expanded the free storage space to 15 GB, but also more efficiently integrated Google’s productivity applications."}]},{"type":"paragraph","content":[{"type":"text","text":"Since its launch, Google Drive has evolved significantly, adapting to the changing needs of users and advancing technology. Initially, Google Drive focused on providing accessible and secure storage space, but over time, numerous features have been added that have enhanced its functionality and appeal."}]}]}'::jsonb, NULL, v_role_ops),
    (v_org_id, 'zoom', 'Zoom', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Client and internal call execution."}]}]}'::jsonb, 'Meetings', v_role_ops);

  select id into v_system_hubspot from public.systems where org_id = v_org_id and slug = 'hubspot';
  select id into v_system_drive from public.systems where org_id = v_org_id and slug = 'google-drive';
  select id into v_system_zoom from public.systems where org_id = v_org_id and slug = 'zoom';

  insert into public.processes (org_id, slug, name, description_rich, trigger, end_state, owner_role_id)
  values
    (v_org_id, 'client-onboarding', 'Client Onboarding', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Move signed clients into execution with clean handoffs."}]}]}'::jsonb, 'Contract signed', 'Kickoff scheduled and owner assigned', v_role_cs),
    (v_org_id, 'weekly-ops-review', 'Weekly Ops Review', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Review open work and assign next actions."}]}]}'::jsonb, 'Monday 9:00am', 'Open issues are assigned', v_role_ops);

  select id into v_process_onboarding from public.processes where org_id = v_org_id and slug = 'client-onboarding';
  select id into v_process_ops_review from public.processes where org_id = v_org_id and slug = 'weekly-ops-review';

  insert into public.actions (org_id, process_id, sequence, description_rich, owner_role_id, system_id)
  values
    (v_org_id, v_process_onboarding, 1, '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Create onboarding folder and client workspace."}]}]}'::jsonb, v_role_ops, v_system_drive),
    (v_org_id, v_process_onboarding, 2, '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Open CRM record and assign onboarding owner."}]}]}'::jsonb, v_role_cs, v_system_hubspot),
    (v_org_id, v_process_onboarding, 3, '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Schedule kickoff and confirm attendees."}]}]}'::jsonb, v_role_founder, v_system_zoom),
    (v_org_id, v_process_ops_review, 1, '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Review unresolved flags and assign next step."}]}]}'::jsonb, v_role_ops, v_system_drive);

  insert into public.flags (org_id, target_type, target_id, flag_type, message, created_by)
  values
    (v_org_id, 'process', v_process_onboarding, 'stale', 'Onboarding checklist needs review.', p_owner_user_id),
    (v_org_id, 'system', v_system_hubspot, 'comment', 'Need to add renewal field on deal object.', p_owner_user_id);

  return v_org_id;
end;
$$;
