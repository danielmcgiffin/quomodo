-- Add logo_url to systems
alter table systems
add column logo_url text;

-- Update danielmcgiffin systems with placeholder logo
-- We will use a lookup to find the org_id for danielmcgiffin first
do $$
declare
  target_user_id uuid;
  target_org_id uuid;
begin
  select id into target_user_id from auth.users where email = 'danielmcgiffin+test@gmail.com';
  
  -- Assuming the user is an owner of an org, or we can look up via org_members
  -- For now, let's update systems where the user is a member of the org
  -- A safer bet given the sample data is to look for the org owned by this user or where they are a member.
  -- Let's just update all systems for orgs where this user is a member, or we can try to be more specific if we knew the org slug.
  -- Based on sample data, we can try to find the org. 
  
  -- Actually, to be safe and simple for this 'test' account, we can just update all systems 
  -- belonging to orgs where this user is a member.
  
  update systems
  set logo_url = '/images/quaestor-full.png'
  from org_members
  where systems.org_id = org_members.org_id
  and org_members.user_id = target_user_id;
  
end $$;
