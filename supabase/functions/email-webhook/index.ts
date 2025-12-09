import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    bounce?: {
      message: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    const payload = await req.text();
    
    let event: ResendWebhookEvent;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const headers = {
        "webhook-id": req.headers.get("webhook-id") || "",
        "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
        "webhook-signature": req.headers.get("webhook-signature") || "",
      };

      try {
        const wh = new Webhook(webhookSecret);
        event = wh.verify(payload, headers) as ResendWebhookEvent;
        console.log("Webhook signature verified successfully");
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // No secret configured, parse payload directly (not recommended for production)
      console.warn("RESEND_WEBHOOK_SECRET not configured, skipping signature verification");
      event = JSON.parse(payload);
    }

    console.log("Received Resend webhook event:", event.type, event.data.email_id);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const emailId = event.data.email_id;
    const eventTime = event.created_at;

    let updateData: Record<string, unknown> = {};

    switch (event.type) {
      case "email.sent":
        updateData = { status: "sent", sent_at: eventTime };
        break;
      case "email.delivered":
        updateData = { status: "delivered", delivered_at: eventTime };
        break;
      case "email.opened":
        updateData = { status: "opened", opened_at: eventTime };
        break;
      case "email.clicked":
        updateData = { clicked_at: eventTime };
        break;
      case "email.bounced":
        updateData = { 
          status: "bounced", 
          bounced_at: eventTime,
          error_message: event.data.bounce?.message || "Email bounced"
        };
        break;
      case "email.complained":
        updateData = { status: "complained", error_message: "Recipient marked as spam" };
        break;
      case "email.delivery_delayed":
        updateData = { status: "delayed" };
        break;
      default:
        console.log("Unhandled event type:", event.type);
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("email_logs")
        .update(updateData)
        .eq("resend_email_id", emailId);

      if (error) {
        console.error("Error updating email log:", error);
      } else {
        console.log("Updated email log for", emailId, "with status:", updateData.status);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
