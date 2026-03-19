
-- Drop old unique constraints that prevent multiple product lines
ALTER TABLE pricing_config DROP CONSTRAINT pricing_config_category_key_key;
ALTER TABLE pricing_config DROP CONSTRAINT pricing_config_key_unique;

-- Add new unique constraint that includes product_line
ALTER TABLE pricing_config ADD CONSTRAINT pricing_config_category_key_product_line_key UNIQUE (category, key, product_line);

-- Insert ColorFlex material rows
INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active, product_line) VALUES
('materials', 'resurfacer_per_gal', 'NuSurf Flexible Filler (55-gal)', 13.82, 'per_gal', 'NuSurf highly flexible filler coat for ColorFlex system', 1, true, 'colorflex'),
('materials', 'color_concentrate_per_gal', 'ColorFlex Color (Standard)', 18.97, 'per_gal', 'ColorFlex standard colors - 55-gal drum', 2, true, 'colorflex'),
('materials', 'premium_color_add_on', 'Premium Color Add-on', 7.64, 'per_gal', 'US Open Blue premium add-on for ColorFlex', 3, true, 'colorflex');

-- Insert Masters (ColorCoat Concentrate) material rows
INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active, product_line) VALUES
('materials', 'resurfacer_per_gal', 'Acrylic Resurfacer (55-gal)', 11.73, 'per_gal', 'Standard acrylic resurfacer for Masters system', 1, true, 'masters'),
('materials', 'color_concentrate_per_gal', 'ColorCoat Concentrate (Standard)', 15.85, 'per_gal', 'ColorCoat Concentrate standard colors - 55-gal drum', 2, true, 'masters'),
('materials', 'premium_color_add_on', 'Premium Color Add-on', 8.68, 'per_gal', 'US Open Blue premium add-on for ColorCoat', 3, true, 'masters');

-- Update existing rows: tag product-line-specific materials as 'advantage' with 2026 prices
UPDATE pricing_config SET product_line = 'advantage', value = 10.46, label = 'Advantage Resurfacer (30-gal)' WHERE key = 'resurfacer_per_gal' AND product_line = 'all';
UPDATE pricing_config SET product_line = 'advantage', value = 15.11 WHERE key = 'color_concentrate_per_gal' AND product_line = 'all';
UPDATE pricing_config SET product_line = 'advantage', value = 8.49 WHERE key = 'premium_color_add_on' AND product_line = 'all';

-- Update shared materials to 2026 prices
UPDATE pricing_config SET value = 30.61 WHERE key = 'line_paint_per_gal';
UPDATE pricing_config SET value = 21.00 WHERE key = 'crack_filler_unit';
UPDATE pricing_config SET value = 8.16 WHERE key = 'cushion_granule_per_gal';
UPDATE pricing_config SET value = 8.16 WHERE key = 'cushion_powder_per_gal';

-- Insert active product line setting
INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active, product_line) VALUES
('settings', 'active_product_line', 'Active Product Line', 0, null, '0=advantage, 1=colorflex, 2=masters', 0, true, 'all');
