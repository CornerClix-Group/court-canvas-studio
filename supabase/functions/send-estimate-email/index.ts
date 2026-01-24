import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const COMPANY_INFO = {
  name: "CourtHaus Construction, LLC",
  dba: "dba CourtPro Augusta",
  address: "500 Furys Ferry Rd. Suite 107",
  cityStateZip: "Augusta, GA 30907",
  phone: "(706) 309-1993",
  email: "estimates@courtproaugusta.com",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EstimateEmailRequest {
  estimateId: string;
}

interface LineItem {
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total: number;
}

// Customer-friendly grouped item for email display
interface CustomerLineItem {
  description: string;
  details: string;
  total: number;
}

// Group detailed line items into customer-friendly categories
function groupItemsForCustomer(items: LineItem[]): CustomerLineItem[] {
  const customerItems: CustomerLineItem[] = [];
  
  const surfacePrep: LineItem[] = [];
  const surfacing: LineItem[] = [];
  const striping: LineItem[] = [];
  const baseWork: LineItem[] = [];
  const addons: LineItem[] = [];
  
  items.forEach(item => {
    const desc = item.description.toLowerCase();
    if (desc.includes('pressure') || desc.includes('wash') || desc.includes('crack') || 
        desc.includes('birdbath') || desc.includes('prime') || desc.includes('prep')) {
      surfacePrep.push(item);
    } else if (desc.includes('line') || desc.includes('striping') || desc.includes('stripe')) {
      striping.push(item);
    } else if (desc.includes('base') || desc.includes('substrate')) {
      baseWork.push(item);
    } else if (desc.includes('granule') || desc.includes('powder') || desc.includes('color') || 
               desc.includes('resurfacer') || desc.includes('laykold') || desc.includes('application') ||
               desc.includes('surfacing') || desc.includes('cushion') || desc.includes('gel')) {
      surfacing.push(item);
    } else {
      addons.push(item);
    }
  });
  
  if (surfacePrep.length > 0) {
    const total = surfacePrep.reduce((sum, item) => sum + item.total, 0);
    customerItems.push({
      description: 'Surface Preparation',
      details: 'Professional surface preparation including cleaning, crack repair, and priming',
      total,
    });
  }
  
  if (surfacing.length > 0) {
    const total = surfacing.reduce((sum, item) => sum + item.total, 0);
    customerItems.push({
      description: 'Court Surfacing System',
      details: 'Premium court surfacing with cushion layers and color coats',
      total,
    });
  }
  
  if (striping.length > 0) {
    const total = striping.reduce((sum, item) => sum + item.total, 0);
    customerItems.push({
      description: 'Professional Line Striping',
      details: 'Complete court line marking',
      total,
    });
  }
  
  if (baseWork.length > 0) {
    const total = baseWork.reduce((sum, item) => sum + item.total, 0);
    customerItems.push({
      description: 'Site Preparation & Base Work',
      details: 'Substrate preparation and base installation',
      total,
    });
  }
  
  addons.forEach(item => {
    customerItems.push({
      description: item.description,
      details: item.quantity > 1 ? `Quantity: ${item.quantity}` : '',
      total: item.total,
    });
  });
  
  return customerItems;
}

interface Customer {
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface Estimate {
  id: string;
  estimate_number: string;
  status: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  notes: string | null;
  valid_until: string | null;
  created_at: string;
  customer: Customer | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generateEstimateEmailHTML(estimate: Estimate, lineItems: LineItem[]): string {
  const customerName = estimate.customer?.contact_name || "Valued Customer";
  const validUntil = estimate.valid_until ? formatDate(estimate.valid_until) : "30 days from receipt";

  // Group items for customer-friendly display (no per-unit pricing)
  const groupedItems = groupItemsForCustomer(lineItems);
  
  const itemsHTML = groupedItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: left;">
          <strong>${item.description}</strong>
          ${item.details ? `<br><span style="color: #6b7280; font-size: 13px;">${item.details}</span>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top;">${formatCurrency(item.total)}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Estimate ${estimate.estimate_number}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">CourtPro Augusta</h1>
            <p style="color: #93c5fd; margin: 5px 0 0 0; font-size: 14px;">Professional Court Construction</p>
          </td>
        </tr>
        
        <!-- Greeting -->
        <tr>
          <td style="padding: 30px 30px 20px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 15px 0; font-size: 22px;">Hello ${customerName},</h2>
            <p style="color: #4b5563; margin: 0; font-size: 16px; line-height: 1.6;">
              Thank you for your interest in our court construction services. Please find attached your detailed estimate for your review.
            </p>
          </td>
        </tr>
        
        <!-- Estimate Summary Box -->
        <tr>
          <td style="padding: 0 30px 20px 30px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color: #64748b; font-size: 14px;">Estimate Number</td>
                      <td style="color: #1f2937; font-size: 14px; text-align: right; font-weight: 600;">${estimate.estimate_number}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-size: 14px; padding-top: 10px;">Date</td>
                      <td style="color: #1f2937; font-size: 14px; text-align: right; padding-top: 10px;">${formatDate(estimate.created_at)}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; font-size: 14px; padding-top: 10px;">Valid Until</td>
                      <td style="color: #1f2937; font-size: 14px; text-align: right; padding-top: 10px;">${validUntil}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top: 15px; border-top: 1px solid #e2e8f0; margin-top: 15px;"></td>
                    </tr>
                    <tr>
                      <td style="color: #1f2937; font-size: 18px; font-weight: bold; padding-top: 5px;">Total</td>
                      <td style="color: #059669; font-size: 24px; text-align: right; font-weight: bold; padding-top: 5px;">${formatCurrency(estimate.total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        <!-- Scope of Work (Customer-Friendly Grouped) -->
        <tr>
          <td style="padding: 0 30px 20px 30px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 16px;">Scope of Work</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; color: #374151; font-size: 13px; font-weight: 600;">Service</th>
                <th style="padding: 12px; text-align: right; color: #374151; font-size: 13px; font-weight: 600;">Amount</th>
              </tr>
              ${itemsHTML}
            </table>
          </td>
        </tr>
        
        <!-- Totals -->
        <tr>
          <td style="padding: 0 30px 20px 30px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="60%"></td>
                <td width="40%">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Subtotal</td>
                      <td style="padding: 8px 0; text-align: right; color: #1f2937;">${formatCurrency(estimate.subtotal)}</td>
                    </tr>
                    ${
                      estimate.tax_amount && estimate.tax_amount > 0
                        ? `
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Tax (${estimate.tax_rate || 0}%)</td>
                      <td style="padding: 8px 0; text-align: right; color: #1f2937;">${formatCurrency(estimate.tax_amount)}</td>
                    </tr>
                    `
                        : ""
                    }
                    <tr>
                      <td style="padding: 12px 0; color: #1f2937; font-weight: bold; font-size: 18px; border-top: 2px solid #e5e7eb;">Total</td>
                      <td style="padding: 12px 0; text-align: right; color: #059669; font-weight: bold; font-size: 18px; border-top: 2px solid #e5e7eb;">${formatCurrency(estimate.total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        
        ${
          estimate.notes
            ? `
        <!-- Notes -->
        <tr>
          <td style="padding: 0 30px 20px 30px;">
            <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
              <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px;">Notes</h4>
              <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.5;">${estimate.notes}</p>
            </div>
          </td>
        </tr>
        `
            : ""
        }
        
        <!-- CTA -->
        <tr>
          <td style="padding: 10px 30px 30px 30px; text-align: center;">
            <p style="color: #4b5563; margin: 0 0 20px 0; font-size: 15px;">
              Ready to proceed? Contact us to schedule your project!
            </p>
            <a href="tel:${COMPANY_INFO.phone}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Call ${COMPANY_INFO.phone}
            </a>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background-color: #1f2937; padding: 25px 30px; text-align: center;">
            <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 14px; font-weight: 600;">${COMPANY_INFO.name}</p>
            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 12px;">${COMPANY_INFO.dba}</p>
            <p style="color: #6b7280; margin: 0 0 5px 0; font-size: 12px;">${COMPANY_INFO.address}</p>
            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 12px;">${COMPANY_INFO.cityStateZip}</p>
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">${COMPANY_INFO.phone} | ${COMPANY_INFO.email}</p>
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
    const { estimateId }: EstimateEmailRequest = await req.json();

    if (!estimateId) {
      throw new Error("Estimate ID is required");
    }

    console.log(`Sending estimate email for estimate: ${estimateId}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch estimate with customer
    const { data: estimate, error: estimateError } = await supabase
      .from("estimates")
      .select(`
        *,
        customer:customers(*)
      `)
      .eq("id", estimateId)
      .single();

    if (estimateError || !estimate) {
      console.error("Estimate fetch error:", estimateError);
      throw new Error(`Estimate not found: ${estimateError?.message}`);
    }

    // Fetch line items
    const { data: lineItems, error: itemsError } = await supabase
      .from("estimate_items")
      .select("*")
      .eq("estimate_id", estimateId)
      .order("sort_order");

    if (itemsError) {
      console.error("Line items fetch error:", itemsError);
      throw new Error(`Failed to fetch line items: ${itemsError.message}`);
    }

    const customerEmail = estimate.customer?.email;
    if (!customerEmail) {
      throw new Error("Customer email is required to send estimate");
    }

    // Generate PDF by calling the generate-estimate-pdf function
    console.log("Generating PDF...");
    const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/generate-estimate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ estimateId }),
    });

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error("PDF generation failed:", errorText);
      throw new Error(`PDF generation failed: ${errorText}`);
    }

    const pdfData = await pdfResponse.json();
    console.log("PDF generated successfully");

    // Generate email HTML
    const emailHtml = generateEstimateEmailHTML(estimate as Estimate, lineItems || []);

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: `CourtPro Augusta <${COMPANY_INFO.email}>`,
      to: [customerEmail],
      cc: [COMPANY_INFO.email],
      subject: `Estimate ${estimate.estimate_number} from CourtPro Augusta`,
      html: emailHtml,
      attachments: [
        {
          filename: `Estimate-${estimate.estimate_number}.pdf`,
          content: pdfData.pdf,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    const { error: logError } = await supabase.from("email_logs").insert({
      email_type: "estimate",
      recipient_email: customerEmail,
      related_id: estimateId,
      subject: `Estimate ${estimate.estimate_number} from CourtPro Augusta`,
      status: "sent",
      resend_email_id: emailResponse.data?.id || null,
    });

    if (logError) {
      console.error("Failed to log email:", logError);
    }

    // Update estimate status to sent
    const { error: updateError } = await supabase
      .from("estimates")
      .update({ 
        status: "sent",
        sent_at: new Date().toISOString() 
      })
      .eq("id", estimateId);

    if (updateError) {
      console.error("Failed to update estimate status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Estimate sent successfully",
        emailId: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-estimate-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
