import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";

interface Invoice {
  invoice_number: string;
  total: number;
  customers: {
    contact_name: string;
    company_name: string | null;
    email: string | null;
  } | null;
}

export default function PaySuccess() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvoice() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("invoices")
          .select(`
            invoice_number,
            total,
            customers (
              contact_name,
              company_name,
              email
            )
          `)
          .eq("payment_link_token", token)
          .single();

        if (data) {
          setInvoice(data);
        }
      } catch (err) {
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [token]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice:</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">
                  {invoice.customers?.company_name || invoice.customers?.contact_name}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 text-center text-sm text-muted-foreground">
            <p>
              A confirmation email will be sent to{" "}
              {invoice?.customers?.email || "your email address"}.
            </p>
            <p>
              If you have any questions, please contact us at (706) 426-6950.
            </p>
          </div>

          <div className="pt-4">
            <Link to="/" className="block">
              <Button variant="outline" className="w-full">
                Return to Homepage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
