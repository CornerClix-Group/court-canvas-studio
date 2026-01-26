import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Package,
  Star,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SupplyRecommendation,
  SupplyOption,
  formatContainerDescription,
  calculateTotalSupplyCost,
} from "@/lib/supplyOptimizer";
import { cn } from "@/lib/utils";

interface ProjectSupplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  recommendations: SupplyRecommendation[];
  onConfirm: (selectedOptions: SupplyRecommendation[]) => void;
  isLoading?: boolean;
}

export function ProjectSupplyModal({
  open,
  onOpenChange,
  projectName,
  recommendations: initialRecommendations,
  onConfirm,
  isLoading = false,
}: ProjectSupplyModalProps) {
  const [recommendations, setRecommendations] = useState<SupplyRecommendation[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRecommendations(initialRecommendations);
  }, [initialRecommendations]);

  const totalCost = calculateTotalSupplyCost(recommendations);
  const hasStockWarnings = recommendations.some(r => r.stockWarning);

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectOption = (recIndex: number, option: SupplyOption) => {
    setRecommendations(prev => {
      const next = [...prev];
      next[recIndex] = {
        ...next[recIndex],
        selectedOption: option,
        options: next[recIndex].options.map(o => ({
          ...o,
          isRecommended: o === option,
        })),
      };
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(recommendations);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Project Supply List
          </DialogTitle>
          <DialogDescription>
            {projectName} — Review and confirm material allocations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No material requirements detected from this estimate.</p>
              <p className="text-sm mt-1">
                You can still create the project and add materials later.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Select the best container options for each material. The system
                recommends cost-effective combinations with minimal waste.
              </p>

              {recommendations.map((rec, recIndex) => {
                const key = `${rec.productType}-${recIndex}`;
                const isExpanded = expandedItems.has(key);
                const selected = rec.selectedOption;

                return (
                  <Card key={key} className="overflow-hidden">
                    <Collapsible
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(key)}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{rec.productName}</h4>
                              <Badge variant="outline" className="text-xs">
                                {rec.productType}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Required: {rec.gallonsRequired.toFixed(1)} gallons
                            </p>
                          </div>

                          {selected && (
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {formatCurrency(selected.totalCost)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selected.wasteGallons.toFixed(1)} gal extra
                              </p>
                            </div>
                          )}
                        </div>

                        {selected && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            {selected.containers.map((alloc, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="font-normal"
                              >
                                {formatContainerDescription(alloc)}
                              </Badge>
                            ))}
                            {selected.isRecommended && (
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                <Star className="w-3 h-3 mr-1" />
                                Recommended
                              </Badge>
                            )}
                          </div>
                        )}

                        {rec.options.length > 1 && (
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 -ml-2 text-muted-foreground"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-1" />
                                  Hide alternatives
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  Show {rec.options.length - 1} alternative
                                  {rec.options.length > 2 ? "s" : ""}
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}

                        {rec.stockWarning && (
                          <Alert variant="destructive" className="mt-3 py-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              {rec.stockWarning}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <CollapsibleContent>
                        <div className="border-t bg-muted/30 p-4 space-y-2">
                          {rec.options.map((option, optIndex) => {
                            const isSelected = option === selected;
                            return (
                              <button
                                key={optIndex}
                                onClick={() => selectOption(recIndex, option)}
                                className={cn(
                                  "w-full text-left p-3 rounded-lg border transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                                )}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {option.containers.map((alloc, i) => (
                                        <span key={i} className="text-sm">
                                          {formatContainerDescription(alloc)}
                                          {i < option.containers.length - 1 && " + "}
                                        </span>
                                      ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {option.reason} •{" "}
                                      {option.wasteGallons.toFixed(1)} gal waste (
                                      {option.wastePercent.toFixed(0)}%)
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {formatCurrency(option.totalCost)}
                                    </span>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-primary" />
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })}
            </>
          )}

          {recommendations.length > 0 && (
            <>
              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Total Material Cost</span>
                </div>
                <span className="text-2xl font-bold">
                  {formatCurrency(totalCost)}
                </span>
              </div>

              {hasStockWarnings && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Some materials have insufficient stock. The project will be
                    created but you'll need to order more supplies.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {recommendations.length > 0
              ? "Create Project & Allocate Materials"
              : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
