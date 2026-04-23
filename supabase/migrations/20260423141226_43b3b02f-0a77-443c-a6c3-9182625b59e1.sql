-- Fix #1: project_courts publicly readable
-- Drop the wide-open public SELECT policy and replace with a security-definer
-- RPC that returns courts only for a known project number (used by the public
-- /court-approval/:number page).

DROP POLICY IF EXISTS "Public can view courts for approval flow" ON public.project_courts;

CREATE OR REPLACE FUNCTION public.get_courts_for_approval(_project_number text)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  court_label text,
  court_type text,
  inner_color text,
  outer_color text,
  line_color text,
  approved boolean,
  approved_initials text,
  approved_at timestamptz,
  sort_order integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id, c.project_id, c.court_label, c.court_type,
    c.inner_color, c.outer_color, c.line_color,
    c.approved, c.approved_initials, c.approved_at,
    c.sort_order, c.created_at, c.updated_at
  FROM public.project_courts c
  JOIN public.projects p ON p.id = c.project_id
  WHERE p.project_number = _project_number
    AND p.project_number IS NOT NULL
  ORDER BY c.sort_order ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_courts_for_approval(text) TO anon, authenticated;

-- Fix #2: receipts bucket - tighten INSERT policy to admin/staff only
-- Drop any permissive INSERT policy on receipts and recreate restricted to admin/staff.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual LIKE '%receipts%' OR with_check LIKE '%receipts%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admin/staff can read receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can update receipts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin_or_staff(auth.uid()))
  WITH CHECK (bucket_id = 'receipts' AND public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can delete receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin_or_staff(auth.uid()));