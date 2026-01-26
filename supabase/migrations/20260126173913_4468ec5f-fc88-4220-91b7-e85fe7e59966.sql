-- =====================================================
-- PART A: Update pricing_config with 2025 Advantage pricing
-- =====================================================

UPDATE pricing_config SET 
  value = 10.25,
  label = 'Advantage Resurfacer',
  description = '$307.50 / 30gal drum (Advantage)'
WHERE key = 'resurfacer_per_gal';

UPDATE pricing_config SET 
  value = 14.81,
  label = 'Advantage Color',
  description = '$444.30 / 30gal drum (Standard colors)'
WHERE key = 'color_concentrate_per_gal';

UPDATE pricing_config SET 
  value = 8.33,
  description = 'Extra for US Open Blue ($23.14 - $14.81)'
WHERE key = 'premium_color_add_on';

UPDATE pricing_config SET 
  value = 30.01,
  description = '$150.05 / 5gal pail (White)'
WHERE key = 'line_paint_per_gal';

UPDATE pricing_config SET 
  value = 20.58,
  description = '$247 / 12-pack sausages'
WHERE key = 'crack_filler_unit';

-- =====================================================
-- PART B: Add cushion material pricing (new rows)
-- =====================================================

INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active)
SELECT 'materials', 'cushion_granule_per_gal', 'Cushion Plus Granule', 8.00, 'per_gal', '$440 / 55gal drum', 7, true
WHERE NOT EXISTS (SELECT 1 FROM pricing_config WHERE key = 'cushion_granule_per_gal');

INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active)
SELECT 'materials', 'cushion_powder_per_gal', 'Cushion Plus Powder', 8.00, 'per_gal', '$440 / 55gal drum', 8, true
WHERE NOT EXISTS (SELECT 1 FROM pricing_config WHERE key = 'cushion_powder_per_gal');

-- =====================================================
-- PART C: Create material_inventory table
-- =====================================================

CREATE TABLE IF NOT EXISTS material_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  product_line TEXT NOT NULL DEFAULT 'advantage',
  is_primary BOOLEAN DEFAULT true,
  container_size DECIMAL(10,2) NOT NULL,
  container_type TEXT NOT NULL,
  cost_per_gallon DECIMAL(10,2) NOT NULL,
  cost_per_container DECIMAL(10,2) NOT NULL,
  quantity_on_hand INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 2,
  reorder_quantity INTEGER DEFAULT 5,
  color_name TEXT,
  is_premium_color BOOLEAN DEFAULT false,
  supplier TEXT DEFAULT 'Laykold/APT',
  last_price_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE material_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies (use DROP IF EXISTS pattern for idempotence)
DROP POLICY IF EXISTS "Admin/staff can view inventory" ON material_inventory;
CREATE POLICY "Admin/staff can view inventory"
ON material_inventory FOR SELECT
USING (is_admin_or_staff(auth.uid()));

DROP POLICY IF EXISTS "Admin/staff can manage inventory" ON material_inventory;
CREATE POLICY "Admin/staff can manage inventory"
ON material_inventory FOR ALL
USING (is_admin_or_staff(auth.uid()));

-- =====================================================
-- PART D: Seed initial inventory data
-- =====================================================

INSERT INTO material_inventory (product_code, product_name, product_type, product_line, is_primary, container_size, container_type, cost_per_gallon, cost_per_container, color_name, is_premium_color)
VALUES
  ('ADV-RESF-30', 'Advantage Acrylic Resurfacer', 'resurfacer', 'advantage', true, 30, 'drum', 10.25, 307.50, NULL, false),
  ('AR-RESF-55', 'Acrylic Resurfacer', 'resurfacer', 'standard', false, 55, 'drum', 11.50, 632.50, NULL, false),
  ('ADV-STD-30', 'Advantage Standard Colors', 'color', 'advantage', true, 30, 'drum', 14.81, 444.30, 'Standard', false),
  ('ADV-USOB-30', 'Advantage US Open Blue', 'color', 'advantage', true, 30, 'drum', 23.14, 694.20, 'US Open Blue', true),
  ('ADV-USOG-30', 'Advantage US Open Green', 'color', 'advantage', true, 30, 'drum', 19.61, 588.30, 'US Open Green', true),
  ('ADV-PURP-30', 'Advantage Royal Purple', 'color', 'advantage', true, 30, 'drum', 19.92, 597.60, 'Royal Purple', true),
  ('CFX-STD-55', 'ColorFlex Standard Colors', 'color', 'colorflex', false, 55, 'drum', 18.60, 1023.00, 'Standard', false),
  ('CPG-55', 'Cushion Plus Granule', 'cushion', 'standard', true, 55, 'drum', 8.00, 440.00, NULL, false),
  ('CPP-55', 'Cushion Plus Powder', 'cushion', 'standard', true, 55, 'drum', 8.00, 440.00, NULL, false),
  ('LP-WHT-5', 'Textured White Line Paint', 'line_paint', 'standard', true, 5, 'pail', 30.01, 150.05, 'White', false),
  ('LP-BLK-5', 'Textured Black Line Paint', 'line_paint', 'standard', true, 5, 'pail', 32.00, 160.00, 'Black', false),
  ('LP-YLW-5', 'Textured Yellow Line Paint', 'line_paint', 'standard', true, 5, 'pail', 47.00, 235.00, 'Yellow', true),
  ('QC-BLK-12', 'Qualicaulk Crack Filler (Black)', 'specialty', 'standard', true, 0.42, 'case', 20.58, 247.00, 'Black', false)
ON CONFLICT (product_code) DO UPDATE SET
  cost_per_gallon = EXCLUDED.cost_per_gallon,
  cost_per_container = EXCLUDED.cost_per_container,
  product_name = EXCLUDED.product_name;