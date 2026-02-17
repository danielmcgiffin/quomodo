-- Add title column to actions table and update search_all view

ALTER TABLE public.actions ADD COLUMN title text NOT NULL DEFAULT '';

-- Update title column with sequence-based default for existing rows
UPDATE public.actions SET title = 'Action ' || sequence::text WHERE title = '';

-- Update search_all view to use the new title column
CREATE OR REPLACE VIEW public.search_all
WITH (security_invoker = true) AS
  SELECT
    'role'::text AS entity_type,
    r.id,
    r.org_id,
    r.slug,
    r.name AS title,
    COALESCE(r.description_rich::text, '') AS body
  FROM public.roles r
  UNION ALL
  SELECT
    'system'::text AS entity_type,
    s.id,
    s.org_id,
    s.slug,
    s.name AS title,
    COALESCE(s.description_rich::text, '') AS body
  FROM public.systems s
  UNION ALL
  SELECT
    'process'::text AS entity_type,
    p.id,
    p.org_id,
    p.slug,
    p.name AS title,
    COALESCE(p.description_rich::text, '') AS body
  FROM public.processes p
  UNION ALL
  SELECT
    'action'::text AS entity_type,
    a.id,
    a.org_id,
    null::text AS slug,
    a.title AS title,
    COALESCE(a.description_rich::text, '') AS body
  FROM public.actions a;
