

# Plan: Fix Database Pricing to Use Advantage Resurfacer

## What Happened

The previous migration added the cushion pricing rows correctly but failed to update the existing material prices. The database still shows old pricing from 2024.

## Current vs. Correct Pricing

| Material | Current (Database) | Correct (2025 PA3D) |
|----------|-------------------|---------------------|
| Resurfacer | $11.73 "Resurfacer" | **$10.25** "Advantage Resurfacer" |
| Color Concentrate | $15.85 | **$14.81** "Advantage Color" |
| Premium Color Add-on | $8.00 | **$8.33** |
| Line Paint | $30.61 | **$30.01** |
| Crack Filler | $25.00 | **$20.58** |

## The Fix

Run a database migration to update the material pricing with correct 2025 Advantage product line values:

```sql
-- Update Resurfacer to Advantage
UPDATE pricing_config SET 
  value = 10.25,
  label = 'Advantage Resurfacer',
  description = '$307.50 / 30gal drum (Advantage)'
WHERE key = 'RESURFACER_PER_GAL';

-- Update Color to Advantage Standard
UPDATE pricing_config SET 
  value = 14.81,
  label = 'Advantage Color',
  description = '$444.30 / 30gal drum (Standard colors)'
WHERE key = 'COLOR_CONCENTRATE_PER_GAL';

-- Update Premium Color Add-on
UPDATE pricing_config SET 
  value = 8.33,
  description = 'Extra for US Open Blue ($23.14 - $14.81)'
WHERE key = 'PREMIUM_COLOR_ADD_ON';

-- Update Line Paint
UPDATE pricing_config SET 
  value = 30.01,
  description = '$150.05 / 5gal pail (White)'
WHERE key = 'LINE_PAINT_PER_GAL';

-- Update Crack Filler
UPDATE pricing_config SET 
  value = 20.58,
  description = '$247 / 12-pack sausages'
WHERE key = 'CRACK_FILLER_UNIT';
```

## Result After Fix

The Pricing Config page will show:
- **Advantage Resurfacer** at $10.25/gal (instead of generic "Resurfacer" at $11.73)
- **Advantage Color** at $14.81/gal
- All other materials with correct 2025 pricing

This ensures all estimates use the proper Advantage product line pricing.

