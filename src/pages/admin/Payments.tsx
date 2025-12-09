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
import { Search, CreditCard, DollarSign, Calendar, Building2, MoreHorizontal, Mail } from "lucide-react";
import { format } from "date-fns";
import BankTransactionsSection from "@/components/admin/BankTransactionsSection";
import { ReceiptEmailPreview } from "@/components/admin/ReceiptEmailPreview";

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: string | null;
  reference_number: string | null;
  payment_date: string;
  notes: string | null;
  created_at: string;
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

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  // Receipt preview state
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sendingReceipt, setSendingReceipt] = useState(false);

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
          )
        `)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
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

  const filteredPayments = payments.filter(
    (payment) =>
      payment.invoices?.invoice_number
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      payment.invoices?.customers?.contact_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(search.toLowerCase())
  );

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
    if (!payment.invoices?.customers?.email) {
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

    setSendingReceipt(true);
    try {
      const { error } = await supabase.functions.invoke("send-receipt-email", {
        body: { paymentId: selectedPayment.id },
      });

      if (error) throw error;

      toast({
        title: "Receipt Sent",
        description: `Receipt email sent to ${selectedPayment.invoices?.customers?.email}`,
      });
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

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice, customer, or reference..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
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
                          <TableCell className="font-mono">
                            {payment.invoices?.invoice_number || "—"}
                          </TableCell>
                          <TableCell>
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleSendReceipt(payment)}
                                  disabled={!payment.invoices?.customers?.email}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Receipt
                                  {!payment.invoices?.customers?.email && (
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
      {selectedPayment && selectedPayment.invoices && selectedPayment.invoices.customers && (
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
            notes: selectedPayment.notes,
          }}
          invoice={{
            id: selectedPayment.invoices.id,
            invoice_number: selectedPayment.invoices.invoice_number,
            total: selectedPayment.invoices.total,
            amount_paid: selectedPayment.invoices.amount_paid,
          }}
          customer={{
            contact_name: selectedPayment.invoices.customers.contact_name,
            company_name: selectedPayment.invoices.customers.company_name,
            email: selectedPayment.invoices.customers.email,
          }}
          onSendEmail={confirmSendReceipt}
          sending={sendingReceipt}
        />
      )}
    </div>
  );
}
