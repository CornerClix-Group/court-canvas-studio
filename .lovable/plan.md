
# Plan: Update Estimate Email Footer & Redesign Invoice PDF

## Overview

Align the estimate email footer and invoice PDF generator with the new CourtPro Augusta branding implemented in the estimate PDF generator.

---

## Part 1: Update Estimate Email Footer

### Current State
The estimate email footer shows:
```
CourtHaus Construction, LLC (large, white text)
dba CourtPro Augusta (smaller, gray)
500 Furys Ferry Rd. Suite 107
Augusta, GA 30907
```

### Updated Design
```
CourtPro Augusta (large, white text)
Professional Court Construction (smaller, light blue)
500 Furys Ferry Rd. Suite 107, Augusta, GA 30907
A CourtHaus Construction, LLC Company (small legal text)
```

### Changes to `supabase/functions/send-estimate-email/index.ts`

1. Update `COMPANY_INFO` object to use brand-focused structure:
```typescript
const COMPANY_INFO = {
  brandName: "CourtPro Augusta",
  tagline: "Professional Court Construction",
  legalName: "A CourtHaus Construction, LLC Company",
  address: "500 Furys Ferry Rd. Suite 107",
  cityStateZip: "Augusta, GA 30907",
  phone: "(706) 309-1993",
  email: "estimates@courtproaugusta.com",
};
```

2. Update footer HTML in both `generateLumpSumEmailHTML` and `generateDetailedScopeEmailHTML` functions:
```html
<!-- Footer -->
<tr>
  <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
    <p style="color: #ffffff; margin: 0 0 5px 0; font-size: 18px; font-weight: 600;">CourtPro Augusta</p>
    <p style="color: #93c5fd; margin: 0 0 12px 0; font-size: 12px;">Professional Court Construction</p>
    <p style="color: #9ca3af; margin: 0; font-size: 12px;">
      (706) 309-1993 | estimates@courtproaugusta.com
    </p>
    <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 11px;">
      500 Furys Ferry Rd. Suite 107, Augusta, GA 30907
    </p>
    <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 10px; font-style: italic;">
      A CourtHaus Construction, LLC Company
    </p>
  </td>
</tr>
```

---

## Part 2: Redesign Invoice PDF Generator

### Current State
The invoice PDF uses a basic text-based approach with Courier font, showing:
- Full legal name "CourtHaus Construction, LLC dba CourtPro Augusta"
- Plain text layout with no colors or branding

### New Design Matching Estimate PDF

| Element | Description |
|---------|-------------|
| **Header** | Navy bar with "CourtPro Augusta" in white, tagline in light blue |
| **Invoice Info** | Clean layout with invoice number, date, due date |
| **Bill To** | Professional customer information section |
| **Line Items** | Table with alternating row colors |
| **Totals** | Green-accented investment box |
| **Payment Options** | Teal banner with Klarna, cards, bank transfer |
| **Marketing** | "WHY CHOOSE COURTPRO?" trust signals section |
| **Quality Quote** | Same inspirational message about Laykold materials |
| **Footer** | Navy bar with legal entity in small text |
| **PAID Stamp** | Green diagonal watermark when invoice is paid |

### Changes to `supabase/functions/generate-invoice-pdf/index.ts`

Complete rewrite using pdf-lib with the same branded approach as estimates:

1. **Import pdf-lib** for proper PDF generation (replacing text-based approach)
2. **Add brand constants** (COMPANY_INFO, COLORS, MARKETING_POINTS)
3. **Implement drawing functions**:
   - `drawBrandedHeader()` - Navy header bar
   - `drawInvoiceInfo()` - Invoice details section
   - `drawBillTo()` - Customer info box
   - `drawLineItems()` - Professional table
   - `drawTotals()` - Subtotal, tax, total with green accent
   - `drawPaymentOptions()` - Teal payment methods banner
   - `drawMarketingSection()` - Trust signals (shared with estimates)
   - `drawQualityStatement()` - Quote box
   - `drawFooter()` - Navy footer with legal text
   - `drawPaidWatermark()` - Diagonal green "PAID" stamp if applicable

---

## Color Scheme (Consistent with Estimate PDF)

| Element | Color | RGB Value |
|---------|-------|-----------|
| Header/Footer Background | Dark Navy | rgb(0.12, 0.23, 0.37) |
| Primary Accent | Brand Green | rgb(0.02, 0.59, 0.41) |
| Tagline Text | Light Blue | rgb(0.58, 0.77, 0.99) |
| Investment Box Background | Light Gray | rgb(0.95, 0.97, 1.0) |
| Marketing Section | Light Sage | rgb(0.94, 0.98, 0.94) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/send-estimate-email/index.ts` | Update COMPANY_INFO and footer HTML in both email templates |
| `supabase/functions/generate-invoice-pdf/index.ts` | Complete rewrite with pdf-lib and branded design |

---

## Technical Notes

- Uses pdf-lib with StandardFonts (Helvetica, Helvetica-Bold)
- All text uses WinAnsi-compatible characters only (no Unicode symbols)
- Bullet points use asterisk (*) or hyphen (-) instead of checkmarks
- Flexible Payment Options banner uses teal color scheme to distinguish from estimates
- PAID watermark uses semi-transparent green diagonal text when invoice status is "paid"
