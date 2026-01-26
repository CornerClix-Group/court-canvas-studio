-- Allow assigned users to update their own projects (for saving notes)
CREATE POLICY "Assigned users can update their projects"
ON projects FOR UPDATE
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());