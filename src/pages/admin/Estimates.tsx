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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/lib/activityLogger";
import { 
  Search, 
  FileText, 
  Plus, 
  Calendar, 
  DollarSign, 
  ArrowRightCircle,
  MoreHorizontal,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  RefreshCcw,
} from "lucide-react";
import { format } from "date-fns";

interface Estimate {
  id: string;
  estimate_number: string;
  customer_id: string | null;
  status: string;
  subtotal: number;
  total: number;
  valid_until: string | null;
  created_at: string;
  customers: {
    contact_name: string;
    company_name: string | null;
    email: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted",
  sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  declined: "bg-red-500/10 text-red-500 border-red-500/20",
  expired: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
};

export default function AdminEstimates() {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    estimateId: string;
    estimateNumber: string;
    action: "sent" | "approved" | "declined" | "expired" | "draft";
  } | null>(null);

  const fetchEstimates = async () => {
    try {
      let query = supabase
        .from("estimates")
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
      setEstimates(data || []);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load estimates. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, [statusFilter]);

  const handleStatusChange = async () => {
    if (!confirmDialog) return;
    
    const { estimateId, estimateNumber, action } = confirmDialog;
    
    try {
      const updateData: Record<string, unknown> = { status: action };
      
      if (action === "sent") {
        updateData.sent_at = new Date().toISOString();
      } else if (action === "approved") {
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("estimates")
        .update(updateData)
        .eq("id", estimateId);

      if (error) throw error;

      await logActivity({
        action: "status_changed",
        entityType: "estimate",
        entityId: estimateId,
        entityName: estimateNumber,
        details: { newStatus: action },
      });

      toast({
        title: "Status Updated",
        description: `Estimate ${estimateNumber} marked as ${statusLabels[action]}.`,
      });

      fetchEstimates();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update estimate status.",
      });
    } finally {
      setConfirmDialog(null);
    }
  };

  const openConfirmDialog = (
    estimate: Estimate,
    action: "sent" | "approved" | "declined" | "expired" | "draft"
  ) => {
    setConfirmDialog({
      open: true,
      estimateId: estimate.id,
      estimateNumber: estimate.estimate_number,
      action,
    });
  };

  const filteredEstimates = estimates.filter(
    (estimate) =>
      estimate.estimate_number.toLowerCase().includes(search.toLowerCase()) ||
      estimate.customers?.contact_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      estimate.customers?.company_name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusActions = (estimate: Estimate) => {
    const actions: Array<{
      label: string;
      icon: React.ReactNode;
      action: "sent" | "approved" | "declined" | "expired" | "draft";
      variant?: "destructive";
    }> = [];

    switch (estimate.status) {
      case "draft":
        actions.push({ label: "Mark as Sent", icon: <Send className="w-4 h-4 mr-2" />, action: "sent" });
        break;
      case "sent":
        actions.push({ label: "Mark as Approved", icon: <CheckCircle className="w-4 h-4 mr-2" />, action: "approved" });
        actions.push({ label: "Mark as Declined", icon: <XCircle className="w-4 h-4 mr-2" />, action: "declined", variant: "destructive" });
        actions.push({ label: "Mark as Expired", icon: <Clock className="w-4 h-4 mr-2" />, action: "expired" });
        break;
      case "declined":
      case "expired":
        actions.push({ label: "Reopen as Draft", icon: <RefreshCcw className="w-4 h-4 mr-2" />, action: "draft" });
        break;
    }

    return actions;
  };

  const getConfirmDialogContent = () => {
    if (!confirmDialog) return { title: "", description: "" };

    const actionLabels: Record<string, { title: string; description: string }> = {
      sent: {
        title: "Mark as Sent?",
        description: `This will mark estimate ${confirmDialog.estimateNumber} as sent to the customer.`,
      },
      approved: {
        title: "Mark as Approved?",
        description: `This will mark estimate ${confirmDialog.estimateNumber} as approved by the customer. You can then convert it to an invoice or project.`,
      },
      declined: {
        title: "Mark as Declined?",
        description: `This will mark estimate ${confirmDialog.estimateNumber} as declined by the customer.`,
      },
      expired: {
        title: "Mark as Expired?",
        description: `This will mark estimate ${confirmDialog.estimateNumber} as expired.`,
      },
      draft: {
        title: "Reopen as Draft?",
        description: `This will reopen estimate ${confirmDialog.estimateNumber} as a draft so you can make changes.`,
      },
    };

    return actionLabels[confirmDialog.action] || { title: "", description: "" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estimates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage project estimates
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/estimates/new">
            <Plus className="w-4 h-4 mr-2" />
            New Estimate
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
                placeholder="Search by estimate number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estimates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            All Estimates ({filteredEstimates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading estimates...
            </div>
          ) : filteredEstimates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No estimates match your filters"
                : "No estimates yet. Create your first estimate to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estimate #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstimates.map((estimate) => {
                    const statusActions = getStatusActions(estimate);
                    
                    return (
                      <TableRow key={estimate.id}>
                        <TableCell className="font-medium font-mono">
                          {estimate.estimate_number}
                        </TableCell>
                        <TableCell>
                          {estimate.customers ? (
                            <div>
                              <div className="font-medium">
                                {estimate.customers.contact_name}
                              </div>
                              {estimate.customers.company_name && (
                                <div className="text-sm text-muted-foreground">
                                  {estimate.customers.company_name}
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
                            className={statusColors[estimate.status]}
                          >
                            {statusLabels[estimate.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            {formatCurrency(estimate.total)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {estimate.valid_until ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {format(new Date(estimate.valid_until), "MMM d, yyyy")}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(estimate.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {estimate.status === "approved" && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  navigate(`/admin/invoices/from-estimate/${estimate.id}`)
                                }
                              >
                                <ArrowRightCircle className="w-4 h-4 mr-1" />
                                Convert
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/admin/estimates/${estimate.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            
                            {statusActions.length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {statusActions.map((action, index) => (
                                    <DropdownMenuItem
                                      key={action.action}
                                      onClick={() => openConfirmDialog(estimate, action.action)}
                                      className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
                                    >
                                      {action.icon}
                                      {action.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog?.open ?? false} 
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getConfirmDialogContent().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmDialogContent().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
