import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EstimateWizardSteps } from "@/components/admin/EstimateWizardSteps";
import { SystemSelector } from "@/components/admin/SystemSelector";
import { MaterialBreakdown } from "@/components/admin/MaterialBreakdown";
import { CustomerSelect } from "@/components/admin/CustomerSelect";
import { 
  PROJECT_TYPES, 
  COURT_PRESETS, 
  BASE_OPTIONS, 
  ADDONS 
} from "@/lib/pricingConstants";
import { calculateMaterials, generateLineItems, type CourtConfig } from "@/lib/courtCalculator";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Calculator,
  MapPin,
  Layers,
  PlusCircle,
  FileText
} from "lucide-react";

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
  }), [projectType, totalSqFt, numberOfCourts, selectedSystem, baseType, crackRepairLf, selectedAddons]);

  // Calculate estimate
  const calculation = useMemo(() => {
    if (totalSqFt > 0) {
      return calculateMaterials(courtConfig);
    }
    return null;
  }, [courtConfig, totalSqFt]);

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
            <div>
              <Label className="text-base font-semibold mb-4 block">Project Type</Label>
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
                      <span className="text-4xl mb-2 block">{type.icon}</span>
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
              <div>
                <Label htmlFor="crackRepair">Crack Repair (Linear Feet)</Label>
                <Input
                  id="crackRepair"
                  type="number"
                  min={0}
                  value={crackRepairLf || ""}
                  onChange={(e) => setCrackRepairLf(parseInt(e.target.value) || 0)}
                  placeholder="Estimated linear feet of cracks"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave at 0 if no crack repair is needed
                </p>
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
        return (
          <div className="space-y-6">
            {calculation && <MaterialBreakdown calculation={calculation} />}
            
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
