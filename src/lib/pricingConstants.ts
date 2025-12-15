// =====================================================
// CourtPro Augusta - 2026 Pricing Constants
// Last Updated: January 2026
// =====================================================

// Coverage rates (gallons per square yard) - Source: Laykold Pro Plus Guide
export const COVERAGE_RATES = {
  CUSHION_GRANULE_RATE: 0.20,    // Laykold Pro Plus Guide
  CUSHION_POWDER_RATE: 0.12,    // Laykold Pro Plus Guide
  ACRYLIC_RESURFACER_RATE: 0.06,
  COLOR_COAT_RATE: 0.065,
  ACRYLIC_RATE: 0.05,           // Standard acrylic coverage gal/sq yd/coat
};

// Court dimensions (sq ft)
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

// Surfacing system definitions
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
// 2026 MATERIAL COSTS - Updated from Supplier Quote
// =====================================================
export const MATERIAL_PRICES = {
  // Per gallon costs calculated from drum pricing
  COST_RESURFACER_PER_GAL: 11.73,        // $645.15 per 55-gal drum
  COST_COLOR_PER_GAL: 15.85,             // $871.75 per 55-gal drum
  COST_LINE_PAINT_PER_GAL: 30.61,        // $153.05 per 5-gal pail
  COST_CRACK_FILLER_PER_UNIT: 21.00,     // Per sausage
  COST_PRIME_SEAL_PER_GAL: 18.50,        // 1K PrimeSeal
  
  // Legacy compatibility (keep for existing calculator)
  CUSHION_GRANULE_PER_GAL: 45.00,
  CUSHION_POWDER_PER_GAL: 35.00,
  ACRYLIC_RESURFACER_PER_GAL: 11.73,     // Updated to 2026 price
  COLOR_COAT_PER_GAL: 15.85,             // Updated to 2026 price
  LINE_PAINT_PER_COURT: 75.00,
  GEL_PER_SQFT: 3.50,
};

// Drum sizes for ordering
export const DRUM_SIZES = {
  STANDARD_DRUM: 55, // gallons
  PAIL: 5, // gallons
  COLOR_DRUM: 30, // gallons (color coats often in smaller containers)
};

// =====================================================
// LABOR RATES
// =====================================================
export const LABOR_RATES = {
  SURFACE_PREP_PER_SQFT: 0.50,
  CRACK_REPAIR_PER_LF: 2.50,             // $2.00 labor + materials
  RESURFACING_PER_SQFT: 1.00,
  CUSHION_APPLICATION_PER_SQFT: 0.75,
  LINE_STRIPING_PER_COURT: 150.00,
  PRESSURE_WASH_PER_SQFT: 0.15,          // NEW: Pressure washing
  BIRDBATH_REPAIR_PER_SQFT: 3.50,        // NEW: Patching/leveling
  PRIME_SEAL_PER_SQFT: 0.20,             // NEW: 1K PrimeSeal application
};

// =====================================================
// PROFIT & PRICING DEFAULTS
// =====================================================
export const DEFAULT_PROFIT_MARGIN = 1.4;  // 40% margin (multiply cost by 1.4)
export const MIN_PROFIT_MARGIN = 1.2;      // 20% minimum
export const MAX_PROFIT_MARGIN = 1.8;      // 80% maximum

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
    unitPrice: 3500.00,
    unit: 'pole',
  },
  BENCH_PLAYER: {
    id: 'bench_player',
    name: 'Player Bench (6\')',
    description: 'Aluminum player bench',
    unitPrice: 450.00,
    unit: 'each',
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
    description: 'Install new asphalt surface',
    pricePerSqFt: 4.50,
  },
  POST_TENSION_CONCRETE: {
    id: 'post_tension_concrete',
    name: 'Post-Tension Concrete',
    description: 'Premium crack-resistant concrete base',
    pricePerSqFt: 8.00,
  },
};
