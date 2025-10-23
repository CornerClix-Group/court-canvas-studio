import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  type: string;
  location: string;
  timeline: string;
  notes: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: ContactFormData = await req.json();

    console.log("Received contact form submission:", { name: formData.name, email: formData.email });

    const emailHtml = `
      <h2>New Quote Request from CourtPro Augusta Website</h2>
      <p><strong>Name:</strong> ${formData.name}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Phone:</strong> ${formData.phone || "Not provided"}</p>
      <p><strong>Project Type:</strong> ${formData.type}</p>
      <p><strong>Location:</strong> ${formData.location || "Not provided"}</p>
      <p><strong>Timeline:</strong> ${formData.timeline || "Not provided"}</p>
      <p><strong>Notes:</strong></p>
      <p>${formData.notes || "No additional notes"}</p>
    `;

    const emailResponse = await resend.emails.send({
      from: "CourtPro Augusta <onboarding@resend.dev>",
      to: ["estimates@courtproaugusta.com"],
      replyTo: formData.email,
      subject: `Quote Request from ${formData.name} - ${formData.type}`,
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
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
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
