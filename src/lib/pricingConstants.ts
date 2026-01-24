// =====================================================
// CourtPro Augusta - 2026 Pricing Constants
// Last Updated: January 2026
// =====================================================

// =====================================================
// MAIN PRICING OBJECT - 2026 Market Rates
// =====================================================
export const PRICING = {
  // --- MATERIALS (Laykold 2026 Price Sheet) ---
  MATERIALS: {
    RESURFACER_PER_GAL: 11.73,        // $645.15 / 55gal drum
    COLOR_CONCENTRATE_PER_GAL: 15.85, // $871.75 / 55gal drum
    PREMIUM_COLOR_ADD_ON: 8.00,       // Extra for US Open Blue/Purple
    LINE_PAINT_PER_GAL: 30.61,        // $153.05 / 5gal pail
    PRIMESEAL_PER_GAL: 45.00,         // For new concrete
    CRACK_FILLER_UNIT: 25.00,         // Per gallon/sausage estimate
  },

  // --- LABOR & SUBS (2025 GA Market Standards) ---
  LABOR: {
    WASH_PER_SF: 0.12,                // Pressure washing
    CRACK_REPAIR_PER_LF: 2.00,        // Route & clean
    ACRYLIC_INSTALL_PER_SF: 0.65,     // Squeegee application (3 coats)
    CUSHION_INSTALL_PER_SF: 1.25,     // Premium cushion install
    STRIPING_PER_COURT: 450.00,       // Flat rate per court
    MOBILIZATION: 1500.00,            // Truck roll / Setup fee
    CORE_DRILL_PER_HOLE: 250.00,      // Post installation
  },

  // --- CONSTRUCTION & ADD-ONS ---
  CONSTRUCTION: {
    ASPHALT_PAVING_PER_SF: 4.50,      // 1.5" Overlay installed
    CONCRETE_PT_PER_SF: 9.00,         // Post-Tension Slab
    FENCING_10FT_PER_LF: 32.00,       // Black Vinyl Chain Link (bumped for safety)
    LIGHT_POLE_UNIT: 5500.00,         // Per pole w/ base + electrical
    PLAYGROUND_BUDGET: 25000.00,      // Starting price for small playground
  },

  // --- COVERAGE RATES ---
  COVERAGE: {
    ACRYLIC_GAL_PER_SY: 0.05,         // Industry standard per coat
    CUSHION_GRANULE_GAL_PER_SY: 0.20, // Laykold Pro Plus Guide
    CUSHION_POWDER_GAL_PER_SY: 0.12,  // Laykold Pro Plus Guide
    COLOR_COAT_GAL_PER_SY: 0.065,     // Color coat coverage
  },

  // --- MARGIN SETTINGS ---
  DEFAULT_MARGIN: 1.40,               // 40% Gross Margin
  MIN_MARGIN: 1.30,                   // 30% minimum
  MAX_MARGIN: 1.60,                   // 60% maximum
};

// =====================================================
// LEGACY EXPORTS (Backward Compatibility)
// =====================================================
export const COVERAGE_RATES = {
  CUSHION_GRANULE_RATE: PRICING.COVERAGE.CUSHION_GRANULE_GAL_PER_SY,
  CUSHION_POWDER_RATE: PRICING.COVERAGE.CUSHION_POWDER_GAL_PER_SY,
  ACRYLIC_RESURFACER_RATE: 0.06,
  COLOR_COAT_RATE: PRICING.COVERAGE.COLOR_COAT_GAL_PER_SY,
  ACRYLIC_RATE: PRICING.COVERAGE.ACRYLIC_GAL_PER_SY,
};

export const MATERIAL_PRICES = {
  // 2026 prices from PRICING object
  COST_RESURFACER_PER_GAL: PRICING.MATERIALS.RESURFACER_PER_GAL,
  COST_COLOR_PER_GAL: PRICING.MATERIALS.COLOR_CONCENTRATE_PER_GAL,
  COST_LINE_PAINT_PER_GAL: PRICING.MATERIALS.LINE_PAINT_PER_GAL,
  COST_CRACK_FILLER_PER_UNIT: PRICING.MATERIALS.CRACK_FILLER_UNIT,
  COST_PRIME_SEAL_PER_GAL: PRICING.MATERIALS.PRIMESEAL_PER_GAL,
  
  // Legacy compatibility
  CUSHION_GRANULE_PER_GAL: 45.00,
  CUSHION_POWDER_PER_GAL: 35.00,
  ACRYLIC_RESURFACER_PER_GAL: PRICING.MATERIALS.RESURFACER_PER_GAL,
  COLOR_COAT_PER_GAL: PRICING.MATERIALS.COLOR_CONCENTRATE_PER_GAL,
  COLOR_PREMIUM_PER_GAL: PRICING.MATERIALS.COLOR_CONCENTRATE_PER_GAL + PRICING.MATERIALS.PREMIUM_COLOR_ADD_ON,
  LINE_PAINT_PER_COURT: 75.00, // Estimate per court for material
  GEL_PER_SQFT: 3.50,
};

export const LABOR_RATES = {
  // Updated to 2025 GA market standards
  SURFACE_PREP_PER_SQFT: 0.00,        // Included in install rate
  CRACK_REPAIR_PER_LF: PRICING.LABOR.CRACK_REPAIR_PER_LF,
  RESURFACING_PER_SQFT: PRICING.LABOR.ACRYLIC_INSTALL_PER_SF,
  CUSHION_APPLICATION_PER_SQFT: PRICING.LABOR.CUSHION_INSTALL_PER_SF,
  LINE_STRIPING_PER_COURT: PRICING.LABOR.STRIPING_PER_COURT,
  PRESSURE_WASH_PER_SQFT: PRICING.LABOR.WASH_PER_SF,
  BIRDBATH_REPAIR_PER_SQFT: 3.50,     // Material + labor combined
  PRIME_SEAL_PER_SQFT: 0.20,          // Application labor (material separate)
  CORE_DRILL_PER_HOLE: PRICING.LABOR.CORE_DRILL_PER_HOLE,
  MOBILIZATION: PRICING.LABOR.MOBILIZATION,
};

export const DEFAULT_PROFIT_MARGIN = PRICING.DEFAULT_MARGIN;
export const MIN_PROFIT_MARGIN = PRICING.MIN_MARGIN;
export const MAX_PROFIT_MARGIN = PRICING.MAX_MARGIN;

// =====================================================
// COURT DIMENSIONS (sq ft)
// =====================================================
export const COURT_SIZES = {
  // Pickleball
  PICKLEBALL_SINGLE: 880,       // 20' x 44' (playing area only)
  PICKLEBALL_RECREATIONAL: 1800, // 30' x 60' (with buffer)
  PICKLEBALL_TOURNAMENT: 2520,  // 34' x 64' (USA Pickleball recommended)
  
  // Tennis
  TENNIS_FULL: 7200,            // 60' x 120'
  TENNIS_DOUBLES: 6240,         // 78' x 80' (court only, less runback)
  
  // Basketball
  BASKETBALL_FULL: 4700,        // 50' x 94'
  BASKETBALL_HALF: 2350,        // 50' x 47'
  BASKETBALL_PRO: 5040,         // 50' x 94' + buffer
};

// Standard court configurations for quick selection
export const COURT_PRESETS = {
  PICKLEBALL_1: { courts: 1, sqFt: 1800, label: "1 Pickleball Court (30' x 60')" },
  PICKLEBALL_2: { courts: 2, sqFt: 3600, label: "2 Pickleball Courts (60' x 60')" },
  PICKLEBALL_4: { courts: 4, sqFt: 7200, label: "4 Pickleball Courts (60' x 120')" },
  PICKLEBALL_6: { courts: 6, sqFt: 10800, label: "6 Pickleball Courts (90' x 120')" },
  TENNIS_1: { courts: 1, sqFt: 7200, label: "1 Tennis Court (60' x 120')" },
  TENNIS_2: { courts: 2, sqFt: 14400, label: "2 Tennis Courts (120' x 120')" },
  BASKETBALL_FULL: { courts: 1, sqFt: 4700, label: "Full Basketball Court (50' x 94')" },
  BASKETBALL_HALF: { courts: 1, sqFt: 2350, label: "Half Basketball Court (50' x 47')" },
};

// Drum sizes for ordering
export const DRUM_SIZES = {
  STANDARD_DRUM: 55, // gallons
  PAIL: 5, // gallons
  COLOR_DRUM: 30, // gallons (color coats often in smaller containers)
};

// =====================================================
// SURFACING SYSTEMS
// =====================================================
export interface SystemDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  benefits: string[];
  cushionLayers: number;
  forceReduction: string;
  isGelSystem?: boolean;
  gelSqFtPrice?: number;
  coats: {
    resurfacer: number;
    colorCoat: number;
    granule: number;
    powder: number;
  };
  priceMultiplier: number;
  badge?: string;
}

export const SURFACING_SYSTEMS: Record<string, SystemDefinition> = {
  HARD_COURT: {
    id: 'hard_court',
    name: 'Hard Court (Basic)',
    shortName: 'Hard Court',
    description: 'Entry level durability - Standard acrylic surface',
    benefits: [
      'Economical option',
      'Durable surface',
      'Low maintenance',
    ],
    cushionLayers: 0,
    forceReduction: '0%',
    coats: {
      resurfacer: 1,
      colorCoat: 2,
      granule: 0,
      powder: 0,
    },
    priceMultiplier: 1.0,
  },
  PRO_PLUS_STANDARD: {
    id: 'pro_plus_standard',
    name: 'Pickleball Pro Plus (Standard)',
    shortName: 'Pro Plus Standard',
    description: 'Good comfort (5 cushion layers)',
    benefits: [
      '5 cushion layers',
      'Reduced joint stress',
      'Enhanced playability',
    ],
    cushionLayers: 5,
    forceReduction: '~12%',
    coats: {
      resurfacer: 0,
      colorCoat: 2,
      granule: 2,
      powder: 3,
    },
    priceMultiplier: 1.4,
    badge: 'Popular',
  },
  PRO_PLUS_XTREME: {
    id: 'pro_plus_xtreme',
    name: 'Pickleball Pro Plus (Xtreme)',
    shortName: 'Pro Plus Xtreme',
    description: 'Enhanced comfort (6 cushion layers)',
    benefits: [
      '6 cushion layers',
      'Superior shock absorption',
      'Extended play sessions',
    ],
    cushionLayers: 6,
    forceReduction: '~14%',
    coats: {
      resurfacer: 0,
      colorCoat: 2,
      granule: 3,
      powder: 3,
    },
    priceMultiplier: 1.6,
  },
  PRO_PLUS_SUPREME: {
    id: 'pro_plus_supreme',
    name: 'Pickleball Pro Plus (Supreme)',
    shortName: 'Pro Plus Supreme',
    description: 'Maximum comfort (7 cushion layers) - Reduces fatigue',
    benefits: [
      '7 cushion layers',
      'Maximum force reduction',
      'Professional grade comfort',
      'Ideal for high-volume play',
    ],
    cushionLayers: 7,
    forceReduction: '~16%',
    coats: {
      resurfacer: 0,
      colorCoat: 2,
      granule: 4,
      powder: 3,
    },
    priceMultiplier: 1.8,
    badge: 'Best Comfort',
  },
  PICKLEBALL_GEL: {
    id: 'pickleball_gel',
    name: 'Laykold Gel',
    shortName: 'Laykold Gel',
    description: 'Advanced force reduction (17% force reduction)',
    benefits: [
      '17% force reduction',
      'Advanced cushioning technology',
      'Premium playing experience',
      'Consistent performance',
    ],
    cushionLayers: 0,
    forceReduction: '17%',
    isGelSystem: true,
    gelSqFtPrice: 3.50,
    coats: {
      resurfacer: 0,
      colorCoat: 2,
      granule: 0,
      powder: 0,
    },
    priceMultiplier: 2.0,
    badge: 'Premium',
  },
};

// =====================================================
// PROJECT TYPES
// =====================================================
export const PROJECT_TYPES = {
  NEW_CONSTRUCTION: { id: 'new_construction', name: 'New Construction', iconName: 'Building' },
  RESURFACING: { id: 'resurfacing', name: 'Resurfacing', iconName: 'RefreshCw' },
  REPAIR_ONLY: { id: 'repair_only', name: 'Repair Only', iconName: 'Wrench' },
  PICKLEBALL: { id: 'pickleball', name: 'Pickleball', iconName: 'Target' },
  TENNIS: { id: 'tennis', name: 'Tennis', iconName: 'Circle' },
  BASKETBALL: { id: 'basketball', name: 'Basketball', iconName: 'CircleDot' },
  MULTI_SPORT: { id: 'multi_sport', name: 'Multi-Sport', iconName: 'LayoutGrid' },
};

// =====================================================
// COAT SYSTEMS (for simplified selection)
// =====================================================
export const COAT_SYSTEMS = {
  TWO_COAT: { 
    id: 'two_coat', 
    name: '2-Coat Color', 
    description: 'Basic color system',
    coats: 2,
    multiplier: 1.0,
  },
  THREE_COAT: { 
    id: 'three_coat', 
    name: '3-Coat Standard', 
    description: 'Standard durability',
    coats: 3,
    multiplier: 1.25,
  },
  CUSHION: { 
    id: 'cushion', 
    name: 'Cushion System', 
    description: 'Maximum comfort',
    coats: 5,
    multiplier: 1.6,
  },
};

// =====================================================
// LAYKOLD COLOR OPTIONS
// =====================================================
export const LAYKOLD_COLORS = [
  { id: 'burgundy', name: 'Burgundy', hex: '#722F37' },
  { id: 'dark_green', name: 'Dark Green', hex: '#1B4D3E' },
  { id: 'light_green', name: 'Light Green', hex: '#90EE90' },
  { id: 'dark_blue', name: 'Dark Blue', hex: '#00008B' },
  { id: 'light_blue', name: 'Light Blue', hex: '#ADD8E6' },
  { id: 'red', name: 'Red', hex: '#C41E3A' },
  { id: 'terra_cotta', name: 'Terra Cotta', hex: '#E2725B' },
  { id: 'sand', name: 'Sand', hex: '#C2B280' },
  { id: 'gray', name: 'Gray', hex: '#808080' },
  { id: 'slate', name: 'Slate', hex: '#708090' },
  { id: 'purple', name: 'Purple', hex: '#663399' },
  { id: 'black', name: 'Black', hex: '#1a1a1a' },
];

// =====================================================
// ADD-ON ITEMS
// =====================================================
export const ADDONS = {
  NET_POST_PICKLEBALL: {
    id: 'net_post_pickleball',
    name: 'Pickleball Net Post System',
    description: 'Professional grade net posts with sleeves',
    unitPrice: 450.00,
    unit: 'set',
  },
  NET_POST_TENNIS: {
    id: 'net_post_tennis',
    name: 'Tennis Net Post System',
    description: 'Regulation tennis posts with center strap',
    unitPrice: 850.00,
    unit: 'set',
  },
  WINDSCREEN_10FT: {
    id: 'windscreen_10ft',
    name: 'Windscreen (10\' sections)',
    description: 'Privacy windscreen for fence lines',
    unitPrice: 35.00,
    unit: 'section',
  },
  LED_LIGHTING_POLE: {
    id: 'led_lighting_pole',
    name: 'LED Lighting Pole',
    description: 'Professional LED court lighting',
    unitPrice: PRICING.CONSTRUCTION.LIGHT_POLE_UNIT,
    unit: 'pole',
  },
  BENCH_PLAYER: {
    id: 'bench_player',
    name: 'Player Bench (6\')',
    description: 'Aluminum player bench',
    unitPrice: 450.00,
    unit: 'each',
  },
  CORE_DRILLING: {
    id: 'core_drilling',
    name: 'Core Drilling',
    description: 'Post hole drilling for net posts',
    unitPrice: PRICING.LABOR.CORE_DRILL_PER_HOLE,
    unit: 'hole',
  },
};

// =====================================================
// BASE/SUBSTRATE OPTIONS
// =====================================================
export const BASE_OPTIONS = {
  EXISTING_ASPHALT: {
    id: 'existing_asphalt',
    name: 'Existing Asphalt',
    description: 'Resurface existing asphalt court',
    pricePerSqFt: 0,
  },
  EXISTING_CONCRETE: {
    id: 'existing_concrete',
    name: 'Existing Concrete',
    description: 'Resurface existing concrete court',
    pricePerSqFt: 0,
  },
  NEW_ASPHALT: {
    id: 'new_asphalt',
    name: 'New Asphalt Base',
    description: 'Install new 1.5" asphalt overlay',
    pricePerSqFt: PRICING.CONSTRUCTION.ASPHALT_PAVING_PER_SF,
  },
  POST_TENSION_CONCRETE: {
    id: 'post_tension_concrete',
    name: 'Post-Tension Concrete',
    description: 'Premium crack-resistant concrete base',
    pricePerSqFt: PRICING.CONSTRUCTION.CONCRETE_PT_PER_SF,
  },
};
