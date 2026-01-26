-- Create project_materials table for tracking materials assigned to projects
CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES material_inventory(id),
  
  -- Material details (copied for historical record)
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  
  -- Quantity
  gallons_required DECIMAL(10,2) NOT NULL,
  containers_allocated INTEGER DEFAULT 0,
  container_size DECIMAL(10,2),
  
  -- Status: pending, allocated, consumed, returned
  status TEXT DEFAULT 'pending',
  allocated_at TIMESTAMP WITH TIME ZONE,
  consumed_at TIMESTAMP WITH TIME ZONE,
  
  -- Cost tracking
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin/staff can manage project materials"
  ON project_materials FOR ALL
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can view project materials"
  ON project_materials FOR SELECT
  USING (is_admin_or_staff(auth.uid()));

CREATE POLICY "Assigned users can view project materials"
  ON project_materials FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_materials.project_id 
    AND projects.assigned_to = auth.uid()
  ));

-- Create index for faster lookups
CREATE INDEX idx_project_materials_project_id ON project_materials(project_id);
CREATE INDEX idx_project_materials_inventory_item_id ON project_materials(inventory_item_id);

-- Add 5-gallon pails for Advantage colors (smaller container options)
INSERT INTO material_inventory (product_code, product_name, product_type, product_line, is_primary, container_size, container_type, cost_per_gallon, cost_per_container, color_name, quantity_on_hand, reorder_point, reorder_quantity)
VALUES 
  ('ADV-STD-5', 'Advantage Standard Colors (5-gal)', 'color', 'advantage', false, 5, 'pail', 16.58, 82.90, 'Standard', 0, 2, 5),
  ('ADV-USOB-5', 'Advantage US Open Blue (5-gal)', 'color', 'advantage', false, 5, 'pail', 24.91, 124.55, 'US Open Blue', 0, 2, 5),
  ('ADV-USOG-5', 'Advantage US Open Green (5-gal)', 'color', 'advantage', false, 5, 'pail', 21.38, 106.90, 'US Open Green', 0, 2, 5),
  ('ADV-PURP-5', 'Advantage Royal Purple (5-gal)', 'color', 'advantage', false, 5, 'pail', 22.50, 112.50, 'Royal Purple', 0, 2, 5);

-- Add 2-gallon line paint option (smaller size for small jobs)
INSERT INTO material_inventory (product_code, product_name, product_type, product_line, is_primary, container_size, container_type, cost_per_gallon, cost_per_container, color_name, quantity_on_hand, reorder_point, reorder_quantity)
VALUES 
  ('LP-WHT-2', 'Textured White Line Paint (2-pack)', 'line_paint', 'standard', false, 2, 'box', 30.01, 60.02, 'White', 0, 2, 5);