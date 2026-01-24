import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

function groupItemsForCustomer(items: any[]) {
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
  return result;
}

async function generatePdfWithImages(estimate: any, supabase: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  
  const page = pdfDoc.addPage([612, 792]);
  let y = 742;
  const leftMargin = 50;

  if (estimate.status === "approved") {
    page.drawText("APPROVED", { x: 150, y: 400, size: 72, font: helveticaBold, color: rgb(0, 0.5, 0), opacity: 0.2, rotate: { type: 'degrees' as const, angle: 45 } });
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
  const customerItems = groupItemsForCustomer(estimate.estimate_items || []);
  for (const item of customerItems) {
    page.drawText(item.description, { x: leftMargin, y, size: 10, font: helveticaBold }); y -= 12;
    if (item.details) { page.drawText(`  ${item.details}`, { x: leftMargin, y, size: 9, font: helvetica }); y -= 11; }
    page.drawText(`  ${formatCurrency(item.total)}`, { x: leftMargin, y, size: 10, font: courier }); y -= 16;
  }

  y -= 10;
  page.drawText(`TOTAL: ${formatCurrency(estimate.total)}`, { x: 400, y, size: 14, font: helveticaBold });
  y -= 30;
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
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { estimateId } = await req.json();
    if (!estimateId) throw new Error("Estimate ID is required");

    const { data: estimate, error } = await supabase.from("estimates").select(`*, customers(*), estimate_items(*), estimate_attachments(*)`).eq("id", estimateId).single();
    if (error) throw new Error(error.message);

    estimate.estimate_items?.sort((a: any, b: any) => a.sort_order - b.sort_order);
    estimate.estimate_attachments?.sort((a: any, b: any) => a.sort_order - b.sort_order);

    const pdfBytes = await generatePdfWithImages(estimate, supabase);
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    return new Response(JSON.stringify({ success: true, pdf: base64Pdf, fileName: `${estimate.estimate_number}.pdf`, hasAttachments: estimate.estimate_attachments?.length > 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});