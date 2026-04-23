import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Mirror of the canonical Laykold palette (kept here so the edge function
// is fully self-contained and deterministic). Matches src/lib/courtGeometry.ts
// ──────────────────────────────────────────────────────────────────────────
const COLORS: Record<string, string> = {
  // Standards
  "Forest Green": "#3A4535", "Dark Green": "#4A5538", "Medium Green": "#5C6A43",
  "Grass Green": "#6F7F42", "Dark Blue": "#2A3F5C", "Light Blue": "#2E7FA8",
  "Pro Blue": "#2D4F6E", "Royal Purple": "#544863", "Brick Red": "#8B4538",
  "Burgundy": "#6B3A33", "Dark Grey": "#4A4A4A", "Desert Sand": "#B39B7D",
  // Vibrants
  "Coral": "#C85B6B", "Scarlet": "#9A3A35", "Pumpkin": "#D97935", "Canary": "#E8C43F",
  "Midnight": "#2B4A8A", "Teal": "#2E7A7E", "Arctic": "#6BA8C9", "Black": "#2A2A2A",
  "Key Lime": "#C5C648", "Kiwi": "#8FA645", "Silver": "#9A9A9A", "Mocha": "#6B4E38",
  // Lines
  "White": "#FFFFFF", "Yellow": "#F2C33D", "Blue": "#2C5F8A", "Red": "#B83A32",
};
function hex(name: string): string { return COLORS[name] || "#2D4F6E"; }
function hexToRgb(h: string) {
  const c = h.replace("#", "");
  return rgb(parseInt(c.slice(0,2),16)/255, parseInt(c.slice(2,4),16)/255, parseInt(c.slice(4,6),16)/255);
}

interface CourtMeta { length: number; width: number; }
const COURT_META: Record<string, { playing: CourtMeta; outer: CourtMeta; label: string; dims: string }> = {
  tennis: { playing: { length: 78, width: 36 }, outer: { length: 120, width: 60 }, label: "Tennis Court", dims: "60' × 120' overall" },
  pickleball: { playing: { length: 44, width: 20 }, outer: { length: 64, width: 34 }, label: "Pickleball Court", dims: "34' × 64' overall" },
  pickleball_double: { playing: { length: 44, width: 44 }, outer: { length: 64, width: 60 }, label: "Double Pickleball", dims: "60' × 64' overall" },
  basketball: { playing: { length: 94, width: 50 }, outer: { length: 110, width: 64 }, label: "Basketball Court", dims: "64' × 110' overall" },
  basketball_pickleball: { playing: { length: 94, width: 50 }, outer: { length: 110, width: 64 }, label: "Basketball + Pickleball", dims: "64' × 110' overall" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_number } = await req.json();
    if (!project_number) throw new Error("project_number required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch only the approval-safe fields. Customer PII, contract value,
    // GPS coordinates, internal notes, and site addresses are intentionally
    // excluded since this endpoint is publicly callable with just a
    // project_number.
    const { data: rows, error: pErr } = await supabase.rpc(
      "get_project_for_approval_pdf",
      { _project_number: project_number }
    );
    const project = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (pErr || !project) throw new Error("Project not found");

    const { data: courts, error: cErr } = await supabase
      .from("project_courts")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order", { ascending: true });
    if (cErr) throw cErr;

    // Build PDF
    const pdf = await PDFDocument.create();
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const NAVY = rgb(0.118, 0.165, 0.227);
    const YELLOW = rgb(0.831, 0.878, 0.125);
    const GREY = rgb(0.4, 0.4, 0.4);

    // Cover page
    let page = pdf.addPage([612, 792]);
    let { width: pw, height: ph } = page.getSize();

    // Header bar
    page.drawRectangle({ x: 0, y: ph - 80, width: pw, height: 80, color: NAVY });
    page.drawRectangle({ x: 0, y: ph - 84, width: pw, height: 4, color: YELLOW });
    page.drawText("COURT COLOR APPROVAL", { x: 40, y: ph - 50, size: 22, font: helvBold, color: rgb(1,1,1) });
    page.drawText("CourtPro Augusta", { x: 40, y: ph - 70, size: 11, font: helv, color: rgb(1,1,1) });

    let y = ph - 130;
    page.drawText(`Project: ${project.project_number}`, { x: 40, y, size: 14, font: helvBold, color: NAVY });
    y -= 22;
    page.drawText(`${project.project_name || ""}`, { x: 40, y, size: 12, font: helv, color: NAVY });
    y -= 18;
    // Customer name, site address, and other PII intentionally omitted from
    // the public approval PDF. Internal team can pull a fully-detailed
    // version from the admin app.
    page.drawText(`Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, { x: 40, y, size: 11, font: helv, color: GREY });
    y -= 24;
    page.drawText(`Status: ${project.color_approval_status === "approved" ? "FULLY APPROVED" : "PARTIAL APPROVAL"}`, {
      x: 40, y, size: 12, font: helvBold, color: project.color_approval_status === "approved" ? rgb(0.1, 0.5, 0.2) : NAVY,
    });
    y -= 28;

    // Render each court
    for (const court of courts || []) {
      if (y < 280) { page = pdf.addPage([612, 792]); y = page.getSize().height - 60; }
      y = drawCourt(page, helv, helvBold, court, y, NAVY, GREY);
      y -= 20;
    }

    // Approval signature block (last page)
    if (y < 140) { page = pdf.addPage([612, 792]); y = page.getSize().height - 60; }
    y -= 10;
    page.drawLine({ start: { x: 40, y }, end: { x: pw - 40, y }, thickness: 1, color: NAVY });
    y -= 24;
    page.drawText("APPROVAL CERTIFICATION", { x: 40, y, size: 12, font: helvBold, color: NAVY });
    y -= 18;
    const allApproved = (courts || []).every((c) => c.approved);
    page.drawText(allApproved
      ? "All courts above have been individually approved by the customer."
      : "Some courts remain pending approval — see status next to each court.",
      { x: 40, y, size: 10, font: helv, color: GREY });
    y -= 16;
    if (project.color_approved_at) {
      page.drawText(`Finalized: ${new Date(project.color_approved_at).toLocaleString("en-US")}`, { x: 40, y, size: 10, font: helv, color: GREY });
      y -= 14;
    }
    if (project.color_approval_ip) {
      page.drawText(`IP on file: ${project.color_approval_ip}`, { x: 40, y, size: 9, font: helv, color: GREY });
    }

    const bytes = await pdf.save();

    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="approval-${project.project_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error("generate-approval-pdf error:", err);
    const msg = err instanceof Error ? err.message : "Unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

// ─── Court rendering on PDF page (server-side SVG-equivalent geometry) ────
function drawCourt(page: any, helv: any, helvBold: any, court: any, startY: number, navy: any, grey: any): number {
  const meta = COURT_META[court.court_type] || COURT_META.tennis;
  const margin = 40;
  const pw = page.getSize().width;
  const maxW = pw - margin * 2;
  const aspect = meta.outer.width / meta.outer.length; // height / width
  const drawW = maxW;
  const drawH = drawW * aspect;
  const x0 = margin;
  const y0 = startY - drawH - 60; // leave room for label

  // Label header
  page.drawText(`${court.court_label || meta.label}`, { x: x0, y: startY - 18, size: 13, font: helvBold, color: navy });
  page.drawText(`${meta.dims} · ${meta.label}`, { x: x0, y: startY - 32, size: 9, font: helv, color: grey });
  page.drawText(`Status: ${court.approved ? "✓ APPROVED" + (court.approved_initials ? ` (${court.approved_initials})` : "") : "Pending"}`,
    { x: x0 + maxW - 180, y: startY - 18, size: 10, font: helvBold,
      color: court.approved ? rgb(0.1, 0.5, 0.2) : rgb(0.7, 0.4, 0.1) });

  // Scale: 1 ft = scale px
  const scale = drawW / meta.outer.length;
  const fy = (yFt: number) => y0 + drawH - yFt * scale; // flip Y for PDF

  // Outer pad
  page.drawRectangle({ x: x0, y: y0, width: drawW, height: drawH, color: hexToRgb(hex(court.outer_color)) });

  // Inner playing surface
  const padX = (meta.outer.length - meta.playing.length) / 2;
  const padY = (meta.outer.width - meta.playing.width) / 2;
  page.drawRectangle({
    x: x0 + padX * scale, y: y0 + padY * scale,
    width: meta.playing.length * scale, height: meta.playing.width * scale,
    color: hexToRgb(hex(court.inner_color)),
  });

  // Lines (simplified set per sport — perimeter + key reference lines)
  const lc = hexToRgb(hex(court.line_color));
  const lw = 0.16 * scale; // 2 inch line in feet × scale
  const left = x0 + padX * scale;
  const right = left + meta.playing.length * scale;
  const bot = y0 + padY * scale;
  const top = bot + meta.playing.width * scale;
  const cx = (left + right) / 2;
  const cy = (bot + top) / 2;

  // Perimeter
  page.drawRectangle({ x: left, y: bot, width: right - left, height: top - bot, borderColor: lc, borderWidth: lw, color: undefined as any, opacity: 0 });

  if (court.court_type === "tennis") {
    const inset = 4.5 * scale;
    page.drawLine({ start: { x: left, y: bot + inset }, end: { x: right, y: bot + inset }, thickness: lw, color: lc });
    page.drawLine({ start: { x: left, y: top - inset }, end: { x: right, y: top - inset }, thickness: lw, color: lc });
    const sv = 21 * scale;
    page.drawLine({ start: { x: cx - sv, y: bot + inset }, end: { x: cx - sv, y: top - inset }, thickness: lw, color: lc });
    page.drawLine({ start: { x: cx + sv, y: bot + inset }, end: { x: cx + sv, y: top - inset }, thickness: lw, color: lc });
    page.drawLine({ start: { x: cx - sv, y: cy }, end: { x: cx + sv, y: cy }, thickness: lw, color: lc });
    // Net
    page.drawLine({ start: { x: cx, y: bot - 6 }, end: { x: cx, y: top + 6 }, thickness: lw * 1.5, color: rgb(0.15, 0.15, 0.15) });
  }
  if (court.court_type === "pickleball") {
    const nvz = 7 * scale;
    page.drawLine({ start: { x: cx - nvz, y: bot }, end: { x: cx - nvz, y: top }, thickness: lw, color: lc });
    page.drawLine({ start: { x: cx + nvz, y: bot }, end: { x: cx + nvz, y: top }, thickness: lw, color: lc });
    page.drawLine({ start: { x: left, y: cy }, end: { x: cx - nvz, y: cy }, thickness: lw, color: lc });
    page.drawLine({ start: { x: cx + nvz, y: cy }, end: { x: right, y: cy }, thickness: lw, color: lc });
    page.drawLine({ start: { x: cx, y: bot - 4 }, end: { x: cx, y: top + 4 }, thickness: lw * 1.4, color: rgb(0.15, 0.15, 0.15) });
  }
  if (court.court_type === "basketball" || court.court_type === "basketball_pickleball") {
    page.drawLine({ start: { x: cx, y: bot }, end: { x: cx, y: top }, thickness: lw, color: lc });
    page.drawCircle({ x: cx, y: cy, size: 6 * scale, borderColor: lc, borderWidth: lw, color: undefined as any, opacity: 0 });
    const laneLen = 19 * scale, laneW = 12 * scale;
    page.drawRectangle({ x: left, y: cy - laneW / 2, width: laneLen, height: laneW, borderColor: lc, borderWidth: lw, color: undefined as any, opacity: 0 });
    page.drawRectangle({ x: right - laneLen, y: cy - laneW / 2, width: laneLen, height: laneW, borderColor: lc, borderWidth: lw, color: undefined as any, opacity: 0 });
  }

  // Color legend below
  const legendY = y0 - 24;
  drawSwatch(page, helv, x0, legendY, "Inner", court.inner_color, navy, grey);
  drawSwatch(page, helv, x0 + 180, legendY, "Outer", court.outer_color, navy, grey);
  drawSwatch(page, helv, x0 + 360, legendY, "Lines", court.line_color, navy, grey);

  return y0 - 50;
}

function drawSwatch(page: any, helv: any, x: number, y: number, label: string, colorName: string, navy: any, grey: any) {
  page.drawRectangle({ x, y, width: 18, height: 18, color: hexToRgb(hex(colorName)), borderColor: rgb(0.5, 0.5, 0.5), borderWidth: 0.5 });
  page.drawText(label, { x: x + 24, y: y + 10, size: 9, font: helv, color: grey });
  page.drawText(`Laykold ${colorName}`, { x: x + 24, y: y - 1, size: 9, font: helv, color: navy });
}
