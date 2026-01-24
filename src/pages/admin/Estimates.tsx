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
  Pencil,
  Trash2,
  AlertTriangle,
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

interface LinkedRecords {
  invoices: Array<{ id: string; invoice_number: string }>;
  projects: Array<{ id: string; project_name: string }>;
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

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    estimate: Estimate | null;
    linkedRecords: LinkedRecords | null;
    checking: boolean;
    deleting: boolean;
  }>({
    open: false,
    estimate: null,
    linkedRecords: null,
    checking: false,
    deleting: false,
  });

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

  const checkLinkedRecords = async (estimateId: string): Promise<LinkedRecords> => {
    const [invoicesResult, projectsResult] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, invoice_number")
        .eq("estimate_id", estimateId),
      supabase
        .from("projects")
        .select("id, project_name")
        .eq("estimate_id", estimateId),
    ]);

    return {
      invoices: invoicesResult.data || [],
      projects: projectsResult.data || [],
    };
  };

  const openDeleteDialog = async (estimate: Estimate) => {
    setDeleteDialog({
      open: true,
      estimate,
      linkedRecords: null,
      checking: true,
      deleting: false,
    });

    const linkedRecords = await checkLinkedRecords(estimate.id);

    setDeleteDialog((prev) => ({
      ...prev,
      linkedRecords,
      checking: false,
    }));
  };

  const handleDelete = async () => {
    if (!deleteDialog.estimate) return;

    const { id, estimate_number } = deleteDialog.estimate;

    setDeleteDialog((prev) => ({ ...prev, deleting: true }));

    try {
      // Delete attachments (and their storage files)
      const { data: attachments } = await supabase
        .from("estimate_attachments")
        .select("file_path")
        .eq("estimate_id", id);

      if (attachments && attachments.length > 0) {
        const filePaths = attachments.map((a) => a.file_path);
        await supabase.storage.from("estimate-attachments").remove(filePaths);
        await supabase.from("estimate_attachments").delete().eq("estimate_id", id);
      }

      // Delete custom items
      await supabase.from("estimate_custom_items").delete().eq("estimate_id", id);

      // Delete line items
      await supabase.from("estimate_items").delete().eq("estimate_id", id);

      // Delete the estimate
      const { error } = await supabase.from("estimates").delete().eq("id", id);

      if (error) throw error;

      await logActivity({
        action: "delete",
        entityType: "estimate",
        entityId: id,
        entityName: estimate_number,
      });

      toast({
        title: "Estimate Deleted",
        description: `Estimate ${estimate_number} has been deleted.`,
      });

      setDeleteDialog({
        open: false,
        estimate: null,
        linkedRecords: null,
        checking: false,
        deleting: false,
      });

      fetchEstimates();
    } catch (error) {
      console.error("Error deleting estimate:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete estimate. Please try again.",
      });
      setDeleteDialog((prev) => ({ ...prev, deleting: false }));
    }
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

  const canDelete = deleteDialog.linkedRecords && 
    deleteDialog.linkedRecords.invoices.length === 0 && 
    deleteDialog.linkedRecords.projects.length === 0;

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
                    const canEdit = estimate.status === "draft";
                    
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
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEdit && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => navigate(`/admin/estimates/${estimate.id}?edit=true`)}
                                    >
                                      <Pencil className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                
                                {statusActions.map((action) => (
                                  <DropdownMenuItem
                                    key={action.action}
                                    onClick={() => openConfirmDialog(estimate, action.action)}
                                    className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
                                  >
                                    {action.icon}
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(estimate)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Status Change Confirmation Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => !open && !deleteDialog.deleting && setDeleteDialog({
          open: false,
          estimate: null,
          linkedRecords: null,
          checking: false,
          deleting: false,
        })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteDialog.checking ? (
                "Checking for linked records..."
              ) : canDelete ? (
                <>
                  <Trash2 className="w-5 h-5 text-destructive" />
                  Delete Estimate?
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Cannot Delete Estimate
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {deleteDialog.checking ? (
                  <p>Please wait while we check for linked invoices and projects...</p>
                ) : canDelete ? (
                  <p>
                    Are you sure you want to delete estimate{" "}
                    <strong>{deleteDialog.estimate?.estimate_number}</strong>? This will also
                    delete all associated line items, custom items, and attachments. This action
                    cannot be undone.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p>
                      This estimate cannot be deleted because it has linked records:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {deleteDialog.linkedRecords?.invoices.map((inv) => (
                        <li key={inv.id}>
                          Invoice: <strong>{inv.invoice_number}</strong>
                        </li>
                      ))}
                      {deleteDialog.linkedRecords?.projects.map((proj) => (
                        <li key={proj.id}>
                          Project: <strong>{proj.project_name}</strong>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm">
                      Please remove or unlink these records first before deleting the estimate.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.deleting}>
              {canDelete ? "Cancel" : "Close"}
            </AlertDialogCancel>
            {canDelete && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteDialog.deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteDialog.deleting ? "Deleting..." : "Delete Estimate"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
