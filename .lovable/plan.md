

# Plan: Enhanced Estimate PDF with CourtPro Augusta Branding & Marketing

## Overview

Transform the estimate PDF from a plain document into a **professionally branded, marketing-focused sales tool** that reinforces trust and helps close deals.

---

## Part 1: Branding Updates

### Change Company Name Display

| Location | Current | New |
|----------|---------|-----|
| PDF Header | "CourtHaus Construction, LLC dba CourtPro Augusta" | **"CourtPro Augusta"** |
| Subheader | None | **"Professional Court Construction"** |
| Footer/Legal | Not shown | Small text: "A CourtHaus Construction, LLC company" |

This keeps the legal identity while emphasizing the customer-facing brand.

### Files to Update

| File | Changes |
|------|---------|
| `supabase/functions/generate-estimate-pdf/index.ts` | Update COMPANY_INFO, redesign header/layout |
| `supabase/functions/generate-invoice-pdf/index.ts` | Match branding for consistency |
| `supabase/functions/send-estimate-email/index.ts` | Already uses "CourtPro Augusta" in header - just update footer |

---

## Part 2: Visual Design Improvements

### New PDF Layout Structure

```text
+------------------------------------------------------------------+
|                        [HEADER SECTION]                           |
|    COURTPRO AUGUSTA                                               |
|    Professional Court Construction                                |
|    (706) 309-1993 | estimates@courtproaugusta.com                |
+------------------------------------------------------------------+
|                                                                   |
|    ESTIMATE #EST-2026-0042           Date: January 26, 2026      |
|    Valid Until: February 25, 2026                                 |
|                                                                   |
+------------------------------------------------------------------+
|    PREPARED FOR:                                                  |
|    [Customer Name]                                                |
|    [Address]                                                      |
|                                                                   |
+==================================================================+
|                      YOUR PROJECT INCLUDES                        |
+==================================================================+
|                                                                   |
|    - Pro Plus Elite cushioned surfacing system (7 coats)         |
|    - Professional pressure washing and surface preparation        |
|    - Complete 4-court pickleball line striping                   |
|    - Premium color selection with UV-stable pigments              |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|   +----------------------------------------------------------+   |
|   |                  PROJECT INVESTMENT                       |   |
|   |                                                           |   |
|   |                     $12,450.00                            |   |
|   +----------------------------------------------------------+   |
|                                                                   |
+------------------------------------------------------------------+
|   +----------------------------------------------------------+   |
|   |        FLEXIBLE PAYMENT OPTIONS                           |   |
|   |   Klarna | Apple Pay | Cash App | Cards                  |   |
|   |   Bank Transfer (ACH) - NO FEES!                          |   |
|   +----------------------------------------------------------+   |
|                                                                   |
+==================================================================+
|                      WHY CHOOSE COURTPRO?                         |
+==================================================================+
|                                                                   |
|   [Trophy Icon] 200+ Courts Completed                            |
|   [Star Icon] ASBA Certified Builder                             |
|   [Shield Icon] Industry-Leading Warranty                        |
|   [Clock Icon] On-Time Project Delivery                          |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|   "Your court is an investment. We use only premium Laykold      |
|    surfacing systems to ensure years of exceptional play."        |
|                                                                   |
+------------------------------------------------------------------+
|                        [FOOTER]                                   |
|   A CourtHaus Construction, LLC company                          |
|   500 Furys Ferry Rd. Suite 107, Augusta, GA 30907               |
+------------------------------------------------------------------+
```

### Color Scheme

| Element | Color | RGB Value |
|---------|-------|-----------|
| Header Background | Dark Navy | rgb(0.12, 0.23, 0.37) |
| Primary Accent | Brand Green | rgb(0.02, 0.59, 0.41) |
| Investment Box Background | Light Gray | rgb(0.95, 0.97, 1.0) |
| Investment Amount | Brand Green | rgb(0.02, 0.59, 0.41) |
| Marketing Section | Light Sage | rgb(0.94, 0.98, 0.94) |

---

## Part 3: Marketing Content Additions

### "Why Choose CourtPro?" Section

Add a dedicated marketing section before the footer with trust-building content:

```typescript
const MARKETING_POINTS = [
  { icon: '*', text: '200+ Courts Completed - Trusted by homeowners, schools & clubs' },
  { icon: '*', text: 'ASBA Certified - American Sports Builders Association member' },
  { icon: '*', text: 'Premium Materials - Laykold surfaces used by US Open & ATP' },
  { icon: '*', text: 'Local Expertise - Serving Augusta & CSRA since 2020' },
];
```

### Warranty/Quality Callout

Add a quality assurance statement:

```
"Your court is more than pavement - it's where memories are made.
We use only premium Laykold surfacing systems, the same materials
trusted by the US Open and professional tournaments worldwide."
```

### Dynamic Marketing Based on Project Type

The marketing text will adapt based on the estimate content:

| Project Type | Marketing Focus |
|--------------|-----------------|
| Pickleball | "The fastest-growing sport - invest in quality that lasts" |
| Tennis | "Championship-quality surfaces for serious players" |
| Basketball | "Built tough for years of hard play" |
| Resurfacing | "Restore your court to like-new condition" |

---

## Part 4: Implementation Details

### Updated generate-estimate-pdf/index.ts

Key changes:

1. **Header Section**: Navy gradient with "CourtPro Augusta" prominently displayed
2. **Remove Legal Entity**: No more "CourtHaus Construction, LLC dba" in header
3. **Add Tagline**: "Professional Court Construction" under brand name
4. **Marketing Section**: New section with trust signals before footer
5. **Footer**: Small legal text for compliance

### PDF Drawing Functions

```typescript
// New header drawing function
function drawBrandedHeader(page: PDFPage, fonts: { bold: PDFFont, regular: PDFFont }) {
  // Navy header bar
  page.drawRectangle({
    x: 0, y: 742, width: 612, height: 50,
    color: rgb(0.12, 0.23, 0.37)
  });
  
  // Brand name
  page.drawText('CourtPro Augusta', {
    x: 50, y: 758, size: 22, font: fonts.bold,
    color: rgb(1, 1, 1)
  });
  
  // Tagline
  page.drawText('Professional Court Construction', {
    x: 50, y: 744, size: 10, font: fonts.regular,
    color: rgb(0.58, 0.77, 0.99) // Light blue
  });
  
  // Contact on right side
  page.drawText('(706) 309-1993', {
    x: 450, y: 758, size: 10, font: fonts.regular,
    color: rgb(1, 1, 1)
  });
}

// New marketing section drawing function
function drawMarketingSection(page: PDFPage, y: number, fonts: { bold: PDFFont, regular: PDFFont }) {
  // Section header
  page.drawRectangle({
    x: 50, y: y - 5, width: 512, height: 25,
    color: rgb(0.02, 0.59, 0.41) // Brand green
  });
  
  page.drawText('WHY CHOOSE COURTPRO?', {
    x: 60, y: y + 3, size: 12, font: fonts.bold,
    color: rgb(1, 1, 1)
  });
  
  y -= 40;
  
  // Trust points
  const points = [
    '* 200+ Courts Completed - Trusted by homeowners, schools & clubs',
    '* ASBA Certified - American Sports Builders Association member',
    '* Premium Materials - Laykold surfaces used by US Open & ATP',
    '* Local Expertise - Serving Augusta & the CSRA',
  ];
  
  for (const point of points) {
    page.drawText(point, { x: 60, y, size: 10, font: fonts.regular });
    y -= 16;
  }
  
  return y;
}
```

---

## Part 5: Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/generate-estimate-pdf/index.ts` | Complete redesign with new branding and marketing |
| `supabase/functions/generate-invoice-pdf/index.ts` | Update header to match (optional - follow-up) |
| `supabase/functions/send-estimate-email/index.ts` | Update footer COMPANY_INFO to match |

---

## Part 6: Sample Output Preview

The new PDF will include:

1. **Bold Navy Header** - "CourtPro Augusta" with contact info
2. **Clean Estimate Info** - Number, date, validity period
3. **Customer Section** - Professional "Prepared For" block
4. **Scope Bullets** - What's included with check marks
5. **Investment Box** - Large, prominent total with green accent
6. **Payment Options** - Klarna, cards, bank transfer callout
7. **Marketing Section** - Trust signals and quality messaging
8. **Professional Footer** - Legal entity in small text

---

## Technical Notes

- Uses pdf-lib standard fonts (Helvetica, Helvetica-Bold) - no custom fonts needed
- All text uses WinAnsi-compatible characters (no unicode symbols)
- Bullet points use asterisk (*) or hyphen (-) instead of checkmarks
- Colors use rgb() function for consistency

