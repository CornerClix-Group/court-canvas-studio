import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "https://esm.sh/pdf-lib@1.17.1";

// Company branding information
const COMPANY_INFO = {
  brandName: "CourtPro Augusta",
  tagline: "Professional Court Construction",
  legalName: "A CourtHaus Construction, LLC Company",
  address: "500 Furys Ferry Rd. Suite 107",
  cityStateZip: "Augusta, GA 30907",
  phone: "(706) 309-1993",
  email: "billing@courtproaugusta.com",
  website: "courtproaugusta.com",
};

// Brand colors
const COLORS = {
  navy: rgb(0.12, 0.23, 0.37),
  brandGreen: rgb(0.02, 0.59, 0.41),
  lightBlue: rgb(0.58, 0.77, 0.99),
  lightGray: rgb(0.95, 0.97, 1.0),
  sage: rgb(0.94, 0.98, 0.94),
  teal: rgb(0.03, 0.57, 0.70),
  darkText: rgb(0.12, 0.12, 0.12),
  grayText: rgb(0.4, 0.4, 0.4),
  white: rgb(1, 1, 1),
  paidGreen: rgb(0.02, 0.5, 0.02),
};

// Marketing trust points
const MARKETING_POINTS = [
  "200+ Courts Completed - Trusted by homeowners, schools & clubs",
  "ASBA Certified - American Sports Builders Association member",
  "Premium Materials - Laykold surfaces used by US Open & ATP",
  "Local Expertise - Serving Augusta & the CSRA",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit: string | null;
}

interface InvoiceData {
  invoice_number: string;
  created_at: string;
  due_date: string | null;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  notes: string | null;
  status: string;
  paid_at: string | null;
  customers: {
    contact_name: string;
    company_name: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  invoice_items: InvoiceItem[];
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Draw branded header
function drawBrandedHeader(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  width: number
): void {
  // Navy header bar
  page.drawRectangle({
    x: 0,
    y: 742,
    width: width,
    height: 50,
    color: COLORS.navy,
  });

  // Brand name
  page.drawText(COMPANY_INFO.brandName, {
    x: 50,
    y: 760,
    size: 22,
    font: fonts.bold,
    color: COLORS.white,
  });

  // Tagline
  page.drawText(COMPANY_INFO.tagline, {
    x: 50,
    y: 746,
    size: 10,
    font: fonts.regular,
    color: COLORS.lightBlue,
  });

  // Contact on right side
  page.drawText(COMPANY_INFO.phone, {
    x: width - 150,
    y: 760,
    size: 10,
    font: fonts.regular,
    color: COLORS.white,
  });

  page.drawText(COMPANY_INFO.email, {
    x: width - 150,
    y: 746,
    size: 9,
    font: fonts.regular,
    color: COLORS.lightBlue,
  });
}

// Draw invoice info section
function drawInvoiceInfo(
  page: PDFPage,
  invoice: InvoiceData,
  fonts: { bold: PDFFont; regular: PDFFont },
  y: number
): number {
  const isPaid = invoice.status === "paid";

  // Invoice title with status
  page.drawText("INVOICE", {
    x: 50,
    y,
    size: 24,
    font: fonts.bold,
    color: COLORS.darkText,
  });

  // Status badge
  if (isPaid) {
    page.drawRectangle({
      x: 140,
      y: y - 3,
      width: 50,
      height: 20,
      color: COLORS.brandGreen,
    });
    page.drawText("PAID", {
      x: 150,
      y: y + 2,
      size: 11,
      font: fonts.bold,
      color: COLORS.white,
    });
  }

  y -= 25;

  // Invoice number
  page.drawText("Invoice Number:", {
    x: 50,
    y,
    size: 10,
    font: fonts.regular,
    color: COLORS.grayText,
  });
  page.drawText(invoice.invoice_number, {
    x: 140,
    y,
    size: 10,
    font: fonts.bold,
    color: COLORS.darkText,
  });

  y -= 15;

  // Date
  page.drawText("Date:", {
    x: 50,
    y,
    size: 10,
    font: fonts.regular,
    color: COLORS.grayText,
  });
  page.drawText(formatDate(invoice.created_at), {
    x: 140,
    y,
    size: 10,
    font: fonts.regular,
    color: COLORS.darkText,
  });

  y -= 15;

  // Due date
  if (invoice.due_date) {
    page.drawText("Due Date:", {
      x: 50,
      y,
      size: 10,
      font: fonts.regular,
      color: COLORS.grayText,
    });
    page.drawText(formatDate(invoice.due_date), {
      x: 140,
      y,
      size: 10,
      font: fonts.bold,
      color: isPaid ? COLORS.grayText : COLORS.darkText,
    });
    y -= 15;
  }

  // Paid date if applicable
  if (isPaid && invoice.paid_at) {
    page.drawText("Paid:", {
      x: 50,
      y,
      size: 10,
      font: fonts.regular,
      color: COLORS.brandGreen,
    });
    page.drawText(formatDate(invoice.paid_at), {
      x: 140,
      y,
      size: 10,
      font: fonts.bold,
      color: COLORS.brandGreen,
    });
    y -= 15;
  }

  return y - 15;
}

// Draw Bill To section
function drawBillTo(
  page: PDFPage,
  customer: InvoiceData["customers"],
  fonts: { bold: PDFFont; regular: PDFFont },
  y: number
): number {
  // Section header bar
  page.drawRectangle({
    x: 50,
    y: y - 5,
    width: 150,
    height: 20,
    color: COLORS.lightGray,
  });

  page.drawText("BILL TO", {
    x: 55,
    y: y,
    size: 11,
    font: fonts.bold,
    color: COLORS.darkText,
  });

  y -= 30;

  if (customer) {
    if (customer.company_name) {
      page.drawText(customer.company_name, {
        x: 50,
        y,
        size: 11,
        font: fonts.bold,
        color: COLORS.darkText,
      });
      y -= 14;
    }

    page.drawText(customer.contact_name, {
      x: 50,
      y,
      size: 10,
      font: fonts.regular,
      color: COLORS.darkText,
    });
    y -= 14;

    if (customer.address) {
      page.drawText(customer.address, {
        x: 50,
        y,
        size: 10,
        font: fonts.regular,
        color: COLORS.grayText,
      });
      y -= 14;
    }

    if (customer.city || customer.state || customer.zip) {
      const cityStateZip = [customer.city, customer.state, customer.zip]
        .filter(Boolean)
        .join(", ");
      page.drawText(cityStateZip, {
        x: 50,
        y,
        size: 10,
        font: fonts.regular,
        color: COLORS.grayText,
      });
      y -= 14;
    }

    if (customer.email) {
      page.drawText(customer.email, {
        x: 50,
        y,
        size: 10,
        font: fonts.regular,
        color: COLORS.grayText,
      });
      y -= 14;
    }

    if (customer.phone) {
      page.drawText(customer.phone, {
        x: 50,
        y,
        size: 10,
        font: fonts.regular,
        color: COLORS.grayText,
      });
      y -= 14;
    }
  }

  return y - 10;
}

// Draw line items table
function drawLineItems(
  page: PDFPage,
  items: InvoiceItem[],
  fonts: { bold: PDFFont; regular: PDFFont },
  y: number,
  width: number
): number {
  const tableWidth = width - 100;

  // Table header
  page.drawRectangle({
    x: 50,
    y: y - 5,
    width: tableWidth,
    height: 25,
    color: COLORS.navy,
  });

  page.drawText("Description", {
    x: 60,
    y: y + 2,
    size: 10,
    font: fonts.bold,
    color: COLORS.white,
  });

  page.drawText("Qty", {
    x: 340,
    y: y + 2,
    size: 10,
    font: fonts.bold,
    color: COLORS.white,
  });

  page.drawText("Price", {
    x: 400,
    y: y + 2,
    size: 10,
    font: fonts.bold,
    color: COLORS.white,
  });

  page.drawText("Total", {
    x: 480,
    y: y + 2,
    size: 10,
    font: fonts.bold,
    color: COLORS.white,
  });

  y -= 30;

  // Draw rows
  items.forEach((item, index) => {
    // Alternating row colors
    if (index % 2 === 0) {
      page.drawRectangle({
        x: 50,
        y: y - 8,
        width: tableWidth,
        height: 22,
        color: COLORS.lightGray,
      });
    }

    // Truncate description if too long
    const desc = item.description.length > 45 
      ? item.description.substring(0, 42) + "..." 
      : item.description;

    page.drawText(desc, {
      x: 60,
      y,
      size: 9,
      font: fonts.regular,
      color: COLORS.darkText,
    });

    page.drawText(item.quantity.toString(), {
      x: 345,
      y,
      size: 9,
      font: fonts.regular,
      color: COLORS.darkText,
    });

    page.drawText(formatCurrency(item.unit_price), {
      x: 390,
      y,
      size: 9,
      font: fonts.regular,
      color: COLORS.darkText,
    });

    page.drawText(formatCurrency(item.total), {
      x: 470,
      y,
      size: 9,
      font: fonts.bold,
      color: COLORS.darkText,
    });

    y -= 22;
  });

  return y - 10;
}

// Draw totals section
function drawTotals(
  page: PDFPage,
  invoice: InvoiceData,
  fonts: { bold: PDFFont; regular: PDFFont },
  y: number,
  width: number
): number {
  const boxX = width - 220;
  const boxWidth = 170;
  const isPaid = invoice.status === "paid";

  // Totals box background
  page.drawRectangle({
    x: boxX,
    y: y - 70,
    width: boxWidth,
    height: 75,
    color: COLORS.lightGray,
  });

  // Green accent line
  page.drawRectangle({
    x: boxX,
    y: y - 70,
    width: 4,
    height: 75,
    color: COLORS.brandGreen,
  });

  // Subtotal
  page.drawText("Subtotal:", {
    x: boxX + 15,
    y: y - 15,
    size: 10,
    font: fonts.regular,
    color: COLORS.grayText,
  });
  page.drawText(formatCurrency(invoice.subtotal), {
    x: boxX + boxWidth - 70,
    y: y - 15,
    size: 10,
    font: fonts.regular,
    color: COLORS.darkText,
  });

  // Tax if applicable
  if (invoice.tax_rate && invoice.tax_amount) {
    page.drawText(`Tax (${invoice.tax_rate}%):`, {
      x: boxX + 15,
      y: y - 32,
      size: 10,
      font: fonts.regular,
      color: COLORS.grayText,
    });
    page.drawText(formatCurrency(invoice.tax_amount), {
      x: boxX + boxWidth - 70,
      y: y - 32,
      size: 10,
      font: fonts.regular,
      color: COLORS.darkText,
    });
  }

  // Total
  page.drawText(isPaid ? "PAID:" : "TOTAL DUE:", {
    x: boxX + 15,
    y: y - 55,
    size: 12,
    font: fonts.bold,
    color: isPaid ? COLORS.brandGreen : COLORS.darkText,
  });
  page.drawText(formatCurrency(invoice.total), {
    x: boxX + boxWidth - 80,
    y: y - 55,
    size: 14,
    font: fonts.bold,
    color: isPaid ? COLORS.brandGreen : COLORS.brandGreen,
  });

  return y - 90;
}

// Draw payment options banner (only for unpaid invoices)
function drawPaymentOptions(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  y: number,
  width: number
): number {
  // Teal banner
  page.drawRectangle({
    x: 50,
    y: y - 5,
    width: width - 100,
    height: 50,
    color: COLORS.teal,
  });

  page.drawText("FLEXIBLE PAYMENT OPTIONS", {
    x: 60,
    y: y + 25,
    size: 12,
    font: fonts.bold,
    color: COLORS.white,
  });

  page.drawText("Klarna - Pay in 4 or Finance | Apple Pay | Cash App | Amazon Pay | Cards", {
    x: 60,
    y: y + 8,
    size: 9,
    font: fonts.regular,
    color: COLORS.white,
  });

  page.drawText("Bank Transfer (ACH) - NO FEE!", {
    x: 60,
    y: y - 7,
    size: 10,
    font: fonts.bold,
    color: rgb(0.8, 1, 0.8),
  });

  return y - 65;
}

// Draw marketing section
function drawMarketingSection(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  y: number,
  width: number
): number {
  // Section header
  page.drawRectangle({
    x: 50,
    y: y - 5,
    width: width - 100,
    height: 22,
    color: COLORS.brandGreen,
  });

  page.drawText("WHY CHOOSE COURTPRO?", {
    x: 60,
    y: y,
    size: 11,
    font: fonts.bold,
    color: COLORS.white,
  });

  y -= 35;

  // Background for marketing points
  page.drawRectangle({
    x: 50,
    y: y - 55,
    width: width - 100,
    height: 70,
    color: COLORS.sage,
  });

  // Marketing points
  MARKETING_POINTS.forEach((point, index) => {
    page.drawText(`* ${point}`, {
      x: 60,
      y: y - (index * 16),
      size: 9,
      font: fonts.regular,
      color: COLORS.darkText,
    });
  });

  return y - 75;
}

// Draw quality statement
function drawQualityStatement(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  y: number,
  width: number
): number {
  // Quote box background
  page.drawRectangle({
    x: 50,
    y: y - 50,
    width: width - 100,
    height: 55,
    color: COLORS.lightGray,
  });

  const quote = '"Your court is more than pavement - its where memories are made.';
  const quote2 = 'We use only premium Laykold surfacing systems, trusted by the US Open."';

  page.drawText(quote, {
    x: 60,
    y: y - 15,
    size: 9,
    font: fonts.regular,
    color: COLORS.grayText,
  });

  page.drawText(quote2, {
    x: 60,
    y: y - 30,
    size: 9,
    font: fonts.regular,
    color: COLORS.grayText,
  });

  return y - 65;
}

// Draw footer
function drawFooter(
  page: PDFPage,
  fonts: { bold: PDFFont; regular: PDFFont },
  width: number
): void {
  // Navy footer bar
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 45,
    color: COLORS.navy,
  });

  page.drawText(COMPANY_INFO.brandName, {
    x: 50,
    y: 28,
    size: 11,
    font: fonts.bold,
    color: COLORS.white,
  });

  page.drawText(`${COMPANY_INFO.address}, ${COMPANY_INFO.cityStateZip}`, {
    x: 50,
    y: 15,
    size: 8,
    font: fonts.regular,
    color: COLORS.lightBlue,
  });

  page.drawText(COMPANY_INFO.legalName, {
    x: width - 200,
    y: 15,
    size: 8,
    font: fonts.regular,
    color: COLORS.grayText,
  });
}

// Draw PAID watermark for paid invoices
function drawPaidWatermark(
  page: PDFPage,
  fonts: { bold: PDFFont },
  width: number,
  height: number
): void {
  // Draw diagonal PAID watermark with light green color for transparency effect
  const text = "PAID";
  const fontSize = 100;
  
  // Position in center of page, offset for rotation
  const x = width / 2 - 100;
  const y = height / 2;

  // Use a light green color to simulate transparency
  page.drawText(text, {
    x: x,
    y: y,
    size: fontSize,
    font: fonts.bold,
    color: rgb(0.85, 0.95, 0.85),
  });
  
  // Draw a second slightly offset for depth effect
  page.drawText(text, {
    x: x + 2,
    y: y - 2,
    size: fontSize,
    font: fonts.bold,
    color: rgb(0.75, 0.92, 0.75),
  });
}

// Generate the branded PDF
async function generateBrandedPdf(invoice: InvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fonts = { regular: helvetica, bold: helveticaBold };

  const width = page.getWidth();
  const height = page.getHeight();
  const isPaid = invoice.status === "paid";

  // Draw PAID watermark first (behind content) for paid invoices
  if (isPaid) {
    drawPaidWatermark(page, { bold: helveticaBold }, width, height);
  }

  // Draw header
  drawBrandedHeader(page, fonts, width);

  // Start content below header
  let y = 710;

  // Draw invoice info
  y = drawInvoiceInfo(page, invoice, fonts, y);

  // Draw Bill To section
  y = drawBillTo(page, invoice.customers, fonts, y);

  // Draw line items table
  y = drawLineItems(page, invoice.invoice_items, fonts, y, width);

  // Draw totals
  y = drawTotals(page, invoice, fonts, y, width);

  // Draw payment options only for unpaid invoices
  if (!isPaid) {
    y = drawPaymentOptions(page, fonts, y, width);
  }

  // Draw marketing section if there's room
  if (y > 200) {
    y = drawMarketingSection(page, fonts, y, width);
  }

  // Draw quality statement if there's room
  if (y > 130) {
    y = drawQualityStatement(page, fonts, y, width);
  }

  // Draw notes if present
  if (invoice.notes && y > 100) {
    page.drawText("Notes:", {
      x: 50,
      y: y - 10,
      size: 10,
      font: fonts.bold,
      color: COLORS.darkText,
    });
    
    // Truncate notes if too long
    const notesText = invoice.notes.length > 200 
      ? invoice.notes.substring(0, 197) + "..." 
      : invoice.notes;
    
    page.drawText(notesText, {
      x: 50,
      y: y - 25,
      size: 9,
      font: fonts.regular,
      color: COLORS.grayText,
    });
  }

  // Draw footer
  drawFooter(page, fonts, width);

  return await pdfDoc.save();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to validate auth
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userSupabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify user has admin/staff role using service client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Error checking roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasAccess = roles?.some((r) =>
      ["owner", "admin", "staff", "accounting", "sales", "project_manager"].includes(r.role)
    );

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    console.log(`Generating branded PDF for invoice: ${invoiceId} by user: ${userId}`);

    // Fetch invoice with customer and items
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select(`
        *,
        customers (
          contact_name,
          company_name,
          address,
          city,
          state,
          zip,
          email,
          phone
        ),
        invoice_items (
          description,
          quantity,
          unit_price,
          total,
          unit,
          sort_order
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (fetchError) {
      console.error("Error fetching invoice:", fetchError);
      throw new Error(`Failed to fetch invoice: ${fetchError.message}`);
    }

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Sort items by sort_order
    invoice.invoice_items.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);

    // Generate branded PDF
    const pdfBytes = await generateBrandedPdf(invoice as InvoiceData);

    // Upload to Supabase Storage
    const fileName = `${invoice.invoice_number}.pdf`;
    const filePath = `${invoiceId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(filePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading PDF:", uploadError);
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get signed URL for download (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from("invoices")
      .createSignedUrl(filePath, 3600);

    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      throw new Error(`Failed to create download URL: ${urlError.message}`);
    }

    // Update invoice with PDF URL
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ pdf_url: filePath })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Error updating invoice:", updateError);
    }

    console.log(`Branded PDF generated successfully: ${filePath}`);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: urlData.signedUrl,
        filePath,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error generating PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
