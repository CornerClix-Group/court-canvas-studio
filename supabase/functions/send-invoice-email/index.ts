import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  email: "billing@courtproaugusta.com",
  website: "courtproaugusta.com",
};

const CONVENIENCE_FEE_PERCENT = 0.03;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  invoiceId: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total: number;
}

interface Customer {
  contact_name: string;
  company_name: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  amount_paid: number | null;
  notes: string | null;
  due_date: string | null;
  status: string;
  payment_link_token: string | null;
  customers: Customer | null;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "Upon Receipt";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Generate a secure payment link token
const generatePaymentToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
};

const generateInvoiceHTML = (invoice: Invoice, lineItems: LineItem[], paymentUrl: string): string => {
  const customer = invoice.customers;
  const amountDue = Number(invoice.total) - Number(invoice.amount_paid || 0);
  const convenienceFee = amountDue * CONVENIENCE_FEE_PERCENT;
  const totalWithFee = amountDue + convenienceFee;
  
  const lineItemsHTML = lineItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} ${item.unit || ""}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%); color: white; padding: 40px; border-radius: 12px 12px 0 0;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="margin: 0; font-size: 32px; font-weight: bold;">CourtPro Augusta</h1>
              <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">${COMPANY_INFO.displayName}</p>
              <p style="margin: 4px 0 0 0; opacity: 0.8; font-size: 12px;">${COMPANY_INFO.address.full}</p>
              <p style="margin: 4px 0 0 0; opacity: 0.8; font-size: 12px;">${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 24px; font-weight: bold;">INVOICE</p>
              <p style="margin: 8px 0 0 0; font-family: monospace; font-size: 18px;">${invoice.invoice_number}</p>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Bill To & Invoice Details -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div>
              <h3 style="margin: 0 0 12px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Bill To</h3>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827;">${customer?.contact_name || "Customer"}</p>
              ${customer?.company_name ? `<p style="margin: 4px 0 0 0; color: #6b7280;">${customer.company_name}</p>` : ""}
              ${customer?.address ? `<p style="margin: 4px 0 0 0; color: #6b7280;">${customer.address}</p>` : ""}
              ${customer?.city || customer?.state || customer?.zip ? `<p style="margin: 4px 0 0 0; color: #6b7280;">${[customer.city, customer.state, customer.zip].filter(Boolean).join(", ")}</p>` : ""}
              ${customer?.email ? `<p style="margin: 4px 0 0 0; color: #6b7280;">${customer.email}</p>` : ""}
            </div>
            <div style="text-align: right;">
              <div style="margin-bottom: 16px;">
                <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Due Date</p>
                <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">${formatDate(invoice.due_date)}</p>
              </div>
              <div style="background: #fef3c7; padding: 16px 24px; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount Due</p>
                <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold; color: #92400e;">${formatCurrency(amountDue)}</p>
              </div>
            </div>
          </div>

          <!-- Line Items -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Description</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Rate</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHTML}
            </tbody>
          </table>

          <!-- Totals -->
          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 300px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280;">Subtotal</span>
                <span style="font-weight: 500;">${formatCurrency(invoice.subtotal)}</span>
              </div>
              ${invoice.tax_rate && invoice.tax_rate > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280;">Tax (${invoice.tax_rate}%)</span>
                <span style="font-weight: 500;">${formatCurrency(invoice.tax_amount || 0)}</span>
              </div>
              ` : ""}
              <div style="display: flex; justify-content: space-between; padding: 16px 0; background: #f9fafb; margin-top: 8px; border-radius: 8px; padding-left: 12px; padding-right: 12px;">
                <span style="font-weight: bold; font-size: 18px;">Total Due</span>
                <span style="font-weight: bold; font-size: 18px; color: #0369a1;">${formatCurrency(amountDue)}</span>
              </div>
            </div>
          </div>
          
          <!-- Flexible Payment Options Banner -->
          <div style="margin-top: 24px; background: linear-gradient(135deg, #059669 0%, #0891b2 100%); padding: 20px; border-radius: 12px; text-align: center;">
            <h3 style="margin: 0 0 8px 0; color: white; font-size: 18px; font-weight: bold;">💳 Flexible Payment Options</h3>
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">
              Finance with Klarna - Pay in 4 or spread over time
            </p>
            <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">
              Also accepting Apple Pay, Cash App, Amazon Pay & cards
            </p>
          </div>

          ${invoice.notes ? `
          <!-- Notes -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 12px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Notes</h3>
            <p style="margin: 0; color: #4b5563; white-space: pre-line;">${invoice.notes}</p>
          </div>
          ` : ""}

          <!-- Payment Options -->
          <div style="margin-top: 40px; background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px; border-radius: 12px; text-align: center;">
            <h3 style="margin: 0 0 8px 0; color: white; font-size: 20px; font-weight: bold;">Pay Online</h3>
            <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.9); font-size: 14px;">
              Quick and secure payment with credit card or financing options
            </p>
            <a href="${paymentUrl}" style="display: inline-block; background: white; color: #059669; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              💳 Pay ${formatCurrency(totalWithFee)} Now
            </a>
            <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.8); font-size: 12px;">
              Includes 3% convenience fee (${formatCurrency(convenienceFee)}) • Finance with Klarna or pay with Apple Pay, Cash App & more
            </p>
          </div>

          <!-- Or Pay by Check -->
          <div style="margin-top: 24px; padding: 24px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0369a1;">
            <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 14px; font-weight: bold;">Or Pay by Check (No Fee)</h3>
            <p style="margin: 0; color: #4b5563; font-size: 14px;">
              Pay <strong>${formatCurrency(amountDue)}</strong> by check (no convenience fee).<br><br>
              Make checks payable to:<br>
              <strong>${COMPANY_INFO.legalName}</strong><br><br>
              Mail to:<br>
              <strong>${COMPANY_INFO.address.street} ${COMPANY_INFO.address.suite}</strong><br>
              <strong>${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.state} ${COMPANY_INFO.address.zip}</strong><br><br>
              Please reference invoice number <strong>${invoice.invoice_number}</strong> with your payment.
            </p>
          </div>

          <!-- Questions -->
          <div style="margin-top: 24px; text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Questions? Contact us at <strong>${COMPANY_INFO.email}</strong> or <strong>${COMPANY_INFO.phone}</strong>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">${COMPANY_INFO.displayName}</p>
          <p style="margin: 4px 0 0 0;">${COMPANY_INFO.address.full}</p>
          <p style="margin: 4px 0 0 0;">${COMPANY_INFO.phone} | ${COMPANY_INFO.website}</p>
          <p style="margin: 12px 0 0 0;">Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { invoiceId }: InvoiceEmailRequest = await req.json();
    
    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    console.log("Fetching invoice:", invoiceId);

    // Fetch invoice with customer
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
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
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error("Error fetching invoice:", invoiceError);
      throw new Error("Invoice not found");
    }

    // Fetch line items
    const { data: lineItems, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("sort_order");

    if (itemsError) {
      console.error("Error fetching line items:", itemsError);
      throw new Error("Failed to fetch line items");
    }

    const customerEmail = invoice.customers?.email;
    if (!customerEmail) {
      throw new Error("Customer email is required to send invoice");
    }

    // Generate or use existing payment link token
    let paymentToken = invoice.payment_link_token;
    if (!paymentToken) {
      paymentToken = generatePaymentToken();
      
      // Save the payment token to the invoice
      const { error: tokenError } = await supabase
        .from("invoices")
        .update({
          payment_link_token: paymentToken,
          payment_link_created_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (tokenError) {
        console.error("Error saving payment token:", tokenError);
        throw new Error("Failed to generate payment link");
      }
      console.log("Generated new payment token for invoice");
    }

    const paymentUrl = `https://courtproaugusta.lovable.app/pay/${paymentToken}`;
    console.log("Payment URL:", paymentUrl);

    console.log("Generating invoice email for:", customerEmail);

    const invoiceHTML = generateInvoiceHTML(invoice as Invoice, lineItems || [], paymentUrl);

    const emailSubject = `Invoice ${invoice.invoice_number} from ${COMPANY_INFO.displayName}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "CourtPro Augusta <billing@courtproaugusta.com>",
      to: [customerEmail],
      cc: [COMPANY_INFO.email],
      subject: emailSubject,
      html: invoiceHTML,
    });

    console.log("Email sent successfully:", emailResponse);

    const resendEmailId = emailResponse.data?.id;

    // Log email to email_logs table
    if (resendEmailId) {
      const { error: logError } = await supabase
        .from("email_logs")
        .insert({
          resend_email_id: resendEmailId,
          email_type: "invoice",
          related_id: invoiceId,
          recipient_email: customerEmail,
          subject: emailSubject,
          status: "sent",
        });

      if (logError) {
        console.error("Error logging email:", logError);
      } else {
        console.log("Email logged with ID:", resendEmailId);
      }
    }

    // Update invoice status to sent
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: invoice.status === "draft" ? "sent" : invoice.status,
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Error updating invoice status:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invoice sent successfully", emailId: resendEmailId, paymentUrl }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
