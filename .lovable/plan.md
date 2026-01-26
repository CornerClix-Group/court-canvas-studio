

# Full Pricing System Audit Report

## Summary of Issues Found

I've completed a comprehensive analysis of the entire pricing system. There are **critical mismatches** between the database values, the code constants, and the key naming conventions that are causing pricing inconsistencies.

---

## Issue 1: DATABASE KEY CASING MISMATCH (Root Cause of Repeated Failures)

The `usePricingConfig.ts` hook expects **lowercase** keys (e.g., `resurfacer_per_gal`), but the database has a **mix of uppercase and lowercase**:

| Database Key | Expected by Hook | Status |
|--------------|------------------|--------|
| `RESURFACER_PER_GAL` | `resurfacer_per_gal` | MISMATCH - Not being read |
| `COLOR_CONCENTRATE_PER_GAL` | `color_concentrate_per_gal` | MISMATCH - Not being read |
| `PREMIUM_COLOR_ADD_ON` | `premium_color_add_on` | MISMATCH - Not being read |
| `LINE_PAINT_PER_GAL` | `line_paint_per_gal` | MISMATCH - Not being read |
| `PRIMESEAL_PER_GAL` | `primeseal_per_gal` | MISMATCH - Not being read |
| `CRACK_FILLER_UNIT` | `crack_filler_unit` | MISMATCH - Not being read |
| `cushion_granule_per_gal` | `cushion_granule_per_gal` | OK |
| `cushion_powder_per_gal` | `cushion_powder_per_gal` | OK |
| `primeseal_gal_per_sy` | `primeseal_gal_per_sy` | OK |

**Result**: The system is using hardcoded fallback values instead of database values for 6 material prices.

---

## Issue 2: DATABASE VALUES ARE OUTDATED

Even if the keys matched, the database values are wrong:

| Material | Database Value | Correct 2025 PA3D Value |
|----------|----------------|-------------------------|
| Resurfacer | $11.73/gal | **$10.25/gal** (Advantage) |
| Color Concentrate | $15.85/gal | **$14.81/gal** (Advantage Std) |
| Premium Color Add-on | $8.00/gal | **$8.33/gal** |
| Line Paint | $30.61/gal | **$30.01/gal** |
| PrimeSeal | $45.00/gal | **$45.65/gal** |
| Crack Filler | $25.00/unit | **$20.58/unit** |

---

## Issue 3: CODE CONSTANTS ARE CORRECT (Fallbacks Working)

The `pricingConstants.ts` file has the correct 2025 pricing:
```typescript
RESURFACER_PER_GAL: 10.25,        // ✓ Correct
COLOR_CONCENTRATE_PER_GAL: 14.81, // ✓ Correct
PRIMESEAL_PER_GAL: 45.65,         // ✓ Correct
```

**This is why estimates might appear to work** - the code falls back to these when database lookup fails.

---

## Issue 4: MISSING COVERAGE RATES IN DATABASE

The `COVERAGE` section is incomplete:

| Coverage Rate | In Database? | Value |
|---------------|--------------|-------|
| `acrylic_gal_per_sy` | ✓ Yes | 0.05 |
| `primeseal_gal_per_sy` | ✓ Yes | 0.05 |
| `cushion_granule_gal_per_sy` | ✗ Missing | Should be 0.20 |
| `cushion_powder_gal_per_sy` | ✗ Missing | Should be 0.12 |
| `color_coat_gal_per_sy` | ✗ Missing | Should be 0.065 |

---

## Issue 5: LABEL/DESCRIPTION CLARITY

The Pricing Config page shows generic labels like "Resurfacer" instead of the specific product "Advantage Resurfacer" with pricing source.

---

## Complete Fix Plan

### Step 1: Standardize All Database Keys to Lowercase

Update all uppercase keys in `pricing_config` to lowercase to match the hook's key mapping:

```sql
-- Fix key casing for all materials
UPDATE pricing_config SET key = 'resurfacer_per_gal' WHERE key = 'RESURFACER_PER_GAL';
UPDATE pricing_config SET key = 'color_concentrate_per_gal' WHERE key = 'COLOR_CONCENTRATE_PER_GAL';
UPDATE pricing_config SET key = 'premium_color_add_on' WHERE key = 'PREMIUM_COLOR_ADD_ON';
UPDATE pricing_config SET key = 'line_paint_per_gal' WHERE key = 'LINE_PAINT_PER_GAL';
UPDATE pricing_config SET key = 'primeseal_per_gal' WHERE key = 'PRIMESEAL_PER_GAL';
UPDATE pricing_config SET key = 'crack_filler_unit' WHERE key = 'CRACK_FILLER_UNIT';

-- Fix labor keys
UPDATE pricing_config SET key = 'wash_per_sf' WHERE key = 'WASH_PER_SF';
UPDATE pricing_config SET key = 'crack_repair_per_lf' WHERE key = 'CRACK_REPAIR_PER_LF';
UPDATE pricing_config SET key = 'acrylic_install_per_sf' WHERE key = 'ACRYLIC_INSTALL_PER_SF';
UPDATE pricing_config SET key = 'cushion_install_per_sf' WHERE key = 'CUSHION_INSTALL_PER_SF';
UPDATE pricing_config SET key = 'striping_per_court' WHERE key = 'STRIPING_PER_COURT';
UPDATE pricing_config SET key = 'mobilization' WHERE key = 'MOBILIZATION';
UPDATE pricing_config SET key = 'core_drill_per_hole' WHERE key = 'CORE_DRILL_PER_HOLE';

-- Fix construction keys
UPDATE pricing_config SET key = 'asphalt_paving_per_sf' WHERE key = 'ASPHALT_PAVING_PER_SF';
UPDATE pricing_config SET key = 'concrete_pt_per_sf' WHERE key = 'CONCRETE_PT_PER_SF';
UPDATE pricing_config SET key = 'fencing_10ft_per_lf' WHERE key = 'FENCING_10FT_PER_LF';
UPDATE pricing_config SET key = 'light_pole_unit' WHERE key = 'LIGHT_POLE_UNIT';
UPDATE pricing_config SET key = 'playground_budget' WHERE key = 'PLAYGROUND_BUDGET';

-- Fix equipment keys
UPDATE pricing_config SET key = 'net_post_set' WHERE key = 'NET_POST_SET';
UPDATE pricing_config SET key = 'player_bench_6ft' WHERE key = 'PLAYER_BENCH_6FT';
UPDATE pricing_config SET key = 'windscreen_per_lf' WHERE key = 'WINDSCREEN_PER_LF';
UPDATE pricing_config SET key = 'ball_containment_per_lf' WHERE key = 'BALL_CONTAINMENT_PER_LF';

-- Fix margin keys
UPDATE pricing_config SET key = 'default_margin' WHERE key = 'DEFAULT_MARGIN';
UPDATE pricing_config SET key = 'min_margin' WHERE key = 'MIN_MARGIN';
UPDATE pricing_config SET key = 'max_margin' WHERE key = 'MAX_MARGIN';
```

### Step 2: Update All Values to 2025 PA3D Pricing

```sql
-- Update material prices to 2025 Advantage line
UPDATE pricing_config SET 
  value = 10.25, 
  label = 'Advantage Resurfacer',
  description = '$307.50 / 30gal drum (PA3D 2025)'
WHERE key = 'resurfacer_per_gal';

UPDATE pricing_config SET 
  value = 14.81, 
  label = 'Advantage Color (Standard)',
  description = '$444.30 / 30gal drum (PA3D 2025)'
WHERE key = 'color_concentrate_per_gal';

UPDATE pricing_config SET 
  value = 8.33, 
  label = 'Premium Color Add-on',
  description = 'Extra for US Open Blue ($23.14 - $14.81)'
WHERE key = 'premium_color_add_on';

UPDATE pricing_config SET 
  value = 30.01, 
  label = 'Textured Line Paint',
  description = '$150.05 / 5gal pail (White)'
WHERE key = 'line_paint_per_gal';

UPDATE pricing_config SET 
  value = 45.65, 
  label = '1K PrimeSeal Primer',
  description = '$228.25 / 5gal pail - New concrete prep'
WHERE key = 'primeseal_per_gal';

UPDATE pricing_config SET 
  value = 20.58, 
  label = 'Qualicaulk Crack Filler',
  description = '$247 / 12-pack sausages'
WHERE key = 'crack_filler_unit';
```

### Step 3: Add Missing Coverage Rates

```sql
INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active)
VALUES 
  ('coverage', 'cushion_granule_gal_per_sy', 'Cushion Granule Coverage', 0.20, 'gal_per_sy', 'Laykold Pro Plus Guide', 3, true),
  ('coverage', 'cushion_powder_gal_per_sy', 'Cushion Powder Coverage', 0.12, 'gal_per_sy', 'Laykold Pro Plus Guide', 4, true),
  ('coverage', 'color_coat_gal_per_sy', 'Color Coat Coverage', 0.065, 'gal_per_sy', 'Standard color application rate', 5, true)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, is_active = true;
```

### Step 4: Update Hook Key Mapping (if needed)

The `usePricingConfig.ts` already uses lowercase mappings, so after the database fix, it will work correctly.

---

## Verification Checklist

After implementation, verify:

1. **Pricing Config Page**: Shows "Advantage Resurfacer" at $10.25/gal (not $11.73)
2. **Admin Estimate Builder**: Creates estimates using database values
3. **Sales Estimator**: Uses same database pricing
4. **Material Calculator**: Pulls correct rates from inventory

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Fix key casing + update values + add missing coverage |

No code changes needed - the hook already expects lowercase keys. The issue is purely database key casing.

