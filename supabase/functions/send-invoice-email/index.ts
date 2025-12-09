import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  notes: string | null;
  due_date: string | null;
  status: string;
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

const generateInvoiceHTML = (invoice: Invoice, lineItems: LineItem[]): string => {
  const customer = invoice.customers;
  
  const lineItemsHTML = lineItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity} ${item.unit || ''}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unit_price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

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
              <p style="margin: 8px 0 0 0; opacity: 0.9;">Premium Sports Court Construction</p>
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
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827;">${customer?.contact_name || 'Customer'}</p>
              ${customer?.company_name ? `<p style="margin: 4px 0 0 0; color: #6b7280;">${customer.company_name}</p>` : ''}
              ${customer?.address ? `<p style="margin: 4px 0 0 0; color: #6b7280;">${customer.address}</p>` : ''}
              ${customer?.city || customer?.state || customer?.zip ? `<p style="margin: 4px 0 0 0; color: #6b7280;">${[customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</p>` : ''}
              ${customer?.email ? `<p style="margin: 4px 0 0 0; color: #6b7280;">${customer.email}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="margin-bottom: 16px;">
                <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Due Date</p>
                <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">${formatDate(invoice.due_date)}</p>
              </div>
              <div style="background: #fef3c7; padding: 16px 24px; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount Due</p>
                <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold; color: #92400e;">${formatCurrency(invoice.total)}</p>
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
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding: 16px 0; background: #f9fafb; margin-top: 8px; border-radius: 8px; padding-left: 12px; padding-right: 12px;">
                <span style="font-weight: bold; font-size: 18px;">Total Due</span>
                <span style="font-weight: bold; font-size: 18px; color: #0369a1;">${formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          ${invoice.notes ? `
          <!-- Notes -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 12px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Notes</h3>
            <p style="margin: 0; color: #4b5563; white-space: pre-line;">${invoice.notes}</p>
          </div>
          ` : ''}

          <!-- Payment Instructions -->
          <div style="margin-top: 40px; padding: 24px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #0369a1;">
            <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 14px; font-weight: bold;">Payment Instructions</h3>
            <p style="margin: 0; color: #4b5563; font-size: 14px;">
              Please make payment via check or bank transfer to:<br><br>
              <strong>CourtPro Augusta</strong><br>
              Bank: Mercury Bank<br>
              Please reference invoice number <strong>${invoice.invoice_number}</strong> with your payment.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">CourtPro Augusta | Augusta, GA</p>
          <p style="margin: 8px 0 0 0;">Thank you for your business!</p>
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

    console.log("Generating invoice email for:", customerEmail);

    const invoiceHTML = generateInvoiceHTML(invoice as Invoice, lineItems || []);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "CourtPro Augusta <onboarding@resend.dev>",
      to: [customerEmail],
      cc: ["estimates@courtproaugusta.com"],
      subject: `Invoice ${invoice.invoice_number} from CourtPro Augusta`,
      html: invoiceHTML,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update invoice status to sent
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("Error updating invoice status:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invoice sent successfully" }),
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
