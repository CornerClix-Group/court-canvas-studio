-- Create pricing_config table to store configurable pricing values
CREATE TABLE public.pricing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'materials', 'labor', 'construction', 'coverage', 'margins'
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT, -- 'per_gal', 'per_sf', 'per_lf', 'per_unit', 'flat', 'multiplier'
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- Enable RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Only authenticated admin/staff can read pricing config
CREATE POLICY "Authenticated users can view pricing config" 
ON public.pricing_config 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Only owners/admins can modify pricing
CREATE POLICY "Admins can modify pricing config" 
ON public.pricing_config 
FOR ALL 
USING (public.is_admin_or_staff(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_pricing_config_updated_at
BEFORE UPDATE ON public.pricing_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pricing values (2026 rates)
INSERT INTO public.pricing_config (category, key, label, value, unit, description, sort_order) VALUES
-- Materials (Laykold 2026)
('materials', 'RESURFACER_PER_GAL', 'Resurfacer', 11.73, 'per_gal', '$645.15 / 55gal drum', 1),
('materials', 'COLOR_CONCENTRATE_PER_GAL', 'Color Concentrate', 15.85, 'per_gal', '$871.75 / 55gal drum', 2),
('materials', 'PREMIUM_COLOR_ADD_ON', 'Premium Color Add-on', 8.00, 'per_gal', 'Extra for US Open Blue', 3),
('materials', 'LINE_PAINT_PER_GAL', 'Line Paint', 30.61, 'per_gal', '$153.05 / 5gal pail', 4),
('materials', 'PRIMESEAL_PER_GAL', 'PrimeSeal', 45.00, 'per_gal', 'For new concrete', 5),
('materials', 'CRACK_FILLER_UNIT', 'Crack Filler', 25.00, 'per_unit', 'Per gallon/sausage', 6),

-- Labor (Subcontractor rates)
('labor', 'WASH_PER_SF', 'Pressure Wash', 0.12, 'per_sf', 'Surface cleaning', 1),
('labor', 'CRACK_REPAIR_PER_LF', 'Crack Repair', 2.00, 'per_lf', 'Route & clean', 2),
('labor', 'ACRYLIC_INSTALL_PER_SF', 'Acrylic Install', 0.65, 'per_sf', 'Squeegee application (3 coats)', 3),
('labor', 'CUSHION_INSTALL_PER_SF', 'Cushion Install', 1.25, 'per_sf', 'Premium cushion install', 4),
('labor', 'STRIPING_PER_COURT', 'Line Striping', 450.00, 'per_court', 'Flat rate per court', 5),
('labor', 'MOBILIZATION', 'Mobilization', 1500.00, 'flat', 'Truck roll / Setup fee', 6),
('labor', 'CORE_DRILL_PER_HOLE', 'Core Drill', 250.00, 'per_unit', 'Post installation', 7),

-- Construction (New builds)
('construction', 'ASPHALT_PAVING_PER_SF', 'Asphalt Paving', 4.50, 'per_sf', '1.5" Overlay installed', 1),
('construction', 'CONCRETE_PT_PER_SF', 'Post-Tension Concrete', 9.00, 'per_sf', 'Post-Tension Slab', 2),
('construction', 'FENCING_10FT_PER_LF', 'Fencing (10ft)', 32.00, 'per_lf', 'Black Vinyl Chain Link', 3),
('construction', 'LIGHT_POLE_UNIT', 'Light Pole', 5500.00, 'per_unit', 'Per pole installed w/ electrical', 4),
('construction', 'PLAYGROUND_BUDGET', 'Playground Allowance', 25000.00, 'flat', 'Small playground starting price', 5),

-- Coverage rates
('coverage', 'ACRYLIC_GAL_PER_SY', 'Acrylic Coverage', 0.05, 'gal_per_sy', 'Industry standard coverage', 1),

-- Margins
('margins', 'DEFAULT_MARGIN', 'Default Margin', 1.40, 'multiplier', '40% Gross Margin', 1),
('margins', 'MIN_MARGIN', 'Minimum Margin', 1.30, 'multiplier', '30% minimum allowed', 2),
('margins', 'MAX_MARGIN', 'Maximum Margin', 1.60, 'multiplier', '60% maximum allowed', 3);