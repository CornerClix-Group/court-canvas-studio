import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 60;
const MAX_REQUESTS_PER_WINDOW = 10;

// Validation schema for lead capture
const leadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional().default(""),
  city: z.string().min(1).max(100).optional().default(""),
  state: z.string().min(1).max(2).optional().default(""),
  sport: z.string().min(1).max(50),
  lead_hash: z.string().max(100).optional(),
  timestamp: z.string().optional(),
  // Optional estimator fields — present when lead comes from /estimator
  source: z.string().max(50).optional(),
  project_name: z.string().max(200).optional(),
  estimated_total: z.number().optional(),
  total_sqft: z.number().optional(),
  number_of_courts: z.number().optional(),
  project_type: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client for rate limiting
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Check rate limit
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
      console.log(`Rate limit exceeded for IP: ${clientIP.substring(0, 10)}...`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const rawData = await req.json();

    // Validate input
    const parseResult = leadSchema.safeParse(rawData);
    
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

    const leadData = parseResult.data;

    // Record rate limit entry
    const { error: insertError } = await supabase
      .from('chat_rate_limits')
      .insert({ ip_address: clientIP });
    
    if (insertError) {
      console.error("Failed to record rate limit entry:", insertError);
    }

    console.log("Received lead submission:", { 
      name: leadData.name.substring(0, 20), 
      email: leadData.email.substring(0, 20),
      sport: leadData.sport
    });

    // Write to leads table FIRST, so the lead is safe in our DB even if
    // downstream integrations (n8n) fail.
    const leadSource = leadData.source || (leadData.sport === 'estimator' ? 'estimator' : 'website');

    const composedNotes = [
      leadData.notes,
      leadData.project_name ? `Project: ${leadData.project_name}` : null,
      leadData.estimated_total ? `Estimator quote: $${leadData.estimated_total.toFixed(2)}` : null,
      leadData.total_sqft ? `Total sq ft: ${leadData.total_sqft}` : null,
      leadData.number_of_courts ? `Courts: ${leadData.number_of_courts}` : null,
    ].filter(Boolean).join(' | ') || null;

    const { data: insertedLead, error: leadInsertError } = await supabase
      .from('leads')
      .insert({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone || null,
        city: leadData.city || null,
        state: leadData.state || null,
        project_type: leadData.project_type || leadData.sport || null,
        source: leadSource,
        status: 'new',
        notes: composedNotes,
      })
      .select()
      .single();

    if (leadInsertError) {
      console.error("Failed to insert lead to DB:", leadInsertError);
      // Do NOT fail the request — n8n forward still provides a backup path
    } else {
      console.log("Lead saved to DB:", insertedLead?.id);
    }

    // Forward to n8n webhook (server-side, secure)
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    if (!n8nWebhookUrl) {
      console.error("N8N_WEBHOOK_URL not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const n8nPayload = {
      ...leadData,
      timestamp: leadData.timestamp || new Date().toISOString(),
    };

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload),
    });

    console.log("n8n webhook response status:", n8nResponse.status);

    if (!n8nResponse.ok) {
      console.error("n8n webhook failed:", await n8nResponse.text());
      return new Response(
        JSON.stringify({ error: "Failed to process lead" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Lead submitted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in submit-lead function:", error);
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
