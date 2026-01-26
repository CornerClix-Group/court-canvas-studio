-- Add project_number column to projects table
ALTER TABLE public.projects 
ADD COLUMN project_number text UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_projects_project_number ON public.projects(project_number);

-- Backfill existing projects with sequential numbers based on creation date
WITH numbered_projects AS (
  SELECT id, 
         'PRJ-' || EXTRACT(YEAR FROM created_at)::text || '-' || LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at)::text, 4, '0') as new_number
  FROM public.projects
  ORDER BY created_at
)
UPDATE public.projects p
SET project_number = np.new_number
FROM numbered_projects np
WHERE p.id = np.id;