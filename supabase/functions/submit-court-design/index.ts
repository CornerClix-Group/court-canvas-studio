import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MINUTES = 60;
const MAX_REQUESTS_PER_WINDOW = 5;

const designSchema = z.object({
  full_name: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().min(7).max(40),
  street: z.string().max(200).optional().default(""),
  city: z.string().max(120).optional().default(""),
  state: z.string().max(40).optional().default(""),
  zip: z.string().max(20).optional().default(""),
  court_type: z.string().min(1).max(60),
  inner_color: z.string().min(1).max(60),
  outer_color: z.string().min(1).max(60),
  line_color: z.string().min(1).max(60),
  project_notes: z.string().max(2000).optional().default(""),
});

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("chat_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIP)
      .gte("created_at", windowStart);

    if ((count || 0) >= MAX_REQUESTS_PER_WINDOW) {
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    await supabase.from("chat_rate_limits").insert({ ip_address: clientIP });

    const raw = await req.json();
    const parsed = designSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid form data", details: parsed.error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const d = parsed.data;

    // 1. Insert lead row
    const fullLocation = [d.city, d.state].filter(Boolean).join(", ");
    const { data: leadRow, error: leadErr } = await supabase
      .from("leads")
      .insert({
        name: d.full_name,
        email: d.email,
        phone: d.phone,
        city: d.city || null,
        state: d.state || null,
        project_type: d.court_type,
        source: "design_your_court",
        status: "new",
        notes: [
          `Design submission via /design-your-court`,
          `Court: ${d.court_type}`,
          `Inner: Laykold ${d.inner_color}`,
          `Outer: Laykold ${d.outer_color}`,
          `Lines: Laykold ${d.line_color}`,
          d.street ? `Address: ${d.street}, ${fullLocation} ${d.zip}` : "",
          d.project_notes ? `Notes: ${d.project_notes}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      })
      .select("id")
      .single();

    if (leadErr) console.error("Lead insert error:", leadErr);

    // 2. Insert design submission
    const { data: subRow, error: subErr } = await supabase
      .from("design_submissions")
      .insert({
        full_name: d.full_name,
        email: d.email,
        phone: d.phone,
        street: d.street || null,
        city: d.city || null,
        state: d.state || null,
        zip: d.zip || null,
        court_type: d.court_type,
        inner_color: d.inner_color,
        outer_color: d.outer_color,
        line_color: d.line_color,
        project_notes: d.project_notes || null,
        lead_id: leadRow?.id || null,
      })
      .select("id")
      .single();

    if (subErr) console.error("Design submission insert error:", subErr);

    // 3. Trigger AI score (fire and forget)
    if (leadRow?.id) {
      supabase.functions
        .invoke("score-lead", { body: { leadId: leadRow.id } })
        .catch((e) => console.error("score-lead error:", e));
    }

    // 4. Send notification email
    const html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; color: #1E2A3A; max-width: 640px; margin: 0 auto; padding: 24px;">
  <h2 style="color:#1E2A3A;border-bottom:3px solid #D4E020;padding-bottom:8px;">🎨 New Court Design Submission</h2>
  <p><strong>From:</strong> ${esc(d.full_name)}<br/>
     <strong>Email:</strong> <a href="mailto:${esc(d.email)}">${esc(d.email)}</a><br/>
     <strong>Phone:</strong> <a href="tel:${esc(d.phone)}">${esc(d.phone)}</a></p>
  ${d.street || d.city ? `<p><strong>Site:</strong> ${esc([d.street, fullLocation, d.zip].filter(Boolean).join(", "))}</p>` : ""}
  <h3 style="margin-top:24px;color:#1E2A3A;">Design</h3>
  <table cellpadding="6" style="border-collapse:collapse;">
    <tr><td><strong>Court type:</strong></td><td>${esc(d.court_type)}</td></tr>
    <tr><td><strong>Inner color:</strong></td><td>Laykold ${esc(d.inner_color)}</td></tr>
    <tr><td><strong>Outer color:</strong></td><td>Laykold ${esc(d.outer_color)}</td></tr>
    <tr><td><strong>Line color:</strong></td><td>Laykold ${esc(d.line_color)}</td></tr>
  </table>
  ${d.project_notes ? `<p><strong>Notes:</strong><br/>${esc(d.project_notes).replace(/\n/g, "<br/>")}</p>` : ""}
  <p style="margin-top:24px;padding:12px;background:#f5f5f5;border-left:4px solid #D4E020;">
    Lead has been added to the CRM with source <code>design_your_court</code> and queued for AI scoring.
  </p>
</body></html>`;

    const { error: emailErr } = await resend.emails.send({
      from: "CourtPro Designer <noreply@courtproaugusta.com>",
      to: ["estimates@courtproaugusta.com"],
      reply_to: d.email,
      subject: `New Court Design: ${d.full_name} (${d.court_type})`,
      html,
    });

    if (emailErr) console.error("Email send error:", emailErr);

    return new Response(
      JSON.stringify({ success: true, lead_id: leadRow?.id, submission_id: subRow?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("submit-court-design error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
