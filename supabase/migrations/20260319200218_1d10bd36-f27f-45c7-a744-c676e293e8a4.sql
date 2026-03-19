-- Phase 1A: Add qualification fields to leads
ALTER TABLE public.leads 
  ADD COLUMN job_type text,
  ADD COLUMN base_type text,
  ADD COLUMN court_condition text,
  ADD COLUMN ownership_type text,
  ADD COLUMN number_of_courts integer DEFAULT 1,
  ADD COLUMN budget_range text,
  ADD COLUMN urgency text,
  ADD COLUMN photo_urls text[];

-- Phase 1B: AI scoring columns
ALTER TABLE public.leads
  ADD COLUMN ai_score integer,
  ADD COLUMN ai_tags text[];

-- Phase 2B: Pipeline and follow-up columns
ALTER TABLE public.leads
  ADD COLUMN lost_reason text,
  ADD COLUMN follow_up_date date,
  ADD COLUMN last_contacted_at timestamptz,
  ADD COLUMN follow_up_count integer DEFAULT 0;

-- Phase 5A: Win/loss tracking on estimates
ALTER TABLE public.estimates
  ADD COLUMN outcome text,
  ADD COLUMN lost_reason text;

-- Phase 4B: Estimate exclusions table
CREATE TABLE public.estimate_exclusions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid REFERENCES public.estimates(id) ON DELETE CASCADE,
  exclusion_text text NOT NULL,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.estimate_exclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage exclusions" ON public.estimate_exclusions
  FOR ALL TO authenticated USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can view exclusions" ON public.estimate_exclusions
  FOR SELECT TO authenticated USING (is_admin_or_staff(auth.uid()));

-- Insert default exclusions
INSERT INTO public.estimate_exclusions (exclusion_text, is_default, sort_order) VALUES
  ('Pricing does not include permits unless specified.', true, 1),
  ('Assumes adequate drainage exists. Drainage corrections are not included.', true, 2),
  ('Does not include tree removal, earthwork, or grading.', true, 3),
  ('Subject to on-site inspection and verification of conditions.', true, 4),
  ('Does not include fencing, lighting, or accessories unless listed.', true, 5),
  ('All work performed during normal business hours. Overtime rates apply if requested.', true, 6);

-- Create index for follow-up queries
CREATE INDEX idx_leads_follow_up_date ON public.leads(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX idx_leads_status_created ON public.leads(status, created_at);
CREATE INDEX idx_estimates_outcome ON public.estimates(outcome) WHERE outcome IS NOT NULL;