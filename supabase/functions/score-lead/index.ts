import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth: allow service-role (internal fire-and-forget) OR owner/admin/staff user.
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    const isServiceRole = token && token === supabaseServiceKey;
    if (!isServiceRole) {
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
    }

    const { leadId } = await req.json();
    if (!leadId) throw new Error("leadId is required");

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) throw new Error("Lead not found");

    const prompt = `You are a lead scoring AI for a court construction company (tennis, pickleball, basketball courts). Score this lead from 1-10 and tag it.

Lead data:
- Name: ${lead.name}
- Location: ${lead.city || "Unknown"}, ${lead.state || "Unknown"}
- Job Type: ${lead.job_type || "Unknown"}
- Court Condition: ${lead.court_condition || "Unknown"}
- Base Type: ${lead.base_type || "Unknown"}
- Ownership: ${lead.ownership_type || "Unknown"}
- Number of Courts: ${lead.number_of_courts || 1}
- Budget Range: ${lead.budget_range || "Unknown"}
- Urgency: ${lead.urgency || "Unknown"}
- Sport: ${lead.project_type || "Unknown"}
- Notes: ${lead.notes || "None"}
- Source: ${lead.source || "website"}

Score criteria:
- Higher score for: multiple courts, known budget, urgent timeline, private owner with budget, resurfacing with clear scope
- Lower score for: no budget info, no urgency, vague details, tire-kicker signals
- Medium for: public bids (competitive but real), single court residential

Return tags from: likely_resurfacing, likely_new_build, likely_heavy_repair, likely_public_bid, likely_premium, poor_fit, quick_close, high_value`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a construction lead scoring assistant. Always respond using the provided tool." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "score_lead",
            description: "Score and tag a construction lead",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "Lead score from 1-10" },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Tags describing the lead type",
                },
                reasoning: { type: "string", description: "Brief explanation of the score" },
              },
              required: ["score", "tags", "reasoning"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "score_lead" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI scoring failed");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    let score = 5;
    let tags: string[] = [];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      score = Math.min(10, Math.max(1, Math.round(parsed.score || 5)));
      tags = Array.isArray(parsed.tags) ? parsed.tags : [];
    }

    // Update lead with score and tags
    const { error: updateError } = await supabase
      .from("leads")
      .update({ ai_score: score, ai_tags: tags })
      .eq("id", leadId);

    if (updateError) {
      console.error("Error updating lead:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, score, tags }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Score-lead error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
