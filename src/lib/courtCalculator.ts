import {
  COVERAGE_RATES,
  SURFACING_SYSTEMS,
  MATERIAL_PRICES,
  DRUM_SIZES,
  LABOR_RATES,
  BASE_OPTIONS,
  DEFAULT_PROFIT_MARGIN,
  type SystemDefinition,
} from './pricingConstants';

export interface SurfaceCondition {
  pressureWash: boolean;
  birdbathSqFt: number;
  primeSeal: boolean;
}

export interface CourtConfig {
  projectType: string;
  totalSqFt: number;
  numberOfCourts: number;
  systemId: string;
  baseType: string;
  crackRepairLf: number;
  addons: Array<{ id: string; quantity: number; unitPrice: number; name: string }>;
  surfaceCondition?: SurfaceCondition;
  profitMargin?: number;
  innerColor?: string;
  outerColor?: string;
  stripingType?: 'pickleball' | 'tennis' | 'both';
}

export interface MaterialLine {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  drums?: number;
  drumSize?: number;
  category?: 'material' | 'labor' | 'addon' | 'condition';
}

export interface CalculationResult {
  materials: MaterialLine[];
  labor: MaterialLine[];
  addons: MaterialLine[];
  conditionWork: MaterialLine[];
  subtotals: {
    materials: number;
    labor: number;
    addons: number;
    base: number;
    condition: number;
  };
  costTotal: number;       // Total before profit
  profitAmount: number;    // Profit margin amount
  grandTotal: number;      // Final price with profit
  profitMargin: number;    // Applied margin (e.g., 1.4 = 40%)
  summary: {
    totalSqFt: number;
    totalSqYds: number;
    system: SystemDefinition;
    drumCounts: {
      granule55Gal: number;
      powder55Gal: number;
      colorCoat30Gal: number;
      resurfacer55Gal: number;
    };
  };
}

export function calculateMaterials(config: CourtConfig): CalculationResult {
  const sqYards = config.totalSqFt / 9;
  const system = SURFACING_SYSTEMS[config.systemId] || SURFACING_SYSTEMS.HARD_COURT;
  const baseOption = BASE_OPTIONS[config.baseType as keyof typeof BASE_OPTIONS] || BASE_OPTIONS.EXISTING_ASPHALT;
  const profitMargin = config.profitMargin || DEFAULT_PROFIT_MARGIN;
  
  const materials: MaterialLine[] = [];
  const labor: MaterialLine[] = [];
  const addons: MaterialLine[] = [];
  const conditionWork: MaterialLine[] = [];
  
  // ========== SURFACE CONDITION WORK ==========
  if (config.surfaceCondition) {
    // Pressure Wash
    if (config.surfaceCondition.pressureWash) {
      conditionWork.push({
        name: 'Pressure Washing',
        quantity: config.totalSqFt,
        unit: 'sq ft',
        unitPrice: LABOR_RATES.PRESSURE_WASH_PER_SQFT,
        total: config.totalSqFt * LABOR_RATES.PRESSURE_WASH_PER_SQFT,
        category: 'condition',
      });
    }
    
    // Birdbath / Patching
    if (config.surfaceCondition.birdbathSqFt > 0) {
      conditionWork.push({
        name: 'Birdbath/Low Spot Repair',
        quantity: config.surfaceCondition.birdbathSqFt,
        unit: 'sq ft',
        unitPrice: LABOR_RATES.BIRDBATH_REPAIR_PER_SQFT,
        total: config.surfaceCondition.birdbathSqFt * LABOR_RATES.BIRDBATH_REPAIR_PER_SQFT,
        category: 'condition',
      });
    }
    
    // 1K PrimeSeal
    if (config.surfaceCondition.primeSeal) {
      const primeSealMaterialCost = config.totalSqFt * (LABOR_RATES.PRIME_SEAL_PER_SQFT);
      conditionWork.push({
        name: '1K PrimeSeal Application',
        quantity: config.totalSqFt,
        unit: 'sq ft',
        unitPrice: LABOR_RATES.PRIME_SEAL_PER_SQFT,
        total: primeSealMaterialCost,
        category: 'condition',
      });
    }
  }
  
  // ========== MATERIALS CALCULATION ==========
  if (system.isGelSystem) {
    // Gel system uses per-sqft pricing
    const gelTotal = config.totalSqFt * (system.gelSqFtPrice || MATERIAL_PRICES.GEL_PER_SQFT);
    materials.push({
      name: 'Laykold Gel System',
      quantity: config.totalSqFt,
      unit: 'sq ft',
      unitPrice: system.gelSqFtPrice || MATERIAL_PRICES.GEL_PER_SQFT,
      total: gelTotal,
      category: 'material',
    });
  } else {
    // Granule coats (for cushion systems)
    if (system.coats.granule > 0) {
      const granuleGallons = sqYards * COVERAGE_RATES.CUSHION_GRANULE_RATE * system.coats.granule;
      const granuleDrums = Math.ceil(granuleGallons / DRUM_SIZES.STANDARD_DRUM);
      materials.push({
        name: 'Laykold Cushion Plus Granule',
        quantity: Math.ceil(granuleGallons * 10) / 10,
        unit: 'gallon',
        unitPrice: MATERIAL_PRICES.CUSHION_GRANULE_PER_GAL,
        total: granuleGallons * MATERIAL_PRICES.CUSHION_GRANULE_PER_GAL,
        drums: granuleDrums,
        drumSize: DRUM_SIZES.STANDARD_DRUM,
        category: 'material',
      });
    }
    
    // Powder coats (for cushion systems)
    if (system.coats.powder > 0) {
      const powderGallons = sqYards * COVERAGE_RATES.CUSHION_POWDER_RATE * system.coats.powder;
      const powderDrums = Math.ceil(powderGallons / DRUM_SIZES.STANDARD_DRUM);
      materials.push({
        name: 'Laykold Cushion Plus Powder',
        quantity: Math.ceil(powderGallons * 10) / 10,
        unit: 'gallon',
        unitPrice: MATERIAL_PRICES.CUSHION_POWDER_PER_GAL,
        total: powderGallons * MATERIAL_PRICES.CUSHION_POWDER_PER_GAL,
        drums: powderDrums,
        drumSize: DRUM_SIZES.STANDARD_DRUM,
        category: 'material',
      });
    }
    
    // Resurfacer (for hard court systems)
    if (system.coats.resurfacer > 0) {
      const resurfacerGallons = sqYards * COVERAGE_RATES.ACRYLIC_RESURFACER_RATE * system.coats.resurfacer;
      const resurfacerDrums = Math.ceil(resurfacerGallons / DRUM_SIZES.STANDARD_DRUM);
      materials.push({
        name: 'Acrylic Resurfacer',
        quantity: Math.ceil(resurfacerGallons * 10) / 10,
        unit: 'gallon',
        unitPrice: MATERIAL_PRICES.ACRYLIC_RESURFACER_PER_GAL,
        total: resurfacerGallons * MATERIAL_PRICES.ACRYLIC_RESURFACER_PER_GAL,
        drums: resurfacerDrums,
        drumSize: DRUM_SIZES.STANDARD_DRUM,
        category: 'material',
      });
    }
  }
  
  // Color coats (all systems except gel if handled separately)
  if (system.coats.colorCoat > 0 && !system.isGelSystem) {
    const colorCoatGallons = sqYards * COVERAGE_RATES.COLOR_COAT_RATE * system.coats.colorCoat;
    const colorCoatDrums = Math.ceil(colorCoatGallons / DRUM_SIZES.COLOR_DRUM);
    materials.push({
      name: 'Laykold ColorFlex',
      quantity: Math.ceil(colorCoatGallons * 10) / 10,
      unit: 'gallon',
      unitPrice: MATERIAL_PRICES.COLOR_COAT_PER_GAL,
      total: colorCoatGallons * MATERIAL_PRICES.COLOR_COAT_PER_GAL,
      drums: colorCoatDrums,
      drumSize: DRUM_SIZES.COLOR_DRUM,
      category: 'material',
    });
  }
  
  // Line paint
  const linePaintTotal = config.numberOfCourts * MATERIAL_PRICES.LINE_PAINT_PER_COURT;
  materials.push({
    name: 'Line Paint',
    quantity: config.numberOfCourts,
    unit: 'court',
    unitPrice: MATERIAL_PRICES.LINE_PAINT_PER_COURT,
    total: linePaintTotal,
    category: 'material',
  });
  
  // ========== LABOR CALCULATIONS ==========
  // Surface prep
  labor.push({
    name: 'Surface Preparation',
    quantity: config.totalSqFt,
    unit: 'sq ft',
    unitPrice: LABOR_RATES.SURFACE_PREP_PER_SQFT,
    total: config.totalSqFt * LABOR_RATES.SURFACE_PREP_PER_SQFT,
    category: 'labor',
  });
  
  // Crack repair if applicable
  if (config.crackRepairLf > 0) {
    labor.push({
      name: 'Crack Repair',
      quantity: config.crackRepairLf,
      unit: 'linear ft',
      unitPrice: LABOR_RATES.CRACK_REPAIR_PER_LF,
      total: config.crackRepairLf * LABOR_RATES.CRACK_REPAIR_PER_LF,
      category: 'labor',
    });
  }
  
  // Surfacing labor
  const surfacingLaborRate = system.isGelSystem 
    ? LABOR_RATES.CUSHION_APPLICATION_PER_SQFT * 1.5 
    : system.cushionLayers > 0 
      ? LABOR_RATES.CUSHION_APPLICATION_PER_SQFT 
      : LABOR_RATES.RESURFACING_PER_SQFT;
      
  labor.push({
    name: `${system.shortName} Application`,
    quantity: config.totalSqFt,
    unit: 'sq ft',
    unitPrice: surfacingLaborRate,
    total: config.totalSqFt * surfacingLaborRate,
    category: 'labor',
  });
  
  // Line striping
  labor.push({
    name: 'Court Line Striping',
    quantity: config.numberOfCourts,
    unit: 'court',
    unitPrice: LABOR_RATES.LINE_STRIPING_PER_COURT,
    total: config.numberOfCourts * LABOR_RATES.LINE_STRIPING_PER_COURT,
    category: 'labor',
  });
  
  // ========== ADD-ONS ==========
  config.addons.forEach(addon => {
    addons.push({
      name: addon.name,
      quantity: addon.quantity,
      unit: 'each',
      unitPrice: addon.unitPrice,
      total: addon.quantity * addon.unitPrice,
      category: 'addon',
    });
  });
  
  // ========== BASE COSTS ==========
  const baseCost = config.totalSqFt * baseOption.pricePerSqFt;
  
  // ========== CALCULATE TOTALS ==========
  const materialsSubtotal = materials.reduce((sum, m) => sum + m.total, 0);
  const laborSubtotal = labor.reduce((sum, l) => sum + l.total, 0);
  const addonsSubtotal = addons.reduce((sum, a) => sum + a.total, 0);
  const conditionSubtotal = conditionWork.reduce((sum, c) => sum + c.total, 0);
  
  // Cost before profit
  const costTotal = materialsSubtotal + laborSubtotal + addonsSubtotal + baseCost + conditionSubtotal;
  
  // Apply profit margin
  const grandTotal = costTotal * profitMargin;
  const profitAmount = grandTotal - costTotal;
  
  // Drum counts for ordering summary
  const drumCounts = {
    granule55Gal: materials.find(m => m.name.includes('Granule'))?.drums || 0,
    powder55Gal: materials.find(m => m.name.includes('Powder'))?.drums || 0,
    colorCoat30Gal: materials.find(m => m.name.includes('ColorFlex'))?.drums || 0,
    resurfacer55Gal: materials.find(m => m.name.includes('Resurfacer'))?.drums || 0,
  };
  
  return {
    materials,
    labor,
    addons,
    conditionWork,
    subtotals: {
      materials: materialsSubtotal,
      labor: laborSubtotal,
      addons: addonsSubtotal,
      base: baseCost,
      condition: conditionSubtotal,
    },
    costTotal,
    profitAmount,
    grandTotal,
    profitMargin,
    summary: {
      totalSqFt: config.totalSqFt,
      totalSqYds: sqYards,
      system,
      drumCounts,
    },
  };
}

// Generate quote text for clipboard
export function generateQuoteText(calculation: CalculationResult, clientInfo?: {
  projectName?: string;
  contactName?: string;
  email?: string;
}): string {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  
  let text = '═══════════════════════════════════════\n';
  text += '           COURTPRO AUGUSTA\n';
  text += '         Court Surfacing Estimate\n';
  text += '═══════════════════════════════════════\n\n';
  
  if (clientInfo?.projectName) {
    text += `Project: ${clientInfo.projectName}\n`;
  }
  if (clientInfo?.contactName) {
    text += `Contact: ${clientInfo.contactName}\n`;
  }
  text += `Date: ${new Date().toLocaleDateString()}\n\n`;
  
  text += '───────────────────────────────────────\n';
  text += 'PROJECT DETAILS\n';
  text += '───────────────────────────────────────\n';
  text += `Total Area: ${calculation.summary.totalSqFt.toLocaleString()} sq ft\n`;
  text += `System: ${calculation.summary.system.name}\n`;
  if (calculation.summary.system.cushionLayers > 0) {
    text += `Cushion Layers: ${calculation.summary.system.cushionLayers}\n`;
  }
  text += `Force Reduction: ${calculation.summary.system.forceReduction}\n\n`;
  
  text += '───────────────────────────────────────\n';
  text += 'PRICING SUMMARY\n';
  text += '───────────────────────────────────────\n';
  text += `Materials:     ${formatCurrency(calculation.subtotals.materials)}\n`;
  text += `Labor:         ${formatCurrency(calculation.subtotals.labor)}\n`;
  if (calculation.subtotals.condition > 0) {
    text += `Prep Work:     ${formatCurrency(calculation.subtotals.condition)}\n`;
  }
  if (calculation.subtotals.addons > 0) {
    text += `Add-ons:       ${formatCurrency(calculation.subtotals.addons)}\n`;
  }
  if (calculation.subtotals.base > 0) {
    text += `Base Work:     ${formatCurrency(calculation.subtotals.base)}\n`;
  }
  text += '───────────────────────────────────────\n';
  text += `TOTAL:         ${formatCurrency(calculation.grandTotal)}\n`;
  text += '═══════════════════════════════════════\n\n';
  
  text += 'CourtPro Augusta | (706) 309-1993\n';
  text += 'estimates@courtproaugusta.com\n';
  
  return text;
}

// Helper to generate estimate line items from calculation
export function generateLineItems(calculation: CalculationResult): Array<{
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  sort_order: number;
}> {
  const items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total: number;
    sort_order: number;
  }> = [];
  
  let sortOrder = 0;
  
  // Condition work first
  calculation.conditionWork.forEach(item => {
    items.push({
      description: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitPrice,
      total: item.total,
      sort_order: sortOrder++,
    });
  });
  
  // Materials section
  calculation.materials.forEach(material => {
    let description = material.name;
    if (material.drums) {
      description += ` (${material.drums} x ${material.drumSize}gal drums)`;
    }
    items.push({
      description,
      quantity: material.quantity,
      unit: material.unit,
      unit_price: material.unitPrice,
      total: material.total,
      sort_order: sortOrder++,
    });
  });
  
  // Labor section
  calculation.labor.forEach(laborItem => {
    items.push({
      description: laborItem.name,
      quantity: laborItem.quantity,
      unit: laborItem.unit,
      unit_price: laborItem.unitPrice,
      total: laborItem.total,
      sort_order: sortOrder++,
    });
  });
  
  // Base cost if applicable
  if (calculation.subtotals.base > 0) {
    items.push({
      description: 'Base/Substrate Work',
      quantity: calculation.summary.totalSqFt,
      unit: 'sq ft',
      unit_price: calculation.subtotals.base / calculation.summary.totalSqFt,
      total: calculation.subtotals.base,
      sort_order: sortOrder++,
    });
  }
  
  // Add-ons
  calculation.addons.forEach(addon => {
    items.push({
      description: addon.name,
      quantity: addon.quantity,
      unit: addon.unit,
      unit_price: addon.unitPrice,
      total: addon.total,
      sort_order: sortOrder++,
    });
  });
  
  return items;
}