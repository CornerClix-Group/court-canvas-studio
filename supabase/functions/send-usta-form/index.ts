import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface USTAApplication {
  id: string;
  tpa_number: string | null;
  facility_name: string | null;
  facility_director: string | null;
  consultant_name: string | null;
  consultant_email: string | null;
  pdf_url: string | null;
  total_renovation_costs: number;
  completion_percentage: number;
  project?: {
    project_name: string;
    site_city: string | null;
    site_state: string | null;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth: require admin/staff bearer token.
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userData.user.id);
    const allowed = (roles || []).some((r: { role: string }) =>
      ["owner", "admin", "staff"].includes(r.role));
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { applicationId } = await req.json();

    if (!applicationId) {
      throw new Error("Application ID is required");
    }

    console.log("Sending USTA form for application:", applicationId);

    // Fetch application
    const { data: application, error: fetchError } = await supabase
      .from("usta_applications")
      .select(`
        *,
        project:projects(project_name, site_city, site_state)
      `)
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      throw new Error("Application not found");
    }

    if (!application.consultant_email) {
      throw new Error("Consultant email is required");
    }

    // Generate PDF if not exists
    let pdfUrl = application.pdf_url;
    if (!pdfUrl) {
      // Call generate function first — forward the caller's bearer token so
      // the auth check in generate-usta-form passes.
      const { data: genData, error: genError } = await supabase.functions.invoke(
        "generate-usta-form",
        {
          body: { applicationId },
          headers: { Authorization: authHeader },
        }
      );

      if (genError) {
        throw new Error("Failed to generate PDF");
      }
      pdfUrl = genData.filePath;
    }

    // Get PDF from storage
    let pdfAttachment: { filename: string; content: string } | null = null;
    if (pdfUrl) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from("invoices")
        .download(pdfUrl);

      if (!fileError && fileData) {
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        uint8Array.forEach((byte) => {
          binary += String.fromCharCode(byte);
        });
        pdfAttachment = {
          filename: `USTA-Grant-Form-${application.tpa_number || application.id}.pdf`,
          content: btoa(binary),
        };
      }
    }

    const app = application as USTAApplication;
    const location = [app.project?.site_city, app.project?.site_state]
      .filter(Boolean)
      .join(", ");

    // Send email
    const emailResponse = await resend.emails.send({
      from: "CourtPro Augusta <onboarding@resend.dev>",
      to: [app.consultant_email!],
      cc: ["estimates@courtproaugusta.com"],
      subject: `USTA Grant Accountability Form - ${app.facility_name || app.project?.project_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a365d;">USTA Grant Accountability Form</h1>
          
          <p>Dear ${app.consultant_name || "USTA Representative"},</p>
          
          <p>Please find attached the completed USTA Grant Accountability Form (Category 2) for the following project:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>TPA Number:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${app.tpa_number || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Facility Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${app.facility_name || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Location:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${location || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Total Renovation Costs:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">$${(app.total_renovation_costs || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Completion:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${app.completion_percentage || 0}%</td>
            </tr>
          </table>
          
          <p>The attached PDF contains the full accountability form with funding breakdown, court information, and project details.</p>
          
          <p>Please let us know if you need any additional information or documentation.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>CourtPro Augusta</strong><br>
            <a href="mailto:estimates@courtproaugusta.com">estimates@courtproaugusta.com</a><br>
            <a href="https://courtproaugusta.com">courtproaugusta.com</a>
          </p>
        </div>
      `,
      attachments: pdfAttachment ? [pdfAttachment] : undefined,
    });

    console.log("Email sent:", emailResponse);

    // Update application status
    await supabase
      .from("usta_applications")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending USTA form:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});