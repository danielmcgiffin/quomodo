begin;


-- Drop any foreign key constraining org_id + reports_to before removing the column.
do $$
declare
  constraint_name text;
begin
  select c.constraint_name
  into constraint_name
  from information_schema.constraint_column_usage c
  where c.table_schema = 'public'
    and c.table_name = 'roles'
    and c.column_name = 'reports_to'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.roles drop constraint %I', constraint_name);
  end if;
end
$$;

alter table public.roles drop column if exists reports_to;

commit;
