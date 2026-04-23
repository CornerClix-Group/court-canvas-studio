import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const MASTER_ADMIN_EMAIL = "troy@courtproaugusta.com";

const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require authenticated admin/staff caller to prevent spoofed admin alerts.
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

    const { action, entityType, entityName, performedBy, details } = await req.json();

    if (!action || !entityType || !performedBy) {
      throw new Error("Missing required fields: action, entityType, performedBy");
    }

    // Format action for display
    const actionLabel = action
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const entityLabel = entityType
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Build email content
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #2563eb; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Team Activity Alert</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    <p style="margin: 0 0 16px 0; font-size: 16px; color: #333333;">
                      A team member has performed an important action:
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #666666;">Action:</strong>
                          <span style="color: #333333; margin-left: 8px;">${esc(actionLabel)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #666666;">Type:</strong>
                          <span style="color: #333333; margin-left: 8px;">${esc(entityLabel)}</span>
                        </td>
                      </tr>
                      ${entityName ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #666666;">Name/ID:</strong>
                          <span style="color: #333333; margin-left: 8px;">${esc(entityName)}</span>
                        </td>
                      </tr>
                      ` : ""}
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #666666;">Performed By:</strong>
                          <span style="color: #333333; margin-left: 8px;">${esc(performedBy)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #666666;">Time:</strong>
                          <span style="color: #333333; margin-left: 8px;">${esc(timestamp)}</span>
                        </td>
                      </tr>
                      ${details ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #666666;">Details:</strong>
                          <span style="color: #333333; margin-left: 8px;">${esc(JSON.stringify(details))}</span>
                        </td>
                      </tr>
                      ` : ""}
                    </table>

                    <p style="margin: 0; font-size: 14px; color: #666666;">
                      You can view all activity in the Team page of your admin dashboard.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      CourtPro Augusta Admin Notifications
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

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "CourtPro Alerts <alerts@courtproaugusta.com>",
        to: [MASTER_ADMIN_EMAIL],
        subject: `[Team Alert] ${actionLabel} - ${entityLabel}${entityName ? `: ${entityName}` : ""}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send notification email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Notification email sent:", emailResult.id);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
