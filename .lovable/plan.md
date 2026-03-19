

# Implementation Plan: Fix All Identified Issues

This plan addresses every gap found in the 6-bucket audit, organized from highest revenue impact to lowest.

---

## Phase 1: Lead Intake Qualification (Bucket 2 -- Score 5/10 to 8/10)

**Problem:** ContactForm and LeadCaptureModal collect basic info but miss critical qualification fields. You can't quote accurately or separate serious buyers from tire-kickers.

### 1A. Upgrade ContactForm with smart qualification fields

Add to the existing ContactForm:
- **Job type** dropdown: Resurfacing, New Build, Repair Only
- **Base type**: Asphalt, Concrete, Unknown
- **Court condition** (conditional, shows for resurfacing): Good, Moderate cracks, Heavy damage, Ponding
- **Public vs Private**: Public bid / Private owner / School/institution
- **Number of courts**: 1-8+
- **Budget range** (optional): Under $15k, $15-30k, $30-60k, $60k+
- **Urgency**: Flexible, Within 3 months, Within 6 months, ASAP
- **Photo upload**: Allow 1-3 site photos via Supabase Storage

Update the `leads` table with new columns: `job_type`, `base_type`, `court_condition`, `ownership_type`, `number_of_courts`, `budget_range`, `urgency`, `photo_urls`.

Update `send-contact-email` and `submit-lead` edge functions to pass new fields to n8n.

### 1B. Add AI lead scoring

Create a new edge function `score-lead` using Lovable AI Gateway:
- Takes lead data + any uploaded photos
- Returns a score (1-10) and tags: `likely_resurfacing`, `likely_heavy_repair`, `likely_public_bid`, `likely_premium`, `poor_fit`
- Auto-stores score and tags on the `leads` table (new columns: `ai_score`, `ai_tags`)
- Runs automatically after lead submission

### 1C. Show lead score in admin Leads page

Display the AI score badge and tags in the leads table so you can prioritize follow-up.

---

## Phase 2: CRM & Follow-Up Automation (Bucket 4 -- Score 5/10 to 8/10)

**Problem:** "Convert to Customer" button does nothing. No automated follow-up. No pipeline tracking. No lost-lead analysis.

### 2A. Wire up "Convert to Customer" button

On the Leads page, make the button functional:
- Opens a pre-filled CustomerFormModal with data from the lead
- On save, creates customer record, updates lead status to `converted`, sets `converted_customer_id`

### 2B. Add pipeline stages and lost-lead tracking

Add columns to `leads` table: `lost_reason`, `follow_up_date`, `last_contacted_at`, `follow_up_count`.

Add to the Leads page:
- "Lost" status option with required reason dropdown (too expensive, went with competitor, project cancelled, no response, bad fit)
- Next follow-up date picker
- Follow-up counter

### 2C. Dashboard follow-up alerts

Add a "Needs Follow-Up" widget to the admin Dashboard:
- Shows leads where `follow_up_date <= today` or status is `new` and older than 24 hours
- Quick action buttons: Mark Contacted, Set Follow-Up, Convert

### 2D. Auto-response email on lead submission

Update `send-contact-email` edge function to also send a branded confirmation email to the lead using Resend (already configured), confirming receipt and setting expectations for response time.

---

## Phase 3: Estimator Margin Protection (Bucket 3/6 -- Score 9/10 to 10/10)

**Problem:** No pricing floor. Same estimate whether court is clean or wrecked. No travel/freight costs. No public-bid vs private pricing logic.

### 3A. Add pricing floor to estimator

Add a `minimum_job_price` setting to `pricing_config`. In `courtCalculator.ts`, after calculating total, enforce: if total < floor, use floor. Show a warning in EstimateBuilder when floor is hit.

### 3B. Add travel/mobilization cost

Add to `pricing_config`: `mobilization_flat_rate`, `travel_per_mile`, `max_free_travel_miles`. Add a "Travel Distance" field in EstimateBuilder (miles from HQ). Auto-calculate mobilization line item.

### 3C. Freight cost line item

Add `freight_per_drum` and `freight_flat_rate` to pricing config. Auto-calculate based on material quantities.

### 3D. Condition-based pricing guard

In EstimateBuilder, when court condition is "Heavy damage" and crack repair LF is below a threshold, show an alert: "Heavy damage selected but crack repair seems low -- verify on site." Prevents underbidding ugly jobs.

---

## Phase 4: Proposal & Sales Materials (Bucket 5 -- Score 7/10 to 9/10)

**Problem:** No tiered proposals. No exclusions/assumptions. No warranty language. No digital signature.

### 4A. Tiered proposal generation

In EstimateBuilder, add a "Generate Options" button that auto-creates 3 tiers:
- **Good**: Current system (e.g., Advantage)
- **Better**: Next tier up (e.g., ColorFlex)
- **Best**: Premium tier (e.g., Masters)

Each tier uses the same court config but swaps the surfacing system. All three appear on the proposal PDF side by side.

### 4B. Exclusions and assumptions on estimates

Add an `estimate_exclusions` table (or use a default set stored in pricing_config) with standard exclusions:
- "Pricing does not include permits unless specified"
- "Assumes adequate drainage exists"
- "Does not include tree removal or earthwork"
- "Subject to site inspection"

Auto-include on PDF. Allow per-estimate customization.

### 4C. Warranty language

Add configurable warranty text to pricing_config (category: `proposal_text`, key: `warranty_language`). Auto-include on PDF output.

---

## Phase 5: Sales Analytics (Bucket 6 -- Score 6/10 to 8/10)

**Problem:** No won/lost tracking. No close rate. No channel analysis.

### 5A. Win/loss tracking on estimates

Add `outcome` column to `estimates` table: `won`, `lost`, `expired`. Add `lost_reason` column. When estimate status changes to `approved`, auto-set `outcome = won`. Add a "Mark Lost" button with reason dropdown.

### 5B. Sales analytics dashboard widget

New component on admin Dashboard:
- Close rate (won / (won + lost) over last 90 days)
- Average job size
- Average days to close
- Win/loss by source
- Revenue pipeline (sum of pending estimates)

Uses existing `estimates` + `leads` data. No new tables needed beyond the columns above.

---

## Phase 6: Front-End Credibility (Bucket 1 -- Score 8/10 to 9/10)

### 6A. Add social proof section

Add a testimonials/reviews section to the homepage below Services. Pull from a new `testimonials` table or hardcode 3-5 real reviews. Include star ratings and customer location.

### 6B. Before/after photo gallery

Add a portfolio section showing completed project photos. Can pull from `project_photos` table (already exists) filtered to completed projects marked as "showcase."

---

## Database Changes Summary

New columns on `leads`: `job_type`, `base_type`, `court_condition`, `ownership_type`, `number_of_courts`, `budget_range`, `urgency`, `photo_urls` (text[]), `ai_score` (integer), `ai_tags` (text[]), `lost_reason`, `follow_up_date`, `last_contacted_at`, `follow_up_count`

New columns on `estimates`: `outcome`, `lost_reason`

New rows in `pricing_config`: `minimum_job_price`, `mobilization_flat_rate`, `travel_per_mile`, `max_free_travel_miles`, `freight_per_drum`, `freight_flat_rate`, `warranty_language`

New table: `estimate_exclusions` (id, estimate_id nullable, text, is_default, sort_order)

New edge function: `score-lead` (Lovable AI Gateway)

Updated edge functions: `send-contact-email` (auto-response), `submit-lead` (new fields)

---

## Recommended Build Order

1. **Phase 1A** -- Intake fields (immediate quoting improvement)
2. **Phase 2A** -- Convert to Customer button (stop losing pipeline)
3. **Phase 2B** -- Pipeline stages and follow-up dates
4. **Phase 3A-3C** -- Pricing floor + travel + freight (margin protection)
5. **Phase 2C-2D** -- Dashboard alerts + auto-response email
6. **Phase 1B-1C** -- AI lead scoring
7. **Phase 4A-4C** -- Tiered proposals + exclusions + warranty
8. **Phase 5A-5B** -- Win/loss analytics
9. **Phase 6A-6B** -- Social proof + portfolio

Each phase is independently deployable. Total: ~15-20 implementation messages.

