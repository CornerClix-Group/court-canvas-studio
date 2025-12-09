import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { Search, CreditCard, DollarSign, Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";
import BankTransactionsSection from "@/components/admin/BankTransactionsSection";

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
    invoice_number: string;
    customers: {
      contact_name: string;
      company_name: string | null;
    } | null;
  } | null;
}

const methodColors: Record<string, string> = {
  cash: "bg-green-500/10 text-green-500 border-green-500/20",
  check: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  card: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  ach: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  other: "bg-muted text-muted-foreground border-muted",
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          invoices (
            invoice_number,
            customers (
              contact_name,
              company_name
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
                                className={methodColors[payment.payment_method]}
                              >
                                {payment.payment_method}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.reference_number || "—"}
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
    </div>
  );
}