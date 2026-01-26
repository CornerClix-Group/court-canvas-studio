-- Update Resurfacer to Advantage
UPDATE pricing_config SET 
  value = 10.25,
  label = 'Advantage Resurfacer',
  description = '$307.50 / 30gal drum (Advantage)'
WHERE key = 'resurfacer_per_gal';

-- Update Color to Advantage Standard
UPDATE pricing_config SET 
  value = 14.81,
  label = 'Advantage Color',
  description = '$444.30 / 30gal drum (Standard colors)'
WHERE key = 'color_concentrate_per_gal';

-- Update Premium Color Add-on
UPDATE pricing_config SET 
  value = 8.33,
  description = 'Extra for US Open Blue ($23.14 - $14.81)'
WHERE key = 'premium_color_add_on';

-- Update Line Paint
UPDATE pricing_config SET 
  value = 30.01,
  description = '$150.05 / 5gal pail (White)'
WHERE key = 'line_paint_per_gal';

-- Update Crack Filler
UPDATE pricing_config SET 
  value = 20.58,
  description = '$247 / 12-pack sausages'
WHERE key = 'crack_filler_unit';