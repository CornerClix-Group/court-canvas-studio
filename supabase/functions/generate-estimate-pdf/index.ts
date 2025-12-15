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
  phone: "(706) 309-1993",
  email: "estimates@courtproaugusta.com",
  website: "courtproaugusta.com",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EstimateItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit: string | null;
}

interface EstimateData {
  estimate_number: string;
  created_at: string;
  valid_until: string | null;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  notes: string | null;
  status: string;
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
  estimate_items: EstimateItem[];
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

// Generate PDF content
function generatePdfContent(estimate: EstimateData): Uint8Array {
  const customer = estimate.customers;
  const isApproved = estimate.status === "approved";
  
  // Build content lines
  const lines: string[] = [];
  
  // Add APPROVED stamp at the top if approved
  if (isApproved) {
    lines.push("");
    lines.push("*".repeat(60));
    lines.push("*" + " ".repeat(18) + "*** APPROVED ***" + " ".repeat(18) + "*");
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
  lines.push(`ESTIMATE ${estimate.estimate_number}`);
  lines.push("");
  lines.push(`Date: ${formatDate(estimate.created_at)}`);
  if (estimate.valid_until) {
    lines.push(`Valid Until: ${formatDate(estimate.valid_until)}`);
  }
  lines.push(`Status: ${estimate.status.toUpperCase()}`);
  lines.push("");
  lines.push("-".repeat(60));
  lines.push("");
  
  // Prepared For
  lines.push("PREPARED FOR:");
  if (customer) {
    if (customer.company_name) lines.push(customer.company_name);
    lines.push(customer.contact_name);
    if (customer.address) lines.push(customer.address);
    if (customer.city || customer.state || customer.zip) {
      lines.push(`${customer.city || ""}, ${customer.state || ""} ${customer.zip || ""}`.trim());
    }
    if (customer.email) lines.push(customer.email);
    if (customer.phone) lines.push(customer.phone);
  } else {
    lines.push("(No customer specified)");
  }
  lines.push("");
  lines.push("-".repeat(60));
  lines.push("");
  
  // Line items header
  lines.push("DESCRIPTION".padEnd(35) + "QTY".padStart(8) + "PRICE".padStart(12) + "TOTAL".padStart(12));
  lines.push("-".repeat(67));
  
  // Line items
  for (const item of estimate.estimate_items) {
    const desc = item.description.substring(0, 34).padEnd(35);
    const qty = item.quantity.toString().padStart(8);
    const price = formatCurrency(item.unit_price).padStart(12);
    const total = formatCurrency(item.total).padStart(12);
    lines.push(`${desc}${qty}${price}${total}`);
  }
  
  lines.push("-".repeat(67));
  lines.push("");
  
  // Totals
  lines.push("SUBTOTAL:".padStart(47) + formatCurrency(estimate.subtotal).padStart(20));
  if (estimate.tax_rate && estimate.tax_amount) {
    lines.push(`TAX (${estimate.tax_rate}%):`.padStart(47) + formatCurrency(estimate.tax_amount).padStart(20));
  }
  lines.push("=".repeat(67));
  lines.push("ESTIMATED TOTAL:".padStart(47) + formatCurrency(estimate.total).padStart(20));
  
  lines.push("");
  
  // Notes
  if (estimate.notes) {
    lines.push("-".repeat(60));
    lines.push("PROJECT NOTES:");
    lines.push(estimate.notes);
  }
  
  lines.push("");
  lines.push("-".repeat(60));
  lines.push("");
  
  // Terms
  lines.push("TERMS & CONDITIONS:");
  lines.push("");
  lines.push("1. This estimate is valid for 30 days from the date above.");
  lines.push("2. A 50% deposit is required to schedule the project.");
  lines.push("3. Final payment is due upon completion.");
  lines.push("4. Pricing is subject to site inspection and conditions.");
  lines.push("");
  lines.push("-".repeat(60));
  lines.push("");
  lines.push("TO ACCEPT THIS ESTIMATE:");
  lines.push("");
  lines.push(`Contact us at ${COMPANY_INFO.email} or ${COMPANY_INFO.phone}`);
  lines.push("");
  lines.push("Thank you for considering CourtPro Augusta!");
  
  const content = lines.join("\n");
  
  // Create PDF
  const pdf = createSimplePdf(content, isApproved);
  return pdf;
}

function createSimplePdf(textContent: string, isApproved: boolean = false): Uint8Array {
  const lines = textContent.split("\n");
  
  // PDF structure
  let pdf = "%PDF-1.4\n";
  let objects: string[] = [];
  
  // Object 1: Catalog
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  
  // Object 2: Pages
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  
  // Object 3: Page - with extended graphics state for transparency
  objects.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /ExtGState << /GS1 7 0 R >> >> >>\nendobj\n");
  
  // Object 5: Courier Font
  const fontObj = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";
  
  // Object 6: Helvetica Bold Font for stamp
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
  
  // Add diagonal APPROVED watermark if approved
  if (isApproved) {
    contentStream += "q\n"; // Save graphics state
    contentStream += "/GS1 gs\n"; // Apply transparency
    contentStream += "0 0.5 0 rg\n"; // Green color
    contentStream += "BT\n";
    contentStream += "/F2 60 Tf\n"; // Large bold font
    // Rotate 45 degrees and position in center
    contentStream += "0.707 0.707 -0.707 0.707 180 350 Tm\n";
    contentStream += "(APPROVED) Tj\n";
    contentStream += "ET\n";
    contentStream += "Q\n"; // Restore graphics state
  }
  
  // Object 4: Content stream
  objects.push(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);
  
  // Add font objects
  objects.push(fontObj);
  objects.push(boldFontObj);
  
  // Add graphics state object
  objects.push(gsObj);
  
  // Calculate offsets
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

    const { estimateId } = await req.json();

    if (!estimateId) {
      throw new Error("Estimate ID is required");
    }

    console.log(`Generating PDF for estimate: ${estimateId}`);

    // Fetch estimate with customer and items
    const { data: estimate, error: fetchError } = await supabase
      .from("estimates")
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
        estimate_items (
          description,
          quantity,
          unit_price,
          total,
          unit,
          sort_order
        )
      `)
      .eq("id", estimateId)
      .single();

    if (fetchError) {
      console.error("Error fetching estimate:", fetchError);
      throw new Error(`Failed to fetch estimate: ${fetchError.message}`);
    }

    if (!estimate) {
      throw new Error("Estimate not found");
    }

    // Sort items by sort_order
    estimate.estimate_items.sort((a: any, b: any) => a.sort_order - b.sort_order);

    // Generate PDF
    const pdfBytes = generatePdfContent(estimate as EstimateData);
    
    // Return PDF directly as base64 (estimates don't need storage)
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));
    
    console.log(`PDF generated successfully for estimate: ${estimate.estimate_number}`);

    return new Response(
      JSON.stringify({
        success: true,
        pdf: base64Pdf,
        fileName: `${estimate.estimate_number}.pdf`,
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