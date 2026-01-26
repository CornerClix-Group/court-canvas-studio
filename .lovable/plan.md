

# Plan: Add Primeseal to Pricing + Material Calculator Tool

## Overview

Two enhancements:
1. Update PrimeSeal pricing to 2025 PA3D rates and add it to the material inventory
2. Create a standalone Material Calculator that estimates how many drums/pails are needed based on court size and number of coats

---

## Part 1: Update PrimeSeal Pricing

### Current State

PrimeSeal already exists in `pricing_config` at $45.00/gal but needs updating with 2025 pricing details.

From the 2025 PA3D Price Sheet:
- **1K PrimeSeal**: $228.25 / 5-gal pail = **$45.65/gal**
- Coverage: Same as acrylic (0.05 gal/sq yd)

### Database Updates

```sql
-- Update PrimeSeal pricing in pricing_config
UPDATE pricing_config SET 
  value = 45.65,
  label = '1K PrimeSeal Primer',
  description = '$228.25 / 5gal pail - For new concrete/moisture mitigation'
WHERE key = 'PRIMESEAL_PER_GAL';

-- Add PrimeSeal coverage rate
INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active)
VALUES ('coverage', 'PRIMESEAL_GAL_PER_SY', 'PrimeSeal Coverage', 0.05, 'gal_per_sy', 'Same as acrylic resurfacer', 2, true);

-- Add PrimeSeal to material_inventory for ordering
INSERT INTO material_inventory (
  product_code, product_name, product_type, product_line, is_primary,
  container_size, container_type, cost_per_gallon, cost_per_container,
  quantity_on_hand, reorder_point
) VALUES (
  'PS-1K-5', '1K PrimeSeal Primer', 'primer', 'standard', true,
  5, 'pail', 45.65, 228.25, 0, 2
);
```

---

## Part 2: Material Calculator Tool

### Purpose

A dedicated calculator that takes court dimensions and desired system, then outputs:
- Exact gallons needed for each material
- Recommended container sizes (drums vs. pails)
- Total material cost breakdown
- Waste percentage for each material

### Calculator Features

```text
+----------------------------------------------------------+
|  Material Calculator                                      |
+----------------------------------------------------------+
|                                                           |
|  COURT DIMENSIONS                                         |
|  ┌────────────────────────────────────────────────────┐   |
|  │ Total Square Feet: [____7200____]                  │   |
|  │                                                     │   |
|  │ Quick Presets:                                     │   |
|  │ [1 Tennis] [2 Pickleball] [4 Pickleball]           │   |
|  └────────────────────────────────────────────────────┘   |
|                                                           |
|  SURFACING SYSTEM                                         |
|  ┌────────────────────────────────────────────────────┐   |
|  │ System: [Pro Plus Standard ▼]                      │   |
|  │ Coats: 2 Granule + 3 Powder + 2 Color              │   |
|  └────────────────────────────────────────────────────┘   |
|                                                           |
|  OPTIONAL MATERIALS                                       |
|  ┌────────────────────────────────────────────────────┐   |
|  │ ☐ Include PrimeSeal (new concrete prep)            │   |
|  │ ☐ Include Resurfacer (existing surface filler)     │   |
|  │   Resurfacer Coats: [_1_]                          │   |
|  └────────────────────────────────────────────────────┘   |
|                                                           |
|  [Calculate Materials]                                    |
|                                                           |
+----------------------------------------------------------+
|                                                           |
|  MATERIAL REQUIREMENTS                 Total: $2,847.50   |
|  ┌────────────────────────────────────────────────────┐   |
|  │ Cushion Plus Granule                               │   |
|  │ Required: 320 gal (800 sq yds × 0.20 × 2 coats)    │   |
|  │                                                     │   |
|  │ RECOMMENDED: 6× 55-gal drums = $2,640.00           │   |
|  │ Provides: 330 gal (10 gal extra / 3% waste)        │   |
|  │                                                     │   |
|  │ Alternative: 5× 55-gal drums = $2,200.00           │   |
|  │ ⚠️ Would need 45 gal more                          │   |
|  └────────────────────────────────────────────────────┘   |
|                                                           |
|  ┌────────────────────────────────────────────────────┐   |
|  │ Cushion Plus Powder                                │   |
|  │ Required: 288 gal (800 sq yds × 0.12 × 3 coats)    │   |
|  │                                                     │   |
|  │ RECOMMENDED: 6× 55-gal drums = $2,640.00           │   |
|  │ Provides: 330 gal (42 gal extra / 13% waste)       │   |
|  └────────────────────────────────────────────────────┘   |
|                                                           |
|  ┌────────────────────────────────────────────────────┐   |
|  │ Advantage Color                                    │   |
|  │ Required: 104 gal (800 sq yds × 0.065 × 2 coats)   │   |
|  │                                                     │   |
|  │ RECOMMENDED: 4× 30-gal drums = $1,777.20           │   |
|  │ Provides: 120 gal (16 gal extra / 13% waste)       │   |
|  │                                                     │   |
|  │ Alternative: 3× 30-gal drums + 3× 5-gal pails      │   |
|  │ = $1,332.90 + $248.70 = $1,581.60 (SAVES $195.60)  │   |
|  └────────────────────────────────────────────────────┘   |
|                                                           |
|  [Copy to Clipboard]  [Add to Order]                      |
+----------------------------------------------------------+
```

### Calculator Logic

The calculator will use the existing `supplyOptimizer.ts` logic but with a simpler interface focused on material planning rather than project conversion.

---

## Part 3: Implementation

### Database Changes

| Change | Description |
|--------|-------------|
| Update `pricing_config` | PrimeSeal to $45.65/gal with proper description |
| Add coverage rate | `PRIMESEAL_GAL_PER_SY` = 0.05 gal/sq yd |
| Add to inventory | 1K PrimeSeal 5-gal pails |
| Add mapping | `usePricingConfig.ts` - Map primeseal_gal_per_sy |

### New Files

| File | Purpose |
|------|---------|
| `src/pages/admin/MaterialCalculator.tsx` | Standalone calculator page |
| `src/lib/materialCalculator.ts` | Pure calculation functions |

### Modified Files

| File | Changes |
|------|---------|
| `src/hooks/usePricingConfig.ts` | Add PrimeSeal coverage mapping |
| `src/lib/pricingConstants.ts` | Add PRIMESEAL_GAL_PER_SY to COVERAGE |
| `src/components/admin/AdminLayout.tsx` | Add "Material Calculator" nav link |
| `src/App.tsx` | Add route for `/admin/calculator` |

---

## Part 4: Calculator Logic

### Material Calculation Formula

```typescript
interface MaterialCalculation {
  squareYards: number;
  coats: number;
  coverageRate: number; // gal per sq yd per coat
  gallonsRequired: number;
  containerOptions: ContainerRecommendation[];
}

function calculateMaterialNeeds(
  sqFt: number,
  system: SystemDefinition,
  options: { primeSeal?: boolean; resurfacerCoats?: number }
): MaterialCalculation[] {
  const sqYards = sqFt / 9;
  const materials: MaterialCalculation[] = [];
  
  // PrimeSeal (if selected)
  if (options.primeSeal) {
    const primeSealGallons = sqYards * COVERAGE.PRIMESEAL_GAL_PER_SY;
    materials.push({
      name: '1K PrimeSeal',
      squareYards: sqYards,
      coats: 1,
      coverageRate: COVERAGE.PRIMESEAL_GAL_PER_SY,
      gallonsRequired: primeSealGallons,
      containerOptions: optimizeContainers('primer', primeSealGallons),
    });
  }
  
  // Resurfacer (if system uses it or manually selected)
  if (system.coats.resurfacer > 0 || options.resurfacerCoats) {
    const coats = options.resurfacerCoats || system.coats.resurfacer;
    const resurfacerGallons = sqYards * COVERAGE.ACRYLIC_GAL_PER_SY * coats;
    materials.push({
      name: 'Advantage Resurfacer',
      squareYards: sqYards,
      coats,
      coverageRate: COVERAGE.ACRYLIC_GAL_PER_SY,
      gallonsRequired: resurfacerGallons,
      containerOptions: optimizeContainers('resurfacer', resurfacerGallons),
    });
  }
  
  // Cushion Granule
  if (system.coats.granule > 0) {
    const granuleGallons = sqYards * COVERAGE.CUSHION_GRANULE_GAL_PER_SY * system.coats.granule;
    materials.push({
      name: 'Cushion Plus Granule',
      squareYards: sqYards,
      coats: system.coats.granule,
      coverageRate: COVERAGE.CUSHION_GRANULE_GAL_PER_SY,
      gallonsRequired: granuleGallons,
      containerOptions: optimizeContainers('cushion', granuleGallons),
    });
  }
  
  // ... similar for Powder, Color Coat
  
  return materials;
}
```

### Container Optimization

Reuses the existing `supplyOptimizer.ts` logic to find the most cost-effective container combination for each material.

---

## Part 5: Navigation

Add "Material Calculator" to the admin sidebar under Tools section:

```text
Admin Sidebar:
├── Dashboard
├── Leads
├── Estimates
├── Projects
├── Customers
├── Invoices
├── Payments
├── Team
├── ─────────────
├── Inventory
├── Material Calculator  ← NEW
├── Pricing Config
```

---

## Technical Notes

### Coverage Rates Reference

| Material | Coverage Rate | Source |
|----------|---------------|--------|
| Resurfacer | 0.05 gal/sq yd | Industry standard |
| Color Coat | 0.065 gal/sq yd | Laykold specs |
| Granule | 0.20 gal/sq yd | Pro Plus guide |
| Powder | 0.12 gal/sq yd | Pro Plus guide |
| PrimeSeal | 0.05 gal/sq yd | Same as resurfacer |

### Integration Points

The Material Calculator will:
1. Fetch current inventory levels from `material_inventory`
2. Use pricing from `pricing_config` (via `usePricingConfig` hook)
3. Apply the smart container optimization from `supplyOptimizer.ts`
4. Allow copy-to-clipboard for ordering purposes

