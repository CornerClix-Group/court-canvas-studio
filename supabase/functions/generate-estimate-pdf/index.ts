import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, degrees } from "https://esm.sh/pdf-lib@1.17.1";

const COMPANY_INFO = {
  displayName: "CourtHaus Construction, LLC dba CourtPro Augusta",
  address: { street: "500 Furys Ferry Rd.", suite: "Suite 107", city: "Augusta", state: "GA", zip: "30907" },
  phone: "(706) 309-1993",
  email: "estimates@courtproaugusta.com",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatCurrency = (amount: number): string => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
const formatDate = (dateStr: string): string => new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

function groupItemsForCustomer(items: any[], customItems: any[] = []) {
  const groups: Record<string, { items: any[], label: string, details: string }> = {
    surfacePrep: { items: [], label: 'Surface Preparation', details: 'Professional surface preparation including cleaning, crack repair, and priming' },
    surfacing: { items: [], label: 'Court Surfacing System', details: 'Premium court surfacing with cushion layers and color coats' },
    striping: { items: [], label: 'Professional Line Striping', details: 'Complete court line marking' },
    baseWork: { items: [], label: 'Site Preparation & Base Work', details: 'Substrate preparation and base installation' },
  };
  const addons: any[] = [];

  items.forEach(item => {
    const desc = item.description.toLowerCase();
    if (desc.includes('pressure') || desc.includes('wash') || desc.includes('crack') || desc.includes('prime') || desc.includes('prep')) groups.surfacePrep.items.push(item);
    else if (desc.includes('line') || desc.includes('striping')) groups.striping.items.push(item);
    else if (desc.includes('base') || desc.includes('substrate')) groups.baseWork.items.push(item);
    else if (desc.includes('granule') || desc.includes('color') || desc.includes('resurfacer') || desc.includes('laykold') || desc.includes('surfacing') || desc.includes('cushion')) groups.surfacing.items.push(item);
    else addons.push(item);
  });

  const result: { description: string; details: string; total: number }[] = [];
  Object.values(groups).forEach(g => {
    if (g.items.length > 0) result.push({ description: g.label, details: g.details, total: g.items.reduce((sum, i) => sum + i.total, 0) });
  });
  addons.forEach(item => result.push({ description: item.description, details: item.quantity > 1 ? `Quantity: ${item.quantity}` : '', total: item.total }));
  
  // Add custom items - show only description and customer price (no vendor details)
  if (customItems && customItems.length > 0) {
    customItems.forEach(item => {
      result.push({ 
        description: item.description, 
        details: '', 
        total: Number(item.customer_price) || 0 
      });
    });
  }
  
  return result;
}

async function generateLumpSumPdf(estimate: any, supabase: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  
  const page = pdfDoc.addPage([612, 792]);
  let y = 742;
  const leftMargin = 50;

  if (estimate.status === "approved") {
    page.drawText("APPROVED", { x: 150, y: 400, size: 72, font: helveticaBold, color: rgb(0, 0.5, 0), opacity: 0.2, rotate: degrees(45) });
  }

  // Company Header
  page.drawText(COMPANY_INFO.displayName, { x: leftMargin, y, size: 12, font: helveticaBold }); y -= 14;
  page.drawText(`${COMPANY_INFO.address.street} ${COMPANY_INFO.address.suite}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12;
  page.drawText(`${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.state} ${COMPANY_INFO.address.zip}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12;
  page.drawText(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, { x: leftMargin, y, size: 10, font: courier }); y -= 25;

  // Estimate Info
  page.drawText(`ESTIMATE ${estimate.estimate_number}`, { x: leftMargin, y, size: 14, font: helveticaBold }); y -= 16;
  page.drawText(`Date: ${formatDate(estimate.created_at)}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12;
  if (estimate.valid_until) { page.drawText(`Valid Until: ${formatDate(estimate.valid_until)}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12; }
  y -= 15;

  // Customer Info
  page.drawText("PREPARED FOR:", { x: leftMargin, y, size: 11, font: helveticaBold }); y -= 14;
  const c = estimate.customers;
  if (c) {
    if (c.company_name) { page.drawText(c.company_name, { x: leftMargin, y, size: 10, font: courier }); y -= 12; }
    page.drawText(c.contact_name, { x: leftMargin, y, size: 10, font: courier }); y -= 12;
    if (c.address) { page.drawText(c.address, { x: leftMargin, y, size: 10, font: courier }); y -= 12; }
    if (c.city || c.state) { page.drawText(`${c.city || ''}, ${c.state || ''} ${c.zip || ''}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12; }
  }
  y -= 20;

  // Lump Sum: Project Scope with Bullet Points
  page.drawText("PROJECT SCOPE", { x: leftMargin, y, size: 12, font: helveticaBold }); y -= 20;
  
  const scopeBullets = estimate.estimate_scope_bullets || [];
  if (scopeBullets.length > 0) {
    // Sort by sort_order
    scopeBullets.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    
    for (const bullet of scopeBullets) {
      // Wrap long text
      const text = bullet.bullet_text;
      const maxWidth = 480;
      const words = text.split(' ');
      let line = '✓ ';
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const width = helvetica.widthOfTextAtSize(testLine, 10);
        if (width > maxWidth && line !== '✓ ') {
          page.drawText(line.trim(), { x: leftMargin, y, size: 10, font: helvetica }); 
          y -= 14;
          line = '   ' + word + ' '; // Indent continuation
        } else {
          line = testLine;
        }
      }
      if (line.trim()) {
        page.drawText(line.trim(), { x: leftMargin, y, size: 10, font: helvetica }); 
        y -= 18;
      }
    }
  } else {
    // Fallback if no bullets saved
    page.drawText("✓ Complete professional court construction services", { x: leftMargin, y, size: 10, font: helvetica }); y -= 18;
  }
  
  y -= 15;
  
  // Project Investment Box
  const boxY = y - 5;
  page.drawRectangle({ x: leftMargin, y: boxY - 45, width: 512, height: 50, color: rgb(0.95, 0.97, 1), borderColor: rgb(0.02, 0.36, 0.29), borderWidth: 2 });
  page.drawText("PROJECT INVESTMENT", { x: leftMargin + 20, y: boxY - 20, size: 12, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(formatCurrency(estimate.total), { x: 400, y: boxY - 25, size: 24, font: helveticaBold, color: rgb(0.02, 0.36, 0.29) });
  
  y = boxY - 70;
  
  // Flexible Payment Options badge
  page.drawRectangle({ x: leftMargin, y: y - 5, width: 350, height: 40, color: rgb(0.02, 0.36, 0.29) });
  page.drawText("FLEXIBLE PAYMENT OPTIONS", { x: leftMargin + 12, y: y + 18, size: 12, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText("Klarna • Apple Pay • Cash App • Cards • Bank Transfer (No Fee!)", { x: leftMargin + 12, y: y + 4, size: 9, font: helvetica, color: rgb(0.82, 0.95, 0.85) });
  
  y -= 55;
  page.drawText("Thank you for considering CourtPro Augusta!", { x: leftMargin, y, size: 10, font: helvetica });

  // Embed site photos
  const attachments = estimate.estimate_attachments?.slice(0, 4) || [];
  if (attachments.length > 0) {
    let imgPage = pdfDoc.addPage([612, 792]);
    let imgY = 742;
    imgPage.drawText("SITE DOCUMENTATION", { x: 50, y: imgY, size: 16, font: helveticaBold }); imgY -= 30;

    for (const att of attachments) {
      try {
        const { data } = await supabase.storage.from('estimate-attachments').download(att.file_path);
        if (!data) continue;
        const bytes = new Uint8Array(await data.arrayBuffer());
        const img = att.file_name.toLowerCase().endsWith('.png') ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        const scale = Math.min(500 / img.width, 300 / img.height, 1);
        const w = img.width * scale, h = img.height * scale;
        if (imgY - h - 50 < 50) { imgPage = pdfDoc.addPage([612, 792]); imgY = 742; }
        imgPage.drawImage(img, { x: (612 - w) / 2, y: imgY - h, width: w, height: h }); imgY -= h + 15;
        imgPage.drawText(att.caption || att.file_name, { x: 50, y: imgY, size: 10, font: helvetica }); imgY -= 25;
      } catch (e) { console.error('Image error:', e); }
    }
  }

  return await pdfDoc.save();
}

async function generateDetailedScopePdf(estimate: any, supabase: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  
  const page = pdfDoc.addPage([612, 792]);
  let y = 742;
  const leftMargin = 50;

  if (estimate.status === "approved") {
    page.drawText("APPROVED", { x: 150, y: 400, size: 72, font: helveticaBold, color: rgb(0, 0.5, 0), opacity: 0.2, rotate: degrees(45) });
  }

  page.drawText(COMPANY_INFO.displayName, { x: leftMargin, y, size: 12, font: helveticaBold }); y -= 14;
  page.drawText(`${COMPANY_INFO.address.street} ${COMPANY_INFO.address.suite}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12;
  page.drawText(`${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.state} ${COMPANY_INFO.address.zip}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12;
  page.drawText(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, { x: leftMargin, y, size: 10, font: courier }); y -= 25;

  page.drawText(`ESTIMATE ${estimate.estimate_number}`, { x: leftMargin, y, size: 14, font: helveticaBold }); y -= 16;
  page.drawText(`Date: ${formatDate(estimate.created_at)}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12;
  if (estimate.valid_until) { page.drawText(`Valid Until: ${formatDate(estimate.valid_until)}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12; }
  y -= 15;

  page.drawText("PREPARED FOR:", { x: leftMargin, y, size: 11, font: helveticaBold }); y -= 14;
  const c = estimate.customers;
  if (c) {
    if (c.company_name) { page.drawText(c.company_name, { x: leftMargin, y, size: 10, font: courier }); y -= 12; }
    page.drawText(c.contact_name, { x: leftMargin, y, size: 10, font: courier }); y -= 12;
    if (c.address) { page.drawText(c.address, { x: leftMargin, y, size: 10, font: courier }); y -= 12; }
    if (c.city || c.state) { page.drawText(`${c.city || ''}, ${c.state || ''} ${c.zip || ''}`, { x: leftMargin, y, size: 10, font: courier }); y -= 12; }
  }
  y -= 15;

  page.drawText("SCOPE OF WORK", { x: leftMargin, y, size: 12, font: helveticaBold }); y -= 18;
  const customerItems = groupItemsForCustomer(estimate.estimate_items || [], estimate.estimate_custom_items || []);
  for (const item of customerItems) {
    page.drawText(item.description, { x: leftMargin, y, size: 10, font: helveticaBold }); y -= 12;
    if (item.details) { page.drawText(`  ${item.details}`, { x: leftMargin, y, size: 9, font: helvetica }); y -= 11; }
    page.drawText(`  ${formatCurrency(item.total)}`, { x: leftMargin, y, size: 10, font: courier }); y -= 16;
  }

  y -= 10;
  page.drawText(`TOTAL: ${formatCurrency(estimate.total)}`, { x: 400, y, size: 14, font: helveticaBold });
  
  // Flexible Payment Options badge
  y -= 35;
  page.drawRectangle({ x: leftMargin, y: y - 5, width: 350, height: 40, color: rgb(0.02, 0.36, 0.29) });
  page.drawText("FLEXIBLE PAYMENT OPTIONS", { x: leftMargin + 12, y: y + 18, size: 12, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText("Klarna • Apple Pay • Cash App • Cards • Bank Transfer (No Fee!)", { x: leftMargin + 12, y: y + 4, size: 9, font: helvetica, color: rgb(0.82, 0.95, 0.85) });
  
  y -= 50;
  page.drawText("Thank you for considering CourtPro Augusta!", { x: leftMargin, y, size: 10, font: helvetica });

  // Embed site photos
  const attachments = estimate.estimate_attachments?.slice(0, 4) || [];
  if (attachments.length > 0) {
    let imgPage = pdfDoc.addPage([612, 792]);
    let imgY = 742;
    imgPage.drawText("SITE DOCUMENTATION", { x: 50, y: imgY, size: 16, font: helveticaBold }); imgY -= 30;

    for (const att of attachments) {
      try {
        const { data } = await supabase.storage.from('estimate-attachments').download(att.file_path);
        if (!data) continue;
        const bytes = new Uint8Array(await data.arrayBuffer());
        const img = att.file_name.toLowerCase().endsWith('.png') ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        const scale = Math.min(500 / img.width, 300 / img.height, 1);
        const w = img.width * scale, h = img.height * scale;
        if (imgY - h - 50 < 50) { imgPage = pdfDoc.addPage([612, 792]); imgY = 742; }
        imgPage.drawImage(img, { x: (612 - w) / 2, y: imgY - h, width: w, height: h }); imgY -= h + 15;
        imgPage.drawText(att.caption || att.file_name, { x: 50, y: imgY, size: 10, font: helvetica }); imgY -= 25;
      } catch (e) { console.error('Image error:', e); }
    }
  }

  return await pdfDoc.save();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to validate auth
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify user has appropriate role using service client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error checking roles:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasAccess = roles?.some(r => 
      ['owner', 'admin', 'staff', 'sales', 'project_manager'].includes(r.role)
    );

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { estimateId } = await req.json();
    if (!estimateId) throw new Error("Estimate ID is required");

    console.log(`Generating PDF for estimate: ${estimateId} by user: ${userId}`);

    // Fetch estimate with all related data including scope bullets
    const { data: estimate, error } = await supabase
      .from("estimates")
      .select(`*, customers(*), estimate_items(*), estimate_attachments(*), estimate_custom_items(*), estimate_scope_bullets(*)`)
      .eq("id", estimateId)
      .single();
    
    if (error) throw new Error(error.message);

    estimate.estimate_items?.sort((a: any, b: any) => a.sort_order - b.sort_order);
    estimate.estimate_attachments?.sort((a: any, b: any) => a.sort_order - b.sort_order);

    // Generate PDF based on display_format
    const displayFormat = estimate.display_format || 'detailed_scope';
    console.log(`Using display format: ${displayFormat}`);
    
    const pdfBytes = displayFormat === 'lump_sum' 
      ? await generateLumpSumPdf(estimate, supabase)
      : await generateDetailedScopePdf(estimate, supabase);
    
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    return new Response(JSON.stringify({ success: true, pdf: base64Pdf, fileName: `${estimate.estimate_number}.pdf`, hasAttachments: estimate.estimate_attachments?.length > 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
