

# Estimate Builder v2: Full Feature Upgrade

This is a large-scale upgrade touching the database schema, the EstimateBuilder UI (~1,743 lines), the PDF generation edge function (~675 lines), and the email edge function (~739 lines). Due to scope, implementation will be split into 4 deployment batches.

---

## Batch 1: Database Migration + Sell Price Override + At-Cost Mode + Alternates

**Database changes (single migration):**
- `estimates` table: add `override_sell_price decimal nullable`, `display_mode text default 'scope_detail'`, `is_phased boolean default false`
- `estimate_items` table: add `option_id uuid nullable`, `phase_id uuid nullable`, `is_alternate boolean default false`
- `estimate_custom_items` table: add `option_id uuid nullable`, `phase_id uuid nullable`, `is_alternate boolean default false`; update `pricing_mode` to support `'at_cost'` value
- New table: `estimate_options` (id, estimate_id, option_name, option_description, override_sell_price, sort_order, is_recommended, created_at) with RLS mirroring estimate_items
- New table: `estimate_phases` (id, estimate_id, phase_name, phase_description, suggested_timeline, sort_order, created_at) with RLS mirroring estimate_items

**UI changes — EstimateBuilder.tsx (Review step):**
- Add "Override sell price" toggle below margin slider with manual dollar input
- Add "Effective margin" color-coded badge (red <15%, yellow 15-30%, green >30%) comparing override to calculated cost
- Store `override_sell_price` on save; use it for `total` in customer-facing contexts

**UI changes — CustomItemsEditor.tsx:**
- Add third pricing mode: "At Cost (Pass-Through)" alongside Direct Price and Cost + Markup
- Add "This is an alternate (deduction)" toggle per item; when on, price becomes negative and item is flagged `is_alternate: true`
- At-cost items show `$0` markup, stored with `pricing_mode: 'at_cost'`

**Files modified:**
- New migration SQL
- `src/pages/admin/EstimateBuilder.tsx` — override toggle + effective margin badge on step 7, save logic updated
- `src/components/admin/CustomItemsEditor.tsx` — at-cost mode, alternate toggle

---

## Batch 2: Scope Detail Display Mode + Multi-Option Estimates

**Display mode:**
- Add third display format `'scope_detail'` to the format selector on step 7 (currently has `lump_sum` and `detailed_scope`)
- Scope Detail shows every scope item with "Included" label (no dollar amounts), grouped under section headers, with a single lump-sum total at bottom
- At-cost items are the exception: show per-item price with "(at our cost)" label
- Alternates show in their own section with deduction amounts visible

**Multi-option estimates:**
- Add "Add Option" button on Review step
- Each option: name, description, optional override sell price, is_recommended toggle
- Base scope items (option_id = null) shared across all options
- Per-option unique items managed via a sub-editor
- Options sortable by sort_order
- Single-option estimates render without "Option 1" labeling

**Files modified:**
- `src/pages/admin/EstimateBuilder.tsx` — option management UI, display mode selector update
- New component: `src/components/admin/EstimateOptionEditor.tsx`
- Save logic updated to write to `estimate_options`, tag items/custom items with `option_id`

---

## Batch 3: Project Phasing + PDF Overhaul

**Project phasing:**
- "Phased Project" toggle on Review step
- Phase management: add/name/describe phases, assign scope items to phases via dropdown
- Phase subtotals calculated automatically
- Interactions with multi-option: each option shows its own phase breakdown

**PDF generation (complete rewrite of `generate-estimate-pdf/index.ts`):**
- Implement robust page-break logic: check `y - element_height < footer_safe_zone (45pt)` before every draw; auto-create new page with header
- All three display modes: Lump Sum, Line Items (admin), Scope Detail (new default)
- Multi-option rendering: shared scope section, then per-option sections with totals
- Phase rendering: full project total, then per-phase breakdowns
- Alternate section with deduction amounts
- At-cost items with "(at our cost)" label and visible price
- Override sell price used when set
- Acceptance page: option checkboxes, alternate checkboxes, phase approvals, signature/date fields
- Branding: navy header bar, yellow accent, proper spacing (8px min between elements, 16px above total bars, 12px below section headers)
- Footer on every page with page numbers

**Files modified:**
- `supabase/functions/generate-estimate-pdf/index.ts` — major rewrite
- `src/pages/admin/EstimateBuilder.tsx` — phasing UI

---

## Batch 4: Email Integration Update

**Email template update (`send-estimate-email/index.ts`):**
- Email body lists option names with totals if multi-option
- Phase names and subtotals if phased
- Uses override sell price when set
- Branded template (navy/yellow, same as PDF)
- PDF attached via service-to-service call to `generate-estimate-pdf`
- Auto-update estimate status from "draft" to "sent" on successful delivery
- Track via existing `email_logs` table

**Files modified:**
- `supabase/functions/send-estimate-email/index.ts`
- `src/lib/estimateEmailTemplate.ts` (if used for email preview)
- `src/components/admin/EstimateEmailPreview.tsx` — updated to show options/phases

---

## What Will NOT Change
- Pricing engine (`courtCalculator.ts`, `pricingConstants.ts`)
- Margin slider behavior (override is additive)
- Existing Lump Sum / Line Items display modes (kept alongside new Scope Detail)
- Estimate lifecycle (draft → sent → approved → expired/lost)
- Stripe payment integration (uses override price if set, otherwise calculated)
- Sales Estimator public page (`/estimator`)
- Scope bullet auto-generation, exclusion defaults, warranty language

---

## Estimated Implementation
- Batch 1: 1 message (migration + override + at-cost + alternates)
- Batch 2: 1-2 messages (scope detail mode + multi-option)
- Batch 3: 2 messages (phasing UI + full PDF rewrite)
- Batch 4: 1 message (email update)

Total: ~5-6 implementation messages

