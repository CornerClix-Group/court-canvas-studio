
# Plan: Advantage Resurfacer Pricing Update + Inventory Management

## Overview

Transition the pricing system from Acrylic Resurfacer (AR) to **Advantage Resurfacer** as the primary product line, update all material costs to 2025 PA3D pricing, and implement an inventory management system to track material stock levels.

---

## Part 1: Pricing Updates (Immediate)

### Current vs. New Pricing (2025 PA3D Price Sheet)

| Material | Current | New (2025) | Change |
|----------|---------|------------|--------|
| Resurfacer (Advantage) | $11.73/gal | $10.25/gal | -$1.48 |
| Color Concentrate (Advantage std) | $15.85/gal | $14.81/gal | -$1.04 |
| Premium Color Add-on | $8.00/gal | $8.33/gal | +$0.33 |
| Line Paint (White) | $30.61/gal | $30.01/gal | -$0.60 |
| Cushion Plus Granule | $45.00/gal | $8.00/gal | -$37.00 |
| Cushion Plus Powder | $35.00/gal | $8.00/gal | -$27.00 |
| Crack Filler (Qualicaulk) | $25.00/unit | $20.58/sausage | -$4.42 |

### Premium Color Pricing (US Open, etc.)

| Color Tier | Advantage Price/gal | Premium Add-on |
|------------|---------------------|----------------|
| Standard Colors | $14.81 | $0 |
| Royal Purple | $19.92 | +$5.11 |
| US Open Green | $19.61 | +$4.80 |
| US Open Blue | $23.14 | +$8.33 |
| Miami Open | $14.99 - $17.18 | +$0.18 - $2.37 |

---

## Part 2: Product Hierarchy (Primary/Backup)

### Surfacing Products

| Use Case | Primary Product | Backup Product |
|----------|-----------------|----------------|
| Filler/Resurfacer | Advantage Acrylic Resurfacer (30-gal) | Acrylic Resurfacer (55-gal) |
| Color Coats | Advantage (30-gal) | ColorFlex (55-gal) |
| Cushion Base | Cushion Plus Granule | No backup |
| Cushion Topcoat | Cushion Plus Powder | No backup |

### When to Use Backup Products

- Advantage unavailable from supplier
- Large commercial project where 55-gal drums are more efficient
- Special color only available in ColorFlex line

---

## Part 3: Database Changes

### A. Update pricing_config Table

Update the existing material costs in the database:

```sql
-- Update to 2025 Advantage pricing
UPDATE pricing_config SET 
  value = 10.25,
  label = 'Advantage Resurfacer',
  description = '$307.50 / 30gal drum (Advantage)'
WHERE key = 'RESURFACER_PER_GAL';

UPDATE pricing_config SET 
  value = 14.81,
  label = 'Advantage Color',
  description = '$444.30 / 30gal drum (Standard colors)'
WHERE key = 'COLOR_CONCENTRATE_PER_GAL';

UPDATE pricing_config SET 
  value = 8.33,
  description = 'Extra for US Open Blue ($23.14 - $14.81)'
WHERE key = 'PREMIUM_COLOR_ADD_ON';

UPDATE pricing_config SET 
  value = 30.01,
  description = '$150.05 / 5gal pail (White)'
WHERE key = 'LINE_PAINT_PER_GAL';

UPDATE pricing_config SET 
  value = 20.58,
  description = '$247 / 12-pack sausages'
WHERE key = 'CRACK_FILLER_UNIT';
```

### B. Add Cushion Material Pricing (New Rows)

```sql
-- Add cushion material pricing (currently hardcoded)
INSERT INTO pricing_config (category, key, label, value, unit, description, sort_order, is_active)
VALUES 
  ('materials', 'CUSHION_GRANULE_PER_GAL', 'Cushion Plus Granule', 8.00, 'per_gal', '$440 / 55gal drum', 7, true),
  ('materials', 'CUSHION_POWDER_PER_GAL', 'Cushion Plus Powder', 8.00, 'per_gal', '$440 / 55gal drum', 8, true);
```

### C. New Inventory Table

```sql
CREATE TABLE material_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL, -- 'resurfacer', 'color', 'cushion', 'line_paint', 'specialty'
  product_line TEXT NOT NULL DEFAULT 'advantage', -- 'advantage', 'standard', 'colorflex'
  is_primary BOOLEAN DEFAULT true, -- true = primary product, false = backup
  
  -- Packaging
  container_size DECIMAL(10,2) NOT NULL, -- gallons per container
  container_type TEXT NOT NULL, -- 'drum', 'pail', 'case'
  
  -- Pricing
  cost_per_gallon DECIMAL(10,2) NOT NULL,
  cost_per_container DECIMAL(10,2) NOT NULL,
  
  -- Inventory tracking
  quantity_on_hand INTEGER DEFAULT 0, -- containers in stock
  reorder_point INTEGER DEFAULT 2, -- when to reorder
  reorder_quantity INTEGER DEFAULT 5, -- how many to order
  
  -- Metadata
  color_name TEXT, -- for color products
  is_premium_color BOOLEAN DEFAULT false,
  supplier TEXT DEFAULT 'Laykold/APT',
  last_price_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies
ALTER TABLE material_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view inventory"
ON material_inventory FOR SELECT
USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Admin/Staff can manage inventory"
ON material_inventory FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true 
    AND role IN ('owner', 'admin', 'staff')
  )
);
```

### D. Seed Initial Inventory Data

```sql
INSERT INTO material_inventory (product_code, product_name, product_type, product_line, is_primary, container_size, container_type, cost_per_gallon, cost_per_container, color_name, is_premium_color)
VALUES
  -- Advantage Resurfacers (PRIMARY)
  ('ADV-RESF-30', 'Advantage Acrylic Resurfacer', 'resurfacer', 'advantage', true, 30, 'drum', 10.25, 307.50, NULL, false),
  
  -- Standard Resurfacer (BACKUP)
  ('AR-RESF-55', 'Acrylic Resurfacer', 'resurfacer', 'standard', false, 55, 'drum', 11.50, 632.50, NULL, false),
  
  -- Advantage Colors - Standard (PRIMARY)
  ('ADV-STD-30', 'Advantage Standard Colors', 'color', 'advantage', true, 30, 'drum', 14.81, 444.30, 'Standard', false),
  
  -- Advantage Colors - Premium
  ('ADV-USOB-30', 'Advantage US Open Blue', 'color', 'advantage', true, 30, 'drum', 23.14, 694.20, 'US Open Blue', true),
  ('ADV-USOG-30', 'Advantage US Open Green', 'color', 'advantage', true, 30, 'drum', 19.61, 588.30, 'US Open Green', true),
  ('ADV-PURP-30', 'Advantage Royal Purple', 'color', 'advantage', true, 30, 'drum', 19.92, 597.60, 'Royal Purple', true),
  
  -- ColorFlex (BACKUP)
  ('CFX-STD-55', 'ColorFlex Standard Colors', 'color', 'colorflex', false, 55, 'drum', 18.60, 1023.00, 'Standard', false),
  
  -- Cushion Products
  ('CPG-55', 'Cushion Plus Granule', 'cushion', 'standard', true, 55, 'drum', 8.00, 440.00, NULL, false),
  ('CPP-55', 'Cushion Plus Powder', 'cushion', 'standard', true, 55, 'drum', 8.00, 440.00, NULL, false),
  
  -- Line Paint
  ('LP-WHT-5', 'Textured White Line Paint', 'line_paint', 'standard', true, 5, 'pail', 30.01, 150.05, 'White', false),
  ('LP-BLK-5', 'Textured Black Line Paint', 'line_paint', 'standard', true, 5, 'pail', 32.00, 160.00, 'Black', false),
  ('LP-YLW-5', 'Textured Yellow Line Paint', 'line_paint', 'standard', true, 5, 'pail', 47.00, 235.00, 'Yellow', true),
  
  -- Specialty
  ('QC-BLK-12', 'Qualicaulk Crack Filler (Black)', 'specialty', 'standard', true, 0.42, 'case', 20.58, 247.00, 'Black', false);
```

---

## Part 4: Code Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/pricingConstants.ts` | Update fallback defaults, add CUSHION_GRANULE_PER_GAL/POWDER |
| `src/hooks/usePricingConfig.ts` | Add cushion material mapping to keyMapping |
| `src/lib/courtCalculator.ts` | Use dynamic cushion pricing instead of hardcoded MATERIAL_PRICES |
| `src/pages/admin/PricingConfig.tsx` | No changes (auto-picks up new DB rows) |

### New Files

| File | Purpose |
|------|---------|
| `src/pages/admin/Inventory.tsx` | Inventory management dashboard |
| `src/components/admin/InventoryTable.tsx` | Table with stock levels, reorder alerts |
| `src/components/admin/AddInventoryModal.tsx` | Add new product or adjust stock |

---

## Part 5: Inventory Management UI

### Dashboard Features

```
┌─────────────────────────────────────────────────────────────┐
│  📦 Material Inventory                         [+ Add Item] │
├─────────────────────────────────────────────────────────────┤
│  Filter: [All Products ▼]  [Show Low Stock Only ☐]          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Resurfacers ────────────────────────────────────────┐   │
│  │ ★ Advantage Resurfacer (30gal)    │ 8 drums │ ✅ OK  │   │
│  │   Acrylic Resurfacer (55gal)      │ 2 drums │ ⚠️ Low │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Color Coats ────────────────────────────────────────┐   │
│  │ ★ Advantage Standard Colors       │ 12 drums│ ✅ OK  │   │
│  │ ★ Advantage US Open Blue          │ 4 drums │ ✅ OK  │   │
│  │   ColorFlex (Backup)              │ 0 drums │ 🔴 Out │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Cushion Materials ──────────────────────────────────┐   │
│  │ ★ Cushion Plus Granule (55gal)    │ 6 drums │ ✅ OK  │   │
│  │ ★ Cushion Plus Powder (55gal)     │ 5 drums │ ✅ OK  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Stock Adjustment Modal

- Quick +/- buttons for receiving shipments or using materials
- Link to project when materials are consumed
- History log of all adjustments

---

## Part 6: Implementation Order

1. **Database Migration** - Create inventory table and update pricing_config
2. **Update pricingConstants.ts** - New fallback defaults for Advantage pricing
3. **Update usePricingConfig.ts** - Map cushion pricing keys
4. **Update courtCalculator.ts** - Use dynamic cushion pricing
5. **Create Inventory page** - Basic table with stock levels
6. **Add to Navigation** - "Inventory" link in admin sidebar
7. **Stock Adjustment Features** - Receive/consume materials

---

## Technical Notes

### Product Line Logic

The estimator will always calculate using the **primary product** pricing:

```typescript
// Example: Get resurfacer price
// 1. Check pricing_config for RESURFACER_PER_GAL (now Advantage @ $10.25)
// 2. Fall back to pricingConstants.ts defaults if DB unavailable

// For rare cases needing backup products, admin can:
// 1. Manually adjust estimate line items
// 2. Or temporarily swap pricing in pricing_config
```

### Cushion Pricing Fix

Currently cushion materials use hardcoded `MATERIAL_PRICES.CUSHION_GRANULE_PER_GAL` ($45/gal). This needs to be:

1. Added to `pricing_config` database table ($8.00/gal from price sheet)
2. Mapped in `usePricingConfig.ts`
3. Used in `courtCalculator.ts` from dynamic pricing

This is a significant cost reduction: ~$37/gal × 20+ gallons per project = **$700+ savings per cushion project**.
