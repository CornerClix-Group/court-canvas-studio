
# Plan: Update Receipt PDF PAID Watermark for Consistency

## Current State

The receipt PDF already has a diagonal "PAID" watermark implemented using raw PDF commands (lines 215-224), but it differs from the invoice PDF's styling:

| Aspect | Receipt PDF (Current) | Invoice PDF |
|--------|----------------------|-------------|
| Rotation | Diagonal (45 degrees) | Horizontal |
| Color | Dark green (0, 0.5, 0) | Light green (0.88, 0.96, 0.88) |
| Transparency | 20% opacity | None (solid color) |
| Size | 72pt | 65pt |
| Position | x=180, y=350 | x=120, y=280 |

## Proposed Changes

Update the receipt PDF watermark to use a more subtle light green color (matching the invoice) while keeping the diagonal rotation (which looks more professional):

### File: `supabase/functions/generate-receipt-pdf/index.ts`

**Lines 215-224 - Update watermark styling:**

```typescript
// Current code:
contentStream += "q\n";
contentStream += "/GS1 gs\n";
contentStream += "0 0.5 0 rg\n";  // Dark green
contentStream += "BT\n";
contentStream += "/F2 72 Tf\n";
contentStream += "0.707 0.707 -0.707 0.707 180 350 Tm\n";
contentStream += "(PAID) Tj\n";
contentStream += "ET\n";
contentStream += "Q\n";

// Updated code:
contentStream += "q\n";
contentStream += "/GS1 gs\n";
contentStream += "0.75 0.92 0.75 rg\n";  // Light green (matches invoice style)
contentStream += "BT\n";
contentStream += "/F2 65 Tf\n";  // Match invoice font size
contentStream += "0.707 0.707 -0.707 0.707 150 320 Tm\n";  // Adjusted position
contentStream += "(PAID) Tj\n";
contentStream += "ET\n";
contentStream += "Q\n";
```

**Also update the transparency (line 197):**

```typescript
// Current:
const gsObj = "7 0 obj\n<< /Type /ExtGState /CA 0.2 /ca 0.2 >>\nendobj\n";

// Updated - slightly more visible:
const gsObj = "7 0 obj\n<< /Type /ExtGState /CA 0.35 /ca 0.35 >>\nendobj\n";
```

## Summary of Changes

1. **Color**: Change from dark green (`0 0.5 0`) to light green (`0.75 0.92 0.75`) - matches invoice styling
2. **Font size**: Reduce from 72pt to 65pt - matches invoice
3. **Position**: Adjust from (180, 350) to (150, 320) - better centered in white space
4. **Transparency**: Increase from 20% to 35% opacity - more visible while still subtle

## Expected Result

Both documents will have consistent "PAID" watermarks:
- Subtle light green color
- Positioned in white space away from content
- Receipt keeps the diagonal rotation for a professional look
- Invoice uses horizontal positioning in its left-side white space

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-receipt-pdf/index.ts` | Update watermark color, size, position, and transparency |
