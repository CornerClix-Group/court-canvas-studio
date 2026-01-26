/**
 * Material Calculator
 * Calculates material requirements based on court size, system type, and coating options.
 * Uses the supply optimizer to recommend the best container combinations.
 */

import { PRICING, SURFACING_SYSTEMS, SystemDefinition, COURT_PRESETS } from './pricingConstants';
import { 
  ContainerOption, 
  MaterialRequirement, 
  SupplyRecommendation,
  optimizeSupplyOrder 
} from './supplyOptimizer';

// Coverage rates (gallons per square yard per coat)
export const COVERAGE_RATES = {
  PRIMESEAL: 0.05,          // Same as resurfacer
  RESURFACER: 0.05,         // Industry standard
  COLOR_COAT: 0.065,        // Laykold specs
  CUSHION_GRANULE: 0.20,    // Pro Plus guide
  CUSHION_POWDER: 0.12,     // Pro Plus guide
};

export interface MaterialCalculation {
  name: string;
  productType: string;
  squareYards: number;
  coats: number;
  coverageRate: number;
  gallonsRequired: number;
  formula: string;
  recommendation?: SupplyRecommendation;
}

export interface CalculatorOptions {
  includePrimeSeal?: boolean;
  includeResurfacer?: boolean;
  resurfacerCoats?: number;
  customCoats?: {
    granule?: number;
    powder?: number;
    colorCoat?: number;
  };
}

export interface CalculatorResult {
  sqFt: number;
  sqYards: number;
  system: SystemDefinition;
  materials: MaterialCalculation[];
  totalMaterialCost: number;
  options: CalculatorOptions;
}

/**
 * Calculate all material needs for a project
 */
export function calculateMaterialNeeds(
  sqFt: number,
  systemId: string,
  options: CalculatorOptions = {},
  availableContainers?: ContainerOption[]
): CalculatorResult {
  const sqYards = sqFt / 9;
  const system = SURFACING_SYSTEMS[systemId] || SURFACING_SYSTEMS.HARD_COURT;
  const materials: MaterialCalculation[] = [];

  // PrimeSeal (if selected for new concrete)
  if (options.includePrimeSeal) {
    const coats = 1;
    const gallons = sqYards * COVERAGE_RATES.PRIMESEAL * coats;
    const calc: MaterialCalculation = {
      name: '1K PrimeSeal Primer',
      productType: 'primer',
      squareYards: sqYards,
      coats,
      coverageRate: COVERAGE_RATES.PRIMESEAL,
      gallonsRequired: Math.ceil(gallons * 10) / 10,
      formula: `${sqYards.toFixed(1)} sq yds × ${COVERAGE_RATES.PRIMESEAL} gal/sy × ${coats} coat`,
    };
    
    if (availableContainers) {
      calc.recommendation = optimizeSupplyOrder(
        { productType: 'primer', productName: calc.name, gallonsRequired: calc.gallonsRequired },
        availableContainers
      );
    }
    
    materials.push(calc);
  }

  // Resurfacer (for surface prep/filler)
  const resurfacerCoats = options.resurfacerCoats || (options.includeResurfacer ? 1 : 0);
  if (resurfacerCoats > 0) {
    const gallons = sqYards * COVERAGE_RATES.RESURFACER * resurfacerCoats;
    const calc: MaterialCalculation = {
      name: 'Advantage Resurfacer',
      productType: 'resurfacer',
      squareYards: sqYards,
      coats: resurfacerCoats,
      coverageRate: COVERAGE_RATES.RESURFACER,
      gallonsRequired: Math.ceil(gallons * 10) / 10,
      formula: `${sqYards.toFixed(1)} sq yds × ${COVERAGE_RATES.RESURFACER} gal/sy × ${resurfacerCoats} coat${resurfacerCoats > 1 ? 's' : ''}`,
    };
    
    if (availableContainers) {
      calc.recommendation = optimizeSupplyOrder(
        { productType: 'resurfacer', productName: calc.name, gallonsRequired: calc.gallonsRequired },
        availableContainers
      );
    }
    
    materials.push(calc);
  }

  // Cushion Granule (for cushion systems)
  const granuleCoats = options.customCoats?.granule ?? system.coats.granule;
  if (granuleCoats > 0) {
    const gallons = sqYards * COVERAGE_RATES.CUSHION_GRANULE * granuleCoats;
    const calc: MaterialCalculation = {
      name: 'Cushion Plus Granule',
      productType: 'cushion',
      squareYards: sqYards,
      coats: granuleCoats,
      coverageRate: COVERAGE_RATES.CUSHION_GRANULE,
      gallonsRequired: Math.ceil(gallons * 10) / 10,
      formula: `${sqYards.toFixed(1)} sq yds × ${COVERAGE_RATES.CUSHION_GRANULE} gal/sy × ${granuleCoats} coats`,
    };
    
    if (availableContainers) {
      calc.recommendation = optimizeSupplyOrder(
        { productType: 'cushion', productName: calc.name, gallonsRequired: calc.gallonsRequired },
        availableContainers
      );
    }
    
    materials.push(calc);
  }

  // Cushion Powder (for cushion systems)
  const powderCoats = options.customCoats?.powder ?? system.coats.powder;
  if (powderCoats > 0) {
    const gallons = sqYards * COVERAGE_RATES.CUSHION_POWDER * powderCoats;
    const calc: MaterialCalculation = {
      name: 'Cushion Plus Powder',
      productType: 'cushion',
      squareYards: sqYards,
      coats: powderCoats,
      coverageRate: COVERAGE_RATES.CUSHION_POWDER,
      gallonsRequired: Math.ceil(gallons * 10) / 10,
      formula: `${sqYards.toFixed(1)} sq yds × ${COVERAGE_RATES.CUSHION_POWDER} gal/sy × ${powderCoats} coats`,
    };
    
    if (availableContainers) {
      calc.recommendation = optimizeSupplyOrder(
        { productType: 'cushion', productName: calc.name, gallonsRequired: calc.gallonsRequired },
        availableContainers
      );
    }
    
    materials.push(calc);
  }

  // Color Coat (always required)
  const colorCoats = options.customCoats?.colorCoat ?? system.coats.colorCoat;
  if (colorCoats > 0) {
    const gallons = sqYards * COVERAGE_RATES.COLOR_COAT * colorCoats;
    const calc: MaterialCalculation = {
      name: 'Advantage Color',
      productType: 'color',
      squareYards: sqYards,
      coats: colorCoats,
      coverageRate: COVERAGE_RATES.COLOR_COAT,
      gallonsRequired: Math.ceil(gallons * 10) / 10,
      formula: `${sqYards.toFixed(1)} sq yds × ${COVERAGE_RATES.COLOR_COAT} gal/sy × ${colorCoats} coats`,
    };
    
    if (availableContainers) {
      calc.recommendation = optimizeSupplyOrder(
        { productType: 'color', productName: calc.name, gallonsRequired: calc.gallonsRequired },
        availableContainers
      );
    }
    
    materials.push(calc);
  }

  // Line Paint (estimate 2 gallons per court for full striping)
  // This is typically included but calculated separately based on court count
  // For now, we'll add a placeholder that can be customized

  // Calculate total cost from recommendations
  const totalMaterialCost = materials.reduce((total, mat) => {
    return total + (mat.recommendation?.selectedOption?.totalCost || 0);
  }, 0);

  return {
    sqFt,
    sqYards,
    system,
    materials,
    totalMaterialCost,
    options,
  };
}

/**
 * Get quick preset calculations
 */
export function getPresetCalculation(
  presetKey: keyof typeof COURT_PRESETS,
  systemId: string,
  options: CalculatorOptions = {},
  availableContainers?: ContainerOption[]
): CalculatorResult {
  const preset = COURT_PRESETS[presetKey];
  return calculateMaterialNeeds(preset.sqFt, systemId, options, availableContainers);
}

/**
 * Format gallons for display
 */
export function formatGallons(gallons: number): string {
  if (gallons >= 100) {
    return Math.round(gallons).toLocaleString();
  }
  return gallons.toFixed(1);
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cost);
}

/**
 * Calculate waste percentage for display
 */
export function formatWaste(provided: number, required: number): string {
  const waste = provided - required;
  const percent = (waste / provided) * 100;
  return `${waste.toFixed(1)} gal extra (${percent.toFixed(0)}% waste)`;
}
