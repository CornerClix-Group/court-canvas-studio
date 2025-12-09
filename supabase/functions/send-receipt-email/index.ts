import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const COMPANY_INFO = {
  name: "CourtHaus Construction, LLC dba CourtPro Augusta",
  address: "3651 Walton Way Extension",
  cityStateZip: "Augusta, GA 30909",
  phone: "(762) 123-4567",
  email: "accounts@courtproaugusta.com",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  invoice_id: string | null;
  customer_id: string | null;
  payment_type: string;
  description: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  amount_paid: number | null;
  customer_id: string | null;
}

interface Customer {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPaymentMethod(method: string | null): string {
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
}

function formatPaymentType(type: string | null): string {
  if (!type) return "Payment";
  const types: Record<string, string> = {
    invoice_payment: "Invoice Payment",
    deposit: "Deposit",
    prepayment: "Prepayment",
    miscellaneous: "Miscellaneous Payment",
  };
  return types[type] || type;
}

function generateReceiptHTML(
  payment: Payment,
  invoice: Invoice,
  customer: Customer
): string {
  const receiptNumber = `RCP-${payment.id.substring(0, 8).toUpperCase()}`;
  const remainingBalance = invoice.total - (invoice.amount_paid || 0);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt ${receiptNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="background-color: #10b981; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Payment Receipt</h1>
                  <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">${receiptNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px 20px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 18px; color: #333333;">
                    Thank you for your payment, <strong>${customer.contact_name}</strong>!
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666666;">
                    We have received your payment of <strong style="color: #10b981; font-size: 16px;">${formatCurrency(payment.amount)}</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td>
                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Payment Details</h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Date</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatDate(payment.payment_date)}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Method</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatPaymentMethod(payment.payment_method)}</td>
                          </tr>
                          ${payment.reference_number ? `
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Reference Number</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${payment.reference_number}</td>
                          </tr>
                          ` : ""}
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Amount Paid</td>
                            <td style="color: #10b981; font-size: 16px; font-weight: 600; text-align: right;">${formatCurrency(payment.amount)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 0 40px 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td>
                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Invoice Information</h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Invoice Number</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${invoice.invoice_number}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Invoice Total</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatCurrency(invoice.total)}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Total Paid to Date</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatCurrency(invoice.amount_paid || 0)}</td>
                          </tr>
                          <tr style="border-top: 1px solid #e5e7eb;">
                            <td style="color: #666666; font-size: 14px; padding-top: 12px;">Remaining Balance</td>
                            <td style="color: ${remainingBalance > 0 ? '#f59e0b' : '#10b981'}; font-size: 16px; font-weight: 600; text-align: right; padding-top: 12px;">
                              ${remainingBalance <= 0 ? 'PAID IN FULL' : formatCurrency(remainingBalance)}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #333333;">${COMPANY_INFO.name}</p>
                        <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">${COMPANY_INFO.address}</p>
                        <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">${COMPANY_INFO.cityStateZip}</p>
                        <p style="margin: 0; font-size: 13px; color: #666666;">${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; text-align: center; background-color: #ffffff;">
                  <p style="margin: 0; font-size: 12px; color: #999999;">
                    This is an automated receipt for your records. If you have any questions about this payment, please contact us.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function generateStandaloneReceiptHTML(
  payment: Payment,
  customer: Customer
): string {
  const receiptNumber = `RCP-${payment.id.substring(0, 8).toUpperCase()}`;
  const paymentTypeLabel = formatPaymentType(payment.payment_type);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${paymentTypeLabel} Receipt ${receiptNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="background-color: #3b82f6; padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">${paymentTypeLabel} Receipt</h1>
                  <p style="margin: 10px 0 0 0; color: #bfdbfe; font-size: 14px;">${receiptNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px 20px 40px; text-align: center;">
                  <p style="margin: 0; font-size: 18px; color: #333333;">
                    Thank you for your ${paymentTypeLabel.toLowerCase()}, <strong>${customer.contact_name}</strong>!
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666666;">
                    We have received your ${paymentTypeLabel.toLowerCase()} of <strong style="color: #3b82f6; font-size: 16px;">${formatCurrency(payment.amount)}</strong>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td>
                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Payment Details</h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Type</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${paymentTypeLabel}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Date</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatDate(payment.payment_date)}</td>
                          </tr>
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Payment Method</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${formatPaymentMethod(payment.payment_method)}</td>
                          </tr>
                          ${payment.reference_number ? `
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Reference Number</td>
                            <td style="color: #333333; font-size: 14px; font-weight: 500; text-align: right;">${payment.reference_number}</td>
                          </tr>
                          ` : ""}
                          <tr>
                            <td style="color: #666666; font-size: 14px;">Amount Received</td>
                            <td style="color: #3b82f6; font-size: 16px; font-weight: 600; text-align: right;">${formatCurrency(payment.amount)}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${payment.description ? `
              <tr>
                <td style="padding: 0 40px 20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td>
                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Description</h3>
                        <p style="margin: 0; font-size: 14px; color: #333333;">${payment.description}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 0 40px 20px 40px;">
                  <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px 20px; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 14px; color: #1e40af;">
                      This ${paymentTypeLabel.toLowerCase()} will be applied to your account. If you have any questions, please don't hesitate to contact us.
                    </p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: 600; color: #333333;">${COMPANY_INFO.name}</p>
                        <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">${COMPANY_INFO.address}</p>
                        <p style="margin: 0 0 5px 0; font-size: 13px; color: #666666;">${COMPANY_INFO.cityStateZip}</p>
                        <p style="margin: 0; font-size: 13px; color: #666666;">${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; text-align: center; background-color: #ffffff;">
                  <p style="margin: 0; font-size: 12px; color: #999999;">
                    This is an automated receipt for your records. If you have any questions about this payment, please contact us.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { paymentId } = await req.json();

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: "Payment ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching payment data for ID:", paymentId);

    // Fetch payment
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      console.error("Error fetching payment:", paymentError);
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Payment found:", { id: payment.id, invoice_id: payment.invoice_id, customer_id: payment.customer_id, payment_type: payment.payment_type });

    let customer: Customer;
    let invoice: Invoice | null = null;
    let html: string;
    let subject: string;
    const receiptNumber = `RCP-${payment.id.substring(0, 8).toUpperCase()}`;

    // Determine if this is an invoice-linked or standalone payment
    if (payment.invoice_id) {
      // Invoice-linked payment
      console.log("Processing invoice-linked payment");
      
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", payment.invoice_id)
        .single();

      if (invoiceError || !invoiceData) {
        console.error("Error fetching invoice:", invoiceError);
        return new Response(
          JSON.stringify({ error: "Invoice not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      invoice = invoiceData;

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", invoiceData.customer_id)
        .single();

      if (customerError || !customerData) {
        console.error("Error fetching customer:", customerError);
        return new Response(
          JSON.stringify({ error: "Customer not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      customer = customerData;
      html = generateReceiptHTML(payment as Payment, invoice!, customer);
      subject = `Payment Receipt ${receiptNumber} - ${COMPANY_INFO.name}`;
      
    } else if (payment.customer_id) {
      // Standalone payment (deposit, prepayment, miscellaneous)
      console.log("Processing standalone payment");
      
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", payment.customer_id)
        .single();

      if (customerError || !customerData) {
        console.error("Error fetching customer:", customerError);
        return new Response(
          JSON.stringify({ error: "Customer not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      customer = customerData;
      const paymentTypeLabel = formatPaymentType(payment.payment_type);
      html = generateStandaloneReceiptHTML(payment as Payment, customer);
      subject = `${paymentTypeLabel} Receipt ${receiptNumber} - ${COMPANY_INFO.name}`;
      
    } else {
      return new Response(
        JSON.stringify({ error: "Payment has no associated invoice or customer" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customer.email) {
      return new Response(
        JSON.stringify({ error: "Customer does not have an email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating receipt email for customer:", customer.email);

    const emailResponse = await resend.emails.send({
      from: `${COMPANY_INFO.name} <onboarding@resend.dev>`,
      to: [customer.email],
      subject,
      html,
    });

    console.log("Receipt email sent successfully:", emailResponse);

    // Update payment with receipt_sent_at timestamp
    const { error: updateError } = await supabase
      .from("payments")
      .update({ receipt_sent_at: new Date().toISOString() })
      .eq("id", paymentId);

    if (updateError) {
      console.error("Error updating receipt_sent_at:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Receipt email sent successfully",
        receiptNumber,
        emailId: emailResponse.data?.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-receipt-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
