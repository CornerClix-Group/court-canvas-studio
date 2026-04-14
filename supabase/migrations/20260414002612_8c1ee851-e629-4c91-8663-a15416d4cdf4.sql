
-- Add new columns to estimates table
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS override_sell_price numeric NULL,
  ADD COLUMN IF NOT EXISTS is_phased boolean NOT NULL DEFAULT false;

-- Add new columns to estimate_items table
ALTER TABLE public.estimate_items
  ADD COLUMN IF NOT EXISTS option_id uuid NULL,
  ADD COLUMN IF NOT EXISTS phase_id uuid NULL,
  ADD COLUMN IF NOT EXISTS is_alternate boolean NOT NULL DEFAULT false;

-- Add new columns to estimate_custom_items table
ALTER TABLE public.estimate_custom_items
  ADD COLUMN IF NOT EXISTS option_id uuid NULL,
  ADD COLUMN IF NOT EXISTS phase_id uuid NULL,
  ADD COLUMN IF NOT EXISTS is_alternate boolean NOT NULL DEFAULT false;

-- Create estimate_options table
CREATE TABLE IF NOT EXISTS public.estimate_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  option_name text NOT NULL,
  option_description text,
  override_sell_price numeric NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_recommended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage estimate options"
  ON public.estimate_options FOR ALL
  TO authenticated
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can view estimate options"
  ON public.estimate_options FOR SELECT
  TO authenticated
  USING (is_admin_or_staff(auth.uid()));

-- Create estimate_phases table
CREATE TABLE IF NOT EXISTS public.estimate_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  phase_name text NOT NULL,
  phase_description text,
  suggested_timeline text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can manage estimate phases"
  ON public.estimate_phases FOR ALL
  TO authenticated
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can view estimate phases"
  ON public.estimate_phases FOR SELECT
  TO authenticated
  USING (is_admin_or_staff(auth.uid()));

-- Add foreign keys from estimate_items to new tables
ALTER TABLE public.estimate_items
  ADD CONSTRAINT estimate_items_option_id_fkey
    FOREIGN KEY (option_id) REFERENCES public.estimate_options(id) ON DELETE SET NULL;

ALTER TABLE public.estimate_items
  ADD CONSTRAINT estimate_items_phase_id_fkey
    FOREIGN KEY (phase_id) REFERENCES public.estimate_phases(id) ON DELETE SET NULL;

-- Add foreign keys from estimate_custom_items to new tables
ALTER TABLE public.estimate_custom_items
  ADD CONSTRAINT estimate_custom_items_option_id_fkey
    FOREIGN KEY (option_id) REFERENCES public.estimate_options(id) ON DELETE SET NULL;

ALTER TABLE public.estimate_custom_items
  ADD CONSTRAINT estimate_custom_items_phase_id_fkey
    FOREIGN KEY (phase_id) REFERENCES public.estimate_phases(id) ON DELETE SET NULL;
