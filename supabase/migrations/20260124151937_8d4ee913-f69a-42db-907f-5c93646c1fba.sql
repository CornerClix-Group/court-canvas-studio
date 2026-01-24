-- Insert equipment add-ons pricing
INSERT INTO public.pricing_config (category, key, label, value, unit, description, sort_order) VALUES
('equipment', 'NET_POST_SET', 'Net Post Set', 850.00, 'per_set', 'Pair of posts with sleeves', 1),
('equipment', 'PLAYER_BENCH_6FT', 'Player Bench (6ft)', 450.00, 'per_unit', 'Aluminum courtside bench', 2),
('equipment', 'WINDSCREEN_PER_LF', 'Windscreen', 8.50, 'per_lf', 'Privacy/wind mesh per linear foot', 3),
('equipment', 'BALL_CONTAINMENT_PER_LF', 'Ball Containment', 12.00, 'per_lf', 'Netting system per linear foot', 4);