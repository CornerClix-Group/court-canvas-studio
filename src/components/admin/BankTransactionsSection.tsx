import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Link, Check, X, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";

interface BankTransaction {
  id: string;
  mercury_id: string;
  amount: number;
  status: string;
  counterparty_name: string | null;
  description: string | null;
  bank_description: string | null;
  transaction_type: string | null;
  posted_at: string | null;
  matched_invoice_id: string | null;
  matched_payment_id: string | null;
  invoices?: {
    invoice_number: string;
    customers?: {
      contact_name: string;
    } | null;
  } | null;
}

interface UnmatchedInvoice {
  id: string;
  invoice_number: string;
  total: number;
  amount_paid: number | null;
  customers: {
    contact_name: string;
  } | null;
}

export default function BankTransactionsSection() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [unmatchedInvoices, setUnmatchedInvoices] = useState<UnmatchedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [matching, setMatching] = useState(false);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("bank_transactions")
        .select(`
          *,
          invoices (
            invoice_number,
            customers (
              contact_name
            )
          )
        `)
        .order("posted_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load bank transactions.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUnmatchedInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          invoice_number,
          total,
          amount_paid,
          customers (
            contact_name
          )
        `)
        .in("status", ["sent", "partial"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUnmatchedInvoices(data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchUnmatchedInvoices();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const openMatchDialog = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    setSelectedInvoiceId("");
    setMatchDialogOpen(true);
  };

  const handleMatch = async () => {
    if (!selectedTransaction || !selectedInvoiceId) return;

    setMatching(true);
    try {
      // Update bank transaction with matched invoice
      const { error: txError } = await supabase
        .from("bank_transactions")
        .update({ matched_invoice_id: selectedInvoiceId })
        .eq("id", selectedTransaction.id);

      if (txError) throw txError;

      // Create a payment record
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          invoice_id: selectedInvoiceId,
          amount: selectedTransaction.amount,
          payment_method: "ach",
          reference_number: selectedTransaction.mercury_id,
          notes: `Auto-matched from Mercury: ${selectedTransaction.counterparty_name || selectedTransaction.description}`,
        });

      if (paymentError) throw paymentError;

      // Update invoice amount_paid
      const invoice = unmatchedInvoices.find(i => i.id === selectedInvoiceId);
      if (invoice) {
        const newAmountPaid = (invoice.amount_paid || 0) + selectedTransaction.amount;
        const newStatus = newAmountPaid >= invoice.total ? "paid" : "partial";

        await supabase
          .from("invoices")
          .update({ 
            amount_paid: newAmountPaid,
            status: newStatus,
            paid_at: newStatus === "paid" ? new Date().toISOString() : null
          })
          .eq("id", selectedInvoiceId);
      }

      toast({
        title: "Transaction matched",
        description: "Payment has been recorded and invoice updated.",
      });

      setMatchDialogOpen(false);
      fetchTransactions();
      fetchUnmatchedInvoices();
    } catch (error) {
      console.error("Error matching transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to match transaction. Please try again.",
      });
    } finally {
      setMatching(false);
    }
  };

  const handleUnmatch = async (transaction: BankTransaction) => {
    try {
      const { error } = await supabase
        .from("bank_transactions")
        .update({ matched_invoice_id: null, matched_payment_id: null })
        .eq("id", transaction.id);

      if (error) throw error;

      toast({
        title: "Match removed",
        description: "Transaction has been unmatched from the invoice.",
      });

      fetchTransactions();
      fetchUnmatchedInvoices();
    } catch (error) {
      console.error("Error unmatching:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unmatch transaction.",
      });
    }
  };

  const deposits = transactions.filter(t => t.amount > 0);
  const matchedDeposits = deposits.filter(t => t.matched_invoice_id);
  const unmatchedDeposits = deposits.filter(t => !t.matched_invoice_id);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading bank transactions...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deposits
            </CardTitle>
            <ArrowDownLeft className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(deposits.reduce((sum, t) => sum + t.amount, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {deposits.length} transaction{deposits.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matched
            </CardTitle>
            <Check className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {matchedDeposits.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(matchedDeposits.reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unmatched
            </CardTitle>
            <X className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {unmatchedDeposits.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(unmatchedDeposits.reduce((sum, t) => sum + t.amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unmatched Deposits */}
      {unmatchedDeposits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Link className="w-5 h-5" />
              Unmatched Deposits ({unmatchedDeposits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unmatchedDeposits.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {tx.posted_at
                          ? format(new Date(tx.posted_at), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.counterparty_name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {tx.description || tx.bank_description || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          +{formatCurrency(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMatchDialog(tx)}
                        >
                          <Link className="w-3 h-3 mr-1" />
                          Match
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matched Deposits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Matched Transactions ({matchedDeposits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchedDeposits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No matched transactions yet. Sync with Mercury to import deposits.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Matched Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matchedDeposits.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {tx.posted_at
                          ? format(new Date(tx.posted_at), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {tx.counterparty_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {tx.invoices ? (
                          <div>
                            <Badge variant="outline" className="font-mono">
                              {tx.invoices.invoice_number}
                            </Badge>
                            {tx.invoices.customers && (
                              <span className="ml-2 text-sm text-muted-foreground">
                                {tx.invoices.customers.contact_name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          +{formatCurrency(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleUnmatch(tx)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Unmatch
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Match Transaction to Invoice</DialogTitle>
            <DialogDescription>
              Select an invoice to match with this deposit of{" "}
              <span className="font-semibold text-green-600">
                {selectedTransaction && formatCurrency(selectedTransaction.amount)}
              </span>
              {selectedTransaction?.counterparty_name && (
                <> from <span className="font-medium">{selectedTransaction.counterparty_name}</span></>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an invoice..." />
              </SelectTrigger>
              <SelectContent>
                {unmatchedInvoices.map((invoice) => {
                  const remaining = invoice.total - (invoice.amount_paid || 0);
                  return (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{invoice.invoice_number}</span>
                        <span className="text-muted-foreground">—</span>
                        <span>{invoice.customers?.contact_name}</span>
                        <span className="text-muted-foreground">—</span>
                        <span className="font-medium">{formatCurrency(remaining)} due</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMatch} disabled={!selectedInvoiceId || matching}>
              {matching ? "Matching..." : "Match & Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
