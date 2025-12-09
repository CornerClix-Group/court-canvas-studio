import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCURY_API_BASE = "https://api.mercury.com/api/v1";

interface MercuryTransaction {
  id: string;
  amount: number;
  status: string;
  counterpartyName: string;
  counterpartyId: string;
  note: string;
  bankDescription: string;
  kind: string;
  postedAt: string;
  createdAt: string;
}

interface MercuryAccount {
  id: string;
  name: string;
  currentBalance: number;
  availableBalance: number;
  accountNumber: string;
  routingNumber: string;
  type: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mercuryApiKey = Deno.env.get("MERCURY_API_KEY");
    if (!mercuryApiKey) {
      throw new Error("Mercury API key not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    console.log("Mercury sync action:", action);

    // Fetch accounts first
    const accountsResponse = await fetch(`${MERCURY_API_BASE}/accounts`, {
      headers: {
        "Authorization": `Bearer ${mercuryApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error("Mercury API error:", errorText);
      throw new Error(`Mercury API error: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    const accounts: MercuryAccount[] = accountsData.accounts || [];

    console.log("Found accounts:", accounts.length);

    if (action === "get-accounts") {
      return new Response(
        JSON.stringify({ accounts }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (action === "sync-transactions") {
      let totalTransactions = 0;
      let matchedPayments = 0;

      for (const account of accounts) {
        // Fetch recent transactions (last 90 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);

        const transactionsResponse = await fetch(
          `${MERCURY_API_BASE}/account/${account.id}/transactions?start=${thirtyDaysAgo.toISOString().split('T')[0]}`,
          {
            headers: {
              "Authorization": `Bearer ${mercuryApiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!transactionsResponse.ok) {
          console.error(`Error fetching transactions for account ${account.id}`);
          continue;
        }

        const transactionsData = await transactionsResponse.json();
        const transactions: MercuryTransaction[] = transactionsData.transactions || [];

        console.log(`Account ${account.name}: ${transactions.length} transactions`);

        for (const tx of transactions) {
          // Only process credit transactions (incoming payments)
          if (tx.amount <= 0) continue;

          totalTransactions++;

          // Upsert transaction
          const { error: upsertError } = await supabase
            .from("bank_transactions")
            .upsert({
              mercury_id: tx.id,
              account_id: account.id,
              amount: tx.amount,
              status: tx.status,
              counterparty_name: tx.counterpartyName,
              counterparty_id: tx.counterpartyId,
              description: tx.note,
              bank_description: tx.bankDescription,
              transaction_type: tx.kind,
              posted_at: tx.postedAt,
            }, {
              onConflict: "mercury_id",
            });

          if (upsertError) {
            console.error("Error upserting transaction:", upsertError);
            continue;
          }

          // Try to match with outstanding invoices
          // Check if invoice number is mentioned in description or note
          const searchText = `${tx.note || ''} ${tx.bankDescription || ''}`.toLowerCase();
          
          // Find invoices with matching amount that aren't fully paid
          const { data: matchingInvoices } = await supabase
            .from("invoices")
            .select("id, invoice_number, total, amount_paid")
            .eq("status", "sent")
            .lte("total", tx.amount * 1.01) // Allow 1% tolerance
            .gte("total", tx.amount * 0.99);

          if (matchingInvoices && matchingInvoices.length > 0) {
            // Check if any invoice number is mentioned
            for (const invoice of matchingInvoices) {
              const invoiceRef = invoice.invoice_number.toLowerCase();
              if (searchText.includes(invoiceRef) || 
                  Math.abs(invoice.total - (invoice.amount_paid || 0) - tx.amount) < 0.01) {
                
                // Check if not already matched
                const { data: existingMatch } = await supabase
                  .from("bank_transactions")
                  .select("id")
                  .eq("mercury_id", tx.id)
                  .not("matched_invoice_id", "is", null)
                  .maybeSingle();

                if (!existingMatch) {
                  // Update bank transaction with match
                  await supabase
                    .from("bank_transactions")
                    .update({ matched_invoice_id: invoice.id })
                    .eq("mercury_id", tx.id);

                  matchedPayments++;
                  console.log(`Matched transaction ${tx.id} to invoice ${invoice.invoice_number}`);
                }
                break;
              }
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          accounts: accounts.length,
          transactions: totalTransactions,
          matched: matchedPayments,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in mercury-sync function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
