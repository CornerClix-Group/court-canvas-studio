import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Loader2,
  CreditCard,
  FileText,
  Building,
  CheckCircle,
  Calendar,
  Landmark,
  ChevronDown,
  Copy,
  Check,
  Eye,
} from "lucide-react";
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

const MERCURY_BANK = {
  beneficiary: "CourtHaus Construction, LLC",
  beneficiaryAddress: "1024 Peninsula Crossing, Evans, GA 30809",
  routing: "091311229",
  account: "202577193172",
  accountKind: "Checking",
  bankName: "Choice Financial Group",
  bankAddress: "4501 23rd Avenue S, Fargo, ND 58104",
  swift: "CHFGUS44021",
};

export default function Pay() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<"card" | "ach" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(`${field} copied`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
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

  const memo = `Invoice ${invoice.invoice_number}`;

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

        {/* PRIMARY: Pay Online via Bank (Stripe ACH - no fee) */}
        <Card className="mb-6 border-2 border-green-600 bg-green-50/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Landmark className="h-6 w-6 text-green-700" />
                <CardTitle className="text-xl text-green-900">Pay with Bank Transfer</CardTitle>
              </div>
              <span className="inline-flex items-center rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                RECOMMENDED · NO FEE
              </span>
            </div>
            <CardDescription className="text-green-800">
              Securely connect your bank in seconds. Funds debit directly — no processing fee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Amount:</span>
                <span>{formatCurrency(amountDue)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-medium">
                <span>Convenience Fee:</span>
                <span>$0.00 ✓</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base text-green-900">
                <span>Total:</span>
                <span>{formatCurrency(amountDue)}</span>
              </div>
            </div>

            <Button
              onClick={() => handlePayOnline("ach")}
              disabled={processingPayment !== null}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-14 text-base shadow-md"
              size="lg"
            >
              {processingPayment === "ach" ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Landmark className="mr-2 h-5 w-5" />
                  Pay {formatCurrency(amountDue)} with Bank — No Fee
                </>
              )}
            </Button>

            <p className="text-xs text-green-700 text-center mt-3">
              🏦 Powered by Stripe + Plaid · Bank-level encryption
            </p>
          </CardContent>
        </Card>

        {/* Reveal Bank Details (Manual Wire/ACH to Mercury) */}
        <Card className="mb-6">
          <Collapsible open={bankDetailsOpen} onOpenChange={setBankDetailsOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {bankDetailsOpen ? "Hide" : "Reveal"} bank details for direct wire / ACH
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    bankDetailsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-3">
                  Initiate a free wire or ACH transfer directly from your bank's bill pay. Please
                  include the memo so we can match your payment.
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Beneficiary Name", value: MERCURY_BANK.beneficiary },
                    { label: "Beneficiary Address", value: MERCURY_BANK.beneficiaryAddress },
                    { label: "Routing Number (ABA)", value: MERCURY_BANK.routing },
                    { label: "Account Number", value: MERCURY_BANK.account },
                    { label: "Account Type", value: MERCURY_BANK.accountKind },
                    { label: "Bank Name", value: MERCURY_BANK.bankName },
                    { label: "Bank Address", value: MERCURY_BANK.bankAddress },
                    { label: "SWIFT / BIC (international)", value: MERCURY_BANK.swift },
                    { label: "Memo / Reference", value: memo },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-mono font-medium truncate">{value}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(value, label)}
                        className="shrink-0 h-8 w-8 p-0"
                      >
                        {copiedField === label ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  ⏱️ Wire transfers post same-day; ACH transfers typically take 1–3 business days.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* SECONDARY: Card / Check */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Pay with Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Card or Wallet</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Card, Apple Pay, Cash App, Klarna · 3% fee
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span>{formatCurrency(amountDue)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Fee (3%):</span>
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
                variant="outline"
                className="w-full"
                size="sm"
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
            </CardContent>
          </Card>

          {/* Pay by Check */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Mail a Check</CardTitle>
              </div>
              <CardDescription className="text-xs">No fee · Slower</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <p className="font-semibold">{formatCurrency(amountDue)} payable to:</p>
                <p className="font-medium">{COMPANY_INFO.name}</p>
                <p className="text-muted-foreground">{COMPANY_INFO.address}</p>
                <p className="text-muted-foreground">
                  {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}
                </p>
                <p className="text-muted-foreground pt-2">
                  Memo: Invoice {invoice.invoice_number}
                </p>
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
