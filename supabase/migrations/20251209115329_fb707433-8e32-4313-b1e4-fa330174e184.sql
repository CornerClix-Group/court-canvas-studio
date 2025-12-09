-- Create helper functions for role tiers
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_above(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'admin', 'project_manager')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_sales_or_above(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('owner', 'admin', 'sales')
  )
$$;

-- Phase 2: Projects Module
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates(id),
  customer_id UUID REFERENCES public.customers(id),
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'sold' CHECK (status IN ('sold', 'scheduled', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  project_name TEXT NOT NULL,
  site_address TEXT,
  site_city TEXT,
  site_state TEXT,
  site_zip TEXT,
  site_lat DECIMAL(10, 8),
  site_lng DECIMAL(11, 8),
  sport_type TEXT,
  system_type TEXT,
  scheduled_start_date DATE,
  target_completion_date DATE,
  actual_start_date DATE,
  actual_completion_date DATE,
  contract_value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('site_prep', 'base_work', 'concrete', 'curing', 'surfacing', 'color_coating', 'line_striping', 'net_posts', 'final_walkthrough', 'other')),
  milestone_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  scheduled_date DATE,
  completed_date DATE,
  completed_by UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.project_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  photo_type TEXT DEFAULT 'progress' CHECK (photo_type IN ('before', 'progress', 'after', 'issue')),
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  is_headquarters BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.projects ADD COLUMN location_id UUID REFERENCES public.locations(id);
ALTER TABLE public.leads ADD COLUMN location_id UUID REFERENCES public.locations(id);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
CREATE POLICY "Admin/staff can view projects"
  ON public.projects FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage projects"
  ON public.projects FOR ALL
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Assigned users can view their projects"
  ON public.projects FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Admin/staff can view milestones"
  ON public.project_milestones FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage milestones"
  ON public.project_milestones FOR ALL
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can view photos"
  ON public.project_photos FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage photos"
  ON public.project_photos FOR ALL
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can view locations"
  ON public.locations FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin can manage locations"
  ON public.locations FOR ALL
  USING (is_owner(auth.uid()) OR has_role(auth.uid(), 'admin'));