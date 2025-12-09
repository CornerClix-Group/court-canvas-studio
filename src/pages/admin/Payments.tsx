import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Search, CreditCard, DollarSign, Calendar, Building2, MoreHorizontal, Mail, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import BankTransactionsSection from "@/components/admin/BankTransactionsSection";
import { ReceiptEmailPreview } from "@/components/admin/ReceiptEmailPreview";
import { RecordPaymentFromPaymentsPage } from "@/components/admin/RecordPaymentFromPaymentsPage";
import { EmailStatusBadge, EmailLog } from "@/components/admin/EmailStatusBadge";

// EmailLog is now imported from EmailStatusBadge

interface Payment {
  id: string;
  invoice_id: string | null;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  payment_date: string;
  notes: string | null;
  created_at: string;
  receipt_sent_at: string | null;
  payment_type: string;
  description: string | null;
  customer_id: string | null;
  invoices: {
    id: string;
    invoice_number: string;
    total: number;
    amount_paid: number | null;
    customer_id: string | null;
    customers: {
      id: string;
      contact_name: string;
      company_name: string | null;
      email: string | null;
    } | null;
  } | null;
  customers: {
    id: string;
    contact_name: string;
    company_name: string | null;
    email: string | null;
  } | null;
  emailLog?: EmailLog | null;
}

const methodColors: Record<string, string> = {
  cash: "bg-green-500/10 text-green-500 border-green-500/20",
  check: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  card: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  credit_card: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  bank_transfer: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  ach: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  other: "bg-muted text-muted-foreground border-muted",
};

// Helper to check if receipt was already sent
const hasReceiptBeenSent = (payment: Payment) => {
  return !!(payment.emailLog || payment.receipt_sent_at);
};

// Helper to check if receipt email failed
const receiptFailed = (payment: Payment) => {
  return payment.emailLog?.status === "failed" || payment.emailLog?.status === "bounced";
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Receipt preview state
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  
  // Record payment modal state
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          invoices (
            id,
            invoice_number,
            total,
            amount_paid,
            customer_id,
            customers (
              id,
              contact_name,
              company_name,
              email
            )
          ),
          customers (
            id,
            contact_name,
            company_name,
            email
          )
        `)
        .order("payment_date", { ascending: false });

      if (error) throw error;

      // Fetch email logs for all payment IDs
      const paymentIds = (data || []).map(p => p.id);
      const { data: emailLogs } = await supabase
        .from("email_logs")
        .select("*")
        .eq("email_type", "receipt")
        .in("related_id", paymentIds);

      // Map email logs to payments
      const paymentsWithLogs = (data || []).map(payment => ({
        ...payment,
        emailLog: emailLogs?.find(log => log.related_id === payment.id) || null,
      }));

      setPayments(paymentsWithLogs as Payment[]);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payments. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const searchLower = search.toLowerCase();
    return (
      payment.invoices?.invoice_number?.toLowerCase().includes(searchLower) ||
      payment.invoices?.customers?.contact_name?.toLowerCase().includes(searchLower) ||
      payment.customers?.contact_name?.toLowerCase().includes(searchLower) ||
      payment.customers?.company_name?.toLowerCase().includes(searchLower) ||
      payment.description?.toLowerCase().includes(searchLower) ||
      payment.reference_number?.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const totalPayments = filteredPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const handleSendReceipt = (payment: Payment) => {
    const customerEmail = payment.invoices?.customers?.email || payment.customers?.email;
    if (!customerEmail) {
      toast({
        variant: "destructive",
        title: "No Email Address",
        description: "Customer does not have an email address on file.",
      });
      return;
    }
    setSelectedPayment(payment);
    setShowReceiptPreview(true);
  };

  const confirmSendReceipt = async () => {
    if (!selectedPayment) return;

    const customerEmail = selectedPayment.invoices?.customers?.email || selectedPayment.customers?.email;
    
    setSendingReceipt(true);
    try {
      const { error } = await supabase.functions.invoke("send-receipt-email", {
        body: { paymentId: selectedPayment.id },
      });

      if (error) throw error;

      toast({
        title: "Receipt Sent",
        description: `Receipt email sent to ${customerEmail}`,
      });
      
      // Refresh payments to show updated receipt_sent_at
      fetchPayments();
    } catch (error) {
      console.error("Error sending receipt:", error);
      toast({
        variant: "destructive",
        title: "Failed to Send",
        description: "Failed to send receipt email. Please try again.",
      });
    } finally {
      setSendingReceipt(false);
      setShowReceiptPreview(false);
      setSelectedPayment(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">
          View payments and Mercury bank transactions
        </p>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Recorded Payments
          </TabsTrigger>
          <TabsTrigger value="mercury" className="gap-2">
            <Building2 className="w-4 h-4" />
            Mercury Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          {/* Summary Card */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Collected
                </CardTitle>
                <DollarSign className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {formatCurrency(totalPayments)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {filteredPayments.length} payment
                  {filteredPayments.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by invoice, customer, or reference..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setShowRecordPaymentModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment History ({filteredPayments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading payments...
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {search
                    ? "No payments match your search"
                    : "No payments recorded yet. Payments will appear here when recorded against invoices."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Receipt</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {format(new Date(payment.payment_date), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.invoices ? (
                              <span className="font-mono">
                                {payment.invoices.invoice_number}
                              </span>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                {payment.payment_type === "deposit"
                                  ? "Deposit"
                                  : payment.payment_type === "prepayment"
                                  ? "Prepayment"
                                  : "Misc"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {/* Show customer from invoice or direct customer */}
                            {payment.invoices?.customers ? (
                              <div>
                                <div className="font-medium">
                                  {payment.invoices.customers.contact_name}
                                </div>
                                {payment.invoices.customers.company_name && (
                                  <div className="text-sm text-muted-foreground">
                                    {payment.invoices.customers.company_name}
                                  </div>
                                )}
                              </div>
                            ) : payment.customers ? (
                              <div>
                                <div className="font-medium">
                                  {payment.customers.contact_name}
                                </div>
                                {payment.customers.company_name && (
                                  <div className="text-sm text-muted-foreground">
                                    {payment.customers.company_name}
                                  </div>
                                )}
                              </div>
                            ) : payment.description ? (
                              <div className="text-sm text-muted-foreground italic">
                                {payment.description}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 font-medium text-green-600">
                              <DollarSign className="w-3 h-3" />
                              {formatCurrency(payment.amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.payment_method ? (
                              <Badge
                                variant="outline"
                                className={methodColors[payment.payment_method] || methodColors.other}
                              >
                                {payment.payment_method.replace("_", " ")}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.reference_number || "—"}
                          </TableCell>
                          <TableCell>
                            <EmailStatusBadge 
                              emailLog={payment.emailLog} 
                              fallbackSentAt={payment.receipt_sent_at}
                              showResendHint={receiptFailed(payment)}
                            />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleSendReceipt(payment)}
                                  disabled={!payment.invoices?.customers?.email && !payment.customers?.email}
                                  className={receiptFailed(payment) ? "text-destructive" : ""}
                                >
                                  {hasReceiptBeenSent(payment) ? (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                  ) : (
                                    <Mail className="mr-2 h-4 w-4" />
                                  )}
                                  {hasReceiptBeenSent(payment) ? "Resend Receipt" : "Send Receipt"}
                                  {!payment.invoices?.customers?.email && !payment.customers?.email && (
                                    <span className="ml-2 text-xs text-muted-foreground">(No email)</span>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mercury" className="space-y-6">
          <BankTransactionsSection />
        </TabsContent>
      </Tabs>

      {/* Receipt Email Preview Modal */}
      {selectedPayment && (selectedPayment.invoices?.customers || selectedPayment.customers) && (
        <ReceiptEmailPreview
          open={showReceiptPreview}
          onOpenChange={(open) => {
            setShowReceiptPreview(open);
            if (!open) setSelectedPayment(null);
          }}
          payment={{
            id: selectedPayment.id,
            amount: selectedPayment.amount,
            payment_date: selectedPayment.payment_date,
            payment_method: selectedPayment.payment_method,
            reference_number: selectedPayment.reference_number,
            payment_type: selectedPayment.payment_type,
            description: selectedPayment.description,
          }}
          invoice={selectedPayment.invoices ? {
            id: selectedPayment.invoices.id,
            invoice_number: selectedPayment.invoices.invoice_number,
            total: selectedPayment.invoices.total,
            amount_paid: selectedPayment.invoices.amount_paid,
          } : null}
          customer={{
            contact_name: selectedPayment.invoices?.customers?.contact_name || selectedPayment.customers?.contact_name || '',
            company_name: selectedPayment.invoices?.customers?.company_name || selectedPayment.customers?.company_name || null,
            email: selectedPayment.invoices?.customers?.email || selectedPayment.customers?.email || null,
          }}
          onSendEmail={confirmSendReceipt}
          sending={sendingReceipt}
        />
      )}

      {/* Record Payment Modal */}
      <RecordPaymentFromPaymentsPage
        open={showRecordPaymentModal}
        onOpenChange={setShowRecordPaymentModal}
        onPaymentRecorded={fetchPayments}
      />
    </div>
  );
}
