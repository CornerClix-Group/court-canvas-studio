
-- Phase 3: Add margin protection pricing config rows
INSERT INTO public.pricing_config (category, key, label, value, unit, description, sort_order, product_line) VALUES
  ('margins', 'minimum_job_price', 'Minimum Job Price', 5000, '$', 'Floor price - no estimate goes below this', 10, 'all'),
  ('labor', 'mobilization_flat_rate', 'Mobilization Flat Rate', 1500, '$', 'Base truck roll / setup fee', 10, 'all'),
  ('labor', 'travel_per_mile', 'Travel Cost Per Mile', 2.50, '$/mile', 'Per-mile charge beyond free radius', 11, 'all'),
  ('labor', 'max_free_travel_miles', 'Max Free Travel Miles', 50, 'miles', 'Miles included in mobilization', 12, 'all'),
  ('materials', 'freight_per_drum', 'Freight Per Drum', 75, '$/drum', 'Shipping cost per drum/pail', 20, 'all'),
  ('materials', 'freight_flat_rate', 'Freight Flat Rate', 350, '$', 'Minimum freight charge per order', 21, 'all');
