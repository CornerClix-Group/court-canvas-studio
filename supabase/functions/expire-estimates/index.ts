import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split('T')[0];

    // Find all estimates that are sent and have passed their valid_until date
    const { data: expiredEstimates, error: fetchError } = await supabase
      .from("estimates")
      .select("id, estimate_number, valid_until")
      .eq("status", "sent")
      .not("valid_until", "is", null)
      .lt("valid_until", today);

    if (fetchError) {
      throw fetchError;
    }

    if (!expiredEstimates || expiredEstimates.length === 0) {
      console.log("No estimates to expire");
      return new Response(
        JSON.stringify({ message: "No estimates to expire", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiredIds = expiredEstimates.map(e => e.id);

    // Update all expired estimates
    const { error: updateError } = await supabase
      .from("estimates")
      .update({ status: "expired" })
      .in("id", expiredIds);

    if (updateError) {
      throw updateError;
    }

    console.log(`Expired ${expiredEstimates.length} estimates:`, expiredEstimates.map(e => e.estimate_number));

    return new Response(
      JSON.stringify({ 
        message: `Expired ${expiredEstimates.length} estimates`,
        count: expiredEstimates.length,
        estimates: expiredEstimates.map(e => e.estimate_number)
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error expiring estimates:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
