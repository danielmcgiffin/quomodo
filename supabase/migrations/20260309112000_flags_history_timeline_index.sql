-- EPI-169: speed up flags history timeline queries
-- Covers org-scoped resolved/dismissed history ordered by most recent resolved_at.

create index if not exists flags_history_timeline_idx
  on public.flags (org_id, resolved_at desc, id desc)
  where status in ('resolved', 'dismissed');
