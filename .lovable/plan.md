

# Plan: Add Email Preview & Fix PDF Box Alignment

## Overview

This plan addresses two requests:
1. **Add email preview before sending estimates** - Similar to the existing invoice email preview functionality
2. **Fix PDF styling issues** - The marketing section boxes are still misaligned in the generated PDFs

---

## Part 1: Add Estimate Email Preview

### Current Behavior
When clicking "Send Estimate", the email is sent immediately without any preview.

### New Behavior
Clicking "Send Estimate" will open a preview modal showing:
- Recipient email address
- Email subject line
- Full HTML email preview in an iframe
- "Cancel" and "Send Email" buttons

### Files to Create

**`src/lib/estimateEmailTemplate.ts`** - Client-side email template generator
- Export types: `EstimateForEmail`, `ScopeBullet`, `LineItem`
- Export functions: `generateLumpSumEmailHTML()`, `generateDetailedScopeEmailHTML()`, `getEstimateEmailSubject()`
- Mirrors the email HTML logic from `send-estimate-email/index.ts` for preview purposes

**`src/components/admin/EstimateEmailPreview.tsx`** - Email preview modal component
- Dialog with email metadata (To, Subject)
- Iframe showing the email HTML preview
- Download PDF button
- Cancel and Send Email buttons
- Similar structure to `InvoiceEmailPreview.tsx` and `ReceiptEmailPreview.tsx`

### Files to Modify

**`src/pages/admin/EstimateDetailView.tsx`**
- Add state: `showEmailPreview` (boolean)
- Change `handleSendEstimate` to open preview modal instead of sending directly
- Add new `handleConfirmSendEmail` function that actually sends the email
- Import and render the new `EstimateEmailPreview` component

### Component Integration

```text
EstimateDetailView.tsx
    |
    +-- "Send Estimate" button
    |      |
    |      v
    +-- EstimateEmailPreview (modal)
           |
           +-- Uses estimateEmailTemplate.ts for preview HTML
           +-- "Send Email" calls send-estimate-email edge function
```

---

## Part 2: Fix PDF Box Alignment Issues

### Current Problem
Looking at the generated PDF, the "WHY CHOOSE COURTPRO?" section has a visible gap between the green header bar and the sage-colored content area with the marketing points.

### Root Cause Analysis

The current `drawMarketingSection` function has coordinate math issues:

```text
Current Flow:
1. Draw green header at y-5 with height 24 (bottom at y-5, top at y+19)
2. y -= 30 (moves cursor down 30 units)
3. Draw sage background at y - contentHeight + 10

The gap appears because:
- Header bottom edge is at (original_y - 5)
- After y -= 30, new_y = original_y - 30
- Sage box top edge is at (new_y) = original_y - 30

GAP = (original_y - 5) - (original_y - 30) = 25 pixels!
But header only has height 24, so there's a 1px gap minimum,
plus the "+10" offset makes it worse.
```

### Solution

Recalculate the box positions so they connect seamlessly:

```text
Fixed Flow:
1. Draw green header at y-5 with height 24 (occupies y-5 to y+19)
2. y -= 29 (header height + small adjustment to seamlessly connect)
3. Draw sage background starting at y (no offset), going down by contentHeight
4. Draw text content within the sage box
```

### Files to Modify

**`supabase/functions/generate-estimate-pdf/index.ts`**
- Fix `drawMarketingSection` coordinate calculations
- Ensure header and content boxes connect with no gap

**`supabase/functions/generate-invoice-pdf/index.ts`**
- Apply the same fix for consistency

---

## Technical Implementation Details

### estimateEmailTemplate.ts Structure

```typescript
export interface EstimateForEmail {
  estimate_number: string;
  total: number;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
  display_format: string | null;
  customer: {
    contact_name: string;
    email?: string | null;
  } | null;
}

export interface ScopeBullet {
  id: string;
  bullet_text: string;
  sort_order: number | null;
}

export function generateEstimateEmailHTML(
  estimate: EstimateForEmail,
  scopeBullets: ScopeBullet[],
  lineItems: LineItem[],
  hasAttachments: boolean
): string

export function getEstimateEmailSubject(estimateNumber: string): string
```

### EstimateEmailPreview Props

```typescript
interface EstimateEmailPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: EstimateForEmail;
  scopeBullets: ScopeBullet[];
  lineItems: LineItem[];
  hasAttachments: boolean;
  recipientEmail: string | null;
  onSendEmail: () => void;
  sending: boolean;
}
```

### Fixed Marketing Section Coordinates

```typescript
function drawMarketingSection(page, y, fonts): number {
  // Header bar
  const headerHeight = 24;
  page.drawRectangle({
    x: 50,
    y: y - headerHeight + 4,  // Adjusted position
    width: 512,
    height: headerHeight,
    color: COLORS.green,
  });

  page.drawText("WHY CHOOSE COURTPRO?", {
    x: 60,
    y: y - headerHeight + 10,
    size: 12,
    font: fonts.bold,
    color: COLORS.white,
  });

  // Content area starts immediately below header
  y -= headerHeight;
  
  const numPoints = MARKETING_POINTS.length;
  const contentHeight = numPoints * 16 + 12;

  // Sage background connects seamlessly to header
  page.drawRectangle({
    x: 50,
    y: y - contentHeight,
    width: 512,
    height: contentHeight,
    color: COLORS.lightSage,
  });

  // Green accent line
  page.drawRectangle({
    x: 50,
    y: y - contentHeight,
    width: 4,
    height: contentHeight,
    color: COLORS.green,
  });

  // Position text with proper top padding
  y -= 6; // Top padding inside sage box
  for (const point of MARKETING_POINTS) {
    page.drawText("* " + point, { x: 62, y, size: 10, ... });
    y -= 16;
  }

  y -= 6; // Bottom padding
  return y;
}
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/estimateEmailTemplate.ts` | Create | Client-side email template for preview |
| `src/components/admin/EstimateEmailPreview.tsx` | Create | Modal component for email preview |
| `src/pages/admin/EstimateDetailView.tsx` | Modify | Integrate email preview modal |
| `supabase/functions/generate-estimate-pdf/index.ts` | Modify | Fix marketing section alignment |
| `supabase/functions/generate-invoice-pdf/index.ts` | Modify | Fix marketing section alignment |

---

## User Flow After Implementation

```text
User clicks "Send Estimate"
       |
       v
+------------------------+
| Email Preview Modal    |
|------------------------|
| To: customer@email.com |
| Subject: Your Estimate |
|                        |
| +--------------------+ |
| |  Email Preview     | |
| |  (iframe)          | |
| +--------------------+ |
|                        |
| [Download PDF] [Cancel] [Send Email] |
+------------------------+
       |
       v (Click "Send Email")
       |
Email sent via send-estimate-email edge function
```

