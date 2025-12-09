import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation schema
const contactFormSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional().default(""),
  type: z.string().min(1).max(100),
  location: z.string().max(200).optional().default(""),
  timeline: z.string().max(100).optional().default(""),
  notes: z.string().max(5000).optional().default(""),
});

// HTML escape function to prevent XSS
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();

    // Validate and sanitize input
    const parseResult = contactFormSchema.safeParse(rawData);
    
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: "Invalid form data", details: parseResult.error.errors }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const formData = parseResult.data;

    console.log("Received contact form submission:", { 
      name: formData.name.substring(0, 20), 
      email: formData.email.substring(0, 20) 
    });

    // Escape all user input for safe HTML insertion
    const safeName = escapeHtml(formData.name);
    const safeEmail = escapeHtml(formData.email);
    const safePhone = escapeHtml(formData.phone || "Not provided");
    const safeType = escapeHtml(formData.type);
    const safeLocation = escapeHtml(formData.location || "Not provided");
    const safeTimeline = escapeHtml(formData.timeline || "Not provided");
    const safeNotes = escapeHtml(formData.notes || "No additional notes");

    const emailHtml = `
      <h2>New Quote Request from CourtPro Augusta Website</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>Project Type:</strong> ${safeType}</p>
      <p><strong>Location:</strong> ${safeLocation}</p>
      <p><strong>Timeline:</strong> ${safeTimeline}</p>
      <p><strong>Notes:</strong></p>
      <p>${safeNotes}</p>
    `;

    const emailResponse = await resend.emails.send({
      from: "CourtPro Augusta <onboarding@resend.dev>",
      to: ["estimates@courtproaugusta.com"],
      replyTo: formData.email,
      subject: `Quote Request from ${safeName} - ${safeType}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-contact-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
