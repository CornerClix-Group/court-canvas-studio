
# Plan: Inventory Usage Tracking + Smart Supply Ordering

## Overview

Add two major features:
1. **Automatic inventory deduction** when an estimate converts to a project
2. **Smart supply calculator** that recommends the most cost-effective container combination

---

## Part 1: Smart Supply Ordering System

### Container Size Options (from 2025 PA3D Price Sheet)

| Product | 5-gal Pail | 30-gal Drum | 55-gal Drum |
|---------|------------|-------------|-------------|
| Advantage Color (Std) | $16.58/gal ($82.90) | $14.81/gal ($444.30) | N/A |
| Advantage Resurfacer | N/A | $10.25/gal ($307.50) | N/A |
| Acrylic Resurfacer | N/A | N/A | $11.50/gal ($632.50) |
| Line Paint White | $30.01/gal ($150.05) | N/A | N/A |
| Line Paint (2-box) | $30.01/gal ($60.02) | N/A | N/A |
| Cushion Granule | N/A | N/A | $8.00/gal ($440.00) |
| Cushion Powder | N/A | N/A | $8.00/gal ($440.00) |

### Container Optimization Logic

```text
Example: Need 13 gallons of Advantage Color

Option A: 1x 30-gal drum = $444.30 (17 gal waste)
Option B: 3x 5-gal pails = $248.70 (2 gal waste)

Savings: $195.60 using pails
```

The algorithm will:
1. Find all container sizes available for each product type
2. Calculate every possible combination that covers the required gallons
3. Score by: (1) Total cost, (2) Waste amount
4. Recommend the best option

### Database Updates

Add more container sizes to inventory to enable smart ordering:

```sql
-- Add 5-gallon pails for Advantage colors
INSERT INTO material_inventory (product_code, product_name, product_type, product_line, is_primary, container_size, container_type, cost_per_gallon, cost_per_container, color_name)
VALUES 
  ('ADV-STD-5', 'Advantage Standard Colors', 'color', 'advantage', true, 5, 'pail', 16.58, 82.90, 'Standard'),
  ('ADV-USOB-5', 'Advantage US Open Blue', 'color', 'advantage', true, 5, 'pail', 24.91, 124.55, 'US Open Blue'),
  ('ADV-USOG-5', 'Advantage US Open Green', 'color', 'advantage', true, 5, 'pail', 21.38, 106.90, 'US Open Green'),
  ('ADV-PURP-5', 'Advantage Royal Purple', 'color', 'advantage', true, 5, 'pail', 22.50, 112.50, 'Royal Purple');

-- Add 2-gallon line paint option
INSERT INTO material_inventory (product_code, product_name, product_type, product_line, is_primary, container_size, container_type, cost_per_gallon, cost_per_container, color_name)
VALUES 
  ('LP-WHT-2', 'Textured White Line Paint (2-pack)', 'line_paint', 'standard', true, 2, 'box', 30.01, 60.02, 'White');
```

---

## Part 2: Project Materials Table

### New Database Table: project_materials

Track materials assigned to each project for inventory deduction:

```sql
CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES material_inventory(id),
  
  -- Material details (copied for historical record)
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  
  -- Quantity
  gallons_required DECIMAL(10,2) NOT NULL,
  containers_allocated INTEGER DEFAULT 0,
  container_size DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, allocated, consumed
  allocated_at TIMESTAMP WITH TIME ZONE,
  consumed_at TIMESTAMP WITH TIME ZONE,
  
  -- Cost tracking
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## Part 3: Estimate-to-Project Conversion Flow

### Current Flow

```text
Estimate (approved) --> Create Project --> Done
```

### New Flow

```text
Estimate (approved) 
  --> Calculate materials from estimate items
  --> Run Smart Container Optimizer
  --> Show Supply List with recommendations
  --> User confirms allocation
  --> Create Project
  --> Deduct from inventory (if sufficient stock)
  --> Create project_materials records
```

### Supply List Modal UI

```text
+----------------------------------------------------------+
|  Project Supply List - "Smith Residence"                  |
+----------------------------------------------------------+
|                                                           |
|  MATERIAL REQUIREMENTS                                    |
|  ┌──────────────────────────────────────────────────────┐ |
|  │ Advantage Standard Colors                             │ |
|  │ Required: 13.2 gallons                               │ |
|  │                                                       │ |
|  │ ★ RECOMMENDED: 3x 5-gal pails = $248.70              │ |
|  │   (2 gal extra / minimal waste)                      │ |
|  │                                                       │ |
|  │   Alternative: 1x 30-gal drum = $444.30              │ |
|  │   (Savings if you have future jobs needing color)    │ |
|  │                                                       │ |
|  │   [Use Pails]  [Use Drum]                            │ |
|  └──────────────────────────────────────────────────────┘ |
|                                                           |
|  ┌──────────────────────────────────────────────────────┐ |
|  │ Cushion Plus Granule                                  │ |
|  │ Required: 42.5 gallons                               │ |
|  │                                                       │ |
|  │ ★ Only Option: 1x 55-gal drum = $440.00              │ |
|  │   (12.5 gal available for next job)                  │ |
|  │                                                       │ |
|  │   [Allocate]                                          │ |
|  └──────────────────────────────────────────────────────┘ |
|                                                           |
|  ┌──────────────────────────────────────────────────────┐ |
|  │ INVENTORY ALERTS                                      │ |
|  │ ⚠️ Advantage Colors: Only 2 pails in stock           │ |
|  │    Need 1 more - add to purchase order?              │ |
|  └──────────────────────────────────────────────────────┘ |
|                                                           |
|  TOTAL MATERIAL COST: $688.70                            |
|                                                           |
|  [Cancel]                           [Create Project]      |
+----------------------------------------------------------+
```

---

## Part 4: Code Changes

### New Files

| File | Purpose |
|------|---------|
| `src/lib/supplyOptimizer.ts` | Smart container calculation algorithm |
| `src/components/admin/ProjectSupplyModal.tsx` | Supply recommendation UI |
| `src/components/admin/ProjectMaterialsTable.tsx` | Materials assigned to project |
| `src/hooks/useProjectMaterials.ts` | Fetch/manage project materials |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/admin/EstimateDetailView.tsx` | Add supply modal to "Convert to Project" flow |
| `src/pages/admin/ProjectDetail.tsx` | Show allocated materials section |
| `src/pages/admin/Inventory.tsx` | Link to projects using each material |

---

## Part 5: Supply Optimizer Algorithm

```typescript
interface ContainerOption {
  inventoryItemId: string;
  productName: string;
  containerSize: number;
  containerType: string;
  costPerContainer: number;
  quantityOnHand: number;
}

interface SupplyRecommendation {
  productType: string;
  gallonsRequired: number;
  options: {
    containers: { item: ContainerOption; count: number }[];
    totalCost: number;
    totalGallons: number;
    wasteGallons: number;
    isRecommended: boolean;
    reason: string; // "Lowest cost", "Minimal waste", "Best value"
  }[];
  stockWarning?: string; // "Need 2 more pails"
}

function optimizeSupplyOrder(
  gallonsRequired: number,
  availableContainers: ContainerOption[]
): SupplyRecommendation {
  // Generate all combinations that meet requirements
  // Score by cost vs. waste tradeoff
  // Return sorted options with recommendation
}
```

---

## Part 6: Inventory Deduction Workflow

### When Project is Created

1. Parse estimate items to extract material quantities
2. Match to inventory products by type
3. Calculate optimal container combinations
4. Show supply modal for user confirmation
5. Create `project_materials` records with status = 'allocated'
6. Deduct from `material_inventory.quantity_on_hand`

### When Project is Completed

1. Mark `project_materials` as status = 'consumed'
2. Log actual vs. estimated usage for future accuracy improvements

### Reversal Handling

If a project is cancelled:
1. Return allocated materials to inventory
2. Update `project_materials` status to 'returned'
3. Log the reversal for audit trail

---

## Technical Notes

### Material Mapping from Estimate Items

The estimate stores line items like "Laykold ColorFlex - 26.0 gallons". The system will:

1. Parse the description to identify product type (color, resurfacer, cushion)
2. Look up matching products in `material_inventory` by `product_type`
3. Prefer primary products (`is_primary = true`)
4. Use backup products only if primary unavailable

### Cost Optimization Rules

1. **Waste threshold**: If waste > 30% of container, consider smaller containers
2. **Future job consideration**: If admin indicates more jobs coming, larger containers may be better
3. **Stock level priority**: Prefer using existing stock over ordering new

### Implementation Order

1. Database migration - Add container sizes and project_materials table
2. Create `supplyOptimizer.ts` utility
3. Build `ProjectSupplyModal` component
4. Integrate into estimate-to-project conversion
5. Add materials section to project detail page
6. Add inventory deduction logic
