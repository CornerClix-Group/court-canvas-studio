import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LineItemsEditor, LineItem } from "@/components/admin/LineItemsEditor";
import { CustomerSelect } from "@/components/admin/CustomerSelect";
import { PaymentTermsSelect } from "@/components/admin/PaymentTermsSelect";
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  Receipt,
  Loader2,
  Mail,
} from "lucide-react";
import { format, addDays } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  estimate_id: string | null;
  status: string;
  subtotal: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  notes: string | null;
  due_date: string | null;
  paid_at: string | null;
  amount_paid: number | null;
}

export default function InvoiceBuilder() {
  const navigate = useNavigate();
  const { id, estimateId } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;
  const isFromEstimate = !!estimateId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [sourceEstimateId, setSourceEstimateId] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(addDays(new Date(), 30));
  const [invoiceId, setInvoiceId] = useState<string | null>(id || null);
  const [paidAt, setPaidAt] = useState<string | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  useEffect(() => {
    const initializeInvoice = async () => {
      try {
        if (isEditing) {
          // Load existing invoice
          await loadInvoice(id);
        } else if (isFromEstimate) {
          // Convert from estimate
          await loadFromEstimate(estimateId);
        } else {
          // New invoice - generate number
          await generateInvoiceNumber();
        }
      } catch (error) {
        console.error("Error initializing invoice:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load invoice data.",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeInvoice();
  }, [id, estimateId]);

  const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true });

    setInvoiceNumber(`INV-${year}-${String((count || 0) + 1).padStart(4, "0")}`);
  };

  const loadInvoice = async (invoiceId: string) => {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();

    if (invoiceError) throw invoiceError;
    if (!invoice) {
      toast({
        variant: "destructive",
        title: "Not Found",
        description: "Invoice not found.",
      });
      navigate("/admin/invoices");
      return;
    }

    setInvoiceNumber(invoice.invoice_number);
    setCustomerId(invoice.customer_id);
    setSourceEstimateId(invoice.estimate_id);
    setStatus(invoice.status);
    setTaxRate(invoice.tax_rate || 0);
    setNotes(invoice.notes || "");
    setDueDate(invoice.due_date ? new Date(invoice.due_date) : null);
    setPaidAt(invoice.paid_at);
    setAmountPaid(invoice.amount_paid || 0);

    // Load line items
    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("sort_order");

    if (items) {
      setLineItems(
        items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || "each",
          unit_price: Number(item.unit_price),
          total: Number(item.total),
          sort_order: item.sort_order,
        }))
      );
    }
  };

  const loadFromEstimate = async (estId: string) => {
    const { data: estimate, error: estimateError } = await supabase
      .from("estimates")
      .select("*")
      .eq("id", estId)
      .maybeSingle();

    if (estimateError) throw estimateError;
    if (!estimate) {
      toast({
        variant: "destructive",
        title: "Not Found",
        description: "Estimate not found.",
      });
      navigate("/admin/estimates");
      return;
    }

    // Generate new invoice number
    await generateInvoiceNumber();

    setCustomerId(estimate.customer_id);
    setSourceEstimateId(estId);
    setTaxRate(estimate.tax_rate || 0);
    setNotes(
      estimate.notes
        ? `Based on Estimate ${estimate.estimate_number}\n\n${estimate.notes}`
        : `Based on Estimate ${estimate.estimate_number}`
    );

    // Load estimate items
    const { data: items } = await supabase
      .from("estimate_items")
      .select("*")
      .eq("estimate_id", estId)
      .order("sort_order");

    if (items) {
      setLineItems(
        items.map((item) => ({
          id: crypto.randomUUID(), // New ID for invoice items
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit || "each",
          unit_price: Number(item.unit_price),
          total: Number(item.total),
          sort_order: item.sort_order,
        }))
      );
    }
  };

  const handleSave = async (shouldSend = false) => {
    if (!customerId) {
      toast({
        variant: "destructive",
        title: "Missing Customer",
        description: "Please select a customer for this invoice.",
      });
      return;
    }

    if (lineItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No Line Items",
        description: "Please add at least one line item.",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_id: customerId,
        estimate_id: sourceEstimateId,
        created_by: user?.id,
        status: shouldSend ? "sent" : "draft",
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes: notes || null,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        sent_at: shouldSend ? new Date().toISOString() : null,
      };

      let currentInvoiceId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", id);

        if (error) throw error;

        // Delete existing line items and re-insert
        await supabase.from("invoice_items").delete().eq("invoice_id", id);
        currentInvoiceId = id;
      } else {
        const { data: newInvoice, error } = await supabase
          .from("invoices")
          .insert(invoiceData)
          .select()
          .single();

        if (error) throw error;
        currentInvoiceId = newInvoice.id;
        setInvoiceId(newInvoice.id);
      }

      // Insert line items
      const itemsToInsert = lineItems.map((item, index) => ({
        invoice_id: currentInvoiceId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total: item.total,
        sort_order: index,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: shouldSend ? "Invoice Sent" : "Invoice Saved",
        description: shouldSend
          ? `Invoice ${invoiceNumber} has been saved and marked as sent.`
          : `Invoice ${invoiceNumber} has been saved as a draft.`,
      });

      navigate("/admin/invoices");
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save invoice. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoiceId) {
      toast({
        variant: "destructive",
        title: "Save First",
        description: "Please save the invoice before sending.",
      });
      return;
    }

    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-invoice-email", {
        body: { invoiceId },
      });

      if (error) throw error;

      setStatus("sent");
      toast({
        title: "Invoice Sent",
        description: `Invoice ${invoiceNumber} has been emailed to the customer.`,
      });
    } catch (error: any) {
      console.error("Error sending invoice email:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invoice email.",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPaid = status === "paid";

  return (
    <div className="space-y-6 relative">
      {/* PAID Watermark Overlay */}
      {isPaid && (
        <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
          <div 
            className="text-green-500/20 font-black text-[180px] tracking-widest rotate-[-30deg] select-none whitespace-nowrap"
            style={{ fontFamily: 'Arial Black, sans-serif' }}
          >
            PAID
          </div>
        </div>
      )}
      
      {/* Paid Banner */}
      {isPaid && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-green-700 text-lg">Invoice Paid in Full</h3>
                  <p className="text-green-600 text-sm">
                    {paidAt ? `Paid on ${format(new Date(paidAt), "MMMM d, yyyy")}` : "Payment received"}
                    {amountPaid > 0 && ` • ${formatCurrency(amountPaid)}`}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                PAID
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/invoices")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">
                {isEditing ? "Edit Invoice" : "New Invoice"}
              </h1>
              <Badge
                variant="outline"
                className={
                  status === "draft"
                    ? "bg-muted text-muted-foreground"
                    : status === "sent"
                    ? "bg-blue-500/10 text-blue-500"
                    : status === "paid"
                    ? "bg-green-500/10 text-green-500"
                    : status === "partial"
                    ? "bg-yellow-500/10 text-yellow-600"
                    : ""
                }
              >
                {status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 font-mono">
              {invoiceNumber}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving || sendingEmail}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Draft
          </Button>
          {invoiceId && status !== "draft" && (
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={saving || sendingEmail}
            >
              {sendingEmail ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Email Invoice
            </Button>
          )}
          <Button onClick={() => handleSave(true)} disabled={saving || sendingEmail}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Save & Mark Sent
          </Button>
        </div>
      </div>

      {isFromEstimate && (
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-600">
              <Receipt className="w-4 h-4" />
              <span className="text-sm font-medium">
                Creating invoice from estimate. Review and adjust as needed.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerSelect
                value={customerId}
                onChange={(id) => setCustomerId(id)}
              />
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemsEditor items={lineItems} onChange={setLineItems} />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or terms for this invoice..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentTermsSelect
                dueDate={dueDate}
                onChange={setDueDate}
              />
            </CardContent>
          </Card>

          {/* Tax */}
          <Card>
            <CardHeader>
              <CardTitle>Tax</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) =>
                    setTaxRate(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Tax ({taxRate}%)
                  </span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
