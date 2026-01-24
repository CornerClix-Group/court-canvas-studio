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

// Generate customer-friendly grouped line items (hides per-unit costs)
export function generateCustomerLineItems(calculation: CalculationResult): Array<{
  description: string;
  details: string;
  total: number;
  sort_order: number;
}> {
  const items: Array<{
    description: string;
    details: string;
    total: number;
    sort_order: number;
  }> = [];
  
  let sortOrder = 0;
  const profitMultiplier = calculation.profitMargin;
  
  // Surface Preparation (grouped)
  if (calculation.subtotals.condition > 0 || calculation.labor.some(l => l.name.includes('Crack'))) {
    const prepItems: string[] = [];
    
    calculation.conditionWork.forEach(item => {
      if (item.name.includes('Pressure')) prepItems.push('Power washing');
      if (item.name.includes('Birdbath')) prepItems.push('Low spot repair');
      if (item.name.includes('PrimeSeal')) prepItems.push('Surface priming');
    });
    
    // Check if crack repair is in labor
    const crackRepair = calculation.labor.find(l => l.name.includes('Crack'));
    if (crackRepair && crackRepair.total > 0) {
      prepItems.push('Crack repair');
    }
    
    const prepTotal = calculation.subtotals.condition + (crackRepair?.total || 0);
    
    if (prepTotal > 0) {
      items.push({
        description: 'Surface Preparation',
        details: prepItems.length > 0 
          ? `Professional surface preparation including ${prepItems.join(', ').toLowerCase()}`
          : 'Professional surface preparation and cleaning',
        total: prepTotal * profitMultiplier,
        sort_order: sortOrder++,
      });
    }
  }
  
  // Court Surfacing System (grouped materials + surfacing labor)
  const surfacingLabor = calculation.labor.find(l => 
    l.name.includes('Application') || l.name.includes('Surfacing')
  );
  const surfacingTotal = calculation.subtotals.materials + (surfacingLabor?.total || 0);
  
  items.push({
    description: `${calculation.summary.system.name} Surfacing System`,
    details: calculation.summary.system.cushionLayers > 0
      ? `Premium ${calculation.summary.system.forceReduction} force reduction system with ${calculation.summary.system.cushionLayers} cushion layer(s) and ${calculation.summary.system.coats.colorCoat} color coats`
      : `Professional ${calculation.summary.system.forceReduction} force reduction system with ${calculation.summary.system.coats.colorCoat} color coats`,
    total: surfacingTotal * profitMultiplier,
    sort_order: sortOrder++,
  });
  
  // Line Striping (keeps per-court pricing as this is customer-visible)
  const stripingLabor = calculation.labor.find(l => l.name.includes('Striping'));
  const linePaint = calculation.materials.find(m => m.name.includes('Line Paint'));
  const stripingTotal = (stripingLabor?.total || 0) + (linePaint?.total || 0);
  
  if (stripingTotal > 0) {
    const courtCount = stripingLabor?.quantity || linePaint?.quantity || 1;
    items.push({
      description: 'Professional Court Striping',
      details: `Complete line marking for ${courtCount} court${courtCount > 1 ? 's' : ''}`,
      total: stripingTotal * profitMultiplier,
      sort_order: sortOrder++,
    });
  }
  
  // Base/Substrate Work
  if (calculation.subtotals.base > 0) {
    items.push({
      description: 'Site Preparation & Base Work',
      details: 'Substrate preparation and base installation',
      total: calculation.subtotals.base * profitMultiplier,
      sort_order: sortOrder++,
    });
  }
  
  // Add-ons (show individually as customers choose these)
  calculation.addons.forEach(addon => {
    items.push({
      description: addon.name,
      details: addon.quantity > 1 ? `Quantity: ${addon.quantity}` : '',
      total: addon.total * profitMultiplier,
      sort_order: sortOrder++,
    });
  });
  
  // General labor items not already accounted for (prep labor)
  const prepLabor = calculation.labor.find(l => l.name.includes('Surface Preparation'));
  if (prepLabor && prepLabor.total > 0 && calculation.subtotals.condition === 0) {
    // Only add if we didn't already include it above
    items[0] = {
      description: 'Surface Preparation',
      details: 'Professional surface preparation and cleaning',
      total: prepLabor.total * profitMultiplier,
      sort_order: 0,
    };
  }
  
  return items;
}

// Helper interface for customer line items
export interface CustomerLineItem {
  description: string;
  details: string;
  total: number;
  sort_order: number;
}