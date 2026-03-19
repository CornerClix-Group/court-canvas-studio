import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MINUTES = 60;
const MAX_REQUESTS_PER_WINDOW = 5;

const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional().default(""),
  type: z.string().min(1).max(100),
  location: z.string().max(200).optional().default(""),
  timeline: z.string().max(100).optional().default(""),
  notes: z.string().max(5000).optional().default(""),
  // New qualification fields
  job_type: z.string().max(50).optional().default(""),
  base_type: z.string().max(50).optional().default(""),
  court_condition: z.string().max(50).optional().default(""),
  ownership_type: z.string().max(50).optional().default(""),
  number_of_courts: z.number().int().min(1).max(20).optional().default(1),
  budget_range: z.string().max(50).optional().default(""),
  urgency: z.string().max(50).optional().default(""),
});

function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

function formatLabel(value: string): string {
  if (!value) return "Not provided";
  return escapeHtml(value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey) as any;

    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    
    const { count, error: rateLimitError } = await supabase
      .from('chat_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIP)
      .gte('created_at', windowStart);
    
    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }
    
    const isAllowed = rateLimitError || (count || 0) < MAX_REQUESTS_PER_WINDOW;
    
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rawData = await req.json();
    const parseResult = contactFormSchema.safeParse(rawData);
    
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid form data", details: parseResult.error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const formData = parseResult.data;

    const { error: insertError } = await supabase
      .from('chat_rate_limits')
      .insert({ ip_address: clientIP });
    
    if (insertError) {
      console.error("Failed to record rate limit entry:", insertError);
    }

    console.log("Received contact form submission:", { 
      name: formData.name.substring(0, 20), 
      email: formData.email.substring(0, 20),
      job_type: formData.job_type,
      ownership_type: formData.ownership_type,
    });

    // Build qualification details section
    const qualificationRows = [
      formData.job_type ? `<tr><td style="padding:4px 8px;font-weight:600;color:#555;">Job Type</td><td style="padding:4px 8px;">${formatLabel(formData.job_type)}</td></tr>` : '',
      formData.base_type ? `<tr><td style="padding:4px 8px;font-weight:600;color:#555;">Base Type</td><td style="padding:4px 8px;">${formatLabel(formData.base_type)}</td></tr>` : '',
      formData.court_condition ? `<tr><td style="padding:4px 8px;font-weight:600;color:#555;">Court Condition</td><td style="padding:4px 8px;">${formatLabel(formData.court_condition)}</td></tr>` : '',
      formData.ownership_type ? `<tr><td style="padding:4px 8px;font-weight:600;color:#555;">Owner Type</td><td style="padding:4px 8px;">${formatLabel(formData.ownership_type)}</td></tr>` : '',
      `<tr><td style="padding:4px 8px;font-weight:600;color:#555;">Courts</td><td style="padding:4px 8px;">${formData.number_of_courts}</td></tr>`,
      formData.budget_range ? `<tr><td style="padding:4px 8px;font-weight:600;color:#555;">Budget Range</td><td style="padding:4px 8px;">${formatLabel(formData.budget_range)}</td></tr>` : '',
      formData.urgency ? `<tr><td style="padding:4px 8px;font-weight:600;color:#555;">Urgency</td><td style="padding:4px 8px;">${formatLabel(formData.urgency)}</td></tr>` : '',
    ].filter(Boolean).join('');

    const safeName = escapeHtml(formData.name);
    const safeEmail = escapeHtml(formData.email);
    const safePhone = escapeHtml(formData.phone || "Not provided");
    const safeType = escapeHtml(formData.type);
    const safeLocation = escapeHtml(formData.location || "Not provided");
    const safeTimeline = escapeHtml(formData.timeline || "Not provided");
    const safeNotes = escapeHtml(formData.notes || "No additional notes");

    const emailHtml = `
      <h2>New Quote Request from CourtPro Augusta Website</h2>
      <table style="border-collapse:collapse;margin-bottom:16px;">
        <tr><td style="padding:4px 8px;font-weight:600;color:#555;">Name</td><td style="padding:4px 8px;">${safeName}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:600;color:#555;">Email</td><td style="padding:4px 8px;">${safeEmail}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:600;color:#555;">Phone</td><td style="padding:4px 8px;">${safePhone}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:600;color:#555;">Sport/Type</td><td style="padding:4px 8px;">${safeType}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:600;color:#555;">Location</td><td style="padding:4px 8px;">${safeLocation}</td></tr>
        <tr><td style="padding:4px 8px;font-weight:600;color:#555;">Timeline</td><td style="padding:4px 8px;">${safeTimeline}</td></tr>
        ${qualificationRows}
      </table>
      <h3>Notes</h3>
      <p>${safeNotes}</p>
    `;

    // Send internal notification email
    const emailResponse = await resend.emails.send({
      from: "CourtPro Augusta <estimates@courtproaugusta.com>",
      to: ["estimates@courtproaugusta.com"],
      replyTo: formData.email,
      subject: `Quote Request from ${safeName} — ${safeType}${formData.job_type ? ` (${formatLabel(formData.job_type)})` : ''}`,
      html: emailHtml,
    });

    console.log("Internal email sent:", emailResponse);

    // Phase 2D: Send auto-response confirmation to the lead
    try {
      await resend.emails.send({
        from: "CourtPro Augusta <estimates@courtproaugusta.com>",
        to: [formData.email],
        subject: "We received your quote request — CourtPro Augusta",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#1a1a2e;">Thanks for reaching out, ${safeName}!</h2>
            <p>We've received your quote request for <strong>${safeType}</strong> and our team is reviewing the details now.</p>
            <p><strong>What happens next:</strong></p>
            <ul>
              <li>We'll review your project details within 1 business day</li>
              <li>If we need more info (photos, measurements, site access), we'll reach out</li>
              <li>You'll receive a detailed, line-item estimate</li>
            </ul>
            <p>If you have site photos or additional details, feel free to reply to this email.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#666;font-size:14px;">
              <strong>CourtPro Augusta</strong><br/>
              (706) 309-1993<br/>
              estimates@courtproaugusta.com
            </p>
          </div>
        `,
      });
      console.log("Auto-response email sent to lead");
    } catch (autoErr) {
      console.error("Auto-response email failed (non-blocking):", autoErr);
    }

    // Forward to n8n webhook
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    if (n8nWebhookUrl) {
      try {
        const n8nResponse = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        console.log("n8n webhook response status:", n8nResponse.status);
      } catch (n8nError) {
        console.error("n8n webhook error:", n8nError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-contact-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
