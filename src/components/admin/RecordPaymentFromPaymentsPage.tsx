import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, FileText, Search } from "lucide-react";
import { format } from "date-fns";
import { ReceiptEmailPreview } from "./ReceiptEmailPreview";

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  payment_method: z.string().min(1, "Please select a payment method"),
  reference_number: z.string().max(100, "Reference number too long").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  amount_paid: number | null;
  status: string;
  customer_id: string | null;
  customers: {
    id: string;
    contact_name: string;
    company_name: string | null;
    email: string | null;
  } | null;
}

interface Customer {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
}

interface RecordPaymentFromPaymentsPageProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentRecorded: () => void;
}

const PAYMENT_METHODS = [
  { value: "check", label: "Check" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

const STANDALONE_PAYMENT_TYPES = [
  { value: "deposit", label: "Deposit" },
  { value: "prepayment", label: "Prepayment" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

export function RecordPaymentFromPaymentsPage({
  open,
  onOpenChange,
  onPaymentRecorded,
}: RecordPaymentFromPaymentsPageProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "record">("select");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isStandalonePayment, setIsStandalonePayment] = useState(false);

  // Standalone payment state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [standalonePaymentType, setStandalonePaymentType] = useState<string>("");
  const [description, setDescription] = useState("");

  // Payment form state
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendReceipt, setSendReceipt] = useState(true);

  // Receipt preview state
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    id: string;
    amount: number;
    payment_date: string;
    payment_method: string | null;
    reference_number: string | null;
    notes: string | null;
  } | null>(null);
  const [newAmountPaid, setNewAmountPaid] = useState<number>(0);

  // Fetch unpaid/partially paid invoices
  useEffect(() => {
    async function fetchInvoices() {
      setLoadingInvoices(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          total,
          amount_paid,
          status,
          customer_id,
          customers (
            id,
            contact_name,
            company_name,
            email
          )
        `)
        .in("status", ["sent", "overdue", "partially_paid"])
        .order("created_at", { ascending: false });

      if (!error && data) {
        setInvoices(data as Invoice[]);
      }
      setLoadingInvoices(false);
    }

    if (open) {
      fetchInvoices();
    }
  }, [open]);

  // Fetch customers for standalone payments
  useEffect(() => {
    async function fetchCustomers() {
      setLoadingCustomers(true);
      const { data, error } = await supabase
        .from("customers")
        .select("id, contact_name, company_name, email")
        .order("contact_name");

      if (!error && data) {
        setCustomers(data);
      }
      setLoadingCustomers(false);
    }

    if (open && isStandalonePayment) {
      fetchCustomers();
    }
  }, [open, isStandalonePayment]);

  const filteredInvoices = invoices.filter((inv) => {
    const query = searchQuery.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(query) ||
      inv.customers?.contact_name?.toLowerCase().includes(query) ||
      inv.customers?.company_name?.toLowerCase().includes(query)
    );
  });

  const remainingBalance = selectedInvoice
    ? selectedInvoice.total - (selectedInvoice.amount_paid || 0)
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const resetForm = () => {
    setStep("select");
    setSelectedInvoice(null);
    setIsStandalonePayment(false);
    setSearchQuery("");
    setAmount("");
    setPaymentMethod("");
    setReferenceNumber("");
    setNotes("");
    setErrors({});
    setSendReceipt(true);
    setPendingPayment(null);
    setNewAmountPaid(0);
    setSelectedCustomer(null);
    setStandalonePaymentType("");
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsStandalonePayment(false);
    setStep("record");
  };

  const handleStandalonePayment = () => {
    setSelectedInvoice(null);
    setIsStandalonePayment(true);
    setStep("record");
  };

  const handleBack = () => {
    setStep("select");
    setSelectedInvoice(null);
    setIsStandalonePayment(false);
    setSelectedCustomer(null);
    setStandalonePaymentType("");
    setDescription("");
    setAmount("");
    setPaymentMethod("");
    setReferenceNumber("");
    setNotes("");
    setErrors({});
  };

  const handleSubmit = async () => {
    setErrors({});

    const parsedAmount = parseFloat(amount);

    // Validate
    const result = paymentSchema.safeParse({
      amount: parsedAmount,
      payment_method: paymentMethod,
      reference_number: referenceNumber || undefined,
      notes: notes || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (selectedInvoice && parsedAmount > remainingBalance) {
      setErrors({
        amount: `Amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}`,
      });
      return;
    }

    // Validate standalone payment fields
    if (isStandalonePayment) {
      if (!standalonePaymentType) {
        setErrors({ payment_type: "Please select a payment type" });
        return;
      }
      if (!description.trim()) {
        setErrors({ description: "Please provide a description" });
        return;
      }
    }

    setSaving(true);

    try {
      const paymentDate = format(new Date(), "yyyy-MM-dd");

      if (selectedInvoice) {
        // Invoice-linked payment
        const { data: paymentData, error: paymentError } = await supabase
          .from("payments")
          .insert({
            invoice_id: selectedInvoice.id,
            amount: parsedAmount,
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            notes: notes || null,
            payment_date: paymentDate,
            payment_type: "invoice_payment",
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // Update invoice amount_paid and status
        const calculatedNewAmountPaid =
          (selectedInvoice.amount_paid || 0) + parsedAmount;
        const newStatus =
          calculatedNewAmountPaid >= selectedInvoice.total
            ? "paid"
            : "partially_paid";

        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({
            amount_paid: calculatedNewAmountPaid,
            status: newStatus,
            paid_at: newStatus === "paid" ? new Date().toISOString() : null,
          })
          .eq("id", selectedInvoice.id);

        if (invoiceError) throw invoiceError;

        toast({
          title: "Payment Recorded",
          description: `${formatCurrency(parsedAmount)} payment recorded for invoice ${selectedInvoice.invoice_number}`,
        });

        // If send receipt is enabled and customer has email, show preview
        if (sendReceipt && selectedInvoice.customers?.email && paymentData) {
          setPendingPayment({
            id: paymentData.id,
            amount: parsedAmount,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            notes: notes || null,
          });
          setNewAmountPaid(calculatedNewAmountPaid);
          setShowReceiptPreview(true);
          setSaving(false);
        } else {
          handleClose();
          onPaymentRecorded();
        }
      } else {
        // Standalone payment (deposit, prepayment, miscellaneous)
        const { error: paymentError } = await supabase
          .from("payments")
          .insert({
            invoice_id: null,
            amount: parsedAmount,
            payment_method: paymentMethod,
            reference_number: referenceNumber || null,
            notes: notes || null,
            payment_date: paymentDate,
            payment_type: standalonePaymentType,
            description: description,
            customer_id: selectedCustomer?.id || null,
          });

        if (paymentError) throw paymentError;

        const typeLabel = STANDALONE_PAYMENT_TYPES.find(
          (t) => t.value === standalonePaymentType
        )?.label;

        toast({
          title: "Payment Recorded",
          description: `${formatCurrency(parsedAmount)} ${typeLabel?.toLowerCase()} recorded successfully`,
        });

        handleClose();
        onPaymentRecorded();
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record payment. Please try again.",
      });
      setSaving(false);
    }
  };

  const handleSendReceipt = async () => {
    if (!pendingPayment) return;

    setSendingReceipt(true);
    try {
      const { error } = await supabase.functions.invoke("send-receipt-email", {
        body: { paymentId: pendingPayment.id },
      });

      if (error) throw error;

      toast({
        title: "Receipt Sent",
        description: `Receipt email sent to ${selectedInvoice?.customers?.email}`,
      });
    } catch (error) {
      console.error("Error sending receipt:", error);
      toast({
        variant: "destructive",
        title: "Receipt Not Sent",
        description: "Payment recorded but failed to send receipt email.",
      });
    } finally {
      setSendingReceipt(false);
      setShowReceiptPreview(false);
      handleClose();
      onPaymentRecorded();
    }
  };

  const handleSkipReceipt = () => {
    setShowReceiptPreview(false);
    handleClose();
    onPaymentRecorded();
  };

  const handlePayFullBalance = () => {
    if (selectedInvoice) {
      setAmount(remainingBalance.toFixed(2));
    }
  };

  // If showing receipt preview
  if (showReceiptPreview && pendingPayment && selectedInvoice?.customers) {
    return (
      <ReceiptEmailPreview
        open={showReceiptPreview}
        onOpenChange={(open) => {
          if (!open) handleSkipReceipt();
        }}
        payment={pendingPayment}
        invoice={{
          id: selectedInvoice.id,
          invoice_number: selectedInvoice.invoice_number,
          total: selectedInvoice.total,
          amount_paid: newAmountPaid,
        }}
        customer={{
          contact_name: selectedInvoice.customers.contact_name,
          company_name: selectedInvoice.customers.company_name,
          email: selectedInvoice.customers.email,
        }}
        onSendEmail={handleSendReceipt}
        sending={sendingReceipt}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {step === "select" ? (
          <>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Select an invoice to record a payment against, or record a
                standalone payment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Invoice List */}
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                {loadingInvoices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No unpaid invoices found
                  </div>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      onClick={() => handleSelectInvoice(invoice)}
                      className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium font-mono text-sm">
                            {invoice.invoice_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {invoice.customers?.company_name ||
                              invoice.customers?.contact_name ||
                              "Unknown customer"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {formatCurrency(
                            invoice.total - (invoice.amount_paid || 0)
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          remaining
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Standalone Payment Option */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleStandalonePayment}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment Without Invoice
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  For deposits, prepayments, or miscellaneous receipts
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {isStandalonePayment
                  ? "Record Standalone Payment"
                  : "Record Payment"}
              </DialogTitle>
              <DialogDescription>
                {selectedInvoice ? (
                  <>
                    Recording payment for invoice{" "}
                    <span className="font-mono font-medium">
                      {selectedInvoice.invoice_number}
                    </span>
                  </>
                ) : (
                  "Record a payment without linking to an invoice"
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Invoice Summary (only for invoice-linked) */}
              {selectedInvoice && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Total</span>
                    <span className="font-medium">
                      {formatCurrency(selectedInvoice.total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already Paid</span>
                    <span>
                      {formatCurrency(selectedInvoice.amount_paid || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Remaining Balance</span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(remainingBalance)}
                    </span>
                  </div>
                </div>
              )}

              {/* Standalone Payment Fields */}
              {isStandalonePayment && (
                <>
                  {/* Payment Type */}
                  <div className="space-y-2">
                    <Label htmlFor="standalonePaymentType">Payment Type *</Label>
                    <Select
                      value={standalonePaymentType}
                      onValueChange={setStandalonePaymentType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {STANDALONE_PAYMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.payment_type && (
                      <p className="text-sm text-destructive">
                        {errors.payment_type}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Deposit for Smith project"
                      maxLength={200}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Customer (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer (Optional)</Label>
                    <Select
                      value={selectedCustomer?.id || ""}
                      onValueChange={(value) => {
                        const customer = customers.find((c) => c.id === value);
                        setSelectedCustomer(customer || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCustomers ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.company_name || customer.contact_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={selectedInvoice ? remainingBalance : undefined}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                    />
                  </div>
                  {selectedInvoice && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePayFullBalance}
                      className="whitespace-nowrap"
                    >
                      Pay Full Balance
                    </Button>
                  )}
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment_method && (
                  <p className="text-sm text-destructive">
                    {errors.payment_method}
                  </p>
                )}
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">
                  Reference / Check Number
                </Label>
                <Input
                  id="referenceNumber"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g., Check #1234"
                  maxLength={100}
                />
                {errors.reference_number && (
                  <p className="text-sm text-destructive">
                    {errors.reference_number}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional payment notes..."
                  rows={2}
                  maxLength={500}
                />
                {errors.notes && (
                  <p className="text-sm text-destructive">{errors.notes}</p>
                )}
              </div>

              {/* Send Receipt Checkbox (only for invoice-linked with email) */}
              {selectedInvoice?.customers?.email && (
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Checkbox
                    id="sendReceipt"
                    checked={sendReceipt}
                    onCheckedChange={(checked) =>
                      setSendReceipt(checked === true)
                    }
                  />
                  <Label
                    htmlFor="sendReceipt"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Send receipt email to {selectedInvoice.customers.email}
                  </Label>
                </div>
              )}
              {selectedInvoice &&
                !selectedInvoice.customers?.email &&
                selectedInvoice.customers && (
                  <p className="text-sm text-muted-foreground pt-2 border-t">
                    No email address on file - receipt cannot be sent
                  </p>
                )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleBack} disabled={saving}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
