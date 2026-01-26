

# Plan: Add Standard Concrete Base Option

## Problem Summary

The estimator currently only offers **Post-Tension Concrete** at $9.00/sf for new concrete construction. Users need a more affordable **Standard Concrete** option at $7.25/sf for projects that don't require the crack-resistance of post-tension slabs.

---

## Current Base Options

| Option | Description | Price |
|--------|-------------|-------|
| Existing Asphalt | Resurface existing asphalt | $0/sf |
| Existing Concrete | Resurface existing concrete | $0/sf |
| New Asphalt | 1.5" asphalt overlay | $4.50/sf |
| Post-Tension Concrete | Premium crack-resistant slab | $9.00/sf |

## Target Base Options

| Option | Description | Price |
|--------|-------------|-------|
| Existing Asphalt | Resurface existing asphalt | $0/sf |
| Existing Concrete | Resurface existing concrete | $0/sf |
| New Asphalt | 1.5" asphalt overlay | $4.50/sf |
| **Standard Concrete** | **Standard 4" concrete slab** | **$7.25/sf** |
| Post-Tension Concrete | Premium crack-resistant slab | $9.00/sf |

---

## Implementation Plan

### 1. Update Pricing Constants

**File:** `src/lib/pricingConstants.ts`

Add to `PRICING.CONSTRUCTION`:
```typescript
CONSTRUCTION: {
  ASPHALT_PAVING_PER_SF: 4.50,
  CONCRETE_STANDARD_PER_SF: 7.25,    // NEW: Standard 4" concrete
  CONCRETE_PT_PER_SF: 9.00,
  // ... rest unchanged
}
```

Add to `BASE_OPTIONS`:
```typescript
STANDARD_CONCRETE: {
  id: 'standard_concrete',
  name: 'Standard Concrete',
  description: 'Standard 4" concrete slab installation',
  pricePerSqFt: PRICING.CONSTRUCTION.CONCRETE_STANDARD_PER_SF,
},
```

### 2. Update Job Templates (if needed)

**File:** `src/components/admin/JobTemplates.tsx`

The template referencing `NEW_CONCRETE` should be updated to use either `STANDARD_CONCRETE` or `POST_TENSION_CONCRETE` as appropriate.

### 3. Update Sales Estimator Base Type Logic

**File:** `src/pages/SalesEstimator.tsx`

If the public estimator offers concrete as a construction type, update the mapping to distinguish between standard and post-tension concrete options.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/pricingConstants.ts` | Add `CONCRETE_STANDARD_PER_SF` and `STANDARD_CONCRETE` base option |
| `src/components/admin/JobTemplates.tsx` | Update template reference from `NEW_CONCRETE` |
| `src/pages/SalesEstimator.tsx` | (Optional) Add concrete type selection if public estimator needs it |

---

## Result

After this update, the EstimateBuilder's base selection step will show:

```
┌─────────────────────────┐  ┌─────────────────────────┐
│ Existing Asphalt        │  │ Existing Concrete       │
│ Resurface existing      │  │ Resurface existing      │
│ $0/sf                   │  │ $0/sf                   │
└─────────────────────────┘  └─────────────────────────┘

┌─────────────────────────┐  ┌─────────────────────────┐
│ New Asphalt Base        │  │ Standard Concrete       │
│ 1.5" asphalt overlay    │  │ Standard 4" slab        │
│ $4.50/sf                │  │ $7.25/sf                │
└─────────────────────────┘  └─────────────────────────┘

┌─────────────────────────┐
│ Post-Tension Concrete   │
│ Premium crack-resistant │
│ $9.00/sf                │
└─────────────────────────┘
```

---

## Note on PDF/Email Functions

The PDF generation and email template functions were already updated in the previous implementation to support both **Lump Sum** and **Detailed Scope** formats. They:

- Fetch `display_format` and `estimate_scope_bullets` from the database
- Render Lump Sum format with bullet points and single total
- Render Detailed Scope format with grouped categories

No additional changes are needed for the edge functions unless you'd like me to verify their implementation.

