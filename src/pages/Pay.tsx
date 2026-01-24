import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, FileText, Building, CheckCircle, Calendar, Landmark } from "lucide-react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  amount_paid: number;
  status: string;
  due_date: string | null;
  customers: {
    contact_name: string;
    company_name: string | null;
    email: string | null;
  } | null;
}

const CONVENIENCE_FEE_PERCENT = 0.03;

const COMPANY_INFO = {
  name: "CourtHaus Construction, LLC",
  address: "500 Furys Ferry Rd. Suite 107",
  city: "Augusta",
  state: "GA",
  zip: "30907",
};

export default function Pay() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<"card" | "ach" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      if (!token) {
        setError("Invalid payment link");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("invoices")
          .select(`
            id,
            invoice_number,
            total,
            amount_paid,
            status,
            due_date,
            customers (
              contact_name,
              company_name,
              email
            )
          `)
          .eq("payment_link_token", token)
          .single();

        if (fetchError || !data) {
          setError("Invoice not found or payment link has expired");
          return;
        }

        setInvoice(data);
      } catch (err) {
        setError("Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [token]);

  const amountDue = invoice ? Number(invoice.total) - Number(invoice.amount_paid || 0) : 0;
  const convenienceFee = amountDue * CONVENIENCE_FEE_PERCENT;
  const totalWithFee = amountDue + convenienceFee;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Upon Receipt";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePayOnline = async (paymentMethod: "card" | "ach" = "card") => {
    if (!token) return;

    setProcessingPayment(paymentMethod);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { token, paymentMethod },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setProcessingPayment(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Payment Link Error</CardTitle>
            <CardDescription>{error || "Invoice not found"}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              If you believe this is an error, please contact us at (706) 426-6950.
            </p>
            <Link to="/">
              <Button variant="outline">Return to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invoice.status === "paid" || amountDue <= 0) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Invoice Already Paid</CardTitle>
            <CardDescription>
              Invoice {invoice.invoice_number} has been fully paid.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Thank you for your payment!
            </p>
            <Link to="/">
              <Button variant="outline">Return to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">{COMPANY_INFO.name}</h1>
          <p className="text-muted-foreground">Payment Portal</p>
        </div>

        {/* Invoice Summary */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Invoice {invoice.invoice_number}</CardTitle>
            </div>
            <CardDescription>
              {invoice.customers?.company_name || invoice.customers?.contact_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Total:</span>
                <span>{formatCurrency(Number(invoice.total))}</span>
              </div>
              {Number(invoice.amount_paid) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="text-green-600">-{formatCurrency(Number(invoice.amount_paid))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Amount Due:</span>
                <span>{formatCurrency(amountDue)}</span>
              </div>
              {invoice.due_date && (
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {formatDate(invoice.due_date)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Options */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pay by Check */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Pay by Check</CardTitle>
              </div>
              <CardDescription>No additional fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 mb-4">
                <p className="font-semibold mb-2">Amount: {formatCurrency(amountDue)}</p>
                <p className="text-sm text-muted-foreground mb-3">Make check payable to:</p>
                <p className="font-medium">{COMPANY_INFO.name}</p>
                <p className="text-sm text-muted-foreground">{COMPANY_INFO.address}</p>
                <p className="text-sm text-muted-foreground">
                  {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Please include invoice number {invoice.invoice_number} on your check.
              </p>
            </CardContent>
          </Card>

          {/* Pay Online - Card/Wallet */}
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Pay with Card or Wallet</CardTitle>
              </div>
              <CardDescription>Credit card, Apple Pay, Cash App, Klarna</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Amount:</span>
                  <span>{formatCurrency(amountDue)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Convenience Fee (3%):</span>
                  <span>{formatCurrency(convenienceFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(totalWithFee)}</span>
                </div>
              </div>

              <Button 
                onClick={() => handlePayOnline("card")} 
                disabled={processingPayment !== null}
                className="w-full mb-4"
                size="lg"
              >
                {processingPayment === "card" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay {formatCurrency(totalWithFee)}
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>💳 Cards • 📱 Apple Pay, Cash App, Amazon Pay</p>
                <p>📅 Klarna - Pay in 4 or finance over time</p>
              </div>
            </CardContent>
          </Card>

          {/* Pay Online - ACH Bank Transfer (No Fee) */}
          <Card className="border-green-500 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg text-green-800">Pay with Bank Transfer</CardTitle>
              </div>
              <CardDescription className="text-green-700">ACH Direct Debit - No convenience fee!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Amount:</span>
                  <span>{formatCurrency(amountDue)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Convenience Fee:</span>
                  <span>$0.00 ✓</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-green-800">
                  <span>Total:</span>
                  <span>{formatCurrency(amountDue)}</span>
                </div>
              </div>

              <Button 
                onClick={() => handlePayOnline("ach")} 
                disabled={processingPayment !== null}
                className="w-full mb-4 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {processingPayment === "ach" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Landmark className="mr-2 h-4 w-4" />
                    Pay {formatCurrency(amountDue)} - No Fee
                  </>
                )}
              </Button>

              <div className="text-xs text-green-700 text-center space-y-1">
                <p className="font-medium">🏦 Connect your bank account securely</p>
                <p>Funds are debited directly - no processing fee</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Questions? Contact us at (706) 426-6950</p>
          <p className="mt-1">
            <Link to="/" className="text-primary hover:underline">
              Visit our website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
