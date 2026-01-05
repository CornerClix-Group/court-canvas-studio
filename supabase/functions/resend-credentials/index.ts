import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is authorized
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !caller) {
      throw new Error("Unauthorized");
    }

    // Check if caller has owner or admin role
    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const isOwnerOrAdmin = (callerRoles || []).some(
      (r) => r.role === "owner" || r.role === "admin"
    );

    if (!isOwnerOrAdmin) {
      throw new Error("Only owners and admins can resend credentials");
    }

    const { invitationId } = await req.json();

    if (!invitationId) {
      throw new Error("Invitation ID is required");
    }

    // Get the invitation details
    const { data: invitation, error: invError } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (invError || !invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending_login") {
      throw new Error("User has already logged in");
    }

    if (!invitation.user_id) {
      throw new Error("No user associated with this invitation");
    }

    // Generate a new temporary password
    const newPassword = generateSecurePassword();

    // Update the user's password and set the requires_password_change flag
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      invitation.user_id,
      { 
        password: newPassword,
        user_metadata: {
          requires_password_change: true,
        },
      }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error("Failed to reset password");
    }

    console.log(`Password reset for user: ${invitation.email}`);

    // Get the caller's name for the email
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", caller.id)
      .single();

    const senderName = callerProfile?.full_name || callerProfile?.email || "Your administrator";

    // Send the credentials email
    const emailResponse = await resend.emails.send({
      from: "CourtPro <noreply@courtproaugusta.com>",
      to: [invitation.email],
      subject: "Your CourtPro Login Credentials (Updated)",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">CourtPro Admin Access</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hi ${invitation.full_name || "there"},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${senderName} has sent you updated login credentials for the CourtPro admin dashboard.
            </p>
            
            <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your login credentials:</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${invitation.email}</p>
              <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background: #f1f3f4; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${newPassword}</code></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://courtproaugusta.com/admin/auth" 
                 style="display: inline-block; background: #1e3a5f; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Login to Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              For security, please change your password after logging in.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              This email was sent by CourtPro Augusta.<br>
              If you didn't expect this email, please contact your administrator.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Credentials email sent:", emailResponse);

    // Log the activity
    const { error: logError } = await supabase
      .from("activity_logs")
      .insert({
        user_id: caller.id,
        user_email: callerProfile?.email || caller.email || "unknown",
        user_name: callerProfile?.full_name,
        action: "resend_credentials",
        entity_type: "team_member",
        entity_id: invitation.user_id,
        entity_name: invitation.full_name || invitation.email,
        details: { email: invitation.email },
      });

    if (logError) {
      console.error("Error logging activity:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Credentials sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error resending credentials:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateSecurePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  const length = 16;
  let password = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  return password;
}
