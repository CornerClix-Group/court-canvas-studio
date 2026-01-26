-- Add Standard Concrete option to pricing_config table
INSERT INTO public.pricing_config (category, key, label, value, unit, description, sort_order, is_active)
VALUES (
  'construction',
  'concrete_standard_per_sf',
  'Standard Concrete (4" Slab)',
  7.25,
  'per_sf',
  'Standard 4" concrete slab installation',
  2,
  true
);