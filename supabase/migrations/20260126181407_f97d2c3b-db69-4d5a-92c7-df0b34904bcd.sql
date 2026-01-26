-- Update PrimeSeal pricing in pricing_config
UPDATE pricing_config SET 
  value = 45.65,
  label = '1K PrimeSeal Primer',
  description = '$228.25 / 5gal pail - For new concrete/moisture mitigation'
WHERE key = 'primeseal_per_gal';

-- Add PrimeSeal coverage rate (check if exists first to avoid duplicates)
INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active)
SELECT 'coverage', 'primeseal_gal_per_sy', 'PrimeSeal Coverage', 0.05, 'gal_per_sy', 'Same as acrylic resurfacer', 5, true
WHERE NOT EXISTS (SELECT 1 FROM pricing_config WHERE key = 'primeseal_gal_per_sy');

-- Add PrimeSeal to material_inventory (check if exists first)
INSERT INTO material_inventory (
  product_code, product_name, product_type, product_line, is_primary,
  container_size, container_type, cost_per_gallon, cost_per_container,
  quantity_on_hand, reorder_point
)
SELECT 'PS-1K-5', '1K PrimeSeal Primer', 'primer', 'standard', true,
  5, 'pail', 45.65, 228.25, 0, 2
WHERE NOT EXISTS (SELECT 1 FROM material_inventory WHERE product_code = 'PS-1K-5');