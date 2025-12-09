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
import { Loader2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ReceiptEmailPreview } from "./ReceiptEmailPreview";

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  payment_method: z.string().min(1, "Please select a payment method"),
  reference_number: z.string().max(100, "Reference number too long").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoice_number: string;
    total: number;
    amount_paid: number;
    customer_id?: string | null;
  };
  onPaymentRecorded: () => void;
}

interface Customer {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
}

const PAYMENT_METHODS = [
  { value: "check", label: "Check" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

export function RecordPaymentModal({
  open,
  onOpenChange,
  invoice,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendReceipt, setSendReceipt] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  
  // Receipt preview state
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{ id: string; amount: number; payment_date: string; payment_method: string | null; reference_number: string | null; notes: string | null } | null>(null);
  const [newAmountPaid, setNewAmountPaid] = useState<number>(0);

  const remainingBalance = invoice.total - (invoice.amount_paid || 0);

  // Fetch customer data
  useEffect(() => {
    async function fetchCustomer() {
      if (!invoice.customer_id) {
        setCustomer(null);
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .select("id, contact_name, company_name, email")
        .eq("id", invoice.customer_id)
        .maybeSingle();

      if (!error && data) {
        setCustomer(data);
      }
    }

    if (open) {
      fetchCustomer();
    }
  }, [open, invoice.customer_id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const resetForm = () => {
    setAmount("");
    setPaymentMethod("");
    setReferenceNumber("");
    setNotes("");
    setErrors({});
    setSendReceipt(true);
    setPendingPayment(null);
    setNewAmountPaid(0);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
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

    if (parsedAmount > remainingBalance) {
      setErrors({ amount: `Amount cannot exceed remaining balance of ${formatCurrency(remainingBalance)}` });
      return;
    }

    setSaving(true);

    try {
      const paymentDate = format(new Date(), "yyyy-MM-dd");
      
      // Insert payment record
      const { data: paymentData, error: paymentError } = await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: parsedAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
        payment_date: paymentDate,
      }).select().single();

      if (paymentError) throw paymentError;

      // Update invoice amount_paid and status
      const calculatedNewAmountPaid = (invoice.amount_paid || 0) + parsedAmount;
      const newStatus = calculatedNewAmountPaid >= invoice.total ? "paid" : "partially_paid";

      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          amount_paid: calculatedNewAmountPaid,
          status: newStatus,
          paid_at: newStatus === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", invoice.id);

      if (invoiceError) throw invoiceError;

      toast({
        title: "Payment Recorded",
        description: `${formatCurrency(parsedAmount)} payment recorded for invoice ${invoice.invoice_number}`,
      });

      // If send receipt is enabled and customer has email, show preview
      if (sendReceipt && customer?.email && paymentData) {
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
        description: `Receipt email sent to ${customer?.email}`,
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
    setAmount(remainingBalance.toFixed(2));
  };

  // If showing receipt preview
  if (showReceiptPreview && pendingPayment && customer) {
    return (
      <ReceiptEmailPreview
        open={showReceiptPreview}
        onOpenChange={(open) => {
          if (!open) handleSkipReceipt();
        }}
        payment={pendingPayment}
        invoice={{
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total: invoice.total,
          amount_paid: newAmountPaid,
        }}
        customer={customer}
        onSendEmail={handleSendReceipt}
        sending={sendingReceipt}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice{" "}
            <span className="font-mono font-medium">{invoice.invoice_number}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice Total</span>
              <span className="font-medium">{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Already Paid</span>
              <span>{formatCurrency(invoice.amount_paid || 0)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Remaining Balance</span>
              <span className="font-semibold text-primary">
                {formatCurrency(remainingBalance)}
              </span>
            </div>
          </div>

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
                  max={remainingBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePayFullBalance}
                className="whitespace-nowrap"
              >
                Pay Full Balance
              </Button>
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
              <p className="text-sm text-destructive">{errors.payment_method}</p>
            )}
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference / Check Number</Label>
            <Input
              id="referenceNumber"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., Check #1234"
              maxLength={100}
            />
            {errors.reference_number && (
              <p className="text-sm text-destructive">{errors.reference_number}</p>
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

          {/* Send Receipt Checkbox */}
          {customer?.email && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id="sendReceipt"
                checked={sendReceipt}
                onCheckedChange={(checked) => setSendReceipt(checked === true)}
              />
              <Label htmlFor="sendReceipt" className="text-sm font-normal cursor-pointer">
                Send receipt email to {customer.email}
              </Label>
            </div>
          )}
          {!customer?.email && customer && (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              No email address on file - receipt cannot be sent
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
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
      </DialogContent>
    </Dialog>
  );
}
