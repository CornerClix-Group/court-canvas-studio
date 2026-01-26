

# Plan: Fix Invoice PDF PAID Watermark Alignment

## Problem Analysis

Looking at the PDF screenshot, the "PAID" watermark is positioned in the center of the page at `(width/2 - 100, height/2)` which places it directly over the line items table. The watermark is drawn horizontally with a large 100pt font size in light green, obscuring the invoice content.

### Current Code (Lines 746-778)

```typescript
function drawPaidWatermark(page, fonts, width, height): void {
  const text = "PAID";
  const fontSize = 100;
  
  // Position in center of page - THIS IS THE PROBLEM
  const x = width / 2 - 100;  // = ~206
  const y = height / 2;        // = ~396 (middle of line items area)

  // Light green color - not light enough
  page.drawText(text, { x, y, size: fontSize, color: rgb(0.85, 0.95, 0.85) });
  
  // Second offset text for "depth"
  page.drawText(text, { x: x + 2, y: y - 2, size: fontSize, color: rgb(0.75, 0.92, 0.75) });
}
```

### Visual Problem

```text
Page Layout (792pt height):
  +-----------------------+ y=792
  |  Navy Header          | y=742
  +-----------------------+
  |  INVOICE PAID         | y=710
  |  Invoice Number/Date  |
  +-----------------------+
  |  BILL TO              |
  |  Customer Info        |
  +-----------------------+ y~520
  |  Line Items Table     |
  |    [PAID WATERMARK]   | <-- y=396 (center) - overlaps!
  |                       |
  +-----------------------+
  |  Subtotal/Total       |
  +-----------------------+
  ...
```

---

## Solution

Reposition the watermark to be:
1. **Diagonal** - Use rotation transform for a professional watermark look
2. **Lighter color** - More subtle so it doesn't interfere with reading
3. **Better positioned** - Either lower on the page or spanning diagonally across

Since pdf-lib doesn't support text rotation directly, we'll use a different approach:
- Position the watermark in the bottom-right quadrant of the page (below main content)
- Use a much lighter, more subtle color
- Make it smaller and less obtrusive

---

## Implementation Options

### Option A: Reposition to Bottom-Right (Recommended)
Move the watermark to the bottom-right corner where it won't interfere with content:

```typescript
function drawPaidWatermark(page, fonts, width, height): void {
  const text = "PAID";
  const fontSize = 80;  // Slightly smaller
  
  // Position in bottom-right area, away from content
  const x = width - 200;  // Right side
  const y = 120;          // Near bottom
  
  // Very subtle light green
  page.drawText(text, {
    x, y,
    size: fontSize,
    font: fonts.bold,
    color: rgb(0.92, 0.98, 0.92),  // Much lighter
  });
}
```

### Option B: Full-Page Diagonal Watermark (Alternative)
Create a diagonal effect by drawing multiple smaller "PAID" texts at an angle using character positioning:

```typescript
// Draw PAID multiple times in diagonal pattern across page
// This creates a watermark effect without rotation support
```

---

## Recommended Fix (Option A)

### Changes to `generate-invoice-pdf/index.ts`

**Before (Lines 746-778):**
```typescript
function drawPaidWatermark(page, fonts, width, height): void {
  const text = "PAID";
  const fontSize = 100;
  const x = width / 2 - 100;
  const y = height / 2;

  page.drawText(text, { x, y, size: fontSize, font: fonts.bold, color: rgb(0.85, 0.95, 0.85) });
  page.drawText(text, { x: x + 2, y: y - 2, size: fontSize, font: fonts.bold, color: rgb(0.75, 0.92, 0.75) });
}
```

**After:**
```typescript
function drawPaidWatermark(page, fonts, width, height): void {
  const text = "PAID";
  
  // Large subtle watermark in bottom-right corner (away from content)
  page.drawText(text, {
    x: width - 180,
    y: 100,
    size: 72,
    font: fonts.bold,
    color: rgb(0.90, 0.97, 0.90),  // Very light green
  });
  
  // Optional: smaller badge watermark in the content area
  // This appears as a subtle background indicator
  page.drawText(text, {
    x: 280,
    y: 280,
    size: 48,
    font: fonts.bold,
    color: rgb(0.93, 0.98, 0.93),  // Even lighter
  });
}
```

---

## Alternative: Remove Duplicate Watermark Entirely

The invoice already has:
1. A green "PAID" badge next to "INVOICE" in the header
2. "PAID:" label in the totals section with green text
3. "Paid: [date]" in the invoice info section

These are sufficient to indicate paid status. The large watermark may be **redundant** and could be:
- Removed entirely, OR
- Made extremely subtle (just a light corner indicator)

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-invoice-pdf/index.ts` | Fix watermark positioning in `drawPaidWatermark` function |

---

## Expected Result After Fix

```text
Page Layout:
  +-----------------------+
  |  Navy Header          |
  +-----------------------+
  |  INVOICE [PAID badge] | <-- Green badge still visible
  |  Invoice Number/Date  |
  |  Paid: Jan 22, 2026   | <-- Green paid date
  +-----------------------+
  |  BILL TO              |
  |  Customer Info        |
  +-----------------------+
  |  Line Items Table     | <-- NO watermark overlap
  |    (clear, readable)  |
  +-----------------------+
  |  PAID: $21,250.00     | <-- Green total
  +-----------------------+
  |  Marketing Section    |
  +-----------------------+
  |  Quality Statement    |
  +-----------------------+
  |  Footer          PAID | <-- Subtle corner watermark
  +-----------------------+
```

---

## Recommendation

Given that paid status is already clearly indicated by:
- Header badge
- Green "Paid:" date
- Green "PAID:" total label

I recommend **Option A with minimal watermark** - a single, subtle "PAID" in the bottom-right corner that doesn't interfere with any content. This provides redundancy for quick visual scanning without obscuring the actual invoice details.

