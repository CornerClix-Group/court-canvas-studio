-- Step 1: Standardize all database keys to lowercase
-- Fix material keys
UPDATE pricing_config SET key = 'resurfacer_per_gal' WHERE key = 'RESURFACER_PER_GAL';
UPDATE pricing_config SET key = 'color_concentrate_per_gal' WHERE key = 'COLOR_CONCENTRATE_PER_GAL';
UPDATE pricing_config SET key = 'premium_color_add_on' WHERE key = 'PREMIUM_COLOR_ADD_ON';
UPDATE pricing_config SET key = 'line_paint_per_gal' WHERE key = 'LINE_PAINT_PER_GAL';
UPDATE pricing_config SET key = 'primeseal_per_gal' WHERE key = 'PRIMESEAL_PER_GAL';
UPDATE pricing_config SET key = 'crack_filler_unit' WHERE key = 'CRACK_FILLER_UNIT';

-- Fix labor keys
UPDATE pricing_config SET key = 'wash_per_sf' WHERE key = 'WASH_PER_SF';
UPDATE pricing_config SET key = 'crack_repair_per_lf' WHERE key = 'CRACK_REPAIR_PER_LF';
UPDATE pricing_config SET key = 'acrylic_install_per_sf' WHERE key = 'ACRYLIC_INSTALL_PER_SF';
UPDATE pricing_config SET key = 'cushion_install_per_sf' WHERE key = 'CUSHION_INSTALL_PER_SF';
UPDATE pricing_config SET key = 'striping_per_court' WHERE key = 'STRIPING_PER_COURT';
UPDATE pricing_config SET key = 'mobilization' WHERE key = 'MOBILIZATION';
UPDATE pricing_config SET key = 'core_drill_per_hole' WHERE key = 'CORE_DRILL_PER_HOLE';

-- Fix construction keys
UPDATE pricing_config SET key = 'asphalt_paving_per_sf' WHERE key = 'ASPHALT_PAVING_PER_SF';
UPDATE pricing_config SET key = 'concrete_pt_per_sf' WHERE key = 'CONCRETE_PT_PER_SF';
UPDATE pricing_config SET key = 'fencing_10ft_per_lf' WHERE key = 'FENCING_10FT_PER_LF';
UPDATE pricing_config SET key = 'light_pole_unit' WHERE key = 'LIGHT_POLE_UNIT';
UPDATE pricing_config SET key = 'playground_budget' WHERE key = 'PLAYGROUND_BUDGET';

-- Fix equipment keys
UPDATE pricing_config SET key = 'net_post_set' WHERE key = 'NET_POST_SET';
UPDATE pricing_config SET key = 'player_bench_6ft' WHERE key = 'PLAYER_BENCH_6FT';
UPDATE pricing_config SET key = 'windscreen_per_lf' WHERE key = 'WINDSCREEN_PER_LF';
UPDATE pricing_config SET key = 'ball_containment_per_lf' WHERE key = 'BALL_CONTAINMENT_PER_LF';

-- Fix margin keys
UPDATE pricing_config SET key = 'default_margin' WHERE key = 'DEFAULT_MARGIN';
UPDATE pricing_config SET key = 'min_margin' WHERE key = 'MIN_MARGIN';
UPDATE pricing_config SET key = 'max_margin' WHERE key = 'MAX_MARGIN';

-- Step 2: Update all values to 2025 PA3D pricing
UPDATE pricing_config SET 
  value = 10.25, 
  label = 'Advantage Resurfacer',
  description = '$307.50 / 30gal drum (PA3D 2025)'
WHERE key = 'resurfacer_per_gal';

UPDATE pricing_config SET 
  value = 14.81, 
  label = 'Advantage Color (Standard)',
  description = '$444.30 / 30gal drum (PA3D 2025)'
WHERE key = 'color_concentrate_per_gal';

UPDATE pricing_config SET 
  value = 8.33, 
  label = 'Premium Color Add-on',
  description = 'Extra for US Open Blue ($23.14 - $14.81)'
WHERE key = 'premium_color_add_on';

UPDATE pricing_config SET 
  value = 30.01, 
  label = 'Textured Line Paint',
  description = '$150.05 / 5gal pail (White)'
WHERE key = 'line_paint_per_gal';

UPDATE pricing_config SET 
  value = 45.65, 
  label = '1K PrimeSeal Primer',
  description = '$228.25 / 5gal pail - New concrete prep'
WHERE key = 'primeseal_per_gal';

UPDATE pricing_config SET 
  value = 20.58, 
  label = 'Qualicaulk Crack Filler',
  description = '$247 / 12-pack sausages'
WHERE key = 'crack_filler_unit';

-- Update cushion pricing to 2025 rates
UPDATE pricing_config SET 
  value = 8.00, 
  label = 'Cushion Plus Granule',
  description = '$440 / 55gal drum (PA3D 2025)'
WHERE key = 'cushion_granule_per_gal';

UPDATE pricing_config SET 
  value = 8.00, 
  label = 'Cushion Plus Powder',
  description = '$440 / 55gal drum (PA3D 2025)'
WHERE key = 'cushion_powder_per_gal';

-- Step 3: Add missing coverage rates (insert only if not exists)
INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active)
SELECT 'coverage', 'cushion_granule_gal_per_sy', 'Cushion Granule Coverage', 0.20, 'gal_per_sy', 'Laykold Pro Plus Guide', 3, true
WHERE NOT EXISTS (SELECT 1 FROM pricing_config WHERE key = 'cushion_granule_gal_per_sy');

INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active)
SELECT 'coverage', 'cushion_powder_gal_per_sy', 'Cushion Powder Coverage', 0.12, 'gal_per_sy', 'Laykold Pro Plus Guide', 4, true
WHERE NOT EXISTS (SELECT 1 FROM pricing_config WHERE key = 'cushion_powder_gal_per_sy');

INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active)
SELECT 'coverage', 'color_coat_gal_per_sy', 'Color Coat Coverage', 0.065, 'gal_per_sy', 'Standard color application rate', 5, true
WHERE NOT EXISTS (SELECT 1 FROM pricing_config WHERE key = 'color_coat_gal_per_sy');

-- Also add unique constraint on key for future migrations
ALTER TABLE pricing_config ADD CONSTRAINT pricing_config_key_unique UNIQUE (key);