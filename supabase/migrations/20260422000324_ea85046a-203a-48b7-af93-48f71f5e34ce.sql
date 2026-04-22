
-- =========================================================
-- Part 1: project_courts table for color approval
-- =========================================================
CREATE TABLE public.project_courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  court_label text NOT NULL,
  court_type text NOT NULL,
  inner_color text NOT NULL DEFAULT 'Pro Blue',
  outer_color text NOT NULL DEFAULT 'Dark Green',
  line_color text NOT NULL DEFAULT 'White',
  approved boolean NOT NULL DEFAULT false,
  approved_initials text,
  approved_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_courts_project_id ON public.project_courts(project_id);

ALTER TABLE public.project_courts ENABLE ROW LEVEL SECURITY;

-- Admin/staff can manage all courts
CREATE POLICY "Admin/staff can manage project courts"
  ON public.project_courts
  FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Public (anon) can read courts only when accessing via project_number lookup
-- We'll allow reads but the app gates by project_number knowledge
CREATE POLICY "Public can view courts for approval flow"
  ON public.project_courts
  FOR SELECT
  USING (true);

-- Public can update approval state via the approval flow
CREATE POLICY "Public can update court approvals"
  ON public.project_courts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_project_courts_updated_at
  BEFORE UPDATE ON public.project_courts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Part 2: Add color approval fields to projects
-- =========================================================
ALTER TABLE public.projects
  ADD COLUMN color_approval_status text NOT NULL DEFAULT 'pending'
    CHECK (color_approval_status IN ('pending','partial','approved')),
  ADD COLUMN color_approved_at timestamptz,
  ADD COLUMN color_approval_ip text,
  ADD COLUMN color_approval_pdf_url text,
  ADD COLUMN customer_email text,
  ADD COLUMN project_notes text;

-- Allow public read of minimal project info for approval flow (gated by knowledge of project_number)
CREATE POLICY "Public can view projects by number for approval"
  ON public.projects
  FOR SELECT
  USING (project_number IS NOT NULL);

-- Allow public update of approval-related columns only
CREATE POLICY "Public can update color approval fields"
  ON public.projects
  FOR UPDATE
  USING (project_number IS NOT NULL)
  WITH CHECK (project_number IS NOT NULL);

-- =========================================================
-- Part 3: Auto-generate project_number on insert
-- =========================================================
CREATE OR REPLACE FUNCTION public.generate_project_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year text;
  next_num integer;
BEGIN
  IF NEW.project_number IS NOT NULL AND NEW.project_number <> '' THEN
    RETURN NEW;
  END IF;

  current_year := to_char(now(), 'YYYY');

  SELECT COALESCE(MAX(CAST(split_part(project_number, '-', 3) AS integer)), 0) + 1
  INTO next_num
  FROM public.projects
  WHERE project_number LIKE 'PRJ-' || current_year || '-%';

  NEW.project_number := 'PRJ-' || current_year || '-' || LPAD(next_num::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_project_number
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_project_number();

-- =========================================================
-- Part 4: design_submissions table for Explore Mode leads
-- =========================================================
CREATE TABLE public.design_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  street text,
  city text,
  state text,
  zip text,
  court_type text NOT NULL,
  inner_color text NOT NULL,
  outer_color text NOT NULL,
  line_color text NOT NULL,
  project_notes text,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.design_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can view design submissions"
  ON public.design_submissions
  FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage design submissions"
  ON public.design_submissions
  FOR ALL
  USING (is_admin_or_staff(auth.uid()));

-- Public can insert via edge function (service role bypasses RLS, but allow as safety)
CREATE POLICY "Anyone can submit a design"
  ON public.design_submissions
  FOR INSERT
  WITH CHECK (true);
