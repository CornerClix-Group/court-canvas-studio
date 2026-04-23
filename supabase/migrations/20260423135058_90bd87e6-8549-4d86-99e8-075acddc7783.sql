-- 1. Drop the overly-permissive public projects policy
DROP POLICY IF EXISTS "Public can view projects by number for approval" ON public.projects;

-- 2. Create a SECURITY DEFINER function that returns only the minimal fields
--    needed by the public court-approval flow. No customer PII, no contract
--    value, no internal notes, no GPS coordinates.
CREATE OR REPLACE FUNCTION public.get_project_for_approval(_project_number text)
RETURNS TABLE (
  id uuid,
  project_number text,
  project_name text,
  color_approval_status text,
  color_approved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.project_number,
    p.project_name,
    p.color_approval_status,
    p.color_approved_at
  FROM public.projects p
  WHERE p.project_number = _project_number
    AND p.project_number IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_for_approval(text) TO anon, authenticated;

-- 3. Internal helper used by the approval-PDF edge function (service-role
--    context). Returns the slightly larger set of fields the PDF renders
--    (project name + approval metadata only — still no customer PII or
--    contract values). Service role bypasses RLS so this is mainly for
--    code organisation.
CREATE OR REPLACE FUNCTION public.get_project_for_approval_pdf(_project_number text)
RETURNS TABLE (
  id uuid,
  project_number text,
  project_name text,
  color_approval_status text,
  color_approved_at timestamptz,
  color_approval_ip text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.project_number,
    p.project_name,
    p.color_approval_status,
    p.color_approved_at,
    p.color_approval_ip
  FROM public.projects p
  WHERE p.project_number = _project_number
    AND p.project_number IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_for_approval_pdf(text) TO anon, authenticated;

-- 4. Add a no-op deny policy on invoice_number_sequences so the linter sees
--    explicit intent: this table is only meant to be touched by the
--    security-definer function generate_invoice_number().
CREATE POLICY "Deny all direct access to invoice number sequences"
  ON public.invoice_number_sequences
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);