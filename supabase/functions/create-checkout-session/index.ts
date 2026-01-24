import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONVENIENCE_FEE_PERCENT = 0.03; // 3% convenience fee

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const { invoiceId, token, paymentMethod } = await req.json();
    if (!invoiceId && !token) {
      throw new Error("Either invoiceId or token is required");
    }
    const isACH = paymentMethod === "ach";
    logStep("Request parsed", { invoiceId, token, paymentMethod, isACH });

    // Initialize Supabase with service role to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch invoice - either by ID or by payment link token
    let invoice;
    if (token) {
      const { data, error } = await supabaseClient
        .from("invoices")
        .select(`
          *,
          customers (
            id,
            contact_name,
            company_name,
            email,
            phone,
            address,
            city,
            state,
            zip
          )
        `)
        .eq("payment_link_token", token)
        .single();
      
      if (error || !data) {
        throw new Error("Invalid payment link or invoice not found");
      }
      invoice = data;
    } else {
      const { data, error } = await supabaseClient
        .from("invoices")
        .select(`
          *,
          customers (
            id,
            contact_name,
            company_name,
            email,
            phone,
            address,
            city,
            state,
            zip
          )
        `)
        .eq("id", invoiceId)
        .single();
      
      if (error || !data) {
        throw new Error("Invoice not found");
      }
      invoice = data;
    }

    logStep("Invoice fetched", { 
      invoiceNumber: invoice.invoice_number, 
      total: invoice.total,
      amountPaid: invoice.amount_paid 
    });

    // Calculate amount due and convenience fee (ACH payments have no fee)
    const amountDue = Number(invoice.total) - Number(invoice.amount_paid || 0);
    if (amountDue <= 0) {
      throw new Error("Invoice is already fully paid");
    }

    const convenienceFee = isACH ? 0 : Math.round(amountDue * CONVENIENCE_FEE_PERCENT * 100) / 100;
    const totalWithFee = amountDue + convenienceFee;
    const totalInCents = Math.round(totalWithFee * 100);

    logStep("Amounts calculated", { 
      amountDue, 
      convenienceFee, 
      totalWithFee, 
      totalInCents,
      isACH
    });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists in Stripe
    const customerEmail = invoice.customers?.email;
    let stripeCustomerId;
    
    if (customerEmail) {
      const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        logStep("Existing Stripe customer found", { stripeCustomerId });
      }
    }

    // Build customer address for Affirm (required)
    const customerAddress = invoice.customers ? {
      line1: invoice.customers.address || "Address on file",
      city: invoice.customers.city || "City",
      state: invoice.customers.state || "GA",
      postal_code: invoice.customers.zip || "30901",
      country: "US",
    } : undefined;

    // Create Stripe Checkout Session
    const origin = req.headers.get("origin") || "https://courtproaugusta.lovable.app";
    const paymentToken = token || invoice.payment_link_token;
    
    // Build line items based on payment method
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Invoice ${invoice.invoice_number}`,
            description: `Payment for Invoice ${invoice.invoice_number} - CourtHaus Construction`,
          },
          unit_amount: Math.round(amountDue * 100),
        },
        quantity: 1,
      },
    ];

    // Add convenience fee only for non-ACH payments
    if (!isACH && convenienceFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Convenience Fee (3%)",
            description: "Processing fee for online card payments",
          },
          unit_amount: Math.round(convenienceFee * 100),
        },
        quantity: 1,
      });
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: isACH ? ["us_bank_account"] : ["card", "klarna", "cashapp", "amazon_pay", "link"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/pay/${paymentToken}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pay/${paymentToken}`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        convenience_fee: convenienceFee.toString(),
        original_amount: amountDue.toString(),
        payment_method_type: isACH ? "ach" : "card",
      },
    };

    // Add customer info if available
    if (stripeCustomerId) {
      sessionConfig.customer = stripeCustomerId;
    } else if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    // Add shipping address for Affirm compatibility
    if (customerAddress) {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ["US"],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        amountDue,
        convenienceFee,
        totalWithFee 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
