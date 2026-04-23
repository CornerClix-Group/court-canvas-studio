import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "https://esm.sh/pdf-lib@1.17.1";

const COMPANY = {
  brand: "CourtPro Augusta",
  legal: "CourtHaus Construction, LLC dba CourtPro Augusta",
  llcNumber: "GA LLC #25207576",
  phone: "(706) 309-1993",
  email: "estimates@courtproaugusta.com",
  website: "courtproaugusta.com",
  address: "500 Furys Ferry Rd, Ste 107, Augusta, GA 30907",
  preparedBy: "Troy Akers, Owner",
};

// Brand colors
const NAVY = rgb(0.118, 0.165, 0.227); // #1E2A3A
const YELLOW = rgb(0.831, 0.878, 0.125); // #D4E020
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(0.4, 0.4, 0.4);
const LIGHT_GRAY = rgb(0.867, 0.867, 0.867); // #DDDDDD
const LINE_GRAY = rgb(0.933, 0.933, 0.933); // #EEEEEE
const FOOTER_GRAY = rgb(0.6, 0.6, 0.6); // #999999

const PAGE_W = 612;
const PAGE_H = 792;
const LEFT = 50;
const RIGHT = 562;
const CONTENT_W = RIGHT - LEFT;
const FOOTER_SAFE = 50; // nothing below this Y
const FULL_HEADER_H = 80;
const COMPACT_HEADER_H = 55;
const ACCENT_H = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const fmt = (n: number): string => "$" + Math.round(n).toLocaleString("en-US");
const fmtDate = (s: string): string =>
  new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

interface Fonts {
  bold: PDFFont;
  regular: PDFFont;
}

interface PageCtx {
  doc: PDFDocument;
  fonts: Fonts;
  page: PDFPage;
  y: number;
  pageNum: number;
  totalPages: number; // filled in at the end
}

// ─── HEADER ────────────────────────────────────────────────────────────────

function drawFullHeader(page: PDFPage, fonts: Fonts) {
  // Navy bar
  page.drawRectangle({ x: 0, y: PAGE_H - FULL_HEADER_H, width: PAGE_W, height: FULL_HEADER_H, color: NAVY });
  // Brand name
  page.drawText(COMPANY.brand, { x: LEFT, y: PAGE_H - 30, size: 22, font: fonts.bold, color: WHITE });
  page.drawText("Professional Court Construction", { x: LEFT, y: PAGE_H - 45, size: 9, font: fonts.regular, color: rgb(0.7, 0.8, 0.9) });
  // Contact right-aligned
  const rightCol = 380;
  page.drawText(COMPANY.phone, { x: rightCol, y: PAGE_H - 25, size: 10, font: fonts.bold, color: WHITE });
  page.drawText(COMPANY.email, { x: rightCol, y: PAGE_H - 38, size: 8, font: fonts.regular, color: rgb(0.7, 0.8, 0.9) });
  page.drawText(COMPANY.website, { x: rightCol, y: PAGE_H - 50, size: 8, font: fonts.regular, color: rgb(0.7, 0.8, 0.9) });
  page.drawText(COMPANY.address, { x: rightCol, y: PAGE_H - 62, size: 7, font: fonts.regular, color: rgb(0.7, 0.8, 0.9) });
  // Yellow accent
  page.drawRectangle({ x: 0, y: PAGE_H - FULL_HEADER_H - ACCENT_H, width: PAGE_W, height: ACCENT_H, color: YELLOW });
}

function drawCompactHeader(page: PDFPage, fonts: Fonts) {
  page.drawRectangle({ x: 0, y: PAGE_H - COMPACT_HEADER_H, width: PAGE_W, height: COMPACT_HEADER_H, color: NAVY });
  page.drawText(COMPANY.brand, { x: LEFT, y: PAGE_H - 35, size: 16, font: fonts.bold, color: WHITE });
  page.drawRectangle({ x: 0, y: PAGE_H - COMPACT_HEADER_H - ACCENT_H, width: PAGE_W, height: ACCENT_H, color: YELLOW });
}

// ─── FOOTER (placeholder — page numbers filled at end) ─────────────────

function drawFooterPlaceholder(page: PDFPage, fonts: Fonts) {
  const footerText = `${COMPANY.legal} | ${COMPANY.llcNumber} | Fully Licensed & Insured`;
  const tw = fonts.regular.widthOfTextAtSize(footerText, 7);
  page.drawText(footerText, { x: (PAGE_W - tw) / 2, y: 25, size: 7, font: fonts.regular, color: FOOTER_GRAY });
}

// ─── PAGE MANAGEMENT ───────────────────────────────────────────────────

function startPage1(ctx: PageCtx): void {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.pageNum = 1;
  drawFullHeader(ctx.page, ctx.fonts);
  drawFooterPlaceholder(ctx.page, ctx.fonts);
  ctx.y = PAGE_H - FULL_HEADER_H - ACCENT_H - 22;
}

function newPage(ctx: PageCtx): void {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.pageNum++;
  drawCompactHeader(ctx.page, ctx.fonts);
  drawFooterPlaceholder(ctx.page, ctx.fonts);
  ctx.y = PAGE_H - COMPACT_HEADER_H - ACCENT_H - 16;
}

function ensureSpace(ctx: PageCtx, needed: number): void {
  if (ctx.y - needed < FOOTER_SAFE) newPage(ctx);
}

// ─── TEXT HELPERS ───────────────────────────────────────────────────────

function wrapText(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(test, size) > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(ctx: PageCtx, text: string, x: number, size: number, font: PDFFont, color: any, maxW: number, lineH: number): void {
  const lines = wrapText(text, font, size, maxW);
  for (const line of lines) {
    ensureSpace(ctx, lineH + 4);
    ctx.page.drawText(line, { x, y: ctx.y, size, font, color });
    ctx.y -= lineH;
  }
}

function drawRightAligned(page: PDFPage, text: string, y: number, size: number, font: PDFFont, color: any): void {
  const tw = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: RIGHT - tw, y, size, font, color });
}

// ─── SECTION HELPERS ───────────────────────────────────────────────────

function drawSectionBar(ctx: PageCtx, title: string, badgeText?: string): void {
  ensureSpace(ctx, 30);
  ctx.y -= 12; // clearance above
  const barH = 18;
  ctx.page.drawRectangle({ x: LEFT, y: ctx.y - barH, width: CONTENT_W, height: barH, color: NAVY });
  ctx.page.drawText(title, { x: LEFT + 8, y: ctx.y - barH + 5, size: 9, font: ctx.fonts.bold, color: WHITE });
  if (badgeText) {
    const titleW = ctx.fonts.bold.widthOfTextAtSize(title, 9);
    const bx = LEFT + 8 + titleW + 12;
    const bw = ctx.fonts.bold.widthOfTextAtSize(badgeText, 7) + 10;
    ctx.page.drawRectangle({ x: bx, y: ctx.y - barH + 3, width: bw, height: 12, color: YELLOW });
    ctx.page.drawText(badgeText, { x: bx + 5, y: ctx.y - barH + 5, size: 7, font: ctx.fonts.bold, color: NAVY });
  }
  ctx.y -= barH + 6;
}

function drawTotalBar(ctx: PageCtx, label: string, amount: number): void {
  ctx.y -= 20; // clearance above total bar
  ensureSpace(ctx, 30);
  const barH = 22;
  ctx.page.drawRectangle({ x: LEFT, y: ctx.y - barH, width: CONTENT_W, height: barH, color: NAVY });
  ctx.page.drawText(label, { x: LEFT + 10, y: ctx.y - barH + 7, size: 10, font: ctx.fonts.bold, color: WHITE });
  const priceText = fmt(amount);
  const pw = ctx.fonts.bold.widthOfTextAtSize(priceText, 13);
  ctx.page.drawText(priceText, { x: RIGHT - 10 - pw, y: ctx.y - barH + 5, size: 13, font: ctx.fonts.bold, color: YELLOW });
  ctx.y -= barH + 20;
}

function drawScopeItem(ctx: PageCtx, text: string, showIncluded = true): void {
  const itemH = 14;
  ensureSpace(ctx, itemH + 6);
  const lines = wrapText(text, ctx.fonts.regular, 8.5, showIncluded ? CONTENT_W - 80 : CONTENT_W - 16);
  for (let i = 0; i < lines.length; i++) {
    ensureSpace(ctx, itemH);
    ctx.page.drawText(lines[i], { x: LEFT + 8, y: ctx.y, size: 8.5, font: ctx.fonts.regular, color: GRAY });
    if (i === 0 && showIncluded) {
      drawRightAligned(ctx.page, "Included", ctx.y, 8, ctx.fonts.regular, rgb(0.5, 0.5, 0.5));
    }
    ctx.y -= 11;
  }
  // Separator line
  ctx.page.drawRectangle({ x: LEFT + 8, y: ctx.y + 7, width: CONTENT_W - 16, height: 0.3, color: LINE_GRAY });
  ctx.y -= 3;
}

function drawBullet(ctx: PageCtx, text: string): void {
  ensureSpace(ctx, 14);
  const lines = wrapText("- " + text, ctx.fonts.regular, 8, CONTENT_W - 16);
  for (const line of lines) {
    ensureSpace(ctx, 12);
    ctx.page.drawText(line, { x: LEFT + 8, y: ctx.y, size: 8, font: ctx.fonts.regular, color: GRAY });
    ctx.y -= 11;
  }
}

// ─── MAIN PDF GENERATION ───────────────────────────────────────────────

async function generateEstimatePdf(estimate: any, _supabase: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fonts: Fonts = { bold, regular };

  const ctx: PageCtx = { doc, fonts, page: null as any, y: 0, pageNum: 0, totalPages: 0 };

  const customer = estimate.customers;
  const items: any[] = (estimate.estimate_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const customItems: any[] = (estimate.estimate_custom_items || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  const scopeBullets: any[] = (estimate.estimate_scope_bullets || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  const exclusions: any[] = estimate._exclusions || [];
  const options: any[] = (estimate.estimate_options || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const phases: any[] = (estimate.estimate_phases || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const isMultiOption = options.length > 1;
  const isPhased = estimate.is_phased && phases.length > 0;
  const displayFormat = estimate.display_format || "scope_detail";

  // Determine estimate total per option
  function getOptionTotal(opt: any): number {
    if (opt.override_sell_price != null) return Number(opt.override_sell_price);
    // Sum shared items + option-specific items + relevant custom items
    const sharedItemsTotal = items.filter(i => !i.option_id && !i.is_alternate).reduce((s, i) => s + Number(i.total), 0);
    const optionItemsTotal = items.filter(i => i.option_id === opt.id && !i.is_alternate).reduce((s, i) => s + Number(i.total), 0);
    const sharedCustomTotal = customItems.filter(ci => !ci.option_id && !ci.is_alternate).reduce((s, ci) => s + Number(ci.customer_price), 0);
    const optionCustomTotal = customItems.filter(ci => ci.option_id === opt.id && !ci.is_alternate).reduce((s, ci) => s + Number(ci.customer_price), 0);
    return sharedItemsTotal + optionItemsTotal + sharedCustomTotal + optionCustomTotal;
  }

  // Single option total
  function getSingleTotal(): number {
    if (estimate.override_sell_price != null) return Number(estimate.override_sell_price);
    const itemsTotal = items.filter(i => !i.is_alternate).reduce((s, i) => s + Number(i.total), 0);
    const customTotal = customItems.filter(ci => !ci.is_alternate).reduce((s, ci) => s + Number(ci.customer_price), 0);
    return itemsTotal + customTotal;
  }

  // ─── PAGE 1: Project Info, Scope, Options ───────────────────────────

  startPage1(ctx);

  // Title block
  const titleText = "Court Resurfacing Estimate"; // Could be dynamic
  ctx.page.drawText(titleText, { x: LEFT, y: ctx.y, size: 18, font: bold, color: NAVY });
  drawRightAligned(ctx.page, `Estimate #${estimate.estimate_number}`, ctx.y + 2, 9, bold, NAVY);
  ctx.y -= 18;

  // Prepared for
  const infoLines: string[] = [];
  if (customer) {
    infoLines.push(`Prepared for: ${customer.company_name || customer.contact_name}`);
    if (customer.company_name && customer.contact_name) infoLines.push(customer.contact_name);
    const addrParts = [customer.address, customer.city, customer.state, customer.zip].filter(Boolean);
    if (addrParts.length > 0) infoLines.push(addrParts.join(", "));
  }
  const validDays = estimate.valid_until
    ? Math.max(1, Math.round((new Date(estimate.valid_until).getTime() - new Date(estimate.created_at).getTime()) / 86400000))
    : 30;
  infoLines.push(`Date: ${fmtDate(estimate.created_at)} | Estimate Valid for ${validDays} Days`);

  for (const line of infoLines) {
    ctx.page.drawText(line, { x: LEFT, y: ctx.y, size: 9, font: regular, color: rgb(0.4, 0.4, 0.4) });
    ctx.y -= 13;
  }

  // Divider
  ctx.y -= 2;
  ctx.page.drawRectangle({ x: LEFT, y: ctx.y, width: CONTENT_W, height: 0.5, color: LIGHT_GRAY });
  ctx.y -= 16;

  // Project Overview
  ctx.page.drawText("Project Overview", { x: LEFT, y: ctx.y, size: 11, font: bold, color: NAVY });
  ctx.y -= 14;

  // Build dynamic overview text from estimate data
  const overviewParts: string[] = [];
  if (estimate.notes) overviewParts.push(estimate.notes);
  if (overviewParts.length === 0) {
    // Auto-generate a brief overview from scope bullets
    const firstBullets = scopeBullets.slice(0, 3).map((b: any) => b.bullet_text);
    if (firstBullets.length > 0) overviewParts.push(firstBullets.join(". ") + ".");
    else overviewParts.push("Professional court construction services as detailed in the scope of work below.");
  }

  for (const text of overviewParts) {
    drawWrappedText(ctx, text, LEFT, 8.5, regular, GRAY, CONTENT_W, 11);
  }
  ctx.y -= 8;

  // ─── SHARED SCOPE OF WORK ──────────────────────────────────────────

  const sharedItems = items.filter(i => !i.option_id && !i.is_alternate);
  const sharedCustom = customItems.filter(ci => !ci.option_id && !ci.is_alternate && ci.pricing_mode !== "at_cost");

  if (sharedItems.length > 0 || sharedCustom.length > 0 || scopeBullets.length > 0) {
    const sectionName = isMultiOption ? "Scope of Work - Base Scope (Included in All Options)" : "Scope of Work";
    drawSectionBar(ctx, sectionName);

    // Display format determines what to show
    if (displayFormat === "lump_sum") {
      // Show scope bullets only
      for (const bullet of scopeBullets) {
        drawScopeItem(ctx, bullet.bullet_text, false);
      }
    } else {
      // scope_detail or detailed_scope: show line items
      for (const item of sharedItems) {
        if (displayFormat === "detailed_scope") {
          // Show with dollar amounts
          ensureSpace(ctx, 16);
          ctx.page.drawText(item.description, { x: LEFT + 8, y: ctx.y, size: 8.5, font: regular, color: GRAY });
          drawRightAligned(ctx.page, fmt(item.total), ctx.y, 8.5, bold, NAVY);
          ctx.y -= 11;
          ctx.page.drawRectangle({ x: LEFT + 8, y: ctx.y + 7, width: CONTENT_W - 16, height: 0.3, color: LINE_GRAY });
          ctx.y -= 3;
        } else {
          // scope_detail: descriptions with "Included"
          drawScopeItem(ctx, item.description, true);
        }
      }
      for (const ci of sharedCustom) {
        if (displayFormat === "detailed_scope") {
          ensureSpace(ctx, 16);
          ctx.page.drawText(ci.description, { x: LEFT + 8, y: ctx.y, size: 8.5, font: regular, color: GRAY });
          drawRightAligned(ctx.page, fmt(ci.customer_price), ctx.y, 8.5, bold, NAVY);
          ctx.y -= 11;
          ctx.page.drawRectangle({ x: LEFT + 8, y: ctx.y + 7, width: CONTENT_W - 16, height: 0.3, color: LINE_GRAY });
          ctx.y -= 3;
        } else {
          drawScopeItem(ctx, ci.description, true);
        }
      }
    }
  }

  // ─── OPTION SECTIONS ───────────────────────────────────────────────

  if (isMultiOption) {
    for (let oi = 0; oi < options.length; oi++) {
      const opt = options[oi];
      const badge = opt.is_recommended ? "RECOMMENDED" : undefined;
      drawSectionBar(ctx, opt.option_name || `Option ${oi + 1}`, badge);

      if (opt.option_description) {
        drawWrappedText(ctx, opt.option_description, LEFT + 8, 8, regular, GRAY, CONTENT_W - 16, 11);
        ctx.y -= 4;
      }

      // Option-specific items
      const optItems = items.filter(i => i.option_id === opt.id && !i.is_alternate);
      const optCustom = customItems.filter(ci => ci.option_id === opt.id && !ci.is_alternate && ci.pricing_mode !== "at_cost");

      for (const item of optItems) {
        if (displayFormat === "detailed_scope") {
          ensureSpace(ctx, 16);
          ctx.page.drawText(item.description, { x: LEFT + 8, y: ctx.y, size: 8.5, font: regular, color: GRAY });
          drawRightAligned(ctx.page, fmt(item.total), ctx.y, 8.5, bold, NAVY);
          ctx.y -= 11;
          ctx.page.drawRectangle({ x: LEFT + 8, y: ctx.y + 7, width: CONTENT_W - 16, height: 0.3, color: LINE_GRAY });
          ctx.y -= 3;
        } else {
          drawScopeItem(ctx, item.description, displayFormat !== "lump_sum");
        }
      }
      for (const ci of optCustom) {
        if (displayFormat === "detailed_scope") {
          ensureSpace(ctx, 16);
          ctx.page.drawText(ci.description, { x: LEFT + 8, y: ctx.y, size: 8.5, font: regular, color: GRAY });
          drawRightAligned(ctx.page, fmt(ci.customer_price), ctx.y, 8.5, bold, NAVY);
          ctx.y -= 11;
          ctx.page.drawRectangle({ x: LEFT + 8, y: ctx.y + 7, width: CONTENT_W - 16, height: 0.3, color: LINE_GRAY });
          ctx.y -= 3;
        } else {
          drawScopeItem(ctx, ci.description, displayFormat !== "lump_sum");
        }
      }

      const optTotal = getOptionTotal(opt);
      drawTotalBar(ctx, `OPTION ${oi + 1} TOTAL`, optTotal);
    }
  } else {
    // Single option — show total bar
    const total = getSingleTotal();
    drawTotalBar(ctx, "PROJECT TOTAL", total);
  }

  // ─── PAGE 2+: Additional Info ──────────────────────────────────────

  // At-Cost Items
  const atCostItems = customItems.filter(ci => ci.pricing_mode === "at_cost");
  if (atCostItems.length > 0) {
    ensureSpace(ctx, 60);
    ctx.page.drawText("Items Provided at Cost", { x: LEFT, y: ctx.y, size: 11, font: bold, color: NAVY });
    ctx.y -= 16;
    for (const ci of atCostItems) {
      ensureSpace(ctx, 20);
      ctx.page.drawText(ci.description, { x: LEFT + 8, y: ctx.y, size: 8.5, font: regular, color: GRAY });
      drawRightAligned(ctx.page, fmt(ci.customer_price), ctx.y, 8.5, bold, NAVY);
      ctx.y -= 12;
      if (ci.notes) {
        drawWrappedText(ctx, ci.notes, LEFT + 16, 7.5, regular, rgb(0.5, 0.5, 0.5), CONTENT_W - 32, 10);
      }
    }
    ensureSpace(ctx, 14);
    ctx.page.drawText("Items above are offered at our cost as a convenience.", { x: LEFT + 8, y: ctx.y, size: 7.5, font: regular, color: rgb(0.5, 0.5, 0.5) });
    ctx.y -= 18;
  }

  // Alternates
  const alternateItems = items.filter(i => i.is_alternate);
  const alternateCustom = customItems.filter(ci => ci.is_alternate);
  const allAlternates = [...alternateItems, ...alternateCustom];
  if (allAlternates.length > 0) {
    ensureSpace(ctx, 50);
    ctx.page.drawText("Alternates", { x: LEFT, y: ctx.y, size: 11, font: bold, color: NAVY });
    ctx.y -= 16;
    for (const alt of allAlternates) {
      ensureSpace(ctx, 16);
      const desc = alt.description || alt.bullet_text || "Alternate";
      const price = Number(alt.total || alt.customer_price || 0);
      ctx.page.drawText(desc, { x: LEFT + 8, y: ctx.y, size: 8.5, font: regular, color: GRAY });
      drawRightAligned(ctx.page, price < 0 ? `-${fmt(Math.abs(price))}` : fmt(price), ctx.y, 8.5, bold, NAVY);
      ctx.y -= 14;
    }

    // If multi-option, show the math
    if (isMultiOption) {
      ctx.y -= 4;
      const altDeduction = allAlternates.reduce((s, a) => s + Math.abs(Number(a.total || a.customer_price || 0)), 0);
      for (let oi = 0; oi < options.length; oi++) {
        const optTotal = getOptionTotal(options[oi]);
        ensureSpace(ctx, 14);
        ctx.page.drawText(`${options[oi].option_name || `Option ${oi + 1}`} with alternate: ${fmt(optTotal - altDeduction)}`, {
          x: LEFT + 8, y: ctx.y, size: 8.5, font: regular, color: GRAY,
        });
        ctx.y -= 12;
      }
    }
    ctx.y -= 10;
  }

  // Phases
  if (isPhased) {
    ensureSpace(ctx, 50);
    ctx.page.drawText("Project Phases", { x: LEFT, y: ctx.y, size: 11, font: bold, color: NAVY });
    ctx.y -= 16;
    for (const phase of phases) {
      ensureSpace(ctx, 30);
      ctx.page.drawText(phase.phase_name, { x: LEFT + 8, y: ctx.y, size: 9, font: bold, color: NAVY });
      ctx.y -= 12;
      if (phase.suggested_timeline) {
        ctx.page.drawText(`Timeline: ${phase.suggested_timeline}`, { x: LEFT + 16, y: ctx.y, size: 8, font: regular, color: GRAY });
        ctx.y -= 11;
      }
      if (phase.phase_description) {
        drawWrappedText(ctx, phase.phase_description, LEFT + 16, 8, regular, GRAY, CONTENT_W - 32, 11);
      }
      // Calculate phase subtotal
      const phaseItems = items.filter(i => i.phase_id === phase.id && !i.is_alternate);
      const phaseCustom = customItems.filter(ci => ci.phase_id === phase.id && !ci.is_alternate);
      const phaseTotal = phaseItems.reduce((s, i) => s + Number(i.total), 0) + phaseCustom.reduce((s, ci) => s + Number(ci.customer_price), 0);
      if (phaseTotal > 0) {
        ctx.page.drawText(`Subtotal: ${fmt(phaseTotal)}`, { x: LEFT + 16, y: ctx.y, size: 8.5, font: bold, color: NAVY });
        ctx.y -= 14;
      }
    }
    // Phase disclaimer
    ensureSpace(ctx, 20);
    ctx.page.drawText("Note: Phase 1 pricing is guaranteed. Phase 2+ pricing is subject to reconfirmation at time of scheduling.", {
      x: LEFT + 8, y: ctx.y, size: 7, font: regular, color: rgb(0.5, 0.5, 0.5),
    });
    ctx.y -= 18;
  }

  // Scope Notes
  const scopeNotes = [
    "All work performed to ASBA (American Sports Builders Association) standards.",
    "Estimated project timeline: 5-10 business days, weather permitting.",
    "Newly applied surfaces require 24-48 hours cure time before play.",
    "Color selections to be confirmed prior to material ordering.",
  ];
  ensureSpace(ctx, 50);
  ctx.page.drawText("Scope Notes", { x: LEFT, y: ctx.y, size: 11, font: bold, color: NAVY });
  ctx.y -= 14;
  for (const note of scopeNotes) {
    drawBullet(ctx, note);
  }
  ctx.y -= 8;

  // Exclusions
  if (exclusions.length > 0) {
    ensureSpace(ctx, 40);
    ctx.page.drawText("Exclusions", { x: LEFT, y: ctx.y, size: 11, font: bold, color: NAVY });
    ctx.y -= 14;
    for (const ex of exclusions) {
      drawBullet(ctx, ex.exclusion_text || "");
    }
    ctx.y -= 8;
  }

  // Payment Terms
  ensureSpace(ctx, 60);
  ctx.page.drawText("Payment Terms", { x: LEFT, y: ctx.y, size: 11, font: bold, color: NAVY });
  ctx.y -= 14;
  const paymentTerms = [
    "50% deposit required to schedule project.",
    "Balance due upon completion of work.",
    "Accepted methods: Bank Transfer/ACH (no fee — recommended), Check, or Credit/Debit Card (3% fee).",
    `This estimate is valid for ${validDays} days from the date above.`,
  ];
  for (const term of paymentTerms) {
    drawBullet(ctx, term);
  }
  ctx.y -= 10;

  // ─── ACCEPTANCE PAGE ──────────────────────────────────────────────

  newPage(ctx);

  ctx.page.drawText("Acceptance", { x: LEFT, y: ctx.y, size: 14, font: bold, color: NAVY });
  ctx.y -= 16;
  ctx.page.drawText("By signing below, you authorize CourtPro Augusta to proceed with the selected option.", {
    x: LEFT, y: ctx.y, size: 9, font: regular, color: GRAY,
  });
  ctx.y -= 24;

  // Option selection checkboxes (multi-option)
  if (isMultiOption) {
    ctx.page.drawText("Select one:", { x: LEFT, y: ctx.y, size: 10, font: bold, color: NAVY });
    ctx.y -= 20;
    for (let oi = 0; oi < options.length; oi++) {
      const opt = options[oi];
      const optTotal = getOptionTotal(opt);
      ensureSpace(ctx, 24);
      // Checkbox square
      ctx.page.drawRectangle({ x: LEFT + 10, y: ctx.y - 10, width: 12, height: 12, borderColor: NAVY, borderWidth: 0.8, color: WHITE });
      ctx.page.drawText(`${opt.option_name || `Option ${oi + 1}`}  -  ${fmt(optTotal)}`, {
        x: LEFT + 28, y: ctx.y - 8, size: 9, font: regular, color: GRAY,
      });
      ctx.y -= 24;
    }
    ctx.y -= 8;
  }

  // Alternate selection
  if (allAlternates.length > 0) {
    ensureSpace(ctx, 30);
    ctx.page.drawText("Alternate (check if applicable):", { x: LEFT, y: ctx.y, size: 10, font: bold, color: NAVY });
    ctx.y -= 20;
    for (const alt of allAlternates) {
      ensureSpace(ctx, 24);
      ctx.page.drawRectangle({ x: LEFT + 10, y: ctx.y - 10, width: 12, height: 12, borderColor: NAVY, borderWidth: 0.8, color: WHITE });
      const desc = alt.description || "Alternate";
      const price = Number(alt.total || alt.customer_price || 0);
      ctx.page.drawText(`${desc}  (${price < 0 ? "-" : ""}${fmt(Math.abs(price))})`, {
        x: LEFT + 28, y: ctx.y - 8, size: 9, font: regular, color: GRAY,
      });
      ctx.y -= 24;
    }
    ctx.y -= 8;
  }

  // At-cost item selection
  if (atCostItems.length > 0) {
    ensureSpace(ctx, 30);
    ctx.page.drawText("At-Cost Items (check if applicable):", { x: LEFT, y: ctx.y, size: 10, font: bold, color: NAVY });
    ctx.y -= 20;
    for (const ci of atCostItems) {
      ensureSpace(ctx, 24);
      ctx.page.drawRectangle({ x: LEFT + 10, y: ctx.y - 10, width: 12, height: 12, borderColor: NAVY, borderWidth: 0.8, color: WHITE });
      ctx.page.drawText(`${ci.description}  -  ${fmt(ci.customer_price)} each`, {
        x: LEFT + 28, y: ctx.y - 8, size: 9, font: regular, color: GRAY,
      });
      ctx.y -= 24;
    }
    ctx.y -= 8;
  }

  // Phase approval
  if (isPhased) {
    ensureSpace(ctx, 30);
    ctx.page.drawText("Phase Approval:", { x: LEFT, y: ctx.y, size: 10, font: bold, color: NAVY });
    ctx.y -= 20;
    for (const phase of phases) {
      ensureSpace(ctx, 24);
      ctx.page.drawRectangle({ x: LEFT + 10, y: ctx.y - 10, width: 12, height: 12, borderColor: NAVY, borderWidth: 0.8, color: WHITE });
      const phaseItems2 = items.filter(i => i.phase_id === phase.id && !i.is_alternate);
      const phaseCustom2 = customItems.filter(ci => ci.phase_id === phase.id && !ci.is_alternate);
      const phaseTotal2 = phaseItems2.reduce((s, i) => s + Number(i.total), 0) + phaseCustom2.reduce((s, ci) => s + Number(ci.customer_price), 0);
      ctx.page.drawText(`${phase.phase_name}  -  ${fmt(phaseTotal2)}`, {
        x: LEFT + 28, y: ctx.y - 8, size: 9, font: regular, color: GRAY,
      });
      ctx.y -= 24;
    }
    ctx.y -= 8;
  }

  // Total Contract Amount
  ensureSpace(ctx, 40);
  ctx.page.drawRectangle({ x: LEFT, y: ctx.y, width: CONTENT_W, height: 0.5, color: LIGHT_GRAY });
  ctx.y -= 20;
  ctx.page.drawText("Total Contract Amount: $ _______________", { x: LEFT, y: ctx.y, size: 11, font: bold, color: NAVY });
  ctx.y -= 50;

  // Signature block
  ensureSpace(ctx, 80);
  ctx.page.drawText("Authorized Signature: __________________________  Date: ______________", {
    x: LEFT, y: ctx.y, size: 9, font: regular, color: GRAY,
  });
  ctx.y -= 25;
  ctx.page.drawText("Print Name: _________________________________  Title: ______________", {
    x: LEFT, y: ctx.y, size: 9, font: regular, color: GRAY,
  });
  ctx.y -= 40;

  // Prepared By
  ctx.page.drawRectangle({ x: LEFT, y: ctx.y + 5, width: CONTENT_W, height: 0.5, color: LIGHT_GRAY });
  ctx.y -= 10;
  ctx.page.drawText("Prepared by:", { x: LEFT, y: ctx.y, size: 9, font: bold, color: NAVY });
  ctx.y -= 13;
  ctx.page.drawText(`${COMPANY.preparedBy} - ${COMPANY.brand}`, { x: LEFT, y: ctx.y, size: 9, font: regular, color: GRAY });
  ctx.y -= 13;
  ctx.page.drawText(`${COMPANY.phone} | ${COMPANY.email}`, { x: LEFT, y: ctx.y, size: 9, font: regular, color: GRAY });

  // ─── SITE PHOTOS (if any) ─────────────────────────────────────────

  const attachments = (estimate.estimate_attachments || []).slice(0, 6);
  if (attachments.length > 0) {
    newPage(ctx);
    ctx.page.drawText("Site Documentation", { x: LEFT, y: ctx.y, size: 14, font: bold, color: NAVY });
    ctx.y -= 20;

    for (const att of attachments) {
      try {
        const { data } = await _supabase.storage.from("estimate-attachments").download(att.file_path);
        if (!data) continue;
        const bytes = new Uint8Array(await data.arrayBuffer());
        const img = att.file_name.toLowerCase().endsWith(".png") ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const scale = Math.min(CONTENT_W / img.width, 280 / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        ensureSpace(ctx, h + 30);
        ctx.page.drawImage(img, { x: (PAGE_W - w) / 2, y: ctx.y - h, width: w, height: h });
        ctx.y -= h + 10;
        if (att.caption) {
          ctx.page.drawText(att.caption, { x: LEFT, y: ctx.y, size: 8, font: regular, color: GRAY });
          ctx.y -= 14;
        }
        ctx.y -= 10;
      } catch (e) {
        console.error("Image embed error:", e);
      }
    }
  }

  // ─── PAGE NUMBERS ─────────────────────────────────────────────────

  const pages = doc.getPages();
  const totalPages = pages.length;
  for (let i = 0; i < totalPages; i++) {
    const p = pages[i];
    const text = `Page ${i + 1} of ${totalPages}`;
    const tw = regular.widthOfTextAtSize(text, 7);
    p.drawText(text, { x: (PAGE_W - tw) / 2, y: 14, size: 7, font: regular, color: FOOTER_GRAY });
  }

  return await doc.save();
}

// ─── HANDLER ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const isServiceCall = token === supabaseServiceKey;

    if (!isServiceCall) {
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claimsData, error: claimsError } = await userSupabase.auth.getUser(token);
      if (claimsError || !claimsData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const userId = claimsData.user.id;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const hasAccess = roles?.some((r: any) => ["owner", "admin", "staff", "sales", "project_manager"].includes(r.role));
      if (!hasAccess) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { estimateId } = await req.json();
    if (!estimateId) throw new Error("Estimate ID is required");

    console.log(`Generating PDF for estimate: ${estimateId}`);

    const { data: estimate, error } = await supabase
      .from("estimates")
      .select(`*, customers(*), estimate_items(*), estimate_attachments(*), estimate_custom_items(*), estimate_scope_bullets(*), estimate_exclusions(*), estimate_options(*), estimate_phases(*)`)
      .eq("id", estimateId)
      .single();

    if (error) throw new Error(error.message);

    // Fetch default exclusions if none specific
    let exclusions = estimate.estimate_exclusions || [];
    if (exclusions.length === 0) {
      const { data: defaults } = await supabase
        .from("estimate_exclusions")
        .select("*")
        .eq("is_default", true)
        .order("sort_order");
      exclusions = defaults || [];
    }
    estimate._exclusions = exclusions;

    const pdfBytes = await generateEstimatePdf(estimate, supabase);
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    return new Response(
      JSON.stringify({ success: true, pdf: base64Pdf, fileName: `${estimate.estimate_number}.pdf`, hasAttachments: (estimate.estimate_attachments?.length || 0) > 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
