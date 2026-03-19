import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, degrees, PDFFont, PDFPage } from "https://esm.sh/pdf-lib@1.17.1";

// Brand-focused company info
const COMPANY_INFO = {
  brandName: "CourtPro Augusta",
  tagline: "Professional Court Construction",
  legalName: "A CourtHaus Construction, LLC Company",
  address: { street: "500 Furys Ferry Rd.", suite: "Suite 107", city: "Augusta", state: "GA", zip: "30907" },
  phone: "(706) 309-1993",
  email: "estimates@courtproaugusta.com",
  website: "courtproaugusta.com",
};

// Brand colors
const COLORS = {
  navy: rgb(0.12, 0.23, 0.37),
  navyLight: rgb(0.18, 0.35, 0.53),
  green: rgb(0.02, 0.59, 0.41),
  greenDark: rgb(0.02, 0.36, 0.29),
  lightBlue: rgb(0.58, 0.77, 0.99),
  lightGray: rgb(0.95, 0.97, 1.0),
  lightSage: rgb(0.94, 0.98, 0.94),
  white: rgb(1, 1, 1),
  black: rgb(0.1, 0.1, 0.1),
  gray: rgb(0.4, 0.4, 0.4),
};

// Marketing content
const MARKETING_POINTS = [
  "200+ Courts Completed - Trusted by homeowners, schools & clubs",
  "Premium Materials - Laykold surfaces used by US Open & ATP",
  "Local Expertise - Serving Augusta & the CSRA",
];

const QUALITY_STATEMENT = "Your court is more than pavement - it's where memories are made. We use only premium Laykold surfacing systems, the same materials trusted by the US Open and professional tournaments worldwide.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatCurrency = (amount: number): string => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
const formatDate = (dateStr: string): string => new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

// Draw branded header with navy bar
function drawBrandedHeader(page: PDFPage, fonts: { bold: PDFFont; regular: PDFFont }, width: number) {
  // Navy header bar
  page.drawRectangle({
    x: 0,
    y: 742,
    width: width,
    height: 50,
    color: COLORS.navy,
  });

  // Brand name - large and prominent
  page.drawText(COMPANY_INFO.brandName, {
    x: 50,
    y: 762,
    size: 24,
    font: fonts.bold,
    color: COLORS.white,
  });

  // Tagline
  page.drawText(COMPANY_INFO.tagline, {
    x: 50,
    y: 748,
    size: 10,
    font: fonts.regular,
    color: COLORS.lightBlue,
  });

  // Contact on right side
  page.drawText(COMPANY_INFO.phone, {
    x: 450,
    y: 762,
    size: 11,
    font: fonts.bold,
    color: COLORS.white,
  });
  page.drawText(COMPANY_INFO.email, {
    x: 425,
    y: 748,
    size: 9,
    font: fonts.regular,
    color: COLORS.lightBlue,
  });
}

// Draw marketing section
function drawMarketingSection(page: PDFPage, y: number, fonts: { bold: PDFFont; regular: PDFFont }): number {
  const headerHeight = 24;
  
  // Section header with green background - positioned so bottom edge is at y
  page.drawRectangle({
    x: 50,
    y: y - headerHeight,
    width: 512,
    height: headerHeight,
    color: COLORS.green,
  });

  page.drawText("WHY CHOOSE COURTPRO?", {
    x: 60,
    y: y - headerHeight + 8,
    size: 12,
    font: fonts.bold,
    color: COLORS.white,
  });

  // Move y to bottom of header (content starts here)
  y -= headerHeight;

  // Calculate dynamic height based on content
  const numPoints = MARKETING_POINTS.length;
  const contentHeight = numPoints * 16 + 12; // 16px per line + padding

  // Light sage background for content - connects seamlessly to header
  page.drawRectangle({
    x: 50,
    y: y - contentHeight,
    width: 512,
    height: contentHeight,
    color: COLORS.lightSage,
  });

  // Green accent line on left edge
  page.drawRectangle({
    x: 50,
    y: y - contentHeight,
    width: 4,
    height: contentHeight,
    color: COLORS.green,
  });

  // Trust points - start with top padding
  y -= 6;
  for (const point of MARKETING_POINTS) {
    page.drawText("* " + point, {
      x: 62,
      y: y - 10,
      size: 10,
      font: fonts.regular,
      color: COLORS.black,
    });
    y -= 16;
  }

  y -= 6; // Bottom padding

  return y;
}

// Draw quality statement
function drawQualityStatement(page: PDFPage, y: number, fonts: { bold: PDFFont; regular: PDFFont }): number {
  const boxHeight = 58;
  
  // Box background
  page.drawRectangle({
    x: 50,
    y: y - boxHeight + 5,
    width: 512,
    height: boxHeight,
    color: COLORS.lightGray,
    borderColor: COLORS.green,
    borderWidth: 1,
  });

  // Quote mark integrated with first line
  page.drawText('"', {
    x: 58,
    y: y - 12,
    size: 20,
    font: fonts.bold,
    color: COLORS.green,
  });

  // Statement lines with proper spacing
  const line1 = "Your court is more than pavement - it's where memories are made.";
  const line2 = "We use only premium Laykold surfacing systems, the same materials";
  const line3 = "trusted by the US Open and professional tournaments worldwide.";

  page.drawText(line1, { x: 75, y: y - 16, size: 9, font: fonts.regular, color: COLORS.gray });
  page.drawText(line2, { x: 75, y: y - 30, size: 9, font: fonts.regular, color: COLORS.gray });
  page.drawText(line3, { x: 75, y: y - 44, size: 9, font: fonts.regular, color: COLORS.gray });

  return y - boxHeight - 8;
}

// Draw footer
function drawFooter(page: PDFPage, fonts: { bold: PDFFont; regular: PDFFont }) {
  // Footer background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 612,
    height: 40,
    color: COLORS.navy,
  });

  // Legal name (small, bottom left)
  page.drawText(COMPANY_INFO.legalName, {
    x: 50,
    y: 22,
    size: 8,
    font: fonts.regular,
    color: COLORS.lightBlue,
  });

  // Address (bottom center)
  const fullAddress = `${COMPANY_INFO.address.street} ${COMPANY_INFO.address.suite}, ${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.state} ${COMPANY_INFO.address.zip}`;
  page.drawText(fullAddress, {
    x: 50,
    y: 10,
    size: 8,
    font: fonts.regular,
    color: COLORS.lightBlue,
  });

  // Website (bottom right)
  page.drawText(COMPANY_INFO.website, {
    x: 480,
    y: 16,
    size: 9,
    font: fonts.bold,
    color: COLORS.white,
  });
}

function groupItemsForCustomer(items: any[], customItems: any[] = []) {
  const groups: Record<string, { items: any[]; label: string; details: string }> = {
    surfacePrep: { items: [], label: "Surface Preparation", details: "Professional surface preparation including cleaning, crack repair, and priming" },
    surfacing: { items: [], label: "Court Surfacing System", details: "Premium court surfacing with cushion layers and color coats" },
    striping: { items: [], label: "Professional Line Striping", details: "Complete court line marking" },
    baseWork: { items: [], label: "Site Preparation & Base Work", details: "Substrate preparation and base installation" },
  };
  const addons: any[] = [];

  items.forEach((item) => {
    const desc = item.description.toLowerCase();
    if (desc.includes("pressure") || desc.includes("wash") || desc.includes("crack") || desc.includes("prime") || desc.includes("prep")) groups.surfacePrep.items.push(item);
    else if (desc.includes("line") || desc.includes("striping")) groups.striping.items.push(item);
    else if (desc.includes("base") || desc.includes("substrate")) groups.baseWork.items.push(item);
    else if (desc.includes("granule") || desc.includes("color") || desc.includes("resurfacer") || desc.includes("laykold") || desc.includes("surfacing") || desc.includes("cushion")) groups.surfacing.items.push(item);
    else addons.push(item);
  });

  const result: { description: string; details: string; total: number }[] = [];
  Object.values(groups).forEach((g) => {
    if (g.items.length > 0) result.push({ description: g.label, details: g.details, total: g.items.reduce((sum, i) => sum + i.total, 0) });
  });
  addons.forEach((item) => result.push({ description: item.description, details: item.quantity > 1 ? `Quantity: ${item.quantity}` : "", total: item.total }));

  if (customItems && customItems.length > 0) {
    customItems.forEach((item) => {
      result.push({
        description: item.description,
        details: "",
        total: Number(item.customer_price) || 0,
      });
    });
  }

  return result;
}

async function generateLumpSumPdf(estimate: any, supabase: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { bold: helveticaBold, regular: helvetica };

  const page = pdfDoc.addPage([612, 792]);
  const leftMargin = 50;
  let y = 720;

  // Approved watermark
  if (estimate.status === "approved") {
    page.drawText("APPROVED", { x: 150, y: 400, size: 72, font: helveticaBold, color: rgb(0, 0.5, 0), opacity: 0.15, rotate: degrees(45) });
  }

  // Branded header
  drawBrandedHeader(page, fonts, 612);

  // Estimate info box
  page.drawRectangle({ x: leftMargin, y: y - 45, width: 512, height: 50, color: COLORS.lightGray });
  page.drawText(`ESTIMATE ${estimate.estimate_number}`, { x: leftMargin + 15, y: y - 15, size: 14, font: helveticaBold, color: COLORS.navy });
  page.drawText(`Date: ${formatDate(estimate.created_at)}`, { x: leftMargin + 15, y: y - 32, size: 10, font: helvetica, color: COLORS.gray });
  if (estimate.valid_until) {
    page.drawText(`Valid Until: ${formatDate(estimate.valid_until)}`, { x: 350, y: y - 32, size: 10, font: helvetica, color: COLORS.gray });
  }

  y -= 65;

  // Customer Info - "Prepared For" box
  page.drawText("PREPARED FOR", { x: leftMargin, y, size: 11, font: helveticaBold, color: COLORS.green });
  y -= 16;
  const c = estimate.customers;
  if (c) {
    if (c.company_name) {
      page.drawText(c.company_name, { x: leftMargin, y, size: 11, font: helveticaBold, color: COLORS.black });
      y -= 14;
    }
    page.drawText(c.contact_name, { x: leftMargin, y, size: 10, font: helvetica, color: COLORS.black });
    y -= 12;
    if (c.address) {
      page.drawText(c.address, { x: leftMargin, y, size: 10, font: helvetica, color: COLORS.gray });
      y -= 12;
    }
    if (c.city || c.state) {
      page.drawText(`${c.city || ""}, ${c.state || ""} ${c.zip || ""}`, { x: leftMargin, y, size: 10, font: helvetica, color: COLORS.gray });
      y -= 12;
    }
  }
  y -= 15;

  // Project Scope Section Header
  page.drawRectangle({ x: leftMargin, y: y - 5, width: 512, height: 24, color: COLORS.navy });
  page.drawText("YOUR PROJECT INCLUDES", { x: leftMargin + 15, y: y + 2, size: 12, font: helveticaBold, color: COLORS.white });
  y -= 30;

  // Scope bullets
  const scopeBullets = estimate.estimate_scope_bullets || [];
  if (scopeBullets.length > 0) {
    scopeBullets.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

    for (const bullet of scopeBullets) {
      const text = bullet.bullet_text;
      const maxWidth = 480;
      const words = text.split(" ");
      let line = "- ";

      for (const word of words) {
        const testLine = line + word + " ";
        const width = helvetica.widthOfTextAtSize(testLine, 10);
        if (width > maxWidth && line !== "- ") {
          page.drawText(line.trim(), { x: leftMargin + 10, y, size: 10, font: helvetica, color: COLORS.black });
          y -= 14;
          line = "   " + word + " ";
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        page.drawText(line.trim(), { x: leftMargin + 10, y, size: 10, font: helvetica, color: COLORS.black });
        y -= 16;
      }
    }
  } else {
    page.drawText("- Complete professional court construction services", { x: leftMargin + 10, y, size: 10, font: helvetica, color: COLORS.black });
    y -= 18;
  }

  y -= 10;

  // Project Investment Box - prominent with green accent
  page.drawRectangle({ x: leftMargin, y: y - 55, width: 512, height: 60, color: COLORS.lightGray, borderColor: COLORS.green, borderWidth: 3 });
  page.drawText("PROJECT INVESTMENT", { x: leftMargin + 20, y: y - 20, size: 14, font: helveticaBold, color: COLORS.navy });
  page.drawText(formatCurrency(estimate.total), { x: 380, y: y - 30, size: 28, font: helveticaBold, color: COLORS.green });

  y -= 70;

  // Flexible Payment Options badge - positioned below with proper gap
  page.drawRectangle({ x: leftMargin, y: y - 50, width: 350, height: 45, color: COLORS.greenDark });
  page.drawText("FLEXIBLE PAYMENT OPTIONS", { x: leftMargin + 12, y: y - 15, size: 12, font: helveticaBold, color: COLORS.white });
  page.drawText("Klarna - Pay in 4 or spread over time!", { x: leftMargin + 12, y: y - 28, size: 9, font: helvetica, color: rgb(0.82, 0.95, 0.85) });
  page.drawText("Apple Pay | Cash App | Cards | Bank Transfer (No Fee!)", { x: leftMargin + 12, y: y - 40, size: 8, font: helvetica, color: rgb(0.7, 0.9, 0.75) });

  y -= 60;

  // Exclusions section if space allows
  if (exclusions.length > 0 && y > 200) {
    page.drawText("EXCLUSIONS & ASSUMPTIONS", { x: leftMargin, y, size: 9, font: helveticaBold, color: COLORS.gray });
    y -= 12;
    for (const ex of exclusions) {
      if (y < 60) break;
      page.drawText("- " + (ex.exclusion_text || ""), { x: leftMargin + 5, y, size: 8, font: helvetica, color: COLORS.gray });
      y -= 11;
    }
    y -= 5;
  }

  // Marketing section if space allows
  if (y > 180) {
    y = drawMarketingSection(page, y, fonts);
  }

  // Quality statement if space allows
  if (y > 120) {
    y = drawQualityStatement(page, y, fonts);
  }

  // Footer
  drawFooter(page, fonts);

  // Embed site photos on additional pages
  const attachments = estimate.estimate_attachments?.slice(0, 4) || [];
  if (attachments.length > 0) {
    let imgPage = pdfDoc.addPage([612, 792]);
    let imgY = 742;

    // Header for documentation page
    drawBrandedHeader(imgPage, fonts, 612);

    imgPage.drawText("SITE DOCUMENTATION", { x: 50, y: 700, size: 16, font: helveticaBold, color: COLORS.navy });
    imgY = 680;

    for (const att of attachments) {
      try {
        const { data } = await supabase.storage.from("estimate-attachments").download(att.file_path);
        if (!data) continue;
        const bytes = new Uint8Array(await data.arrayBuffer());
        const img = att.file_name.toLowerCase().endsWith(".png") ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        const scale = Math.min(500 / img.width, 280 / img.height, 1);
        const w = img.width * scale,
          h = img.height * scale;
        if (imgY - h - 60 < 50) {
          imgPage = pdfDoc.addPage([612, 792]);
          drawBrandedHeader(imgPage, fonts, 612);
          imgY = 700;
        }
        imgPage.drawImage(img, { x: (612 - w) / 2, y: imgY - h, width: w, height: h });
        imgY -= h + 15;
        imgPage.drawText(att.caption || att.file_name, { x: 50, y: imgY, size: 10, font: helvetica, color: COLORS.gray });
        imgY -= 25;
      } catch (e) {
        console.error("Image error:", e);
      }
    }

    drawFooter(imgPage, fonts);
  }

  return await pdfDoc.save();
}

async function generateDetailedScopePdf(estimate: any, supabase: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { bold: helveticaBold, regular: helvetica };

  const page = pdfDoc.addPage([612, 792]);
  const leftMargin = 50;
  let y = 720;

  // Approved watermark
  if (estimate.status === "approved") {
    page.drawText("APPROVED", { x: 150, y: 400, size: 72, font: helveticaBold, color: rgb(0, 0.5, 0), opacity: 0.15, rotate: degrees(45) });
  }

  // Branded header
  drawBrandedHeader(page, fonts, 612);

  // Estimate info box
  page.drawRectangle({ x: leftMargin, y: y - 45, width: 512, height: 50, color: COLORS.lightGray });
  page.drawText(`ESTIMATE ${estimate.estimate_number}`, { x: leftMargin + 15, y: y - 15, size: 14, font: helveticaBold, color: COLORS.navy });
  page.drawText(`Date: ${formatDate(estimate.created_at)}`, { x: leftMargin + 15, y: y - 32, size: 10, font: helvetica, color: COLORS.gray });
  if (estimate.valid_until) {
    page.drawText(`Valid Until: ${formatDate(estimate.valid_until)}`, { x: 350, y: y - 32, size: 10, font: helvetica, color: COLORS.gray });
  }

  y -= 65;

  // Customer Info
  page.drawText("PREPARED FOR", { x: leftMargin, y, size: 11, font: helveticaBold, color: COLORS.green });
  y -= 16;
  const c = estimate.customers;
  if (c) {
    if (c.company_name) {
      page.drawText(c.company_name, { x: leftMargin, y, size: 11, font: helveticaBold, color: COLORS.black });
      y -= 14;
    }
    page.drawText(c.contact_name, { x: leftMargin, y, size: 10, font: helvetica, color: COLORS.black });
    y -= 12;
    if (c.address) {
      page.drawText(c.address, { x: leftMargin, y, size: 10, font: helvetica, color: COLORS.gray });
      y -= 12;
    }
    if (c.city || c.state) {
      page.drawText(`${c.city || ""}, ${c.state || ""} ${c.zip || ""}`, { x: leftMargin, y, size: 10, font: helvetica, color: COLORS.gray });
      y -= 12;
    }
  }
  y -= 12;

  // Scope of Work Section
  page.drawRectangle({ x: leftMargin, y: y - 5, width: 512, height: 24, color: COLORS.navy });
  page.drawText("SCOPE OF WORK", { x: leftMargin + 15, y: y + 2, size: 12, font: helveticaBold, color: COLORS.white });
  y -= 30;

  const customerItems = groupItemsForCustomer(estimate.estimate_items || [], estimate.estimate_custom_items || []);
  for (const item of customerItems) {
    page.drawText(item.description, { x: leftMargin, y, size: 10, font: helveticaBold, color: COLORS.black });
    y -= 12;
    if (item.details) {
      page.drawText(`  ${item.details}`, { x: leftMargin, y, size: 9, font: helvetica, color: COLORS.gray });
      y -= 11;
    }
    page.drawText(`  ${formatCurrency(item.total)}`, { x: leftMargin, y, size: 10, font: helveticaBold, color: COLORS.green });
    y -= 18;
  }

  y -= 5;

  // Total box
  page.drawRectangle({ x: leftMargin, y: y - 35, width: 512, height: 40, color: COLORS.lightGray, borderColor: COLORS.green, borderWidth: 2 });
  page.drawText("TOTAL", { x: leftMargin + 20, y: y - 20, size: 14, font: helveticaBold, color: COLORS.navy });
  page.drawText(formatCurrency(estimate.total), { x: 420, y: y - 22, size: 20, font: helveticaBold, color: COLORS.green });

  y -= 55;

  // Flexible Payment Options badge
  page.drawRectangle({ x: leftMargin, y: y - 5, width: 350, height: 45, color: COLORS.greenDark });
  page.drawText("FLEXIBLE PAYMENT OPTIONS", { x: leftMargin + 12, y: y + 22, size: 12, font: helveticaBold, color: COLORS.white });
  page.drawText("Klarna - Pay in 4 or spread over time!", { x: leftMargin + 12, y: y + 8, size: 9, font: helvetica, color: rgb(0.82, 0.95, 0.85) });
  page.drawText("Apple Pay | Cash App | Cards | Bank Transfer (No Fee!)", { x: leftMargin + 12, y: y - 5, size: 8, font: helvetica, color: rgb(0.7, 0.9, 0.75) });

  y -= 65;

  // Exclusions section if space allows
  if (exclusions.length > 0 && y > 200) {
    page.drawText("EXCLUSIONS & ASSUMPTIONS", { x: leftMargin, y, size: 9, font: helveticaBold, color: COLORS.gray });
    y -= 12;
    for (const ex of exclusions) {
      if (y < 60) break;
      page.drawText("- " + (ex.exclusion_text || ""), { x: leftMargin + 5, y, size: 8, font: helvetica, color: COLORS.gray });
      y -= 11;
    }
    y -= 5;
  }

  // Marketing section if space allows
  if (y > 180) {
    y = drawMarketingSection(page, y, fonts);
  }

  // Footer
  drawFooter(page, fonts);

  // Embed site photos
  const attachments = estimate.estimate_attachments?.slice(0, 4) || [];
  if (attachments.length > 0) {
    let imgPage = pdfDoc.addPage([612, 792]);
    let imgY = 742;

    drawBrandedHeader(imgPage, fonts, 612);
    imgPage.drawText("SITE DOCUMENTATION", { x: 50, y: 700, size: 16, font: helveticaBold, color: COLORS.navy });
    imgY = 680;

    for (const att of attachments) {
      try {
        const { data } = await supabase.storage.from("estimate-attachments").download(att.file_path);
        if (!data) continue;
        const bytes = new Uint8Array(await data.arrayBuffer());
        const img = att.file_name.toLowerCase().endsWith(".png") ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        const scale = Math.min(500 / img.width, 280 / img.height, 1);
        const w = img.width * scale,
          h = img.height * scale;
        if (imgY - h - 60 < 50) {
          imgPage = pdfDoc.addPage([612, 792]);
          drawBrandedHeader(imgPage, fonts, 612);
          imgY = 700;
        }
        imgPage.drawImage(img, { x: (612 - w) / 2, y: imgY - h, width: w, height: h });
        imgY -= h + 15;
        imgPage.drawText(att.caption || att.file_name, { x: 50, y: imgY, size: 10, font: helvetica, color: COLORS.gray });
        imgY -= 25;
      } catch (e) {
        console.error("Image error:", e);
      }
    }

    drawFooter(imgPage, fonts);
  }

  return await pdfDoc.save();
}

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

    // Check if this is a service-to-service call using the service role key
    const isServiceCall = token === supabaseServiceKey;

    if (!isServiceCall) {
      // Validate user JWT for direct API calls
      const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);

      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const userId = claimsData.claims.sub;

      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("role").eq("user_id", userId);

      if (rolesError) {
        console.error("Error checking roles:", rolesError);
        return new Response(JSON.stringify({ error: "Failed to verify permissions" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const hasAccess = roles?.some((r) => ["owner", "admin", "staff", "sales", "project_manager"].includes(r.role));

      if (!hasAccess) {
        return new Response(JSON.stringify({ error: "Forbidden - Insufficient permissions" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      console.log(`Generating PDF by user: ${userId}`);
    } else {
      console.log("Generating PDF via service-to-service call");
    }

    const { estimateId } = await req.json();
    if (!estimateId) throw new Error("Estimate ID is required");

    console.log(`Generating PDF for estimate: ${estimateId}`);

    const { data: estimate, error } = await supabase
      .from("estimates")
      .select(`*, customers(*), estimate_items(*), estimate_attachments(*), estimate_custom_items(*), estimate_scope_bullets(*), estimate_exclusions(*)`)
      .eq("id", estimateId)
      .single();

    if (error) throw new Error(error.message);

    // Also fetch default exclusions if no estimate-specific ones
    let exclusions = estimate.estimate_exclusions || [];
    if (exclusions.length === 0) {
      const { data: defaults } = await supabase
        .from("estimate_exclusions")
        .select("*")
        .eq("is_default", true)
        .order("sort_order");
      exclusions = defaults || [];
    }

    estimate.estimate_items?.sort((a: any, b: any) => a.sort_order - b.sort_order);
    estimate.estimate_attachments?.sort((a: any, b: any) => a.sort_order - b.sort_order);

    const displayFormat = estimate.display_format || "detailed_scope";
    console.log(`Using display format: ${displayFormat}`);

    const pdfBytes = displayFormat === "lump_sum" ? await generateLumpSumPdf(estimate, supabase) : await generateDetailedScopePdf(estimate, supabase);

    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    return new Response(JSON.stringify({ success: true, pdf: base64Pdf, fileName: `${estimate.estimate_number}.pdf`, hasAttachments: estimate.estimate_attachments?.length > 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
