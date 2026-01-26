import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Package,
  MoreVertical,
  Check,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useProjectMaterials, ProjectMaterial } from "@/hooks/useProjectMaterials";
import { formatDistanceToNow } from "date-fns";

interface ProjectMaterialsTableProps {
  projectId: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  allocated: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  consumed: "bg-green-500/10 text-green-600 border-green-500/20",
  returned: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  allocated: "Allocated",
  consumed: "Used",
  returned: "Returned",
};

export function ProjectMaterialsTable({ projectId }: ProjectMaterialsTableProps) {
  const {
    materials,
    isLoading,
    consumeMaterials,
    isConsuming,
    returnMaterials,
    isReturning,
  } = useProjectMaterials(projectId);

  const [confirmAction, setConfirmAction] = useState<{
    type: "consume" | "return";
    material: ProjectMaterial;
  } | null>(null);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "consume") {
      consumeMaterials([confirmAction.material.id]);
    } else {
      returnMaterials([confirmAction.material]);
    }

    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Project Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Project Materials
          </CardTitle>
          <CardDescription>
            No materials have been allocated to this project yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalCost = materials.reduce(
    (sum, m) => sum + (m.total_cost || 0),
    0
  );

  const allocatedCount = materials.filter(m => m.status === "allocated").length;
  const consumedCount = materials.filter(m => m.status === "consumed").length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Project Materials
              </CardTitle>
              <CardDescription>
                {allocatedCount} allocated, {consumedCount} used •{" "}
                {formatCurrency(totalCost)} total
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">Containers</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{material.product_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {material.product_type.replace("_", " ")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {material.gallons_required.toFixed(1)} gal
                  </TableCell>
                  <TableCell className="text-right">
                    {material.containers_allocated}x{" "}
                    {material.container_size
                      ? `${material.container_size}-gal`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(material.total_cost)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[material.status] || ""}
                    >
                      {STATUS_LABELS[material.status] || material.status}
                    </Badge>
                    {material.allocated_at && material.status === "allocated" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(material.allocated_at), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {material.status === "allocated" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({ type: "consume", material })
                            }
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Used
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setConfirmAction({ type: "return", material })
                            }
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Return to Inventory
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "consume"
                ? "Mark Material as Used?"
                : "Return Material to Inventory?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "consume"
                ? `This will mark ${confirmAction.material.product_name} as consumed for this project.`
                : `This will return ${confirmAction?.material.containers_allocated} container(s) of ${confirmAction?.material.product_name} back to inventory.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isConsuming || isReturning}
            >
              {(isConsuming || isReturning) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
