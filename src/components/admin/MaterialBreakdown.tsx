import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Wrench, PlusCircle, Calculator, Droplets, FileText } from "lucide-react";
import type { CalculationResult } from "@/lib/courtCalculator";
import { generateCustomerLineItems } from "@/lib/courtCalculator";

export interface MaterialBreakdownProps {
  calculation: CalculationResult;
  showCosts?: boolean; // true = Internal view (cost before markup), false = Customer view
}

export function MaterialBreakdown({ calculation, showCosts = false }: MaterialBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Customer view shows grouped categories without per-unit pricing
  if (!showCosts) {
    const customerItems = generateCustomerLineItems(calculation);
    const customerTotal = customerItems.reduce((sum, item) => sum + item.total, 0);
    
    return (
      <div className="space-y-6">
        {/* Summary Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5" />
              Project Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Area</p>
                <p className="text-lg font-semibold">{calculation.summary.totalSqFt.toLocaleString()} sq ft</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System</p>
                <p className="text-lg font-semibold">{calculation.summary.system.shortName}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {calculation.summary.system.forceReduction} force reduction
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimate Total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(calculation.grandTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer-Friendly Scope of Work */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5" />
              Scope of Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerItems.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between py-3 border-b last:border-0">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-foreground">{item.description}</p>
                    {item.details && (
                      <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                    )}
                  </div>
                  <p className="font-semibold text-lg whitespace-nowrap">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grand Total */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Estimate Total</span>
              <span className="text-3xl font-bold">
                {formatCurrency(calculation.grandTotal)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Internal view shows full granular breakdown
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="w-5 h-5" />
            Project Summary (Internal)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Area</p>
              <p className="text-lg font-semibold">{calculation.summary.totalSqFt.toLocaleString()} sq ft</p>
              <p className="text-xs text-muted-foreground">({Math.round(calculation.summary.totalSqYds).toLocaleString()} sq yds)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">System</p>
              <p className="text-lg font-semibold">{calculation.summary.system.shortName}</p>
              <Badge variant="outline" className="text-xs mt-1">
                {calculation.summary.system.forceReduction} force reduction
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cushion Layers</p>
              <p className="text-lg font-semibold">{calculation.summary.system.cushionLayers || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost (Before Markup)</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(calculation.costTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drum Order Summary */}
      {(calculation.summary.drumCounts.granule55Gal > 0 || 
        calculation.summary.drumCounts.powder55Gal > 0 ||
        calculation.summary.drumCounts.colorCoat30Gal > 0) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5" />
              Material Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {calculation.summary.drumCounts.granule55Gal > 0 && (
                <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-2 shadow-sm border">
                  <span className="text-2xl font-bold text-primary">
                    {calculation.summary.drumCounts.granule55Gal}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    × 55gal Granule Drums
                  </span>
                </div>
              )}
              {calculation.summary.drumCounts.powder55Gal > 0 && (
                <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-2 shadow-sm border">
                  <span className="text-2xl font-bold text-primary">
                    {calculation.summary.drumCounts.powder55Gal}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    × 55gal Powder Drums
                  </span>
                </div>
              )}
              {calculation.summary.drumCounts.colorCoat30Gal > 0 && (
                <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-2 shadow-sm border">
                  <span className="text-2xl font-bold text-primary">
                    {calculation.summary.drumCounts.colorCoat30Gal}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    × 30gal Color Drums
                  </span>
                </div>
              )}
              {calculation.summary.drumCounts.resurfacer55Gal > 0 && (
                <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-2 shadow-sm border">
                  <span className="text-2xl font-bold text-primary">
                    {calculation.summary.drumCounts.resurfacer55Gal}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    × 55gal Resurfacer Drums
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Surface Condition Work */}
      {calculation.conditionWork && calculation.conditionWork.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Droplets className="w-5 h-5" />
                Surface Prep
              </span>
              <span className="text-lg font-semibold">
                {formatCurrency(calculation.subtotals.condition)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculation.conditionWork.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity.toLocaleString()} {item.unit} @ {formatCurrency(item.unitPrice)}/{item.unit}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Materials
            </span>
            <span className="text-lg font-semibold">
              {formatCurrency(calculation.subtotals.materials)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {calculation.materials.map((material, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{material.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {material.quantity.toFixed(1)} {material.unit} @ {formatCurrency(material.unitPrice)}/{material.unit}
                    {material.drums && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {material.drums} × {material.drumSize}gal
                      </Badge>
                    )}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(material.total)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Labor Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Labor
            </span>
            <span className="text-lg font-semibold">
              {formatCurrency(calculation.subtotals.labor)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {calculation.labor.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity.toLocaleString()} {item.unit} @ {formatCurrency(item.unitPrice)}/{item.unit}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(item.total)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add-ons */}
      {calculation.addons.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Add-ons
              </span>
              <span className="text-lg font-semibold">
                {formatCurrency(calculation.subtotals.addons)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculation.addons.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit} @ {formatCurrency(item.unitPrice)}/{item.unit}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.total)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Base Cost */}
      {calculation.subtotals.base > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>Base/Substrate Work</span>
              <span className="text-lg font-semibold">
                {formatCurrency(calculation.subtotals.base)}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Totals Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cost Before Markup</span>
              <span>{formatCurrency(calculation.costTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profit ({Math.round((calculation.profitMargin - 1) * 100)}%)</span>
              <span className="text-primary">+{formatCurrency(calculation.profitAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grand Total */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Customer Price</span>
            <span className="text-3xl font-bold">
              {formatCurrency(calculation.grandTotal)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
