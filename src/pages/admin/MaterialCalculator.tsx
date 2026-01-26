import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  Package, 
  Loader2, 
  Star,
  AlertTriangle,
  Copy,
  Info,
} from "lucide-react";
import { 
  calculateMaterialNeeds, 
  CalculatorResult,
  formatGallons,
  formatCost,
} from "@/lib/materialCalculator";
import { SURFACING_SYSTEMS, COURT_PRESETS } from "@/lib/pricingConstants";
import { ContainerOption, formatContainerDescription } from "@/lib/supplyOptimizer";

const PRESETS = [
  { key: "PICKLEBALL_1", label: "1 Pickleball", sqFt: 1800 },
  { key: "PICKLEBALL_2", label: "2 Pickleball", sqFt: 3600 },
  { key: "PICKLEBALL_4", label: "4 Pickleball", sqFt: 7200 },
  { key: "TENNIS_1", label: "1 Tennis", sqFt: 7200 },
  { key: "TENNIS_2", label: "2 Tennis", sqFt: 14400 },
  { key: "BASKETBALL_FULL", label: "Full Basketball", sqFt: 4700 },
];

export default function MaterialCalculator() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [containers, setContainers] = useState<ContainerOption[]>([]);
  
  // Form state
  const [sqFt, setSqFt] = useState<number>(7200);
  const [systemId, setSystemId] = useState<string>("PRO_PLUS_STANDARD");
  const [includePrimeSeal, setIncludePrimeSeal] = useState(false);
  const [includeResurfacer, setIncludeResurfacer] = useState(false);
  const [resurfacerCoats, setResurfacerCoats] = useState(1);
  
  // Results
  const [result, setResult] = useState<CalculatorResult | null>(null);

  // Fetch inventory containers on mount
  useEffect(() => {
    async function fetchContainers() {
      setLoading(true);
      const { data, error } = await supabase
        .from("material_inventory")
        .select("*")
        .eq("is_active", true);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load inventory data",
        });
      } else {
        const mapped: ContainerOption[] = (data || []).map(item => ({
          inventoryItemId: item.id,
          productCode: item.product_code,
          productName: item.product_name,
          productType: item.product_type,
          containerSize: Number(item.container_size),
          containerType: item.container_type,
          costPerContainer: Number(item.cost_per_container),
          costPerGallon: Number(item.cost_per_gallon),
          quantityOnHand: item.quantity_on_hand || 0,
          colorName: item.color_name,
          isPrimary: item.is_primary || false,
        }));
        setContainers(mapped);
      }
      setLoading(false);
    }
    fetchContainers();
  }, [toast]);

  // Calculate materials whenever inputs change
  const calculatedResult = useMemo(() => {
    if (containers.length === 0) return null;
    
    return calculateMaterialNeeds(
      sqFt,
      systemId,
      {
        includePrimeSeal,
        includeResurfacer,
        resurfacerCoats: includeResurfacer ? resurfacerCoats : 0,
      },
      containers
    );
  }, [sqFt, systemId, includePrimeSeal, includeResurfacer, resurfacerCoats, containers]);

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    setSqFt(preset.sqFt);
  };

  const handleCalculate = () => {
    setResult(calculatedResult);
  };

  const handleCopyToClipboard = () => {
    if (!result) return;
    
    const lines: string[] = [
      `Material Calculator Results`,
      `Court Size: ${result.sqFt.toLocaleString()} sq ft (${result.sqYards.toFixed(1)} sq yds)`,
      `System: ${result.system.name}`,
      ``,
      `MATERIALS REQUIRED:`,
    ];
    
    for (const mat of result.materials) {
      lines.push(`\n${mat.name}`);
      lines.push(`  Required: ${formatGallons(mat.gallonsRequired)} gallons`);
      lines.push(`  Formula: ${mat.formula}`);
      
      if (mat.recommendation?.selectedOption) {
        const opt = mat.recommendation.selectedOption;
        const containers = opt.containers.map(c => formatContainerDescription(c)).join(" + ");
        lines.push(`  Recommended: ${containers} = ${formatCost(opt.totalCost)}`);
      }
    }
    
    lines.push(`\nTOTAL MATERIAL COST: ${formatCost(result.totalMaterialCost)}`);
    
    navigator.clipboard.writeText(lines.join("\n"));
    toast({
      title: "Copied!",
      description: "Material list copied to clipboard",
    });
  };

  const selectedSystem = SURFACING_SYSTEMS[systemId];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Material Calculator</h1>
        <p className="text-muted-foreground mt-1">
          Estimate drums and pails needed based on court size and coating system
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Project Details
            </CardTitle>
            <CardDescription>
              Enter court dimensions and select surfacing system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Court Dimensions */}
            <div className="space-y-3">
              <Label>Total Square Feet</Label>
              <Input
                type="number"
                value={sqFt}
                onChange={(e) => setSqFt(parseInt(e.target.value) || 0)}
                placeholder="Enter square feet"
              />
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.key}
                    variant={sqFt === preset.sqFt ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Surfacing System */}
            <div className="space-y-3">
              <Label>Surfacing System</Label>
              <Select value={systemId} onValueChange={setSystemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select system" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SURFACING_SYSTEMS).map(([key, sys]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {sys.name}
                        {sys.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {sys.badge}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedSystem && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-1">{selectedSystem.description}</p>
                  <p className="text-muted-foreground">
                    Coats: {selectedSystem.coats.granule > 0 && `${selectedSystem.coats.granule} Granule + `}
                    {selectedSystem.coats.powder > 0 && `${selectedSystem.coats.powder} Powder + `}
                    {selectedSystem.coats.colorCoat} Color
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Optional Materials */}
            <div className="space-y-4">
              <Label>Optional Materials</Label>
              
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  id="primeseal"
                  checked={includePrimeSeal}
                  onCheckedChange={(checked) => setIncludePrimeSeal(!!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="primeseal" className="font-medium cursor-pointer">
                    Include PrimeSeal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    For new concrete prep or moisture mitigation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  id="resurfacer"
                  checked={includeResurfacer}
                  onCheckedChange={(checked) => setIncludeResurfacer(!!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="resurfacer" className="font-medium cursor-pointer">
                    Include Resurfacer
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    For filling cracks and leveling existing surfaces
                  </p>
                  {includeResurfacer && (
                    <div className="mt-2 flex items-center gap-2">
                      <Label className="text-sm">Coats:</Label>
                      <Select
                        value={resurfacerCoats.toString()}
                        onValueChange={(v) => setResurfacerCoats(parseInt(v))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={handleCalculate} className="w-full" size="lg">
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Materials
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Material Requirements
              </span>
              {(result || calculatedResult) && (
                <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {(result || calculatedResult) 
                ? `${(result || calculatedResult)!.sqFt.toLocaleString()} sq ft • ${(result || calculatedResult)!.sqYards.toFixed(1)} sq yds`
                : "Click Calculate to see results"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(result || calculatedResult) ? (
              <div className="space-y-4">
                {(result || calculatedResult)!.materials.map((mat, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{mat.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Required: {formatGallons(mat.gallonsRequired)} gallons
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {mat.formula}
                        </p>
                      </div>
                      <Badge variant="outline">{mat.coats} coat{mat.coats > 1 ? 's' : ''}</Badge>
                    </div>

                    {mat.recommendation?.selectedOption && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              RECOMMENDED: {mat.recommendation.selectedOption.containers
                                .map(c => formatContainerDescription(c))
                                .join(" + ")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              = {formatCost(mat.recommendation.selectedOption.totalCost)}
                              {" "}({mat.recommendation.selectedOption.wasteGallons.toFixed(1)} gal extra / {mat.recommendation.selectedOption.wastePercent.toFixed(0)}% waste)
                            </p>
                            <p className="text-xs text-primary mt-1">
                              {mat.recommendation.selectedOption.reason}
                            </p>
                          </div>
                        </div>

                        {/* Alternative options */}
                        {mat.recommendation.options.length > 1 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Alternatives:</p>
                            {mat.recommendation.options.slice(1, 3).map((opt, i) => (
                              <p key={i} className="text-xs text-muted-foreground">
                                {opt.containers.map(c => formatContainerDescription(c)).join(" + ")} = {formatCost(opt.totalCost)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                      {mat.recommendation?.stockWarning && (
                      <div className="flex items-start gap-2 p-2 bg-warning/10 rounded text-sm">
                        <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                        <span className="text-warning">{mat.recommendation.stockWarning}</span>
                      </div>
                    )}

                    {!mat.recommendation?.selectedOption && mat.recommendation?.options.length === 0 && (
                      <div className="flex items-start gap-2 p-2 bg-muted rounded text-sm">
                        <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-muted-foreground">No matching inventory items for this product type</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Total */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Material Cost:</span>
                    <span className="text-primary">
                      {formatCost((result || calculatedResult)!.totalMaterialCost)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on recommended container selections
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Package className="w-12 h-12 mb-4 opacity-50" />
                <p>Enter project details and click Calculate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Coverage Reference Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" />
            Coverage Rate Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="p-3 bg-background rounded-lg border">
              <p className="font-medium">PrimeSeal</p>
              <p className="text-muted-foreground">0.05 gal/sq yd</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <p className="font-medium">Resurfacer</p>
              <p className="text-muted-foreground">0.05 gal/sq yd</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <p className="font-medium">Color Coat</p>
              <p className="text-muted-foreground">0.065 gal/sq yd</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <p className="font-medium">Cushion Granule</p>
              <p className="text-muted-foreground">0.20 gal/sq yd</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <p className="font-medium">Cushion Powder</p>
              <p className="text-muted-foreground">0.12 gal/sq yd</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
