import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      // For development, parse without verification
      event = JSON.parse(body);
      logStep("Webhook parsed without signature verification (dev mode)");
    }

    logStep("Event received", { type: event.type, id: event.id });

    // Initialize Supabase with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", { 
        sessionId: session.id,
        paymentStatus: session.payment_status,
        metadata: session.metadata 
      });

      if (session.payment_status === "paid") {
        const invoiceId = session.metadata?.invoice_id;
        const invoiceNumber = session.metadata?.invoice_number;
        const convenienceFee = parseFloat(session.metadata?.convenience_fee || "0");
        const originalAmount = parseFloat(session.metadata?.original_amount || "0");

        if (!invoiceId) {
          logStep("No invoice_id in metadata, skipping");
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        // Fetch invoice to get customer_id
        const { data: invoice, error: invoiceError } = await supabaseClient
          .from("invoices")
          .select("id, customer_id, total, amount_paid")
          .eq("id", invoiceId)
          .single();

        if (invoiceError || !invoice) {
          logStep("Invoice not found", { invoiceId, error: invoiceError });
          return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404 });
        }

        // Determine payment method type from session
        let paymentMethodType = "card";
        if (session.payment_method_types?.includes("affirm")) {
          // Check if Affirm was actually used
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          if (paymentIntent.payment_method) {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);
            paymentMethodType = paymentMethod.type;
          }
        }

        logStep("Recording payment", { 
          invoiceId, 
          amount: originalAmount, 
          convenienceFee,
          paymentMethodType 
        });

        // Record the payment
        const { data: payment, error: paymentError } = await supabaseClient
          .from("payments")
          .insert({
            invoice_id: invoiceId,
            customer_id: invoice.customer_id,
            amount: originalAmount,
            convenience_fee_amount: convenienceFee,
            payment_method: paymentMethodType,
            payment_type: "invoice_payment",
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent as string,
            reference_number: session.id,
            notes: `Online payment via Stripe (${paymentMethodType}). Convenience fee: $${convenienceFee.toFixed(2)}`,
          })
          .select()
          .single();

        if (paymentError) {
          logStep("Failed to record payment", { error: paymentError });
          throw new Error(`Failed to record payment: ${paymentError.message}`);
        }

        logStep("Payment recorded", { paymentId: payment.id });

        // Update invoice status and amount_paid
        const newAmountPaid = Number(invoice.amount_paid || 0) + originalAmount;
        const invoiceTotal = Number(invoice.total);
        const newStatus = newAmountPaid >= invoiceTotal ? "paid" : "partially_paid";

        const { error: updateError } = await supabaseClient
          .from("invoices")
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
            paid_at: newStatus === "paid" ? new Date().toISOString() : null,
          })
          .eq("id", invoiceId);

        if (updateError) {
          logStep("Failed to update invoice", { error: updateError });
        } else {
          logStep("Invoice updated", { newAmountPaid, newStatus });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500 }
    );
  }
});
