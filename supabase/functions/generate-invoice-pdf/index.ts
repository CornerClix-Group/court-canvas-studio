import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Company information
const COMPANY_INFO = {
  legalName: "CourtHaus Construction, LLC",
  dbaName: "CourtPro Augusta",
  displayName: "CourtHaus Construction, LLC dba CourtPro Augusta",
  address: {
    street: "500 Furys Ferry Rd.",
    suite: "Suite 107",
    city: "Augusta",
    state: "GA",
    zip: "30907",
    full: "500 Furys Ferry Rd. Suite 107, Augusta, GA 30907",
  },
  phone: "(762) 218-2974",
  email: "estimates@courtproaugusta.com",
  website: "courtproaugusta.com",
};

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

// Generate PDF using a simple text-based approach that creates valid PDF
function generatePdfContent(invoice: InvoiceData): Uint8Array {
  const customer = invoice.customers;
  const isPaid = invoice.status === "paid";
  
  // Build content lines
  const lines: string[] = [];
  
  // Add PAID stamp at the top if invoice is paid
  if (isPaid) {
    lines.push("");
    lines.push("*".repeat(60));
    lines.push("*" + " ".repeat(20) + "*** PAID ***" + " ".repeat(20) + "*");
    if (invoice.paid_at) {
      const paidDate = formatDate(invoice.paid_at);
      const padding = Math.max(0, Math.floor((58 - paidDate.length - 6) / 2));
      lines.push("*" + " ".repeat(padding) + `Paid: ${paidDate}` + " ".repeat(58 - padding - paidDate.length - 6) + "*");
    }
    lines.push("*".repeat(60));
    lines.push("");
  }
  
  // Company header with full legal name and address
  lines.push(COMPANY_INFO.displayName);
  lines.push(COMPANY_INFO.address.street + " " + COMPANY_INFO.address.suite);
  lines.push(`${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.state} ${COMPANY_INFO.address.zip}`);
  lines.push("");
  lines.push(`Phone: ${COMPANY_INFO.phone}`);
  lines.push(`Email: ${COMPANY_INFO.email}`);
  lines.push("");
  lines.push("=".repeat(60));
  lines.push("");
  lines.push(`INVOICE ${invoice.invoice_number}`);
  lines.push("");
  lines.push(`Date: ${formatDate(invoice.created_at)}`);
  if (invoice.due_date) {
    lines.push(`Due Date: ${formatDate(invoice.due_date)}`);
  }
  lines.push(`Status: ${invoice.status.toUpperCase()}`);
  lines.push("");
  lines.push("-".repeat(60));
  lines.push("");
  
  // Bill To
  lines.push("BILL TO:");
  if (customer) {
    if (customer.company_name) lines.push(customer.company_name);
    lines.push(customer.contact_name);
    if (customer.address) lines.push(customer.address);
    if (customer.city || customer.state || customer.zip) {
      lines.push(`${customer.city || ""}, ${customer.state || ""} ${customer.zip || ""}`.trim());
    }
    if (customer.email) lines.push(customer.email);
    if (customer.phone) lines.push(customer.phone);
  }
  lines.push("");
  lines.push("-".repeat(60));
  lines.push("");
  
  // Line items header
  lines.push("DESCRIPTION".padEnd(35) + "QTY".padStart(8) + "PRICE".padStart(12) + "TOTAL".padStart(12));
  lines.push("-".repeat(67));
  
  // Line items
  for (const item of invoice.invoice_items) {
    const desc = item.description.substring(0, 34).padEnd(35);
    const qty = item.quantity.toString().padStart(8);
    const price = formatCurrency(item.unit_price).padStart(12);
    const total = formatCurrency(item.total).padStart(12);
    lines.push(`${desc}${qty}${price}${total}`);
  }
  
  lines.push("-".repeat(67));
  lines.push("");
  
  // Totals
  lines.push("SUBTOTAL:".padStart(47) + formatCurrency(invoice.subtotal).padStart(20));
  if (invoice.tax_rate && invoice.tax_amount) {
    lines.push(`TAX (${invoice.tax_rate}%):`.padStart(47) + formatCurrency(invoice.tax_amount).padStart(20));
  }
  lines.push("=".repeat(67));
  lines.push("TOTAL DUE:".padStart(47) + formatCurrency(invoice.total).padStart(20));
  
  // Show payment info for paid invoices
  if (isPaid) {
    lines.push("");
    lines.push("=".repeat(67));
    lines.push("AMOUNT PAID:".padStart(47) + formatCurrency(invoice.total).padStart(20));
    lines.push("BALANCE DUE:".padStart(47) + formatCurrency(0).padStart(20));
  }
  
  lines.push("");
  
  // Notes
  if (invoice.notes) {
    lines.push("-".repeat(60));
    lines.push("NOTES:");
    lines.push(invoice.notes);
  }
  
  lines.push("");
  lines.push("-".repeat(60));
  lines.push("");
  
  if (isPaid) {
    lines.push("PAYMENT RECEIVED - THANK YOU!");
  } else {
    lines.push("PAYMENT INFORMATION:");
    lines.push("");
    lines.push(`Please make checks payable to: ${COMPANY_INFO.legalName}`);
    lines.push("");
    lines.push("Mail to:");
    lines.push(`  ${COMPANY_INFO.address.street} ${COMPANY_INFO.address.suite}`);
    lines.push(`  ${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.state} ${COMPANY_INFO.address.zip}`);
    lines.push("");
    lines.push(`For questions, contact us at ${COMPANY_INFO.email} or ${COMPANY_INFO.phone}`);
  }
  lines.push("");
  lines.push("Thank you for your business!");
  
  const content = lines.join("\n");
  
  // Create a simple PDF structure
  const pdf = createSimplePdf(content, isPaid);
  return pdf;
}

function createSimplePdf(textContent: string, isPaid: boolean = false): Uint8Array {
  const lines = textContent.split("\n");
  
  // PDF structure
  let pdf = "%PDF-1.4\n";
  let objects: string[] = [];
  let offsets: number[] = [];
  
  // Object 1: Catalog
  offsets.push(pdf.length);
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  
  // Object 2: Pages
  offsets.push(pdf.length + objects.join("").length);
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  
  // Object 3: Page - with extended graphics state for transparency
  offsets.push(pdf.length + objects.join("").length);
  objects.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /ExtGState << /GS1 7 0 R >> >> >>\nendobj\n");
  
  // Object 5: Courier Font
  const fontObj = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";
  
  // Object 6: Helvetica Bold Font for PAID stamp
  const boldFontObj = "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  
  // Object 7: Graphics state for transparency
  const gsObj = "7 0 obj\n<< /Type /ExtGState /CA 0.3 /ca 0.3 >>\nendobj\n";
  
  // Build content stream
  let contentStream = "BT\n/F1 9 Tf\n";
  let yPos = 750;
  const lineHeight = 11;
  const leftMargin = 50;
  
  for (const line of lines) {
    if (yPos < 50) {
      // Would need multi-page support for long invoices
      break;
    }
    // Escape special characters for PDF
    const escapedLine = line
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
    contentStream += `1 0 0 1 ${leftMargin} ${yPos} Tm\n(${escapedLine}) Tj\n`;
    yPos -= lineHeight;
  }
  contentStream += "ET\n";
  
  // Add diagonal PAID watermark if paid
  if (isPaid) {
    contentStream += "q\n"; // Save graphics state
    contentStream += "/GS1 gs\n"; // Apply transparency
    contentStream += "0 0.5 0 rg\n"; // Green color
    contentStream += "BT\n";
    contentStream += "/F2 72 Tf\n"; // Large bold font
    // Rotate 45 degrees and position in center
    contentStream += "0.707 0.707 -0.707 0.707 200 350 Tm\n";
    contentStream += "(PAID) Tj\n";
    contentStream += "ET\n";
    contentStream += "Q\n"; // Restore graphics state
  }
  
  // Object 4: Content stream
  offsets.push(pdf.length + objects.join("").length);
  objects.push(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);
  
  // Add font objects
  offsets.push(pdf.length + objects.join("").length);
  objects.push(fontObj);
  
  offsets.push(pdf.length + objects.join("").length);
  objects.push(boldFontObj);
  
  // Add graphics state object
  offsets.push(pdf.length + objects.join("").length);
  objects.push(gsObj);
  
  // Recalculate offsets
  let currentOffset = pdf.length;
  const finalOffsets: number[] = [];
  for (const obj of objects) {
    finalOffsets.push(currentOffset);
    currentOffset += obj.length;
  }
  
  // Build final PDF
  pdf += objects.join("");
  
  // Cross-reference table
  const xrefOffset = pdf.length;
  pdf += "xref\n";
  pdf += `0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of finalOffsets) {
    pdf += offset.toString().padStart(10, "0") + " 00000 n \n";
  }
  
  // Trailer
  pdf += "trailer\n";
  pdf += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += "startxref\n";
  pdf += `${xrefOffset}\n`;
  pdf += "%%EOF";
  
  return new TextEncoder().encode(pdf);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    console.log(`Generating PDF for invoice: ${invoiceId}`);

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
    invoice.invoice_items.sort((a: any, b: any) => a.sort_order - b.sort_order);

    // Generate PDF
    const pdfBytes = generatePdfContent(invoice as InvoiceData);
    
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

    console.log(`PDF generated successfully: ${filePath}`);

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
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
