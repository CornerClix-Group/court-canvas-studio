
# Plan: Fix PDF Styling Issues & Remove ASBA/2020 References

## Overview

Fix the box alignment issues visible in the PDF, remove the ASBA certification and "since 2020" references, and create a more polished, professional appearance.

---

## Issues to Fix

### Content Removal

| Current Text | Updated Text |
|--------------|--------------|
| "ASBA Certified - American Sports Builders Association member" | **REMOVE ENTIRELY** |
| "Local Expertise - Serving Augusta & the CSRA since 2020" | "Local Expertise - Serving Augusta & the CSRA" |

### Box Alignment Issues

The current code sets fixed heights that don't match the content:

| Element | Current | Issue |
|---------|---------|-------|
| Marketing section background | Height: 90px | Too tall for 3 items (was 4) |
| Quality statement box | Height: 55px, Y offset: -50 | Text doesn't align properly within box |

---

## Part 1: Update Marketing Points

### Files to Update
- `supabase/functions/generate-estimate-pdf/index.ts`
- `supabase/functions/generate-invoice-pdf/index.ts`

### Updated MARKETING_POINTS Array

```typescript
const MARKETING_POINTS = [
  "200+ Courts Completed - Trusted by homeowners, schools & clubs",
  "Premium Materials - Laykold surfaces used by US Open & ATP",
  "Local Expertise - Serving Augusta & the CSRA",
];
```

---

## Part 2: Fix Marketing Section Box

### Current (Broken)
```typescript
// Light sage background for content - WRONG HEIGHT
page.drawRectangle({
  x: 50,
  y: y - 85,  // Wrong offset
  width: 512,
  height: 90, // Too tall for 3 items
  color: COLORS.lightSage,
});
```

### Fixed Version
Calculate the box height dynamically based on number of marketing points:
- 3 items × 16px line height = 48px
- Add padding: 10px top + 10px bottom = 68px total

```typescript
const numPoints = MARKETING_POINTS.length;
const contentHeight = numPoints * 16 + 20; // 16px per line + padding

page.drawRectangle({
  x: 50,
  y: y - contentHeight,
  width: 512,
  height: contentHeight + 5,
  color: COLORS.lightSage,
});
```

---

## Part 3: Fix Quality Statement Box

### Current Issue
The box draws at y - 50 with height 55, but text draws at y - 15, y - 27, y - 39, causing the text to appear at the top edge of the box.

### Fixed Version
Adjust box position and size to properly contain the content:

```typescript
// Better proportioned box
page.drawRectangle({
  x: 50,
  y: y - 55,
  width: 512,
  height: 60,
  color: COLORS.lightGray,
  borderColor: COLORS.green,
  borderWidth: 1,
});

// Quote mark
page.drawText('"', {
  x: 60,
  y: y - 10,
  size: 24,
  font: fonts.bold,
  color: COLORS.green,
});

// Text lines with better spacing
page.drawText(line1, { x: 75, y: y - 18, ... });
page.drawText(line2, { x: 75, y: y - 32, ... });
page.drawText(line3, { x: 75, y: y - 46, ... });
```

---

## Part 4: Professional Styling Improvements

### Add subtle design enhancements:

1. **Green accent line** on marketing section left edge
2. **Improved quote styling** with proper typography hierarchy
3. **Better spacing** between sections

```typescript
// Green accent line on left of marketing section
page.drawRectangle({
  x: 50,
  y: y - contentHeight,
  width: 4,
  height: contentHeight + 5,
  color: COLORS.green,
});
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-estimate-pdf/index.ts` | Update MARKETING_POINTS, fix drawMarketingSection, fix drawQualityStatement |
| `supabase/functions/generate-invoice-pdf/index.ts` | Update MARKETING_POINTS, fix drawMarketingSection, fix drawQualityStatement |

---

## Visual Comparison

### Before
```text
+----------------------------------+
| WHY CHOOSE COURTPRO?             |  (Green header)
+----------------------------------+
                                      (Gap - box starts too low)
+----------------------------------+
| * 200+ Courts Completed...       |
| * ASBA Certified...              |  <- REMOVE
| * Premium Materials...           |
| * Local Expertise...since 2020   |  <- Remove "since 2020"
|                                  |  (Extra space - box too tall)
+----------------------------------+

+----------------------------------+
| "                                |  (Quote mark misaligned)
|   Your court is more than...     |
|   We use only premium...         |
|   trusted by the US Open...      |
+----------------------------------+
```

### After
```text
+----------------------------------+
| WHY CHOOSE COURTPRO?             |  (Green header)
+==================================+
| * 200+ Courts Completed...       |  (Box fits content perfectly)
| * Premium Materials...           |
| * Local Expertise...             |
+----------------------------------+

+----------------------------------+
|  " Your court is more than...    |  (Quote integrated with text)
|    We use only premium...        |
|    trusted by the US Open...     |
+----------------------------------+
```

---

## Technical Notes

- Marketing points reduced from 4 to 3 items
- Box heights calculated dynamically based on content
- Consistent styling between estimate and invoice PDFs
- All text uses WinAnsi-compatible characters (no unicode)
