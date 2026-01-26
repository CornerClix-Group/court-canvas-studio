import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  LayoutList,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectSupplyModal } from "@/components/admin/ProjectSupplyModal";
import { useInventoryContainers, CreateProjectMaterialInput } from "@/hooks/useProjectMaterials";
import {
  parseEstimateItemsForMaterials,
  optimizeAllSupplies,
  SupplyRecommendation,
} from "@/lib/supplyOptimizer";

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
  display_format: string | null;
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

interface ScopeBullet {
  id: string;
  bullet_text: string;
  sort_order: number;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const isEditMode = searchParams.get("edit") === "true";

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [scopeBullets, setScopeBullets] = useState<ScopeBullet[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'customer'>('admin');
  
  // Edit mode state
  const [editNotes, setEditNotes] = useState("");
  const [editValidUntil, setEditValidUntil] = useState("");
  const [editItems, setEditItems] = useState<EstimateItem[]>([]);
  const [editCustomItems, setEditCustomItems] = useState<CustomItem[]>([]);
  
  // Dialog states
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showConvertToProjectDialog, setShowConvertToProjectDialog] = useState(false);
  
  // Supply modal state
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [supplyRecommendations, setSupplyRecommendations] = useState<SupplyRecommendation[]>([]);
  const { data: inventoryContainers } = useInventoryContainers();

  useEffect(() => {
    if (id) {
      fetchEstimate();
    }
  }, [id]);

  // Initialize edit state when entering edit mode
  useEffect(() => {
    if (isEditMode && estimate) {
      setEditNotes(estimate.notes || "");
      setEditValidUntil(estimate.valid_until || "");
      setEditItems([...items]);
      setEditCustomItems([...customItems]);
    }
  }, [isEditMode, estimate, items, customItems]);

  const fetchEstimate = async () => {
    try {
      const [estimateResult, itemsResult, customItemsResult, bulletsResult] = await Promise.all([
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
        supabase
          .from("estimate_scope_bullets")
          .select("id, bullet_text, sort_order")
          .eq("estimate_id", id!)
          .order("sort_order"),
      ]);

      if (estimateResult.error) throw estimateResult.error;
      
      setEstimate(estimateResult.data);
      setItems(itemsResult.data || []);
      setCustomItems(customItemsResult.data || []);
      setScopeBullets(bulletsResult.data || []);
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

  const handleOpenSupplyModal = () => {
    if (!estimate || !inventoryContainers) return;
    
    // Parse estimate items to find material requirements
    const requirements = parseEstimateItemsForMaterials(items);
    
    // Optimize supply orders for each requirement
    const recommendations = optimizeAllSupplies(requirements, inventoryContainers);
    
    setSupplyRecommendations(recommendations);
    setShowSupplyModal(true);
    setShowConvertToProjectDialog(false);
  };

  const handleConvertToProject = async (selectedRecommendations?: SupplyRecommendation[]) => {
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

      // Allocate materials if we have recommendations
      if (selectedRecommendations && selectedRecommendations.length > 0) {
        const materialsToAllocate: CreateProjectMaterialInput[] = [];
        
        for (const rec of selectedRecommendations) {
          if (rec.selectedOption) {
            for (const alloc of rec.selectedOption.containers) {
              materialsToAllocate.push({
                project_id: project.id,
                inventory_item_id: alloc.item.inventoryItemId,
                product_name: alloc.item.productName,
                product_type: alloc.item.productType,
                gallons_required: rec.gallonsRequired,
                containers_allocated: alloc.count,
                container_size: alloc.item.containerSize,
                unit_cost: alloc.item.costPerContainer,
                total_cost: alloc.totalCost,
              });
            }
          }
        }

        if (materialsToAllocate.length > 0) {
          // Insert project materials
          const { error: materialsError } = await supabase
            .from("project_materials")
            .insert(materialsToAllocate.map(m => ({
              ...m,
              status: 'allocated',
              allocated_at: new Date().toISOString(),
            })));

          if (materialsError) {
            console.error("Error allocating materials:", materialsError);
            // Don't fail the whole operation, just log it
          } else {
            // Deduct from inventory
            for (const material of materialsToAllocate) {
              if (material.inventory_item_id) {
                const { data: inventory } = await supabase
                  .from('material_inventory')
                  .select('quantity_on_hand')
                  .eq('id', material.inventory_item_id)
                  .single();

                if (inventory) {
                  const newQuantity = Math.max(0, (inventory.quantity_on_hand || 0) - material.containers_allocated);
                  await supabase
                    .from('material_inventory')
                    .update({ quantity_on_hand: newQuantity })
                    .eq('id', material.inventory_item_id);
                }
              }
            }
          }
        }
      }

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
      setShowSupplyModal(false);
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

  const handleEnterEditMode = () => {
    if (estimate?.status !== "draft") {
      toast({
        variant: "destructive",
        title: "Cannot Edit",
        description: "Only draft estimates can be edited.",
      });
      return;
    }
    setSearchParams({ edit: "true" });
  };

  const handleCancelEdit = () => {
    setSearchParams({});
    // Reset edit state
    if (estimate) {
      setEditNotes(estimate.notes || "");
      setEditValidUntil(estimate.valid_until || "");
      setEditItems([...items]);
      setEditCustomItems([...customItems]);
    }
  };

  const handleSaveEdit = async () => {
    if (!estimate) return;

    setSaving(true);
    try {
      // Calculate new totals
      const lineItemsTotal = editItems.reduce((sum, item) => sum + item.total, 0);
      const customItemsTotal = editCustomItems.reduce((sum, item) => sum + item.customer_price, 0);
      const newTotal = lineItemsTotal + customItemsTotal;

      // Update estimate
      const { error: estimateError } = await supabase
        .from("estimates")
        .update({
          notes: editNotes || null,
          valid_until: editValidUntil || null,
          subtotal: newTotal,
          total: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", estimate.id);

      if (estimateError) throw estimateError;

      // Delete and re-insert line items
      await supabase.from("estimate_items").delete().eq("estimate_id", estimate.id);
      
      if (editItems.length > 0) {
        const itemsToInsert = editItems.map((item, index) => ({
          estimate_id: estimate.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total: item.total,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from("estimate_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Delete and re-insert custom items
      await supabase.from("estimate_custom_items").delete().eq("estimate_id", estimate.id);
      
      if (editCustomItems.length > 0) {
        const customToInsert = editCustomItems.map((item, index) => ({
          estimate_id: estimate.id,
          description: item.description,
          customer_price: item.customer_price,
          sort_order: index,
        }));

        const { error: customError } = await supabase
          .from("estimate_custom_items")
          .insert(customToInsert);

        if (customError) throw customError;
      }

      await logActivity({
        action: "update",
        entityType: "estimate",
        entityId: estimate.id,
        entityName: estimate.estimate_number,
      });

      toast({
        title: "Estimate Updated",
        description: "Changes have been saved successfully.",
      });

      setSearchParams({});
      fetchEstimate();
    } catch (error) {
      console.error("Error saving estimate:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = (index: number, field: keyof EstimateItem, value: string | number) => {
    setEditItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      
      if (field === "quantity" || field === "unit_price") {
        const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
        item[field] = numValue;
        item.total = item.quantity * item.unit_price;
      } else if (field === "description" || field === "unit") {
        item[field] = value as string;
      }
      
      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    const newItem: EstimateItem = {
      id: `new-${Date.now()}`,
      description: "",
      quantity: 1,
      unit: "each",
      unit_price: 0,
      total: 0,
      sort_order: editItems.length,
    };
    setEditItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCustomItem = (index: number, field: keyof CustomItem, value: string | number) => {
    setEditCustomItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };
      
      if (field === "customer_price") {
        item.customer_price = typeof value === "string" ? parseFloat(value) || 0 : value;
      } else if (field === "description") {
        item.description = value as string;
      }
      
      updated[index] = item;
      return updated;
    });
  };

  const handleAddCustomItem = () => {
    const newItem: CustomItem = {
      id: `new-${Date.now()}`,
      description: "",
      customer_price: 0,
      sort_order: editCustomItems.length,
    };
    setEditCustomItems(prev => [...prev, newItem]);
  };

  const handleRemoveCustomItem = (index: number) => {
    setEditCustomItems(prev => prev.filter((_, i) => i !== index));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate edit mode totals
  const editLineItemsTotal = editItems.reduce((sum, item) => sum + item.total, 0);
  const editCustomItemsTotal = editCustomItems.reduce((sum, item) => sum + item.customer_price, 0);
  const editGrandTotal = editLineItemsTotal + editCustomItemsTotal;

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

  const canEdit = estimate.status === "draft";

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
              {isEditMode && (
                <Badge variant="secondary">Editing</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Created {format(new Date(estimate.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={handleEnterEditMode}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
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
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {viewMode === 'admin' ? 'Line Items' : 'Scope of Work'}
                </CardTitle>
                {!isEditMode && (
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'admin' | 'customer')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="customer" className="text-xs px-3 h-7">
                        <Eye className="w-3 h-3 mr-1" />
                        Customer View
                      </TabsTrigger>
                      <TabsTrigger value="admin" className="text-xs px-3 h-7">
                        <LayoutList className="w-3 h-3 mr-1" />
                        Admin View
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </div>
              {viewMode === 'customer' && !isEditMode && (
                <CardDescription>
                  This is how the customer will see the estimate
                  {estimate?.display_format === 'lump_sum' ? ' (Lump Sum format)' : estimate?.display_format === 'detailed_scope' ? ' (Detailed Scope format)' : ''}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {isEditMode ? (
                <div className="space-y-4">
                  {editItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5">
                        <Input
                          value={item.description}
                          onChange={(e) => handleUpdateItem(index, "description", e.target.value)}
                          placeholder="Description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, "quantity", e.target.value)}
                          placeholder="Qty"
                          min={0}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleUpdateItem(index, "unit_price", e.target.value)}
                          placeholder="Unit Price"
                          min={0}
                          step={0.01}
                        />
                      </div>
                      <div className="col-span-2 text-right font-medium pt-2">
                        {formatCurrency(item.total)}
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Line Item
                  </Button>
                  
                  {/* Custom Items in Edit Mode */}
                  {(editCustomItems.length > 0 || isEditMode) && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="font-medium">Additional Work</h4>
                      {editCustomItems.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                          <div className="col-span-9">
                            <Input
                              value={item.description}
                              onChange={(e) => handleUpdateCustomItem(index, "description", e.target.value)}
                              placeholder="Description"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={item.customer_price}
                              onChange={(e) => handleUpdateCustomItem(index, "customer_price", e.target.value)}
                              placeholder="Price"
                              min={0}
                              step={0.01}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCustomItem(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={handleAddCustomItem}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Item
                      </Button>
                    </>
                  )}
                  
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(editGrandTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : viewMode === 'customer' ? (
                // Customer View - Lump Sum or Detailed Scope
                <div className="space-y-6">
                  {estimate.display_format === 'lump_sum' && scopeBullets.length > 0 ? (
                    // Lump Sum Format with Bullets
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Our team will professionally complete your court project with:
                      </p>
                      <ul className="space-y-2">
                        {scopeBullets.map((bullet) => (
                          <li key={bullet.id} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span>{bullet.bullet_text}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {customItems.length > 0 && (
                        <div className="pt-4 border-t">
                          <p className="font-medium mb-2">Additional Work Included:</p>
                          <ul className="space-y-2">
                            {customItems.map((item) => (
                              <li key={item.id} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>{item.description}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <Separator className="my-4" />
                      
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Project Investment</p>
                        <p className="text-3xl font-bold text-primary">
                          {formatCurrency(estimate.total)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Detailed Scope Format (grouped categories) or fallback
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Group items by category */}
                          {(() => {
                            // Simple grouping logic for customer view
                            const groups: Record<string, number> = {};
                            items.forEach(item => {
                              let category = 'Other Services';
                              const desc = item.description.toLowerCase();
                              if (desc.includes('pressure') || desc.includes('wash') || desc.includes('crack') || desc.includes('birdbath') || desc.includes('prime') || desc.includes('seal')) {
                                category = 'Surface Preparation';
                              } else if (desc.includes('laykold') || desc.includes('resurfacer') || desc.includes('color') || desc.includes('cushion') || desc.includes('installation') || desc.includes('gel')) {
                                category = 'Court Surfacing System';
                              } else if (desc.includes('striping') || desc.includes('line')) {
                                category = 'Professional Court Striping';
                              } else if (desc.includes('mobilization') || desc.includes('setup')) {
                                category = 'Mobilization & Project Setup';
                              } else if (desc.includes('fence') || desc.includes('light') || desc.includes('asphalt') || desc.includes('concrete')) {
                                category = 'Construction & Infrastructure';
                              }
                              groups[category] = (groups[category] || 0) + item.total;
                            });
                            
                            return Object.entries(groups).map(([category, total]) => (
                              <TableRow key={category}>
                                <TableCell className="font-medium">{category}</TableCell>
                                <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                              </TableRow>
                            ));
                          })()}
                          
                          {customItems.length > 0 && customItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.description}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.customer_price)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Project Total</span>
                            <span>{formatCurrency(estimate.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Admin View - Full Detail
                <>
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditMode ? (
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={4}
                />
              ) : (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {estimate.notes || "No notes"}
                </p>
              )}
            </CardContent>
          </Card>
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
              {isEditMode ? (
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={editValidUntil}
                    onChange={(e) => setEditValidUntil(e.target.value)}
                    className="mt-1"
                  />
                </div>
              ) : (
                <>
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Status Actions - only show when not editing */}
          {!isEditMode && (
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
          )}
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
              You'll be able to review and allocate materials before creating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOpenSupplyModal} disabled={actionLoading === "project"}>
              {actionLoading === "project" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Supply Modal */}
      <ProjectSupplyModal
        open={showSupplyModal}
        onOpenChange={setShowSupplyModal}
        projectName={
          estimate?.customers?.company_name ||
          estimate?.customers?.contact_name ||
          `Project from ${estimate?.estimate_number}`
        }
        recommendations={supplyRecommendations}
        onConfirm={(selectedRecs) => handleConvertToProject(selectedRecs)}
        isLoading={actionLoading === "project"}
      />
    </div>
  );
}
