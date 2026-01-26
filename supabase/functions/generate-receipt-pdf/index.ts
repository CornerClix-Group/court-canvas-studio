import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  email: "receipts@courtproaugusta.com",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentData {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  payment_type: string;
  description: string | null;
  invoices?: {
    invoice_number: string;
    total: number;
    amount_paid: number | null;
  } | null;
  customers?: {
    contact_name: string;
    company_name: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  } | null;
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

const formatPaymentMethod = (method: string | null): string => {
  if (!method) return "Other";
  const methods: Record<string, string> = {
    check: "Check",
    bank_transfer: "Bank Transfer",
    credit_card: "Credit Card",
    cash: "Cash",
    ach: "ACH",
    wire: "Wire Transfer",
    other: "Other",
  };
  return methods[method] || method;
};

const formatPaymentType = (type: string | null): string => {
  if (!type) return "Payment";
  const types: Record<string, string> = {
    invoice_payment: "Invoice Payment",
    deposit: "Deposit",
    prepayment: "Prepayment",
    miscellaneous: "Miscellaneous Payment",
  };
  return types[type] || type;
};

function generateReceiptPdfContent(payment: PaymentData): Uint8Array {
  const receiptNumber = `RCP-${payment.id.substring(0, 8).toUpperCase()}`;
  const customer = payment.invoices ? null : payment.customers;
  const invoiceCustomer = payment.invoices ? payment.customers : null;
  const effectiveCustomer = invoiceCustomer || customer;
  
  const lines: string[] = [];
  
  // Header with payment received stamp
  lines.push("");
  lines.push("*".repeat(60));
  lines.push("*" + " ".repeat(16) + "*** PAYMENT RECEIVED ***" + " ".repeat(16) + "*");
  lines.push("*".repeat(60));
  lines.push("");
  
  // Company header
  lines.push(COMPANY_INFO.displayName);
  lines.push(COMPANY_INFO.address.street + " " + COMPANY_INFO.address.suite);
  lines.push(`${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.state} ${COMPANY_INFO.address.zip}`);
  lines.push("");
  lines.push(`Phone: ${COMPANY_INFO.phone}`);
  lines.push(`Email: ${COMPANY_INFO.email}`);
  lines.push("");
  lines.push("=".repeat(60));
  lines.push("");
  lines.push(`RECEIPT ${receiptNumber}`);
  lines.push("");
  lines.push(`Date: ${formatDate(payment.payment_date)}`);
  lines.push(`Type: ${formatPaymentType(payment.payment_type)}`);
  lines.push("");
  lines.push("-".repeat(60));
  lines.push("");
  
  // Customer info
  lines.push("RECEIVED FROM:");
  if (effectiveCustomer) {
    if (effectiveCustomer.company_name) lines.push(effectiveCustomer.company_name);
    lines.push(effectiveCustomer.contact_name);
    if (effectiveCustomer.address) lines.push(effectiveCustomer.address);
    if (effectiveCustomer.city || effectiveCustomer.state || effectiveCustomer.zip) {
      lines.push(`${effectiveCustomer.city || ""}, ${effectiveCustomer.state || ""} ${effectiveCustomer.zip || ""}`.trim());
    }
    if (effectiveCustomer.email) lines.push(effectiveCustomer.email);
  } else {
    lines.push("Customer information not available");
  }
  lines.push("");
  lines.push("-".repeat(60));
  lines.push("");
  
  // Payment details
  lines.push("PAYMENT DETAILS:");
  lines.push("");
  lines.push(`  Payment Method:  ${formatPaymentMethod(payment.payment_method)}`);
  if (payment.reference_number) {
    lines.push(`  Reference #:     ${payment.reference_number}`);
  }
  lines.push("");
  lines.push("  " + "=".repeat(40));
  lines.push(`  AMOUNT RECEIVED: ${formatCurrency(payment.amount).padStart(20)}`);
  lines.push("  " + "=".repeat(40));
  lines.push("");
  
  // Invoice details if applicable
  if (payment.invoices) {
    lines.push("-".repeat(60));
    lines.push("");
    lines.push("APPLIED TO INVOICE:");
    lines.push("");
    lines.push(`  Invoice Number:    ${payment.invoices.invoice_number}`);
    lines.push(`  Invoice Total:     ${formatCurrency(payment.invoices.total)}`);
    lines.push(`  Total Paid:        ${formatCurrency(payment.invoices.amount_paid || 0)}`);
    const remaining = payment.invoices.total - (payment.invoices.amount_paid || 0);
    lines.push(`  Remaining Balance: ${remaining <= 0 ? 'PAID IN FULL' : formatCurrency(remaining)}`);
    lines.push("");
  }
  
  // Description if present
  if (payment.description) {
    lines.push("-".repeat(60));
    lines.push("");
    lines.push("DESCRIPTION:");
    lines.push(payment.description);
    lines.push("");
  }
  
  lines.push("-".repeat(60));
  lines.push("");
  lines.push("Thank you for your payment!");
  lines.push("");
  lines.push(`For questions, contact us at ${COMPANY_INFO.email} or ${COMPANY_INFO.phone}`);
  
  const content = lines.join("\n");
  return createSimplePdf(content);
}

function createSimplePdf(textContent: string): Uint8Array {
  const lines = textContent.split("\n");
  
  let pdf = "%PDF-1.4\n";
  let objects: string[] = [];
  
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /ExtGState << /GS1 7 0 R >> >> >>\nendobj\n");
  
  const fontObj = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n";
  const boldFontObj = "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  const gsObj = "7 0 obj\n<< /Type /ExtGState /CA 0.35 /ca 0.35 >>\nendobj\n";
  
  let contentStream = "BT\n/F1 9 Tf\n";
  let yPos = 750;
  const lineHeight = 11;
  const leftMargin = 50;
  
  for (const line of lines) {
    if (yPos < 50) break;
    const escapedLine = line
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
    contentStream += `1 0 0 1 ${leftMargin} ${yPos} Tm\n(${escapedLine}) Tj\n`;
    yPos -= lineHeight;
  }
  contentStream += "ET\n";
  
  // Add diagonal "PAID" watermark
  contentStream += "q\n";
  contentStream += "/GS1 gs\n";
  contentStream += "0.75 0.92 0.75 rg\n";  // Light green (matches invoice style)
  contentStream += "BT\n";
  contentStream += "/F2 65 Tf\n";  // Match invoice font size
  contentStream += "0.707 0.707 -0.707 0.707 150 320 Tm\n";  // Adjusted position
  contentStream += "(PAID) Tj\n";
  contentStream += "ET\n";
  contentStream += "Q\n";
  
  objects.push(`4 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`);
  objects.push(fontObj);
  objects.push(boldFontObj);
  objects.push(gsObj);
  
  let currentOffset = pdf.length;
  const finalOffsets: number[] = [];
  for (const obj of objects) {
    finalOffsets.push(currentOffset);
    currentOffset += obj.length;
  }
  
  pdf += objects.join("");
  
  const xrefOffset = pdf.length;
  pdf += "xref\n";
  pdf += `0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of finalOffsets) {
    pdf += offset.toString().padStart(10, "0") + " 00000 n \n";
  }
  
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

    const { paymentId } = await req.json();

    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    console.log(`Generating receipt PDF for payment: ${paymentId}`);

    // Fetch payment with related data
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select(`
        *,
        invoices (
          invoice_number,
          total,
          amount_paid,
          customers (
            contact_name,
            company_name,
            email,
            address,
            city,
            state,
            zip
          )
        ),
        customers (
          contact_name,
          company_name,
          email,
          address,
          city,
          state,
          zip
        )
      `)
      .eq("id", paymentId)
      .single();

    if (fetchError) {
      console.error("Error fetching payment:", fetchError);
      throw new Error(`Failed to fetch payment: ${fetchError.message}`);
    }

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Transform data
    const paymentData: PaymentData = {
      ...payment,
      invoices: payment.invoices || null,
      customers: payment.invoices?.customers || payment.customers || null,
    };

    // Generate PDF
    const pdfBytes = generateReceiptPdfContent(paymentData);
    
    // Upload to Supabase Storage
    const receiptNumber = `RCP-${payment.id.substring(0, 8).toUpperCase()}`;
    const fileName = `${receiptNumber}.pdf`;
    const filePath = `${paymentId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
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
      .from("receipts")
      .createSignedUrl(filePath, 3600);

    if (urlError) {
      console.error("Error creating signed URL:", urlError);
      throw new Error(`Failed to create download URL: ${urlError.message}`);
    }

    console.log(`Receipt PDF generated successfully: ${filePath}`);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: urlData.signedUrl,
        filePath,
        receiptNumber,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating receipt PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
