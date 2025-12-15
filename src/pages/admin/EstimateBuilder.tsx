import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EstimateWizardSteps } from "@/components/admin/EstimateWizardSteps";
import { JobTemplates, type JobTemplate } from "@/components/admin/JobTemplates";
import { SystemSelector } from "@/components/admin/SystemSelector";
import { MaterialBreakdown } from "@/components/admin/MaterialBreakdown";
import { CustomerSelect } from "@/components/admin/CustomerSelect";
import { 
  PROJECT_TYPES, 
  COURT_PRESETS, 
  BASE_OPTIONS, 
  ADDONS,
  DEFAULT_PROFIT_MARGIN,
  MIN_PROFIT_MARGIN,
  MAX_PROFIT_MARGIN,
} from "@/lib/pricingConstants";
import { Slider } from "@/components/ui/slider";
import { calculateMaterials, generateLineItems, generateQuoteText, type CourtConfig, type SurfaceCondition } from "@/lib/courtCalculator";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Calculator,
  MapPin,
  Layers,
  PlusCircle,
  FileText,
  Target,
  Circle,
  CircleDot,
  LayoutGrid,
  LucideIcon,
  Copy,
  Download,
  Mail,
  Loader2
} from "lucide-react";

const projectIcons: Record<string, LucideIcon> = {
  pickleball: Target,
  tennis: Circle,
  basketball: CircleDot,
  multi_sport: LayoutGrid,
};

const WIZARD_STEPS = [
  { id: 1, name: "Project" },
  { id: 2, name: "Court Size" },
  { id: 3, name: "Base" },
  { id: 4, name: "System" },
  { id: 5, name: "Add-ons" },
  { id: 6, name: "Review" },
];

interface AddonSelection {
  id: string;
  quantity: number;
  unitPrice: number;
  name: string;
}

export default function EstimateBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<'copy' | 'pdf' | 'email' | null>(null);
  const [customerData, setCustomerData] = useState<{ contact_name: string; email: string | null } | null>(null);
  // Wizard state
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [projectType, setProjectType] = useState<string>("pickleball");
  const [courtPreset, setCourtPreset] = useState<string>("PICKLEBALL_2");
  const [customSqFt, setCustomSqFt] = useState<number>(0);
  const [numberOfCourts, setNumberOfCourts] = useState<number>(2);
  const [baseType, setBaseType] = useState<string>("EXISTING_ASPHALT");
  const [crackRepairLf, setCrackRepairLf] = useState<number>(0);
  const [selectedSystem, setSelectedSystem] = useState<string>("PRO_PLUS_STANDARD");
  const [selectedAddons, setSelectedAddons] = useState<AddonSelection[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [surfaceCondition, setSurfaceCondition] = useState<SurfaceCondition>({
    pressureWash: false,
    birdbathSqFt: 0,
    primeSeal: false,
  });
  const [profitMargin, setProfitMargin] = useState<number>(DEFAULT_PROFIT_MARGIN);
  const [showCostView, setShowCostView] = useState<boolean>(false);

  // Calculate total sq ft
  const totalSqFt = useMemo(() => {
    if (customSqFt > 0) return customSqFt;
    const preset = COURT_PRESETS[courtPreset as keyof typeof COURT_PRESETS];
    return preset?.sqFt || 0;
  }, [courtPreset, customSqFt]);

  // Build config for calculator
  const courtConfig: CourtConfig = useMemo(() => ({
    projectType,
    totalSqFt,
    numberOfCourts,
    systemId: selectedSystem,
    baseType,
    crackRepairLf,
    addons: selectedAddons,
    surfaceCondition,
    profitMargin,
  }), [projectType, totalSqFt, numberOfCourts, selectedSystem, baseType, crackRepairLf, selectedAddons, surfaceCondition, profitMargin]);

  // Calculate estimate
  const calculation = useMemo(() => {
    if (totalSqFt > 0) {
      return calculateMaterials(courtConfig);
    }
    return null;
  }, [courtConfig, totalSqFt]);

  // Fetch customer data when selected
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        setCustomerData(null);
        return;
      }
      const { data } = await supabase
        .from("customers")
        .select("contact_name, email")
        .eq("id", customerId)
        .single();
      setCustomerData(data);
    };
    fetchCustomer();
  }, [customerId]);

  const handleCopyToClipboard = async () => {
    if (!calculation) return;
    setExporting('copy');
    try {
      const quoteText = generateQuoteText(calculation, {
        contactName: customerData?.contact_name || '',
        email: customerData?.email || '',
      });
      await navigator.clipboard.writeText(quoteText);
      toast({
        title: "Copied!",
        description: "Quote copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!calculation) return;
    
    // First save the estimate to get an ID
    setExporting('pdf');
    try {
      const timestamp = Date.now().toString(36).toUpperCase();
      const estimateNumber = `EST-${timestamp}`;
      
      const { data: estimate, error: estimateError } = await supabase
        .from("estimates")
        .insert({
          estimate_number: estimateNumber,
          customer_id: customerId,
          subtotal: calculation.grandTotal,
          total: calculation.grandTotal,
          notes: notes || `${PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES]?.name || projectType} - ${calculation.summary.system.name}`,
          status: "draft",
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      const lineItems = generateLineItems(calculation);
      const itemsToInsert = lineItems.map(item => ({
        ...item,
        estimate_id: estimate.id,
      }));

      await supabase.from("estimate_items").insert(itemsToInsert);

      // Generate PDF
      const { data, error } = await supabase.functions.invoke("generate-estimate-pdf", {
        body: { estimateId: estimate.id },
      });

      if (error) throw error;

      // Download the PDF
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${data.pdf}`;
      link.download = `Estimate-${estimateNumber}.pdf`;
      link.click();

      toast({
        title: "PDF Downloaded",
        description: `Estimate ${estimateNumber} saved and downloaded.`,
      });

      navigate("/admin/estimates");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleEmailEstimate = async () => {
    if (!calculation || !customerId) {
      toast({
        variant: "destructive",
        title: "Customer Required",
        description: "Please select a customer with an email address to send the estimate.",
      });
      return;
    }

    if (!customerData?.email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "The selected customer does not have an email address.",
      });
      return;
    }

    setExporting('email');
    try {
      const timestamp = Date.now().toString(36).toUpperCase();
      const estimateNumber = `EST-${timestamp}`;
      
      const { data: estimate, error: estimateError } = await supabase
        .from("estimates")
        .insert({
          estimate_number: estimateNumber,
          customer_id: customerId,
          subtotal: calculation.grandTotal,
          total: calculation.grandTotal,
          notes: notes || `${PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES]?.name || projectType} - ${calculation.summary.system.name}`,
          status: "draft",
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      const lineItems = generateLineItems(calculation);
      const itemsToInsert = lineItems.map(item => ({
        ...item,
        estimate_id: estimate.id,
      }));

      await supabase.from("estimate_items").insert(itemsToInsert);

      // Send email
      const { error } = await supabase.functions.invoke("send-estimate-email", {
        body: { estimateId: estimate.id },
      });

      if (error) throw error;

      toast({
        title: "Estimate Sent",
        description: `Estimate ${estimateNumber} has been emailed to ${customerData.email}`,
      });

      navigate("/admin/estimates");
    } catch (error) {
      console.error("Error sending estimate:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send estimate email",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleApplyTemplate = (template: JobTemplate) => {
    setProjectType(template.projectType);
    setCourtPreset(template.courtPreset);
    setNumberOfCourts(template.numberOfCourts);
    setCustomSqFt(template.customSqFt);
    setBaseType(template.baseType);
    setCrackRepairLf(template.crackRepairLf);
    setSelectedSystem(template.selectedSystem);
    setSurfaceCondition(template.surfaceCondition);
    setCurrentStep(6); // Jump to review
    toast({
      title: "Template Applied",
      description: `"${template.name}" loaded. Review and adjust as needed.`,
    });
  };

  const handleAddAddon = (addonKey: string) => {
    const addon = ADDONS[addonKey as keyof typeof ADDONS];
    if (!addon) return;
    
    const existing = selectedAddons.find(a => a.id === addon.id);
    if (existing) {
      setSelectedAddons(prev => 
        prev.map(a => a.id === addon.id ? { ...a, quantity: a.quantity + 1 } : a)
      );
    } else {
      setSelectedAddons(prev => [...prev, {
        id: addon.id,
        quantity: 1,
        unitPrice: addon.unitPrice,
        name: addon.name,
      }]);
    }
  };

  const handleRemoveAddon = (addonId: string) => {
    setSelectedAddons(prev => prev.filter(a => a.id !== addonId));
  };

  const handleUpdateAddonQuantity = (addonId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveAddon(addonId);
      return;
    }
    setSelectedAddons(prev => 
      prev.map(a => a.id === addonId ? { ...a, quantity } : a)
    );
  };

  const handleSaveEstimate = async () => {
    if (!calculation) return;
    
    setSaving(true);
    try {
      // Generate estimate number
      const timestamp = Date.now().toString(36).toUpperCase();
      const estimateNumber = `EST-${timestamp}`;
      
      // Create estimate
      const { data: estimate, error: estimateError } = await supabase
        .from("estimates")
        .insert({
          estimate_number: estimateNumber,
          customer_id: customerId,
          subtotal: calculation.grandTotal,
          total: calculation.grandTotal,
          notes: notes || `${PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES]?.name || projectType} - ${calculation.summary.system.name}`,
          status: "draft",
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      // Generate and insert line items
      const lineItems = generateLineItems(calculation);
      const itemsToInsert = lineItems.map(item => ({
        ...item,
        estimate_id: estimate.id,
      }));

      const { error: itemsError } = await supabase
        .from("estimate_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Estimate Created",
        description: `Estimate ${estimateNumber} has been saved successfully.`,
      });

      navigate("/admin/estimates");
    } catch (error) {
      console.error("Error saving estimate:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save estimate. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!projectType;
      case 2:
        return totalSqFt > 0;
      case 3:
        return !!baseType;
      case 4:
        return !!selectedSystem;
      case 5:
        return true; // Add-ons are optional
      case 6:
        return !!calculation;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <JobTemplates onSelectTemplate={handleApplyTemplate} />
            
            <div className="border-t pt-6">
              <Label className="text-base font-semibold mb-4 block">Or Build Custom Estimate</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(PROJECT_TYPES).map(([key, type]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      projectType === type.id ? "ring-2 ring-primary border-primary" : ""
                    }`}
                    onClick={() => setProjectType(type.id)}
                  >
                    <CardContent className="p-6 text-center">
                      {(() => {
                        const IconComponent = projectIcons[type.id];
                        return IconComponent ? <IconComponent className="w-10 h-10 mx-auto mb-2 text-primary" /> : null;
                      })()}
                      <p className="font-semibold">{type.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-base font-semibold mb-4 block">Customer (Optional)</Label>
              <CustomerSelect
                value={customerId}
                onChange={setCustomerId}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-4 block">Quick Select Court Configuration</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(COURT_PRESETS)
                  .filter(([key]) => key.toLowerCase().includes(projectType.toLowerCase().replace('_', '')))
                  .map(([key, preset]) => (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        courtPreset === key && customSqFt === 0 ? "ring-2 ring-primary border-primary" : ""
                      }`}
                      onClick={() => {
                        setCourtPreset(key);
                        setNumberOfCourts(preset.courts);
                        setCustomSqFt(0);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{preset.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {preset.sqFt.toLocaleString()} sq ft
                            </p>
                          </div>
                          <Badge variant="secondary">{preset.courts} court{preset.courts > 1 ? 's' : ''}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <Label className="text-base font-semibold mb-4 block">Or Enter Custom Dimensions</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customSqFt">Total Square Feet</Label>
                  <Input
                    id="customSqFt"
                    type="number"
                    value={customSqFt || ""}
                    onChange={(e) => setCustomSqFt(parseInt(e.target.value) || 0)}
                    placeholder="Enter total sq ft"
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfCourts">Number of Courts</Label>
                  <Input
                    id="numberOfCourts"
                    type="number"
                    min={1}
                    value={numberOfCourts}
                    onChange={(e) => setNumberOfCourts(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <MapPin className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Area</p>
                    <p className="text-2xl font-bold">{totalSqFt.toLocaleString()} sq ft</p>
                    <p className="text-sm text-muted-foreground">
                      ({Math.round(totalSqFt / 9).toLocaleString()} sq yds)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-4 block">Base / Substrate</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(BASE_OPTIONS).map(([key, option]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      baseType === key ? "ring-2 ring-primary border-primary" : ""
                    }`}
                    onClick={() => setBaseType(key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{option.name}</p>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        {option.pricePerSqFt > 0 && (
                          <Badge variant="outline">${option.pricePerSqFt}/sq ft</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {(baseType === "EXISTING_ASPHALT" || baseType === "EXISTING_CONCRETE") && (
              <div className="space-y-4">
                <Label className="text-base font-semibold mb-4 block">Surface Condition & Prep</Label>
                
                {/* Pressure Wash */}
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="pressureWash"
                    checked={surfaceCondition.pressureWash}
                    onCheckedChange={(checked) => 
                      setSurfaceCondition(prev => ({ ...prev, pressureWash: checked === true }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="pressureWash" className="font-medium cursor-pointer">
                      Pressure Wash Surface
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Clean surface before resurfacing (+$0.15/sq ft)
                    </p>
                  </div>
                  <Badge variant="outline">$0.15/sq ft</Badge>
                </div>
                
                {/* 1K PrimeSeal */}
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Checkbox
                    id="primeSeal"
                    checked={surfaceCondition.primeSeal}
                    onCheckedChange={(checked) => 
                      setSurfaceCondition(prev => ({ ...prev, primeSeal: checked === true }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="primeSeal" className="font-medium cursor-pointer">
                      1K PrimeSeal Application
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Primer for better adhesion on concrete/asphalt (+$0.20/sq ft)
                    </p>
                  </div>
                  <Badge variant="outline">$0.20/sq ft</Badge>
                </div>
                
                {/* Birdbaths / Low Spots */}
                <div className="p-4 border rounded-lg space-y-3">
                  <Label htmlFor="birdbathSqFt" className="font-medium">
                    Birdbath / Low Spot Repair (sq ft)
                  </Label>
                  <Input
                    id="birdbathSqFt"
                    type="number"
                    min={0}
                    value={surfaceCondition.birdbathSqFt || ""}
                    onChange={(e) => 
                      setSurfaceCondition(prev => ({ ...prev, birdbathSqFt: parseInt(e.target.value) || 0 }))
                    }
                    placeholder="Estimated sq ft of low spots to fill"
                  />
                  <p className="text-sm text-muted-foreground">
                    Areas with standing water that need leveling (+$3.50/sq ft)
                  </p>
                </div>
                
                {/* Crack Repair */}
                <div className="p-4 border rounded-lg space-y-3">
                  <Label htmlFor="crackRepair" className="font-medium">
                    Crack Repair (Linear Feet)
                  </Label>
                  <Input
                    id="crackRepair"
                    type="number"
                    min={0}
                    value={crackRepairLf || ""}
                    onChange={(e) => setCrackRepairLf(parseInt(e.target.value) || 0)}
                    placeholder="Estimated linear feet of cracks"
                  />
                  <p className="text-sm text-muted-foreground">
                    Leave at 0 if no crack repair is needed (+$2.50/LF)
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-2 block">Surfacing System</Label>
              <p className="text-muted-foreground mb-6">
                Select the surfacing system based on desired comfort and performance
              </p>
              <SystemSelector
                selectedSystemId={selectedSystem}
                onSelect={setSelectedSystem}
                projectType={projectType}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-4 block">Available Add-ons</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(ADDONS).map(([key, addon]) => (
                  <Card key={key} className="hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{addon.name}</p>
                          <p className="text-sm text-muted-foreground">{addon.description}</p>
                          <p className="text-sm font-medium text-primary mt-1">
                            ${addon.unitPrice.toLocaleString()}/{addon.unit}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddAddon(key)}
                        >
                          <PlusCircle className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {selectedAddons.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-4 block">Selected Add-ons</Label>
                <div className="space-y-2">
                  {selectedAddons.map((addon) => (
                    <div 
                      key={addon.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="font-medium">{addon.name}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateAddonQuantity(addon.id, addon.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{addon.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateAddonQuantity(addon.id, addon.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <span className="font-semibold w-24 text-right">
                          ${(addon.quantity * addon.unitPrice).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 6:
        const marginPercent = Math.round((profitMargin - 1) * 100);
        const formatCurrency = (val: number) => 
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
        
        return (
          <div className="space-y-6">
            {/* Profit Margin & View Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Pricing Controls
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showCostView ? "outline" : "default"}
                      size="sm"
                      onClick={() => setShowCostView(false)}
                    >
                      Customer View
                    </Button>
                    <Button
                      variant={showCostView ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowCostView(true)}
                    >
                      Internal View
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profit Margin Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Profit Margin</Label>
                    <span className="text-lg font-bold text-primary">{marginPercent}%</span>
                  </div>
                  <Slider
                    value={[profitMargin]}
                    onValueChange={([value]) => setProfitMargin(value)}
                    min={MIN_PROFIT_MARGIN}
                    max={MAX_PROFIT_MARGIN}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round((MIN_PROFIT_MARGIN - 1) * 100)}%</span>
                    <span>{Math.round((MAX_PROFIT_MARGIN - 1) * 100)}%</span>
                  </div>
                </div>

                {/* Profit Summary */}
                {calculation && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Materials:</span>
                          <span className="font-medium">{formatCurrency(calculation.subtotals.materials)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Labor:</span>
                          <span className="font-medium">{formatCurrency(calculation.subtotals.labor)}</span>
                        </div>
                        {calculation.subtotals.condition > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prep Work:</span>
                            <span className="font-medium">{formatCurrency(calculation.subtotals.condition)}</span>
                          </div>
                        )}
                        {calculation.subtotals.base > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base Work:</span>
                            <span className="font-medium">{formatCurrency(calculation.subtotals.base)}</span>
                          </div>
                        )}
                        {calculation.subtotals.addons > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Add-ons:</span>
                            <span className="font-medium">{formatCurrency(calculation.subtotals.addons)}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 border-l pl-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Cost:</span>
                          <span className="font-medium">{formatCurrency(calculation.costTotal)}</span>
                        </div>
                        <div className="flex justify-between text-primary">
                          <span>Markup ({marginPercent}%):</span>
                          <span className="font-medium">+{formatCurrency(calculation.profitAmount)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-semibold">Customer Price:</span>
                          <span className="font-bold text-lg">{formatCurrency(calculation.grandTotal)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Gross Profit:</span>
                          <span className="font-semibold">{formatCurrency(calculation.profitAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {calculation && <MaterialBreakdown calculation={calculation} showCosts={showCostView} />}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any notes for this estimate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Export Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Share or save this estimate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    disabled={exporting !== null}
                  >
                    {exporting === 'copy' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Copy to Clipboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={exporting !== null}
                  >
                    {exporting === 'pdf' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleEmailEstimate}
                    disabled={exporting !== null || !customerId}
                    title={!customerId ? "Select a customer first" : ""}
                  >
                    {exporting === 'email' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Email to Customer
                  </Button>
                </div>
                {!customerId && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select a customer in Step 1 to enable email delivery
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/estimates")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? "Edit Estimate" : "CourtPro Estimator"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Build a detailed estimate with Laykold surfacing systems
          </p>
        </div>
      </div>

      <EstimateWizardSteps
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepClick={(step) => step < currentStep && setCurrentStep(step)}
      />

      <Card>
        <CardHeader>
          <CardTitle>{WIZARD_STEPS[currentStep - 1].name}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {currentStep < WIZARD_STEPS.length ? (
          <Button
            onClick={() => setCurrentStep((prev) => prev + 1)}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSaveEstimate}
            disabled={saving || !calculation}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Estimate
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
