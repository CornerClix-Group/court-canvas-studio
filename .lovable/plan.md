

# Plan: Fix PDF Box Overlap - Payment Options vs Project Investment

## Problem Analysis

Looking at the PDF, the "FLEXIBLE PAYMENT OPTIONS" green box is overlapping with the "PROJECT INVESTMENT" box above it.

### Current Code Logic (Lines 359-371)

```text
Project Investment Box:
  - Rectangle: y - 55 to y + 5 (height 60)
  - Text "PROJECT INVESTMENT" at y - 20
  - Price text at y - 30
  - Then: y -= 75

Payment Options Box:
  - Rectangle: y - 5 to y + 40 (height 45, drawn at y-5)
  - But "y" is now (original_y - 75)
  - So box occupies: (original_y - 80) to (original_y - 35)
```

### Visual Problem

```text
Before Fix:
                y = 400 (example)
   +------------------------+  <- y + 5 = 405
   |  PROJECT INVESTMENT    |
   |        $8,324.72       |
   +------------------------+  <- y - 55 = 345
         y -= 75 → y = 325
   +------------------------+  <- y + 40 = 365  ← OVERLAP!
   | FLEXIBLE PAYMENT OPT   |     (365 > 345)
   +------------------------+  <- y - 5 = 320
```

The payment box top (365) is ABOVE the investment box bottom (345) = **20px overlap**!

---

## Solution

Adjust the y decrement after the Project Investment box. The investment box occupies 60px of height from `y - 55` to `y + 5`. We need to move y down by at least 60px plus some spacing to clear the box.

### Current vs Fixed

| Step | Current | Fixed |
|------|---------|-------|
| Investment box height | 60px (at y-55 to y+5) | Same |
| y decrement after box | 75 | 70 |
| Payment box position | y - 5 (top at y+40) | y - 50 (top at y-5) |

### Fixed Logic

```typescript
// Project Investment Box - prominent with green accent
page.drawRectangle({ 
  x: leftMargin, 
  y: y - 55, 
  width: 512, 
  height: 60, 
  ... 
});
// Text at y - 20 and y - 30

y -= 70; // Move past the investment box (was 75)

// Flexible Payment Options badge - positioned below with proper gap
page.drawRectangle({ 
  x: leftMargin, 
  y: y - 50, // Changed from y - 5 to y - 50
  width: 350, 
  height: 45, 
  ... 
});
// Text positions adjusted accordingly
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-estimate-pdf/index.ts` | Fix payment box y-position in `generateLumpSumPdf` |
| `supabase/functions/generate-invoice-pdf/index.ts` | Apply same fix if payment options section exists |

---

## Updated Coordinate Math

```text
After Fix:
                y = 400 (example)
   +------------------------+  <- y + 5 = 405
   |  PROJECT INVESTMENT    |
   |        $8,324.72       |
   +------------------------+  <- y - 55 = 345
         y -= 70 → y = 330
                              <- 10px gap
   +------------------------+  <- y - 5 = 325
   | FLEXIBLE PAYMENT OPT   |
   +------------------------+  <- y - 50 = 280
```

Now the payment box (280-325) is clearly below the investment box (345-405) with proper spacing.

---

## Technical Implementation

### generateLumpSumPdf Changes (Lines 359-372)

**Before:**
```typescript
// Project Investment Box
page.drawRectangle({ x: leftMargin, y: y - 55, width: 512, height: 60, ... });
page.drawText("PROJECT INVESTMENT", { x: leftMargin + 20, y: y - 20, ... });
page.drawText(formatCurrency(estimate.total), { x: 380, y: y - 30, ... });

y -= 75;

// Flexible Payment Options badge
page.drawRectangle({ x: leftMargin, y: y - 5, width: 350, height: 45, ... });
page.drawText("FLEXIBLE PAYMENT OPTIONS", { x: leftMargin + 12, y: y + 22, ... });
page.drawText("Klarna...", { x: leftMargin + 12, y: y + 8, ... });
page.drawText("Apple Pay...", { x: leftMargin + 12, y: y - 5, ... });

y -= 65;
```

**After:**
```typescript
// Project Investment Box
page.drawRectangle({ x: leftMargin, y: y - 55, width: 512, height: 60, ... });
page.drawText("PROJECT INVESTMENT", { x: leftMargin + 20, y: y - 20, ... });
page.drawText(formatCurrency(estimate.total), { x: 380, y: y - 30, ... });

y -= 70; // Adjusted to properly clear the box

// Flexible Payment Options badge - fixed positioning
page.drawRectangle({ x: leftMargin, y: y - 50, width: 350, height: 45, ... });
page.drawText("FLEXIBLE PAYMENT OPTIONS", { x: leftMargin + 12, y: y - 15, ... });
page.drawText("Klarna...", { x: leftMargin + 12, y: y - 28, ... });
page.drawText("Apple Pay...", { x: leftMargin + 12, y: y - 40, ... });

y -= 60;
```

---

## Expected Result

After the fix:

```text
+----------------------------------+
| YOUR PROJECT INCLUDES            |  (Navy header)
+----------------------------------+
| - Bullet point 1                 |
| - Bullet point 2                 |
+----------------------------------+

+----------------------------------+
| PROJECT INVESTMENT    $8,324.72  |  (Gray box with green border)
+----------------------------------+
          ↓ 10-15px gap
+----------------------------------+
| FLEXIBLE PAYMENT OPTIONS         |  (Dark green box, no overlap)
| Klarna - Pay in 4...             |
| Apple Pay | Cash App...          |
+----------------------------------+
```

