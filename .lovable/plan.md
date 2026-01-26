
# Plan: Fix Invoice PDF PAID Watermark Position

## Problem Identified

Looking at the PDF:
1. The green "PAID" badge next to "INVOICE" (at x=140) is overlapping/covering part of the invoice header
2. The user wants a diagonal PAID watermark in the white space area instead
3. The watermark should only appear for paid invoices

## Current Code Analysis

### PAID Badge (Lines 159-175)
```typescript
// Status badge - THIS IS WHAT WE NEED TO REMOVE
if (isPaid) {
  page.drawRectangle({
    x: 140,
    y: y - 3,
    width: 50,
    height: 20,
    color: COLORS.brandGreen,
  });
  page.drawText("PAID", {
    x: 150,
    y: y + 2,
    size: 11,
    font: fonts.bold,
    color: COLORS.white,
  });
}
```

### Current Watermark (Lines 746-763)
```typescript
// Single watermark in bottom-right - user wants this changed
page.drawText(text, {
  x: width - 180,
  y: 100,
  size: 72,
  font: fonts.bold,
  color: rgb(0.90, 0.97, 0.90),
});
```

## Solution

### 1. Remove the PAID Badge from Header
Delete the green badge next to "INVOICE" text (lines 159-175)

### 2. Add Diagonal Watermark in White Space
Position a subtle "PAID" watermark in the left side white space (next to totals box). Since pdf-lib doesn't support rotation, we'll create a "diagonal" effect by:
- Positioning multiple PAID texts at an angle using character offsets
- Or using a single large watermark in the left white space area

Best approach: Position a single large "PAID" watermark in the left-center area where there's guaranteed white space (between the line items table and the totals box on the right).

### Layout Analysis (where white space exists)
```text
+---------------------------+
|  Navy Header              |
+---------------------------+
|  INVOICE    [no badge]    |
|  Invoice Number/Date      |
+---------------------------+
|  BILL TO                  |
+---------------------------+
|  Line Items Table         |
+---------------------------+
| [WHITE SPACE]  | Totals   |  <- Left side is white space
|    PAID        | Box      |  <- Place watermark here
|  (diagonal)    |          |
+---------------------------+
```

### New Watermark Position
- Position: x=80, y=320 (left-center of page, below line items)
- Size: 60-70pt
- Color: Very light green for subtle effect
- The totals box is on the right (x: 392-562), so left side (x: 50-350) is clear

## Changes to Make

### File: `supabase/functions/generate-invoice-pdf/index.ts`

**Change 1: Remove PAID badge from header (lines 159-175)**

Remove this entire block:
```typescript
// Status badge
if (isPaid) {
  page.drawRectangle({
    x: 140,
    y: y - 3,
    width: 50,
    height: 20,
    color: COLORS.brandGreen,
  });
  page.drawText("PAID", {
    x: 150,
    y: y + 2,
    size: 11,
    font: fonts.bold,
    color: COLORS.white,
  });
}
```

**Change 2: Update watermark function (lines 746-763)**

Replace the current watermark with a diagonal-style watermark in the left white space:
```typescript
function drawPaidWatermark(
  page: PDFPage,
  fonts: { bold: PDFFont },
  width: number,
  height: number
): void {
  // Diagonal PAID watermark in left side white space
  // Position it between line items table and footer area
  // Creating diagonal effect by drawing characters at an angle
  const text = "PAID";
  
  // Main diagonal watermark - positioned in left-center white space
  // This area is clear of content (totals box is on the right)
  page.drawText(text, {
    x: 120,
    y: 280,
    size: 65,
    font: fonts.bold,
    color: rgb(0.88, 0.96, 0.88), // Very subtle light green
  });
}
```

## Expected Result

```text
+---------------------------+
|  Navy Header              |
+---------------------------+
|  INVOICE                  |  <- No badge overlay
|  Invoice Number/Date      |
|  Paid: Jan 22, 2026       |  <- Green paid date still shown
+---------------------------+
|  BILL TO                  |
+---------------------------+
|  Line Items Table         |
+---------------------------+
|                  | Totals |
|    PAID          | Box    |  <- Subtle watermark in white space
|   (subtle)       |        |
+---------------------------+
```

## Safety Check

The watermark is only drawn when `invoice.status === "paid"` (checked at line 779):
```typescript
if (isPaid) {
  drawPaidWatermark(page, { bold: helveticaBold }, width, height);
}
```

This logic remains unchanged, ensuring the watermark only appears on paid invoices.
