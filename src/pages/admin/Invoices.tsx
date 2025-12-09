import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RecordPaymentModal } from "@/components/admin/RecordPaymentModal";
import { EmailStatusBadge, EmailLog } from "@/components/admin/EmailStatusBadge";
import { Search, Receipt, Plus, Calendar, DollarSign, CreditCard, Mail, Loader2, FileDown, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  status: string;
  subtotal: number;
  total: number;
  amount_paid: number;
  due_date: string | null;
  created_at: string;
  sent_at: string | null;
  pdf_url: string | null;
  customers: {
    contact_name: string;
    company_name: string | null;
    email: string | null;
  } | null;
  emailLog?: EmailLog | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted",
  sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  partially_paid: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-500 border-green-500/20",
  overdue: "bg-red-500/10 text-red-500 border-red-500/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
};

export default function AdminInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      let query = supabase
        .from("invoices")
        .select(`
          *,
          customers (
            contact_name,
            company_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch email logs for all invoice IDs
      const invoiceIds = (data || []).map(inv => inv.id);
      const { data: emailLogs } = await supabase
        .from("email_logs")
        .select("*")
        .eq("email_type", "invoice")
        .in("related_id", invoiceIds);

      // Map email logs to invoices
      const invoicesWithLogs = (data || []).map(invoice => ({
        ...invoice,
        emailLog: emailLogs?.find(log => log.related_id === invoice.id) || null,
      }));
      
      setInvoices(invoicesWithLogs as Invoice[]);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load invoices. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      invoice.customers?.contact_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      invoice.customers?.company_name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentModalOpen(true);
  };

  const handleSendEmail = async (invoice: Invoice) => {
    if (!invoice.customers?.email) {
      toast({
        variant: "destructive",
        title: "No Email Address",
        description: "Customer does not have an email address on file.",
      });
      return;
    }
    
    setSendingEmailId(invoice.id);
    try {
      const { error } = await supabase.functions.invoke("send-invoice-email", {
        body: { invoiceId: invoice.id },
      });

      if (error) throw error;

      const isResend = invoice.emailLog || invoice.sent_at;
      toast({
        title: isResend ? "Invoice Resent" : "Invoice Sent",
        description: `Invoice ${invoice.invoice_number} has been emailed to ${invoice.customers.email}.`,
      });
      fetchInvoices();
    } catch (err: any) {
      console.error("Error sending invoice email:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send invoice email.",
      });
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    setGeneratingPdfId(invoice.id);
    try {
      // Check if PDF already exists
      if (invoice.pdf_url) {
        const { data: urlData, error: urlError } = await supabase.storage
          .from("invoices")
          .createSignedUrl(invoice.pdf_url, 3600);

        if (!urlError && urlData) {
          window.open(urlData.signedUrl, "_blank");
          setGeneratingPdfId(null);
          return;
        }
      }

      // Generate new PDF
      const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
        body: { invoiceId: invoice.id },
      });

      if (error) throw error;

      if (data?.pdfUrl) {
        window.open(data.pdfUrl, "_blank");
        fetchInvoices();
      }

      toast({
        title: "PDF Generated",
        description: `Invoice ${invoice.invoice_number} PDF is ready for download.`,
      });
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to generate PDF.",
      });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Helper to determine if email can be sent
  const canSendEmail = (invoice: Invoice) => {
    return invoice.status !== "draft" && invoice.status !== "cancelled";
  };

  // Helper to determine if this is a resend
  const isResend = (invoice: Invoice) => {
    return !!(invoice.emailLog || invoice.sent_at);
  };

  // Helper to check if email failed
  const emailFailed = (invoice: Invoice) => {
    return invoice.emailLog?.status === "failed" || invoice.emailLog?.status === "bounced";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer invoices
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/invoices/new">
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            All Invoices ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No invoices match your filters"
                : "No invoices yet. Create your first invoice to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} className={emailFailed(invoice) ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium font-mono">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {invoice.customers ? (
                          <div>
                            <div className="font-medium">
                              {invoice.customers.contact_name}
                            </div>
                            {invoice.customers.company_name && (
                              <div className="text-sm text-muted-foreground">
                                {invoice.customers.company_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[invoice.status]}
                        >
                          {invoice.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <EmailStatusBadge 
                          emailLog={invoice.emailLog} 
                          fallbackSentAt={invoice.sent_at}
                          showResendHint={emailFailed(invoice)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          {formatCurrency(invoice.total)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {formatCurrency(invoice.amount_paid || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {format(new Date(invoice.due_date), "MMM d, yyyy")}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPdf(invoice)}
                          disabled={generatingPdfId === invoice.id}
                        >
                          {generatingPdfId === invoice.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <FileDown className="w-3 h-3 mr-1" />
                          )}
                          PDF
                        </Button>
                        {canSendEmail(invoice) && (
                          <Button
                            variant={emailFailed(invoice) ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleSendEmail(invoice)}
                            disabled={sendingEmailId === invoice.id}
                          >
                            {sendingEmailId === invoice.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isResend(invoice) ? (
                              <RefreshCw className="w-3 h-3 mr-1" />
                            ) : (
                              <Mail className="w-3 h-3 mr-1" />
                            )}
                            {isResend(invoice) ? "Resend" : "Email"}
                          </Button>
                        )}
                        {invoice.status !== "paid" && invoice.status !== "draft" && invoice.status !== "cancelled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRecordPayment(invoice)}
                          >
                            <CreditCard className="w-3 h-3 mr-1" />
                            Record Payment
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <RecordPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          invoice={selectedInvoice}
          onPaymentRecorded={fetchInvoices}
        />
      )}
    </div>
  );
}
