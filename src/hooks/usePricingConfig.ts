import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PRICING } from '@/lib/pricingConstants';

export type ProductLine = 'advantage' | 'colorflex' | 'masters';

export const PRODUCT_LINE_LABELS: Record<ProductLine, string> = {
  advantage: 'Advantage',
  colorflex: 'ColorFlex',
  masters: 'Masters (ColorCoat)',
};

export interface PricingConfigRow {
  id: string;
  category: string;
  key: string;
  label: string;
  value: number;
  unit: string | null;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  product_line: string;
}

export interface DynamicPricing {
  MATERIALS: {
    RESURFACER_PER_GAL: number;
    COLOR_CONCENTRATE_PER_GAL: number;
    PREMIUM_COLOR_ADD_ON: number;
    LINE_PAINT_PER_GAL: number;
    PRIMESEAL_PER_GAL: number;
    CRACK_FILLER_UNIT: number;
    CUSHION_GRANULE_PER_GAL: number;
    CUSHION_POWDER_PER_GAL: number;
  };
  LABOR: {
    WASH_PER_SF: number;
    CRACK_REPAIR_PER_LF: number;
    ACRYLIC_INSTALL_PER_SF: number;
    CUSHION_INSTALL_PER_SF: number;
    STRIPING_PER_COURT: number;
    MOBILIZATION: number;
    CORE_DRILL_PER_HOLE: number;
  };
  CONSTRUCTION: {
    ASPHALT_PAVING_PER_SF: number;
    CONCRETE_STANDARD_PER_SF: number;
    CONCRETE_PT_PER_SF: number;
    FENCING_10FT_PER_LF: number;
    LIGHT_POLE_UNIT: number;
    PLAYGROUND_BUDGET: number;
  };
  EQUIPMENT: {
    NET_POST_SET: number;
    PLAYER_BENCH_6FT: number;
    WINDSCREEN_PER_LF: number;
    BALL_CONTAINMENT_PER_LF: number;
  };
  COVERAGE: {
    ACRYLIC_GAL_PER_SY: number;
    CUSHION_GRANULE_GAL_PER_SY: number;
    CUSHION_POWDER_GAL_PER_SY: number;
    COLOR_COAT_GAL_PER_SY: number;
    PRIMESEAL_GAL_PER_SY: number;
  };
  DEFAULT_MARGIN: number;
  MIN_MARGIN: number;
  MAX_MARGIN: number;
}

const PRODUCT_LINE_KEYS = ['resurfacer_per_gal', 'color_concentrate_per_gal', 'premium_color_add_on'];

const keyMapping: Record<string, { category: keyof DynamicPricing | 'margins'; subKey: string }> = {
  resurfacer_per_gal: { category: 'MATERIALS', subKey: 'RESURFACER_PER_GAL' },
  color_concentrate_per_gal: { category: 'MATERIALS', subKey: 'COLOR_CONCENTRATE_PER_GAL' },
  premium_color_add_on: { category: 'MATERIALS', subKey: 'PREMIUM_COLOR_ADD_ON' },
  line_paint_per_gal: { category: 'MATERIALS', subKey: 'LINE_PAINT_PER_GAL' },
  primeseal_per_gal: { category: 'MATERIALS', subKey: 'PRIMESEAL_PER_GAL' },
  crack_filler_unit: { category: 'MATERIALS', subKey: 'CRACK_FILLER_UNIT' },
  cushion_granule_per_gal: { category: 'MATERIALS', subKey: 'CUSHION_GRANULE_PER_GAL' },
  cushion_powder_per_gal: { category: 'MATERIALS', subKey: 'CUSHION_POWDER_PER_GAL' },
  wash_per_sf: { category: 'LABOR', subKey: 'WASH_PER_SF' },
  crack_repair_per_lf: { category: 'LABOR', subKey: 'CRACK_REPAIR_PER_LF' },
  acrylic_install_per_sf: { category: 'LABOR', subKey: 'ACRYLIC_INSTALL_PER_SF' },
  cushion_install_per_sf: { category: 'LABOR', subKey: 'CUSHION_INSTALL_PER_SF' },
  striping_per_court: { category: 'LABOR', subKey: 'STRIPING_PER_COURT' },
  mobilization: { category: 'LABOR', subKey: 'MOBILIZATION' },
  core_drill_per_hole: { category: 'LABOR', subKey: 'CORE_DRILL_PER_HOLE' },
  asphalt_paving_per_sf: { category: 'CONSTRUCTION', subKey: 'ASPHALT_PAVING_PER_SF' },
  concrete_standard_per_sf: { category: 'CONSTRUCTION', subKey: 'CONCRETE_STANDARD_PER_SF' },
  concrete_pt_per_sf: { category: 'CONSTRUCTION', subKey: 'CONCRETE_PT_PER_SF' },
  fencing_10ft_per_lf: { category: 'CONSTRUCTION', subKey: 'FENCING_10FT_PER_LF' },
  light_pole_unit: { category: 'CONSTRUCTION', subKey: 'LIGHT_POLE_UNIT' },
  playground_budget: { category: 'CONSTRUCTION', subKey: 'PLAYGROUND_BUDGET' },
  net_post_set: { category: 'EQUIPMENT', subKey: 'NET_POST_SET' },
  player_bench_6ft: { category: 'EQUIPMENT', subKey: 'PLAYER_BENCH_6FT' },
  windscreen_per_lf: { category: 'EQUIPMENT', subKey: 'WINDSCREEN_PER_LF' },
  ball_containment_per_lf: { category: 'EQUIPMENT', subKey: 'BALL_CONTAINMENT_PER_LF' },
  acrylic_gal_per_sy: { category: 'COVERAGE', subKey: 'ACRYLIC_GAL_PER_SY' },
  cushion_granule_gal_per_sy: { category: 'COVERAGE', subKey: 'CUSHION_GRANULE_GAL_PER_SY' },
  cushion_powder_gal_per_sy: { category: 'COVERAGE', subKey: 'CUSHION_POWDER_GAL_PER_SY' },
  color_coat_gal_per_sy: { category: 'COVERAGE', subKey: 'COLOR_COAT_GAL_PER_SY' },
  primeseal_gal_per_sy: { category: 'COVERAGE', subKey: 'PRIMESEAL_GAL_PER_SY' },
  default_margin: { category: 'margins', subKey: 'DEFAULT_MARGIN' },
  min_margin: { category: 'margins', subKey: 'MIN_MARGIN' },
  max_margin: { category: 'margins', subKey: 'MAX_MARGIN' },
};

function buildPricingFromRows(rows: PricingConfigRow[], activeProductLine: ProductLine): DynamicPricing {
  const pricing: DynamicPricing = {
    MATERIALS: { ...PRICING.MATERIALS },
    LABOR: { ...PRICING.LABOR },
    CONSTRUCTION: { ...PRICING.CONSTRUCTION },
    EQUIPMENT: { ...PRICING.EQUIPMENT },
    COVERAGE: { ...PRICING.COVERAGE },
    DEFAULT_MARGIN: PRICING.DEFAULT_MARGIN,
    MIN_MARGIN: PRICING.MIN_MARGIN,
    MAX_MARGIN: PRICING.MAX_MARGIN,
  };

  for (const row of rows) {
    if (!row.is_active || row.category === 'settings') continue;

    const mapping = keyMapping[row.key];
    if (!mapping) continue;

    // For product-line-specific keys, only use the active product line's values
    if (PRODUCT_LINE_KEYS.includes(row.key)) {
      if (row.product_line !== activeProductLine) continue;
    } else {
      // For shared keys, use 'all' rows
      if (row.product_line !== 'all') continue;
    }

    if (mapping.category === 'margins') {
      if (mapping.subKey === 'DEFAULT_MARGIN') pricing.DEFAULT_MARGIN = row.value;
      else if (mapping.subKey === 'MIN_MARGIN') pricing.MIN_MARGIN = row.value;
      else if (mapping.subKey === 'MAX_MARGIN') pricing.MAX_MARGIN = row.value;
    } else {
      const cat = pricing[mapping.category] as Record<string, number>;
      cat[mapping.subKey] = row.value;
    }
  }

  return pricing;
}

// Fetch active product line from DB
export function useActiveProductLine() {
  return useQuery({
    queryKey: ['active-product-line'],
    queryFn: async (): Promise<ProductLine> => {
      const { data } = await supabase
        .from('pricing_config')
        .select('value')
        .eq('category', 'settings')
        .eq('key', 'active_product_line')
        .single();

      const val = data?.value ?? 0;
      if (val === 1) return 'colorflex';
      if (val === 2) return 'masters';
      return 'advantage';
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePricingConfig() {
  const { data: activeProductLine } = useActiveProductLine();
  const productLine = activeProductLine ?? 'advantage';

  return useQuery({
    queryKey: ['pricing-config', productLine],
    queryFn: async (): Promise<DynamicPricing> => {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching pricing config:', error);
        return getDefaultPricing();
      }

      return buildPricingFromRows((data || []) as PricingConfigRow[], productLine);
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

export async function fetchPricingConfig(): Promise<DynamicPricing> {
  // First get active product line
  const { data: settingsData } = await supabase
    .from('pricing_config')
    .select('value')
    .eq('category', 'settings')
    .eq('key', 'active_product_line')
    .single();

  const val = settingsData?.value ?? 0;
  const productLine: ProductLine = val === 1 ? 'colorflex' : val === 2 ? 'masters' : 'advantage';

  const { data, error } = await supabase
    .from('pricing_config')
    .select('*')
    .eq('is_active', true);

  if (error || !data) return getDefaultPricing();
  return buildPricingFromRows(data as PricingConfigRow[], productLine);
}

export function getDefaultPricing(): DynamicPricing {
  return {
    MATERIALS: { ...PRICING.MATERIALS },
    LABOR: { ...PRICING.LABOR },
    CONSTRUCTION: { ...PRICING.CONSTRUCTION },
    EQUIPMENT: { ...PRICING.EQUIPMENT },
    COVERAGE: { ...PRICING.COVERAGE },
    DEFAULT_MARGIN: PRICING.DEFAULT_MARGIN,
    MIN_MARGIN: PRICING.MIN_MARGIN,
    MAX_MARGIN: PRICING.MAX_MARGIN,
  };
}
