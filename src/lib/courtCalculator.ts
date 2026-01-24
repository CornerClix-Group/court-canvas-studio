import {
  PRICING,
  SURFACING_SYSTEMS,
  MATERIAL_PRICES,
  DRUM_SIZES,
  BASE_OPTIONS,
  type SystemDefinition,
} from './pricingConstants';
import type { DynamicPricing } from '@/hooks/usePricingConfig';

export interface SurfaceCondition {
  pressureWash: boolean;
  birdbathSqFt: number;
  primeSeal: boolean;
}

export interface ConstructionOptions {
  newConstruction: boolean;
  constructionType: 'asphalt' | 'post_tension' | null;
  fencingRequired: boolean;
  fencingLinearFeet: number;
  lightingRequired: boolean;
  lightPoleCount: number;
  playgroundInterest: boolean;
  // Equipment add-ons
  netPostSets: number;
  benchCount: number;
  windscreenLinearFeet: number;
  ballContainmentLinearFeet: number;
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
  constructionOptions?: ConstructionOptions;
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
  constructionItems: MaterialLine[];
  subtotals: {
    materials: number;
    labor: number;
    addons: number;
    base: number;
    condition: number;
    mobilization: number;
    construction: number;
  };
  // Job Cost = What you pay (Materials + Labor + Mobilization + Construction)
  jobCost: number;
  // Profit calculated from margin
  profitAmount: number;
  // Client Price = Job Cost × Margin
  clientPrice: number;
  // For backward compatibility
  costTotal: number;
  grandTotal: number;
  profitMargin: number;
  // Flags
  requiresConsultation: boolean;
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

// Default pricing fallback (uses hardcoded PRICING)
const getDefaultPricing = (): DynamicPricing => ({
  MATERIALS: { ...PRICING.MATERIALS },
  LABOR: { ...PRICING.LABOR },
  CONSTRUCTION: { ...PRICING.CONSTRUCTION },
  EQUIPMENT: { ...PRICING.EQUIPMENT },
  COVERAGE: { ...PRICING.COVERAGE },
  DEFAULT_MARGIN: PRICING.DEFAULT_MARGIN,
  MIN_MARGIN: PRICING.MIN_MARGIN,
  MAX_MARGIN: PRICING.MAX_MARGIN,
});

export function calculateMaterials(config: CourtConfig, dynamicPricing?: DynamicPricing): CalculationResult {
  const pricing = dynamicPricing || getDefaultPricing();
  const sqYards = config.totalSqFt / 9;
  const system = SURFACING_SYSTEMS[config.systemId] || SURFACING_SYSTEMS.HARD_COURT;
  const baseOption = BASE_OPTIONS[config.baseType as keyof typeof BASE_OPTIONS] || BASE_OPTIONS.EXISTING_ASPHALT;
  const profitMargin = config.profitMargin || pricing.DEFAULT_MARGIN;
  
  const materials: MaterialLine[] = [];
  const labor: MaterialLine[] = [];
  const addons: MaterialLine[] = [];
  const conditionWork: MaterialLine[] = [];
  
  // ========== SURFACE CONDITION WORK ==========
  if (config.surfaceCondition) {
    // Pressure Wash (Labor only)
    if (config.surfaceCondition.pressureWash) {
      conditionWork.push({
        name: 'Pressure Washing',
        quantity: config.totalSqFt,
        unit: 'sq ft',
        unitPrice: pricing.LABOR.WASH_PER_SF,
        total: config.totalSqFt * pricing.LABOR.WASH_PER_SF,
        category: 'condition',
      });
    }
    
    // Birdbath / Patching (Combined material + labor)
    if (config.surfaceCondition.birdbathSqFt > 0) {
      conditionWork.push({
        name: 'Birdbath/Low Spot Repair',
        quantity: config.surfaceCondition.birdbathSqFt,
        unit: 'sq ft',
        unitPrice: 3.50, // Combined rate
        total: config.surfaceCondition.birdbathSqFt * 3.50,
        category: 'condition',
      });
    }
    
    // 1K PrimeSeal (Material + Labor)
    if (config.surfaceCondition.primeSeal) {
      // Material cost: coverage rate × price per gallon
      const primeSealGallons = sqYards * pricing.COVERAGE.ACRYLIC_GAL_PER_SY;
      const primeSealMaterialCost = primeSealGallons * pricing.MATERIALS.PRIMESEAL_PER_GAL;
      const primeSealLaborCost = config.totalSqFt * 0.20; // Labor at $0.20/sf
      conditionWork.push({
        name: '1K PrimeSeal Application',
        quantity: config.totalSqFt,
        unit: 'sq ft',
        unitPrice: (primeSealMaterialCost + primeSealLaborCost) / config.totalSqFt,
        total: primeSealMaterialCost + primeSealLaborCost,
        category: 'condition',
      });
    }
  }
  
  // Crack Repair (Material + Labor) - moved here as condition work
  if (config.crackRepairLf > 0) {
    const crackMaterialCost = (config.crackRepairLf / 50) * pricing.MATERIALS.CRACK_FILLER_UNIT; // ~50 LF per unit
    const crackLaborCost = config.crackRepairLf * pricing.LABOR.CRACK_REPAIR_PER_LF;
    conditionWork.push({
      name: 'Crack Repair',
      quantity: config.crackRepairLf,
      unit: 'linear ft',
      unitPrice: (crackMaterialCost + crackLaborCost) / config.crackRepairLf,
      total: crackMaterialCost + crackLaborCost,
      category: 'condition',
    });
  }
  
  // ========== MATERIALS CALCULATION ==========
  if (system.isGelSystem) {
    // Gel system uses per-sqft pricing (material cost)
    const gelMaterialCost = config.totalSqFt * (system.gelSqFtPrice || MATERIAL_PRICES.GEL_PER_SQFT);
    materials.push({
      name: 'Laykold Gel System Material',
      quantity: config.totalSqFt,
      unit: 'sq ft',
      unitPrice: system.gelSqFtPrice || MATERIAL_PRICES.GEL_PER_SQFT,
      total: gelMaterialCost,
      category: 'material',
    });
  } else {
    // Granule coats (for cushion systems)
    if (system.coats.granule > 0) {
      const granuleGallons = sqYards * pricing.COVERAGE.CUSHION_GRANULE_GAL_PER_SY * system.coats.granule;
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
      const powderGallons = sqYards * pricing.COVERAGE.CUSHION_POWDER_GAL_PER_SY * system.coats.powder;
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
      const resurfacerGallons = sqYards * pricing.COVERAGE.ACRYLIC_GAL_PER_SY * system.coats.resurfacer;
      const resurfacerDrums = Math.ceil(resurfacerGallons / DRUM_SIZES.STANDARD_DRUM);
      materials.push({
        name: 'Acrylic Resurfacer',
        quantity: Math.ceil(resurfacerGallons * 10) / 10,
        unit: 'gallon',
        unitPrice: pricing.MATERIALS.RESURFACER_PER_GAL,
        total: resurfacerGallons * pricing.MATERIALS.RESURFACER_PER_GAL,
        drums: resurfacerDrums,
        drumSize: DRUM_SIZES.STANDARD_DRUM,
        category: 'material',
      });
    }
  }
  
  // Color coats (all non-gel systems)
  if (system.coats.colorCoat > 0 && !system.isGelSystem) {
    const colorCoatGallons = sqYards * pricing.COVERAGE.COLOR_COAT_GAL_PER_SY * system.coats.colorCoat;
    const colorCoatDrums = Math.ceil(colorCoatGallons / DRUM_SIZES.COLOR_DRUM);
    materials.push({
      name: 'Laykold ColorFlex',
      quantity: Math.ceil(colorCoatGallons * 10) / 10,
      unit: 'gallon',
      unitPrice: pricing.MATERIALS.COLOR_CONCENTRATE_PER_GAL,
      total: colorCoatGallons * pricing.MATERIALS.COLOR_CONCENTRATE_PER_GAL,
      drums: colorCoatDrums,
      drumSize: DRUM_SIZES.COLOR_DRUM,
      category: 'material',
    });
  }
  
  // Line paint material
  const linePaintGallons = config.numberOfCourts * 0.5; // ~0.5 gal per court
  const linePaintMaterialCost = linePaintGallons * pricing.MATERIALS.LINE_PAINT_PER_GAL;
  materials.push({
    name: 'Line Paint',
    quantity: Math.ceil(linePaintGallons * 10) / 10,
    unit: 'gallon',
    unitPrice: pricing.MATERIALS.LINE_PAINT_PER_GAL,
    total: linePaintMaterialCost,
    category: 'material',
  });
  
  // ========== LABOR CALCULATIONS ==========
  // Acrylic/Surfacing Installation Labor
  const installLaborRate = system.isGelSystem 
    ? pricing.LABOR.CUSHION_INSTALL_PER_SF * 1.5  // Gel is premium install
    : system.cushionLayers > 0 
      ? pricing.LABOR.CUSHION_INSTALL_PER_SF      // $1.25/sf for cushion
      : pricing.LABOR.ACRYLIC_INSTALL_PER_SF;     // $0.65/sf for standard
      
  labor.push({
    name: `${system.shortName} Installation`,
    quantity: config.totalSqFt,
    unit: 'sq ft',
    unitPrice: installLaborRate,
    total: config.totalSqFt * installLaborRate,
    category: 'labor',
  });
  
  // Line striping labor
  labor.push({
    name: 'Court Line Striping',
    quantity: config.numberOfCourts,
    unit: 'court',
    unitPrice: pricing.LABOR.STRIPING_PER_COURT,
    total: config.numberOfCourts * pricing.LABOR.STRIPING_PER_COURT,
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
  
  // ========== CONSTRUCTION & LIGHTING ==========
  const constructionItems: MaterialLine[] = [];
  let requiresConsultation = false;
  
  if (config.constructionOptions) {
    const opts = config.constructionOptions;
    
    // New court construction (asphalt or post-tension)
    if (opts.newConstruction && opts.constructionType) {
      const pricePerSf = opts.constructionType === 'asphalt' 
        ? pricing.CONSTRUCTION.ASPHALT_PAVING_PER_SF 
        : pricing.CONSTRUCTION.CONCRETE_PT_PER_SF;
      const constructionName = opts.constructionType === 'asphalt' 
        ? 'Asphalt Paving (1.5" Overlay)' 
        : 'Post-Tension Concrete Slab';
      constructionItems.push({
        name: constructionName,
        quantity: config.totalSqFt,
        unit: 'sq ft',
        unitPrice: pricePerSf,
        total: config.totalSqFt * pricePerSf,
        category: 'addon',
      });
    }
    
    // Fencing
    if (opts.fencingRequired && opts.fencingLinearFeet > 0) {
      constructionItems.push({
        name: '10\' Black Vinyl Chain Link Fence',
        quantity: opts.fencingLinearFeet,
        unit: 'linear ft',
        unitPrice: pricing.CONSTRUCTION.FENCING_10FT_PER_LF,
        total: opts.fencingLinearFeet * pricing.CONSTRUCTION.FENCING_10FT_PER_LF,
        category: 'addon',
      });
    }
    
    // Lighting
    if (opts.lightingRequired && opts.lightPoleCount > 0) {
      constructionItems.push({
        name: 'LED Court Light Pole (w/ electrical)',
        quantity: opts.lightPoleCount,
        unit: 'pole',
        unitPrice: pricing.CONSTRUCTION.LIGHT_POLE_UNIT,
        total: opts.lightPoleCount * pricing.CONSTRUCTION.LIGHT_POLE_UNIT,
        category: 'addon',
      });
    }
    
    // Playground Interest
    if (opts.playgroundInterest) {
      constructionItems.push({
        name: 'Playground Allowance (Consultation Required)',
        quantity: 1,
        unit: 'allowance',
        unitPrice: pricing.CONSTRUCTION.PLAYGROUND_BUDGET,
        total: pricing.CONSTRUCTION.PLAYGROUND_BUDGET,
        category: 'addon',
      });
      requiresConsultation = true;
    }
    
    // ========== EQUIPMENT ADD-ONS ==========
    // Net Post Sets
    if (opts.netPostSets > 0) {
      constructionItems.push({
        name: 'Net Post Set (pair with sleeves)',
        quantity: opts.netPostSets,
        unit: 'set',
        unitPrice: pricing.EQUIPMENT.NET_POST_SET,
        total: opts.netPostSets * pricing.EQUIPMENT.NET_POST_SET,
        category: 'addon',
      });
    }
    
    // Player Benches
    if (opts.benchCount > 0) {
      constructionItems.push({
        name: '6\' Aluminum Player Bench',
        quantity: opts.benchCount,
        unit: 'bench',
        unitPrice: pricing.EQUIPMENT.PLAYER_BENCH_6FT,
        total: opts.benchCount * pricing.EQUIPMENT.PLAYER_BENCH_6FT,
        category: 'addon',
      });
    }
    
    // Windscreen
    if (opts.windscreenLinearFeet > 0) {
      constructionItems.push({
        name: 'Windscreen Privacy Mesh',
        quantity: opts.windscreenLinearFeet,
        unit: 'linear ft',
        unitPrice: pricing.EQUIPMENT.WINDSCREEN_PER_LF,
        total: opts.windscreenLinearFeet * pricing.EQUIPMENT.WINDSCREEN_PER_LF,
        category: 'addon',
      });
    }
    
    // Ball Containment
    if (opts.ballContainmentLinearFeet > 0) {
      constructionItems.push({
        name: 'Ball Containment Netting',
        quantity: opts.ballContainmentLinearFeet,
        unit: 'linear ft',
        unitPrice: pricing.EQUIPMENT.BALL_CONTAINMENT_PER_LF,
        total: opts.ballContainmentLinearFeet * pricing.EQUIPMENT.BALL_CONTAINMENT_PER_LF,
        category: 'addon',
      });
    }
  }
  
  // ========== BASE COSTS ==========
  const baseCost = config.totalSqFt * baseOption.pricePerSqFt;
  
  // ========== CALCULATE TOTALS ==========
  const materialsSubtotal = materials.reduce((sum, m) => sum + m.total, 0);
  const laborSubtotal = labor.reduce((sum, l) => sum + l.total, 0);
  const addonsSubtotal = addons.reduce((sum, a) => sum + a.total, 0);
  const conditionSubtotal = conditionWork.reduce((sum, c) => sum + c.total, 0);
  const constructionSubtotal = constructionItems.reduce((sum, c) => sum + c.total, 0);
  const mobilizationCost = pricing.LABOR.MOBILIZATION;
  
  // Job Cost = Materials + Labor + Condition + Addons + Base + Construction + Mobilization
  const jobCost = materialsSubtotal + laborSubtotal + addonsSubtotal + baseCost + conditionSubtotal + constructionSubtotal + mobilizationCost;
  
  // Client Price = Job Cost × Margin
  const clientPrice = jobCost * profitMargin;
  const profitAmount = clientPrice - jobCost;
  
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
    constructionItems,
    subtotals: {
      materials: materialsSubtotal,
      labor: laborSubtotal,
      addons: addonsSubtotal,
      base: baseCost,
      condition: conditionSubtotal,
      mobilization: mobilizationCost,
      construction: constructionSubtotal,
    },
    // New naming
    jobCost,
    profitAmount,
    clientPrice,
    // Legacy compatibility
    costTotal: jobCost,
    grandTotal: clientPrice,
    profitMargin,
    // Flags
    requiresConsultation,
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
  text += 'INVESTMENT SUMMARY\n';
  text += '───────────────────────────────────────\n';
  text += `\nTOTAL:         ${formatCurrency(calculation.clientPrice)}\n`;
  text += `Per Sq Ft:     ${formatCurrency(calculation.clientPrice / calculation.summary.totalSqFt)}\n`;
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
  const profitMultiplier = calculation.profitMargin;
  
  // Condition work first (with margin applied)
  calculation.conditionWork.forEach(item => {
    items.push({
      description: item.name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unitPrice * profitMultiplier,
      total: item.total * profitMultiplier,
      sort_order: sortOrder++,
    });
  });
  
  // Materials section (with margin applied)
  calculation.materials.forEach(material => {
    let description = material.name;
    if (material.drums) {
      description += ` (${material.drums} x ${material.drumSize}gal drums)`;
    }
    items.push({
      description,
      quantity: material.quantity,
      unit: material.unit,
      unit_price: material.unitPrice * profitMultiplier,
      total: material.total * profitMultiplier,
      sort_order: sortOrder++,
    });
  });
  
  // Labor section (with margin applied)
  calculation.labor.forEach(laborItem => {
    items.push({
      description: laborItem.name,
      quantity: laborItem.quantity,
      unit: laborItem.unit,
      unit_price: laborItem.unitPrice * profitMultiplier,
      total: laborItem.total * profitMultiplier,
      sort_order: sortOrder++,
    });
  });
  
  // Mobilization fee (with margin applied)
  items.push({
    description: 'Mobilization & Setup',
    quantity: 1,
    unit: 'job',
    unit_price: calculation.subtotals.mobilization * profitMultiplier,
    total: calculation.subtotals.mobilization * profitMultiplier,
    sort_order: sortOrder++,
  });
  
  // Base cost if applicable (with margin applied)
  if (calculation.subtotals.base > 0) {
    items.push({
      description: 'Base/Substrate Work',
      quantity: calculation.summary.totalSqFt,
      unit: 'sq ft',
      unit_price: (calculation.subtotals.base / calculation.summary.totalSqFt) * profitMultiplier,
      total: calculation.subtotals.base * profitMultiplier,
      sort_order: sortOrder++,
    });
  }
  
  // Add-ons (with margin applied)
  calculation.addons.forEach(addon => {
    items.push({
      description: addon.name,
      quantity: addon.quantity,
      unit: addon.unit,
      unit_price: addon.unitPrice * profitMultiplier,
      total: addon.total * profitMultiplier,
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
  if (calculation.subtotals.condition > 0) {
    const prepItems: string[] = [];
    
    calculation.conditionWork.forEach(item => {
      if (item.name.includes('Pressure')) prepItems.push('Power washing');
      if (item.name.includes('Birdbath')) prepItems.push('Low spot repair');
      if (item.name.includes('PrimeSeal')) prepItems.push('Surface priming');
      if (item.name.includes('Crack')) prepItems.push('Crack repair');
    });
    
    items.push({
      description: 'Surface Preparation',
      details: prepItems.length > 0 
        ? `Professional surface preparation including ${prepItems.join(', ').toLowerCase()}`
        : 'Professional surface preparation and cleaning',
      total: calculation.subtotals.condition * profitMultiplier,
      sort_order: sortOrder++,
    });
  }
  
  // Court Surfacing System (grouped materials + surfacing labor)
  const surfacingLabor = calculation.labor.find(l => 
    l.name.includes('Installation') || l.name.includes('Application')
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
  
  // Line Striping
  const stripingLabor = calculation.labor.find(l => l.name.includes('Striping'));
  if (stripingLabor && stripingLabor.total > 0) {
    const courtCount = stripingLabor.quantity || 1;
    items.push({
      description: 'Professional Court Striping',
      details: `Complete line marking for ${courtCount} court${courtCount > 1 ? 's' : ''}`,
      total: stripingLabor.total * profitMultiplier,
      sort_order: sortOrder++,
    });
  }
  
  // Mobilization
  items.push({
    description: 'Mobilization & Project Setup',
    details: 'Equipment delivery, site setup, and project coordination',
    total: calculation.subtotals.mobilization * profitMultiplier,
    sort_order: sortOrder++,
  });
  
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
  
  return items;
}

// Helper interface for customer line items
export interface CustomerLineItem {
  description: string;
  details: string;
  total: number;
  sort_order: number;
}

// Generate marketing-friendly scope bullets for lump sum format
export function generateScopeBullets(calculation: CalculationResult): string[] {
  const bullets: string[] = [];
  
  // Surface preparation bullets
  if (calculation.subtotals.condition > 0) {
    const prepTasks: string[] = [];
    
    calculation.conditionWork.forEach(item => {
      if (item.name.toLowerCase().includes('pressure') || item.name.toLowerCase().includes('wash')) {
        prepTasks.push('complete pressure washing');
      }
      if (item.name.toLowerCase().includes('crack')) {
        prepTasks.push('professional crack repair');
      }
      if (item.name.toLowerCase().includes('birdbath') || item.name.toLowerCase().includes('low spot')) {
        prepTasks.push('low spot leveling');
      }
      if (item.name.toLowerCase().includes('prime') || item.name.toLowerCase().includes('seal')) {
        prepTasks.push('surface priming');
      }
    });
    
    if (prepTasks.length > 0) {
      const uniqueTasks = [...new Set(prepTasks)];
      if (uniqueTasks.length === 1) {
        bullets.push(`Professional ${uniqueTasks[0]} and surface preparation`);
      } else {
        bullets.push(`Complete surface preparation including ${uniqueTasks.slice(0, -1).join(', ')}${uniqueTasks.length > 1 ? ' and ' + uniqueTasks[uniqueTasks.length - 1] : ''}`);
      }
    }
  }
  
  // Surfacing system bullet
  const system = calculation.summary.system;
  if (system.cushionLayers > 0) {
    bullets.push(`${system.name} premium cushioned surfacing system (${system.forceReduction} force reduction)`);
  } else if (system.isGelSystem) {
    bullets.push(`${system.name} gel cushion surfacing system for maximum player comfort`);
  } else {
    bullets.push(`${system.name} acrylic surfacing system with ${system.coats.colorCoat} color coats`);
  }
  
  // Color coats bullet
  if (system.coats.colorCoat > 0) {
    bullets.push(`Professional color application with premium UV-resistant coatings`);
  }
  
  // Line striping bullet
  const stripingLabor = calculation.labor.find(l => l.name.toLowerCase().includes('striping'));
  if (stripingLabor && stripingLabor.quantity > 0) {
    const courtCount = stripingLabor.quantity;
    bullets.push(`Regulation court line striping for ${courtCount} court${courtCount > 1 ? 's' : ''}`);
  }
  
  // Construction items
  calculation.constructionItems.forEach(item => {
    if (item.name.toLowerCase().includes('fence')) {
      bullets.push('10\' black vinyl coated chain link perimeter fencing');
    }
    if (item.name.toLowerCase().includes('light')) {
      bullets.push('LED court lighting system with professional installation');
    }
    if (item.name.toLowerCase().includes('asphalt')) {
      bullets.push('New asphalt paving with proper drainage slope');
    }
    if (item.name.toLowerCase().includes('concrete') || item.name.toLowerCase().includes('post-tension')) {
      bullets.push('Premium post-tension concrete slab construction');
    }
    if (item.name.toLowerCase().includes('net post')) {
      bullets.push('Net post system with ground sleeves');
    }
    if (item.name.toLowerCase().includes('bench')) {
      bullets.push('Courtside player benches');
    }
    if (item.name.toLowerCase().includes('windscreen')) {
      bullets.push('Privacy windscreen installation');
    }
  });
  
  // Add-ons
  calculation.addons.forEach(addon => {
    bullets.push(addon.name);
  });
  
  return bullets;
}

// Display format type for customer-facing estimates
export type EstimateDisplayFormat = 'lump_sum' | 'detailed_scope';
