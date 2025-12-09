-- Create USTA applications table for grant accountability tracking
CREATE TABLE public.usta_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  
  -- TPA Info
  tpa_number TEXT,
  
  -- Facility Info
  facility_name TEXT,
  facility_director TEXT,
  facility_phone TEXT,
  facility_email TEXT,
  
  -- Funding Sources
  usta_national_amount NUMERIC DEFAULT 0,
  usta_section_amount NUMERIC DEFAULT 0,
  government_funding NUMERIC DEFAULT 0,
  foundation_funding NUMERIC DEFAULT 0,
  fundraising_amount NUMERIC DEFAULT 0,
  professional_fees NUMERIC DEFAULT 0,
  local_sponsors_amount NUMERIC DEFAULT 0,
  other_funding NUMERIC DEFAULT 0,
  other_funding_description TEXT,
  
  -- Court Counts
  courts_36_lined INTEGER DEFAULT 0,
  courts_36_permanent INTEGER DEFAULT 0,
  courts_60_lined INTEGER DEFAULT 0,
  courts_60_permanent INTEGER DEFAULT 0,
  courts_78 INTEGER DEFAULT 0,
  
  -- Project Details
  description_of_improvements TEXT,
  total_renovation_costs NUMERIC DEFAULT 0,
  projected_completion_date DATE,
  completion_percentage INTEGER DEFAULT 0,
  
  -- Submission Info
  status TEXT NOT NULL DEFAULT 'draft',
  consultant_name TEXT,
  consultant_email TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.usta_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin/staff can view USTA applications"
ON public.usta_applications
FOR SELECT
USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can manage USTA applications"
ON public.usta_applications
FOR ALL
USING (is_admin_or_staff(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_usta_applications_updated_at
BEFORE UPDATE ON public.usta_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_usta_funded flag to projects table
ALTER TABLE public.projects ADD COLUMN is_usta_funded BOOLEAN DEFAULT false;