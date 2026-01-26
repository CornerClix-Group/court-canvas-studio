

# Plan: Complete the Three-Tier Estimate Display System

## Problem Summary

The display format selection (Lump Sum vs Detailed Scope) works in the admin UI preview, but when you actually send an estimate or download a PDF, it ignores your selection. Both PDFs and emails always use the "Detailed Scope" grouped category format.

---

## Current vs Target State

| Component | Current Behavior | Target Behavior |
|-----------|------------------|-----------------|
| EstimateBuilder UI | Lets you pick Lump Sum or Detailed Scope | No change needed |
| EstimateDetailView | Shows correct preview based on format | No change needed |
| PDF Generation | Always shows grouped categories | Should respect display_format setting |
| Email Template | Always shows grouped categories | Should respect display_format setting |

---

## Implementation Plan

### 1. Update PDF Generation Edge Function

**File:** `supabase/functions/generate-estimate-pdf/index.ts`

**Changes:**
- Fetch `display_format` and `estimate_scope_bullets` from the database alongside the estimate
- Add conditional rendering logic based on display format
- Create Lump Sum PDF layout with bullet points and single total
- Keep Detailed Scope layout (current grouped categories) as the alternative

**Lump Sum PDF Layout:**
```
PROJECT SCOPE:
✓ Complete surface preparation including pressure washing and crack repair
✓ Pro Plus Premium cushioned surfacing system (28% force reduction)
✓ Professional color application with premium UV-resistant coatings
✓ Regulation court line striping for 2 courts

────────────────────────────────
PROJECT INVESTMENT: $8,386.99
────────────────────────────────
```

**Detailed Scope PDF Layout:** (Current grouped format - no changes needed)

---

### 2. Update Email Template Edge Function

**File:** `supabase/functions/send-estimate-email/index.ts`

**Changes:**
- Fetch `display_format` and `estimate_scope_bullets` from the database
- Create `generateLumpSumEmailHTML()` function with marketing-focused layout
- Modify main handler to select template based on display format

**Lump Sum Email Layout:**
```html
<h3>Your Court Project Includes:</h3>
<ul>
  <li>✓ Complete surface preparation...</li>
  <li>✓ Premium surfacing system...</li>
  <li>✓ Regulation court striping...</li>
</ul>

<div class="investment-box">
  <p>Project Investment</p>
  <h2>$8,386.99</h2>
</div>
```

---

## Technical Details

### Database Query Updates

Both edge functions need to fetch additional data:
```sql
SELECT 
  estimates.*,
  customers(*),
  estimate_items(*),
  estimate_attachments(*),
  estimate_custom_items(*),
  estimate_scope_bullets(*)  -- ADD THIS
FROM estimates
WHERE id = :estimateId
```

### PDF Function Logic Flow

```
┌──────────────────────────────┐
│  Fetch estimate + bullets    │
└──────────────┬───────────────┘
               │
       ┌───────▼───────┐
       │ display_format │
       └───────┬───────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌─────────┐         ┌─────────────┐
│Lump Sum │         │Detailed     │
│  PDF    │         │Scope PDF    │
└─────────┘         └─────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-estimate-pdf/index.ts` | Add Lump Sum layout, conditional rendering |
| `supabase/functions/send-estimate-email/index.ts` | Add Lump Sum email template, conditional rendering |

---

## What You'll Get After This

1. **Lump Sum Format** - Marketing-focused estimates with:
   - Professional bullet points describing the work
   - Single "Project Investment" total
   - No line item breakdown visible to customer
   - Clean, simple presentation for quick decisions

2. **Detailed Scope Format** - Category-level breakdown with:
   - Grouped services (Surface Prep, Surfacing System, Striping, etc.)
   - Category subtotals (but no unit prices)
   - Professional itemized look for customers wanting more detail

3. **Admin View** - Always available with:
   - Full line item detail
   - Quantities and unit prices
   - Internal cost analysis

---

## Existing Estimator Options Summary

For reference, here's everything currently captured in the estimators:

**Project Configuration:**
- Project type (Pickleball, Tennis, Basketball, Multi-sport)
- Court size (presets or custom square footage)
- Number of courts
- Base type (existing asphalt, new concrete, overlays)

**Surface Condition:**
- Pressure washing
- Crack repair (linear feet)
- Birdbath/low spot repair (sq ft)
- Prime seal application

**Construction and Infrastructure:**
- New paving (asphalt or post-tension concrete)
- Fencing (linear feet)
- LED lighting (pole count)
- Playground interest flag

**Equipment Add-ons:**
- Net post sets
- Player benches
- Windscreen (linear feet)
- Ball containment netting (linear feet)

**Surfacing System:**
- System tier (Standard, Premium, Elite, Gel)
- Color selection (inner/outer)
- Striping type

**Custom Items:**
- Free-form line items with vendor cost tracking
- Direct Price or Cost + Markup modes

**Pricing Controls:**
- Profit margin slider (35% - 55%)
- Internal cost vs customer price toggle

