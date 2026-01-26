-- RLS policies for contractors to access their assigned project milestones and photos

-- project_milestones: Assigned users can view milestones for their projects
CREATE POLICY "Assigned users can view project milestones"
ON project_milestones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_milestones.project_id 
    AND projects.assigned_to = auth.uid()
  )
);

-- project_milestones: Assigned users can update milestone status
CREATE POLICY "Assigned users can update project milestones"
ON project_milestones FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_milestones.project_id 
    AND projects.assigned_to = auth.uid()
  )
);

-- project_photos: Assigned users can view photos for their projects
CREATE POLICY "Assigned users can view project photos"
ON project_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.assigned_to = auth.uid()
  )
);

-- project_photos: Assigned users can upload photos to their projects
CREATE POLICY "Assigned users can insert project photos"
ON project_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id 
    AND projects.assigned_to = auth.uid()
  )
);