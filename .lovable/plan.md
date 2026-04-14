

# Fix: Override Price Not Populating in Preview Cards

## Problem
When you toggle "Override sell price" and enter a custom amount, the price correctly shows in the Profit Summary section but does NOT update in the Customer Display Format preview cards below. Both the "Lump Sum" and "Detailed Scope" preview cards still show the calculated price instead of your override.

## What the Customer Sees
The customer **never** sees your markup percentage. They only see the final dollar amount — either the calculated price or your override price. The "Markup (40%)" slider and all cost breakdowns are internal-only and never appear on PDFs, emails, or any customer-facing output.

## Fix (2 lines)

In `EstimateBuilder.tsx`:

- **Line 1628** — Lump Sum preview: change `grandTotalWithCustomItems` → `customerFacingTotal`
- **Line 1672** — Detailed Scope preview: change `grandTotalWithCustomItems` → `customerFacingTotal`

This ensures when you enter an override price, it immediately reflects in the preview cards below so you can see exactly what the customer will see.

