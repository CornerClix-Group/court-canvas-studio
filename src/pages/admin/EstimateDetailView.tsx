import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  Mail,
  FileText,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  Send,
  Loader2,
  Building,
  RefreshCcw,
} from "lucide-react";

interface Estimate {
  id: string;
  estimate_number: string;
  customer_id: string | null;
  status: string;
  subtotal: number;
  total: number;
  notes: string | null;
  valid_until: string | null;
  sent_at: string | null;
  approved_at: string | null;
  created_at: string;
  customers: {
    id: string;
    contact_name: string;
    company_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  } | null;
}

interface EstimateItem {
  id: string;
  description: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total: number;
  sort_order: number;
}

interface CustomItem {
  id: string;
  description: string;
  customer_price: number;
  sort_order: number | null;
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

export default function EstimateDetailView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Dialog states
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showConvertToProjectDialog, setShowConvertToProjectDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEstimate();
    }
  }, [id]);

  const fetchEstimate = async () => {
    try {
      const [estimateResult, itemsResult, customItemsResult] = await Promise.all([
        supabase
          .from("estimates")
          .select(`
            *,
            customers (
              id,
              contact_name,
              company_name,
              email,
              phone,
              address,
              city,
              state,
              zip
            )
          `)
          .eq("id", id!)
          .single(),
        supabase
          .from("estimate_items")
          .select("*")
          .eq("estimate_id", id!)
          .order("sort_order"),
        supabase
          .from("estimate_custom_items")
          .select("id, description, customer_price, sort_order")
          .eq("estimate_id", id!)
          .order("sort_order"),
      ]);

      if (estimateResult.error) throw estimateResult.error;
      
      setEstimate(estimateResult.data);
      setItems(itemsResult.data || []);
      setCustomItems(customItemsResult.data || []);
    } catch (error) {
      console.error("Error fetching estimate:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load estimate details.",
      });
      navigate("/admin/estimates");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string, additionalData?: Record<string, unknown>) => {
    if (!estimate) return;
    
    setActionLoading(newStatus);
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        ...additionalData,
      };

      const { error } = await supabase
        .from("estimates")
        .update(updateData)
        .eq("id", estimate.id);

      if (error) throw error;

      await logActivity({
        action: "status_changed",
        entityType: "estimate",
        entityId: estimate.id,
        entityName: estimate.estimate_number,
        details: { from: estimate.status, to: newStatus },
      });

      toast({
        title: "Status Updated",
        description: `Estimate marked as ${statusLabels[newStatus]}.`,
      });

      fetchEstimate();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEstimate = async () => {
    if (!estimate?.customers?.email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Customer does not have an email address.",
      });
      return;
    }

    setActionLoading("send");
    try {
      const { error } = await supabase.functions.invoke("send-estimate-email", {
        body: { estimateId: estimate.id },
      });

      if (error) throw error;

      await supabase
        .from("estimates")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", estimate.id);

      toast({
        title: "Estimate Sent",
        description: `Estimate emailed to ${estimate.customers.email}`,
      });

      fetchEstimate();
    } catch (error) {
      console.error("Error sending estimate:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send estimate.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!estimate) return;

    setActionLoading("pdf");
    try {
      const { data, error } = await supabase.functions.invoke("generate-estimate-pdf", {
        body: { estimateId: estimate.id },
      });

      if (error) throw error;

      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${data.pdf}`;
      link.download = `Estimate-${estimate.estimate_number}.pdf`;
      link.click();

      toast({
        title: "PDF Downloaded",
        description: "Estimate PDF has been downloaded.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    await updateStatus("declined");
    setShowDeclineDialog(false);
    setDeclineReason("");
  };

  const handleConvertToProject = async () => {
    if (!estimate) return;

    setActionLoading("project");
    try {
      const projectName = estimate.customers?.company_name || 
        estimate.customers?.contact_name || 
        `Project from ${estimate.estimate_number}`;

      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          project_name: projectName,
          estimate_id: estimate.id,
          customer_id: estimate.customer_id,
          contract_value: estimate.total,
          status: "sold",
          notes: estimate.notes || `Created from estimate ${estimate.estimate_number}`,
        })
        .select()
        .single();

      if (error) throw error;

      await logActivity({
        action: "converted_to_project",
        entityType: "estimate",
        entityId: estimate.id,
        entityName: estimate.estimate_number,
        details: { projectId: project.id, projectName },
      });

      toast({
        title: "Project Created",
        description: `Project "${projectName}" has been created from this estimate.`,
      });

      setShowConvertToProjectDialog(false);
      navigate(`/admin/projects/${project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create project.",
      });
    } finally {
      setActionLoading(null);
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Estimate not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/estimates")}>
          Back to Estimates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/estimates")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground font-mono">
                {estimate.estimate_number}
              </h1>
              <Badge variant="outline" className={statusColors[estimate.status]}>
                {statusLabels[estimate.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Created {format(new Date(estimate.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={actionLoading !== null}
          >
            {actionLoading === "pdf" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
          
          {estimate.status === "draft" && (
            <Button
              onClick={handleSendEstimate}
              disabled={actionLoading !== null || !estimate.customers?.email}
            >
              {actionLoading === "send" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send to Customer
            </Button>
          )}
          
          {estimate.status === "sent" && (
            <Button
              variant="outline"
              onClick={handleSendEstimate}
              disabled={actionLoading !== null || !estimate.customers?.email}
            >
              {actionLoading === "send" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Resend
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit || ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {customItems.length > 0 && (
                    <>
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/50 font-medium">
                          Additional Work
                        </TableCell>
                      </TableRow>
                      {customItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell colSpan={3}>{item.description}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.customer_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
              
              <Separator className="my-4" />
              
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(estimate.subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(estimate.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {estimate.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{estimate.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {estimate.customers ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">{estimate.customers.contact_name}</p>
                    {estimate.customers.company_name && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {estimate.customers.company_name}
                      </p>
                    )}
                  </div>
                  {estimate.customers.email && (
                    <p className="text-sm">{estimate.customers.email}</p>
                  )}
                  {estimate.customers.phone && (
                    <p className="text-sm">{estimate.customers.phone}</p>
                  )}
                  {estimate.customers.address && (
                    <p className="text-sm text-muted-foreground">
                      {estimate.customers.address}
                      {estimate.customers.city && `, ${estimate.customers.city}`}
                      {estimate.customers.state && ` ${estimate.customers.state}`}
                      {estimate.customers.zip && ` ${estimate.customers.zip}`}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No customer assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Estimate Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid Until</span>
                <span>
                  {estimate.valid_until
                    ? format(new Date(estimate.valid_until), "MMM d, yyyy")
                    : "—"}
                </span>
              </div>
              {estimate.sent_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{format(new Date(estimate.sent_at), "MMM d, yyyy")}</span>
                </div>
              )}
              {estimate.approved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved</span>
                  <span>{format(new Date(estimate.approved_at), "MMM d, yyyy")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Update the estimate status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Draft Actions */}
              {estimate.status === "draft" && (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => updateStatus("sent", { sent_at: new Date().toISOString() })}
                    disabled={actionLoading !== null}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Mark as Sent
                  </Button>
                </>
              )}

              {/* Sent Actions */}
              {estimate.status === "sent" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => updateStatus("approved", { approved_at: new Date().toISOString() })}
                    disabled={actionLoading !== null}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Approved
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => setShowDeclineDialog(true)}
                    disabled={actionLoading !== null}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Mark as Declined
                  </Button>
                </>
              )}

              {/* Approved Actions */}
              {estimate.status === "approved" && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/admin/invoices/from-estimate/${estimate.id}`)}
                  >
                    <ArrowRightCircle className="w-4 h-4 mr-2" />
                    Convert to Invoice
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setShowConvertToProjectDialog(true)}
                    disabled={actionLoading !== null}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </>
              )}

              {/* Declined/Expired Actions */}
              {(estimate.status === "declined" || estimate.status === "expired") && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus("draft")}
                  disabled={actionLoading !== null}
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Reopen as Draft
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decline Dialog */}
      <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Declined?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the estimate as declined by the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDecline}>
              Mark as Declined
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Project Dialog */}
      <AlertDialog open={showConvertToProjectDialog} onOpenChange={setShowConvertToProjectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Project from Estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new project linked to this estimate with the customer and contract value pre-filled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertToProject} disabled={actionLoading === "project"}>
              {actionLoading === "project" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Create Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
