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
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { EstimateWizardSteps } from "@/components/admin/EstimateWizardSteps";
import { JobTemplates, type JobTemplate } from "@/components/admin/JobTemplates";
import { SystemSelector } from "@/components/admin/SystemSelector";
import { SystemTierComparison } from "@/components/admin/SystemTierComparison";
import { MaterialBreakdown } from "@/components/admin/MaterialBreakdown";
import { CustomerSelect } from "@/components/admin/CustomerSelect";
import { SitePhotosUploader, type SitePhoto } from "@/components/admin/SitePhotosUploader";
import { CustomItemsEditor, type CustomItem } from "@/components/admin/CustomItemsEditor";
import { 
  PROJECT_TYPES, 
  COURT_PRESETS, 
  BASE_OPTIONS, 
  ADDONS,
  DEFAULT_PROFIT_MARGIN,
  MIN_PROFIT_MARGIN,
  MAX_PROFIT_MARGIN,
  PRICING,
} from "@/lib/pricingConstants";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateMaterials, generateLineItems, generateQuoteText, generateScopeBullets, type CourtConfig, type SurfaceCondition, type ConstructionOptions, type EstimateDisplayFormat } from "@/lib/courtCalculator";
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
  Loader2,
  Building2,
  Fence,
  Lightbulb,
  Trees,
  AlertCircle,
  Eye,
  List,
  Check,
  DollarSign
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
  { id: 4, name: "Construction" },
  { id: 5, name: "System" },
  { id: 6, name: "Add-ons" },
  { id: 7, name: "Review" },
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
  const { data: pricingConfig } = usePricingConfig();
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
  const [sitePhotos, setSitePhotos] = useState<SitePhoto[]>([]);
  const [surfaceCondition, setSurfaceCondition] = useState<SurfaceCondition>({
    pressureWash: false,
    birdbathSqFt: 0,
    primeSeal: false,
  });
  const [constructionOptions, setConstructionOptions] = useState<ConstructionOptions>({
    newConstruction: false,
    constructionType: 'asphalt',
    fencingRequired: false,
    fencingLinearFeet: 0,
    lightingRequired: false,
    lightPoleCount: 4,
    playgroundInterest: false,
    netPostSets: 0,
    benchCount: 0,
    windscreenLinearFeet: 0,
    ballContainmentLinearFeet: 0,
  });
  const [profitMargin, setProfitMargin] = useState<number>(DEFAULT_PROFIT_MARGIN);
  const [showCostView, setShowCostView] = useState<boolean>(false);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [displayFormat, setDisplayFormat] = useState<EstimateDisplayFormat>('lump_sum');
  const [scopeBullets, setScopeBullets] = useState<string[]>([]);
  const [overrideSellPrice, setOverrideSellPrice] = useState<number | null>(null);
  const [overrideEnabled, setOverrideEnabled] = useState(false);

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
    constructionOptions,
    profitMargin,
  }), [projectType, totalSqFt, numberOfCourts, selectedSystem, baseType, crackRepairLf, selectedAddons, surfaceCondition, constructionOptions, profitMargin]);

  // Calculate estimate
  const calculation = useMemo(() => {
    if (totalSqFt > 0) {
      return calculateMaterials(courtConfig, pricingConfig);
    }
    return null;
  }, [courtConfig, totalSqFt, pricingConfig]);

  // Calculate totals including custom items
  const customItemsTotal = useMemo(() => {
    return customItems.reduce((sum, item) => sum + item.customerPrice, 0);
  }, [customItems]);

  const grandTotalWithCustomItems = useMemo(() => {
    return (calculation?.grandTotal || 0) + customItemsTotal;
  }, [calculation?.grandTotal, customItemsTotal]);

  // Customer-facing price uses override if set
  const customerFacingTotal = useMemo(() => {
    if (overrideEnabled && overrideSellPrice !== null) return overrideSellPrice;
    return grandTotalWithCustomItems;
  }, [overrideEnabled, overrideSellPrice, grandTotalWithCustomItems]);

  // Generate scope bullets when calculation changes
  useEffect(() => {
    if (calculation) {
      const bullets = generateScopeBullets(calculation);
      setScopeBullets(bullets);
    }
  }, [calculation]);

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
          subtotal: grandTotalWithCustomItems,
          total: customerFacingTotal,
          override_sell_price: overrideEnabled ? overrideSellPrice : null,
          notes: notes || `${PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES]?.name || projectType} - ${calculation.summary.system.name}`,
          status: "draft",
          display_format: displayFormat,
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      // Save scope bullets
      if (scopeBullets.length > 0) {
        const bulletsToInsert = scopeBullets.map((bullet, index) => ({
          estimate_id: estimate.id,
          bullet_text: bullet,
          sort_order: index,
        }));

        await supabase.from("estimate_scope_bullets").insert(bulletsToInsert);
      }

      const lineItems = generateLineItems(calculation);
      const itemsToInsert = lineItems.map(item => ({
        ...item,
        estimate_id: estimate.id,
      }));

      await supabase.from("estimate_items").insert(itemsToInsert);

      // Save custom items
      if (customItems.length > 0) {
        const customItemsToInsert = customItems.map((item, index) => ({
          estimate_id: estimate.id,
          description: item.description,
          vendor_name: item.vendorName || null,
          vendor_cost: item.vendorCost || null,
          markup_percent: item.markupPercent,
          customer_price: item.customerPrice,
          notes: item.notes || null,
          pricing_mode: item.pricingMode === 'at_cost' ? 'at_cost' : item.pricingMode,
          is_alternate: item.isAlternate || false,
          sort_order: index,
        }));

        await supabase.from("estimate_custom_items").insert(customItemsToInsert);
      }

      // Save site photos attachments
      if (sitePhotos.length > 0) {
        const attachmentsToInsert = sitePhotos.map((photo, index) => ({
          estimate_id: estimate.id,
          file_path: photo.file_path,
          file_name: photo.file_name,
          file_type: photo.file_type,
          file_size: photo.file_size,
          caption: photo.caption || null,
          sort_order: index,
        }));

        await supabase.from("estimate_attachments").insert(attachmentsToInsert);

        // Move files from temp folder to estimate folder
        for (const photo of sitePhotos) {
          if (photo.file_path.startsWith('temp/')) {
            const newPath = photo.file_path.replace('temp/', `${estimate.id}/`);
            await supabase.storage
              .from('estimate-attachments')
              .move(photo.file_path, newPath);
          }
        }
      }

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
          subtotal: grandTotalWithCustomItems,
          total: customerFacingTotal,
          override_sell_price: overrideEnabled ? overrideSellPrice : null,
          notes: notes || `${PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES]?.name || projectType} - ${calculation.summary.system.name}`,
          status: "draft",
          display_format: displayFormat,
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      // Save scope bullets
      if (scopeBullets.length > 0) {
        const bulletsToInsert = scopeBullets.map((bullet, index) => ({
          estimate_id: estimate.id,
          bullet_text: bullet,
          sort_order: index,
        }));

        await supabase.from("estimate_scope_bullets").insert(bulletsToInsert);
      }

      const lineItems = generateLineItems(calculation);
      const itemsToInsert = lineItems.map(item => ({
        ...item,
        estimate_id: estimate.id,
      }));

      await supabase.from("estimate_items").insert(itemsToInsert);

      // Save custom items
      if (customItems.length > 0) {
        const customItemsToInsert = customItems.map((item, index) => ({
          estimate_id: estimate.id,
          description: item.description,
          vendor_name: item.vendorName || null,
          vendor_cost: item.vendorCost || null,
          markup_percent: item.markupPercent,
          customer_price: item.customerPrice,
          notes: item.notes || null,
          pricing_mode: item.pricingMode === 'at_cost' ? 'at_cost' : item.pricingMode,
          is_alternate: item.isAlternate || false,
          sort_order: index,
        }));

        await supabase.from("estimate_custom_items").insert(customItemsToInsert);
      }

      // Save site photos attachments
      if (sitePhotos.length > 0) {
        const attachmentsToInsert = sitePhotos.map((photo, index) => ({
          estimate_id: estimate.id,
          file_path: photo.file_path,
          file_name: photo.file_name,
          file_type: photo.file_type,
          file_size: photo.file_size,
          caption: photo.caption || null,
          sort_order: index,
        }));

        await supabase.from("estimate_attachments").insert(attachmentsToInsert);

        // Move files from temp folder to estimate folder
        for (const photo of sitePhotos) {
          if (photo.file_path.startsWith('temp/')) {
            const newPath = photo.file_path.replace('temp/', `${estimate.id}/`);
            await supabase.storage
              .from('estimate-attachments')
              .move(photo.file_path, newPath);
          }
        }
      }

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
      
      // Create estimate with custom items included in total
      const { data: estimate, error: estimateError } = await supabase
        .from("estimates")
        .insert({
          estimate_number: estimateNumber,
          customer_id: customerId,
          subtotal: grandTotalWithCustomItems,
          total: customerFacingTotal,
          override_sell_price: overrideEnabled ? overrideSellPrice : null,
          notes: notes || `${PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES]?.name || projectType} - ${calculation.summary.system.name}`,
          status: "draft",
          display_format: displayFormat,
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      // Save scope bullets
      if (scopeBullets.length > 0) {
        const bulletsToInsert = scopeBullets.map((bullet, index) => ({
          estimate_id: estimate.id,
          bullet_text: bullet,
          sort_order: index,
        }));

        await supabase.from("estimate_scope_bullets").insert(bulletsToInsert);
      }

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

      // Save custom items
      if (customItems.length > 0) {
        const customItemsToInsert = customItems.map((item, index) => ({
          estimate_id: estimate.id,
          description: item.description,
          vendor_name: item.vendorName || null,
          vendor_cost: item.vendorCost || null,
          markup_percent: item.markupPercent,
          customer_price: item.customerPrice,
          notes: item.notes || null,
          pricing_mode: item.pricingMode === 'at_cost' ? 'at_cost' : item.pricingMode,
          is_alternate: item.isAlternate || false,
          sort_order: index,
        }));

        const { error: customItemsError } = await supabase
          .from("estimate_custom_items")
          .insert(customItemsToInsert);

        if (customItemsError) {
          console.error("Failed to save custom items:", customItemsError);
        }
      }

      // Save site photos attachments
      if (sitePhotos.length > 0) {
        const attachmentsToInsert = sitePhotos.map((photo, index) => ({
          estimate_id: estimate.id,
          file_path: photo.file_path,
          file_name: photo.file_name,
          file_type: photo.file_type,
          file_size: photo.file_size,
          caption: photo.caption || null,
          sort_order: index,
        }));

        const { error: attachmentsError } = await supabase
          .from("estimate_attachments")
          .insert(attachmentsToInsert);

        if (attachmentsError) {
          console.error("Failed to save attachments:", attachmentsError);
        }

        // Move files from temp folder to estimate folder
        for (const photo of sitePhotos) {
          if (photo.file_path.startsWith('temp/')) {
            const newPath = photo.file_path.replace('temp/', `${estimate.id}/`);
            await supabase.storage
              .from('estimate-attachments')
              .move(photo.file_path, newPath);
          }
        }
      }

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
        // Construction step - always can proceed (options are optional)
        return true;
      case 5:
        return !!selectedSystem;
      case 6:
        return true; // Add-ons are optional
      case 7:
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
        // Calculate default fencing perimeter based on court dimensions
        const presetData = COURT_PRESETS[courtPreset as keyof typeof COURT_PRESETS];
        const defaultPerimeter = presetData ? Math.round(Math.sqrt(presetData.sqFt) * 4) : Math.round(Math.sqrt(totalSqFt) * 4);
        
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-4 block">Construction & Infrastructure</Label>
              <p className="text-muted-foreground mb-6">
                Configure construction options for new builds or court enhancements
              </p>
            </div>

            {/* New Construction Toggle */}
            <Card className={constructionOptions.newConstruction ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <Label className="font-medium">New Court Construction?</Label>
                      <p className="text-sm text-muted-foreground">
                        Building a new court from the ground up
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={constructionOptions.newConstruction}
                    onCheckedChange={(checked) =>
                      setConstructionOptions(prev => ({ ...prev, newConstruction: checked }))
                    }
                  />
                </div>

                {constructionOptions.newConstruction && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <Label className="text-sm font-medium">Select Base Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          constructionOptions.constructionType === 'asphalt' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                        }`}
                        onClick={() => setConstructionOptions(prev => ({ ...prev, constructionType: 'asphalt' }))}
                      >
                        <p className="font-medium">Asphalt Paving</p>
                        <p className="text-sm text-muted-foreground">1.5" Overlay</p>
                        <p className="text-sm font-medium text-primary mt-1">
                          ${PRICING.CONSTRUCTION.ASPHALT_PAVING_PER_SF.toFixed(2)}/sq ft
                        </p>
                      </div>
                      <div
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          constructionOptions.constructionType === 'post_tension' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                        }`}
                        onClick={() => setConstructionOptions(prev => ({ ...prev, constructionType: 'post_tension' }))}
                      >
                        <p className="font-medium">Post-Tension Concrete</p>
                        <p className="text-sm text-muted-foreground">Premium slab</p>
                        <p className="text-sm font-medium text-primary mt-1">
                          ${PRICING.CONSTRUCTION.CONCRETE_PT_PER_SF.toFixed(2)}/sq ft
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fencing Toggle */}
            <Card className={constructionOptions.fencingRequired ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fence className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <Label className="font-medium">Fencing Required?</Label>
                      <p className="text-sm text-muted-foreground">
                        10ft Black Vinyl Chain Link
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={constructionOptions.fencingRequired}
                    onCheckedChange={(checked) =>
                      setConstructionOptions(prev => ({
                        ...prev,
                        fencingRequired: checked,
                        fencingLinearFeet: checked && prev.fencingLinearFeet === 0 ? defaultPerimeter : prev.fencingLinearFeet,
                      }))
                    }
                  />
                </div>

                {constructionOptions.fencingRequired && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor="fencingLf">Linear Feet of Fencing</Label>
                        <Input
                          id="fencingLf"
                          type="number"
                          min={0}
                          value={constructionOptions.fencingLinearFeet || ''}
                          onChange={(e) =>
                            setConstructionOptions(prev => ({
                              ...prev,
                              fencingLinearFeet: parseInt(e.target.value) || 0,
                            }))
                          }
                          placeholder={`Default: ${defaultPerimeter} LF (perimeter)`}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Estimated Cost</p>
                        <p className="text-lg font-bold">
                          ${(constructionOptions.fencingLinearFeet * PRICING.CONSTRUCTION.FENCING_10FT_PER_LF).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lighting Toggle */}
            <Card className={constructionOptions.lightingRequired ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <Label className="font-medium">Lighting?</Label>
                      <p className="text-sm text-muted-foreground">
                        LED Light Poles with electrical
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={constructionOptions.lightingRequired}
                    onCheckedChange={(checked) =>
                      setConstructionOptions(prev => ({ ...prev, lightingRequired: checked }))
                    }
                  />
                </div>

                {constructionOptions.lightingRequired && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm font-medium mb-3 block">Number of Poles</Label>
                    <div className="grid grid-cols-4 gap-3">
                      {[2, 4, 6, 8].map((count) => (
                        <div
                          key={count}
                          className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${
                            constructionOptions.lightPoleCount === count ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                          }`}
                          onClick={() => setConstructionOptions(prev => ({ ...prev, lightPoleCount: count }))}
                        >
                          <p className="text-lg font-bold">{count}</p>
                          <p className="text-xs text-muted-foreground">poles</p>
                          <p className="text-sm font-medium text-primary mt-1">
                            ${(count * PRICING.CONSTRUCTION.LIGHT_POLE_UNIT).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Playground Interest Toggle */}
            <Card className={constructionOptions.playgroundInterest ? "ring-2 ring-amber-500 border-amber-500" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trees className="w-6 h-6 text-muted-foreground" />
                    <div>
                      <Label className="font-medium">Playground Interest?</Label>
                      <p className="text-sm text-muted-foreground">
                        Add playground equipment allowance
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={constructionOptions.playgroundInterest}
                    onCheckedChange={(checked) =>
                      setConstructionOptions(prev => ({ ...prev, playgroundInterest: checked }))
                    }
                  />
                </div>

                {constructionOptions.playgroundInterest && (
                  <div className="mt-4 pt-4 border-t">
                    <Alert className="border-amber-500 bg-amber-500/10">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-amber-700">
                        <strong>Consultation Required</strong> - A ${PRICING.CONSTRUCTION.PLAYGROUND_BUDGET.toLocaleString()} 
                        {' '}allowance will be added. Final pricing requires a site consultation.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipment Add-ons Section */}
            <div className="border-t pt-6">
              <Label className="text-base font-semibold mb-4 block flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Equipment Add-ons
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Net Post Sets */}
                <Card className={constructionOptions.netPostSets > 0 ? "ring-2 ring-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">Net Post Sets</p>
                        <p className="text-sm text-muted-foreground">Pair of posts with sleeves</p>
                        <p className="text-sm font-medium text-primary">${PRICING.EQUIPMENT.NET_POST_SET.toLocaleString()}/set</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setConstructionOptions(prev => ({ ...prev, netPostSets: Math.max(0, prev.netPostSets - 1) }))}
                        disabled={constructionOptions.netPostSets === 0}
                      >-</Button>
                      <span className="w-8 text-center font-bold">{constructionOptions.netPostSets}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setConstructionOptions(prev => ({ ...prev, netPostSets: prev.netPostSets + 1 }))}
                      >+</Button>
                      {constructionOptions.netPostSets > 0 && (
                        <span className="ml-auto font-semibold">${(constructionOptions.netPostSets * PRICING.EQUIPMENT.NET_POST_SET).toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Player Benches */}
                <Card className={constructionOptions.benchCount > 0 ? "ring-2 ring-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">Player Benches (6ft)</p>
                        <p className="text-sm text-muted-foreground">Aluminum courtside bench</p>
                        <p className="text-sm font-medium text-primary">${PRICING.EQUIPMENT.PLAYER_BENCH_6FT.toLocaleString()}/bench</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setConstructionOptions(prev => ({ ...prev, benchCount: Math.max(0, prev.benchCount - 1) }))}
                        disabled={constructionOptions.benchCount === 0}
                      >-</Button>
                      <span className="w-8 text-center font-bold">{constructionOptions.benchCount}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setConstructionOptions(prev => ({ ...prev, benchCount: prev.benchCount + 1 }))}
                      >+</Button>
                      {constructionOptions.benchCount > 0 && (
                        <span className="ml-auto font-semibold">${(constructionOptions.benchCount * PRICING.EQUIPMENT.PLAYER_BENCH_6FT).toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Windscreen */}
                <Card className={constructionOptions.windscreenLinearFeet > 0 ? "ring-2 ring-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <p className="font-semibold">Windscreen</p>
                      <p className="text-sm text-muted-foreground">Privacy/wind mesh</p>
                      <p className="text-sm font-medium text-primary">${PRICING.EQUIPMENT.WINDSCREEN_PER_LF.toFixed(2)}/linear ft</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={constructionOptions.windscreenLinearFeet || ''}
                        onChange={(e) => setConstructionOptions(prev => ({ ...prev, windscreenLinearFeet: parseInt(e.target.value) || 0 }))}
                        placeholder="Linear feet"
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">LF</span>
                      {constructionOptions.windscreenLinearFeet > 0 && (
                        <span className="ml-auto font-semibold">${(constructionOptions.windscreenLinearFeet * PRICING.EQUIPMENT.WINDSCREEN_PER_LF).toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ball Containment */}
                <Card className={constructionOptions.ballContainmentLinearFeet > 0 ? "ring-2 ring-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <p className="font-semibold">Ball Containment</p>
                      <p className="text-sm text-muted-foreground">Overhead netting system</p>
                      <p className="text-sm font-medium text-primary">${PRICING.EQUIPMENT.BALL_CONTAINMENT_PER_LF.toFixed(2)}/linear ft</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={constructionOptions.ballContainmentLinearFeet || ''}
                        onChange={(e) => setConstructionOptions(prev => ({ ...prev, ballContainmentLinearFeet: parseInt(e.target.value) || 0 }))}
                        placeholder="Linear feet"
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">LF</span>
                      {constructionOptions.ballContainmentLinearFeet > 0 && (
                        <span className="ml-auto font-semibold">${(constructionOptions.ballContainmentLinearFeet * PRICING.EQUIPMENT.BALL_CONTAINMENT_PER_LF).toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 5:
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

      case 6:
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

            {/* Custom Items Section */}
            <div className="border-t pt-6">
              <CustomItemsEditor
                items={customItems}
                onChange={setCustomItems}
                showCostView={showCostView}
              />
            </div>
          </div>
        );

      case 7:
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
                {/* Sell Price Override */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={overrideEnabled}
                        onCheckedChange={(checked) => {
                          setOverrideEnabled(checked);
                          if (!checked) setOverrideSellPrice(null);
                        }}
                        id="overrideToggle"
                      />
                      <Label htmlFor="overrideToggle" className="cursor-pointer text-base font-medium">
                        Override sell price
                      </Label>
                    </div>
                    {overrideEnabled && overrideSellPrice !== null && calculation && (() => {
                      const directCost = calculation.costTotal + customItems.reduce((sum, item) => sum + (item.vendorCost || item.customerPrice), 0);
                      const effectiveMarginPct = directCost > 0 ? ((overrideSellPrice - directCost) / directCost) * 100 : 0;
                      const marginColor = effectiveMarginPct < 15 ? 'bg-destructive text-destructive-foreground' : effectiveMarginPct < 30 ? 'bg-yellow-500 text-white' : 'bg-emerald-600 text-white';
                      return (
                        <Badge className={`${marginColor}`}>
                          Effective margin: {effectiveMarginPct.toFixed(1)}%
                        </Badge>
                      );
                    })()}
                  </div>
                  {overrideEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="overridePrice">Customer-facing sell price</Label>
                      <div className="relative max-w-xs">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="overridePrice"
                          type="number"
                          min={0}
                          step={100}
                          value={overrideSellPrice ?? ''}
                          onChange={(e) => setOverrideSellPrice(e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder={formatCurrency(grandTotalWithCustomItems)}
                          className="pl-9 text-lg font-semibold"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Calculated price: {formatCurrency(grandTotalWithCustomItems)}. Override only changes what the customer sees — internal cost tracking stays the same.
                      </p>
                    </div>
                  )}
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
                        {calculation.subtotals.construction > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Construction:</span>
                            <span className="font-medium">{formatCurrency(calculation.subtotals.construction)}</span>
                          </div>
                        )}
                        {calculation.subtotals.mobilization > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mobilization:</span>
                            <span className="font-medium">{formatCurrency(calculation.subtotals.mobilization)}</span>
                          </div>
                        )}
                        {customItemsTotal > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Custom Items:</span>
                            <span className="font-medium">{formatCurrency(customItemsTotal)}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 border-l pl-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Surfacing Cost:</span>
                          <span className="font-medium">{formatCurrency(calculation.costTotal)}</span>
                        </div>
                        <div className="flex justify-between text-primary">
                          <span>Markup ({marginPercent}%):</span>
                          <span className="font-medium">+{formatCurrency(calculation.profitAmount)}</span>
                        </div>
                        {customItemsTotal > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Custom Items:</span>
                            <span className="font-medium">+{formatCurrency(customItemsTotal)}</span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between">
                          <span className="font-semibold">
                            {overrideEnabled && overrideSellPrice !== null ? 'Override Price:' : 'Customer Total:'}
                          </span>
                          <span className="font-bold text-lg">{formatCurrency(customerFacingTotal)}</span>
                        </div>
                        {overrideEnabled && overrideSellPrice !== null && (
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Calculated price:</span>
                            <span className="line-through">{formatCurrency(grandTotalWithCustomItems)}</span>
                          </div>
                        )}
                        {showCostView && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Total Profit:</span>
                            <span className="font-semibold">
                              {formatCurrency(
                                calculation.profitAmount + 
                                customItems.reduce((sum, item) => sum + item.customerPrice - (item.vendorCost || item.customerPrice), 0)
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Tier Comparison */}
            <SystemTierComparison
              baseConfig={{
                projectType,
                totalSqFt,
                numberOfCourts,
                baseType,
                crackRepairLf,
                addons: selectedAddons,
                surfaceCondition,
                profitMargin,
              }}
              selectedSystem={selectedSystem}
              onSelectSystem={setSelectedSystem}
            />

            {calculation && <MaterialBreakdown calculation={calculation} showCosts={showCostView} />}
            
            {/* Site Documentation */}
            <SitePhotosUploader
              photos={sitePhotos}
              onChange={setSitePhotos}
            />
            
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

            {/* Customer Display Format */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Customer Display Format
                </CardTitle>
                <CardDescription>
                  Choose how the estimate will appear to your customer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lump Sum Option */}
                  <div
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      displayFormat === 'lump_sum' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setDisplayFormat('lump_sum')}
                  >
                    {displayFormat === 'lump_sum' && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Lump Sum</p>
                        <p className="text-xs text-muted-foreground">Recommended</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Clean, marketing-focused format with bullet points and a single total price.
                    </p>
                    <div className="text-xs space-y-1 p-2 bg-muted/50 rounded">
                      <p className="font-medium">Preview:</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {scopeBullets.slice(0, 3).map((bullet, i) => (
                          <li key={i} className="truncate">{bullet}</li>
                        ))}
                        {scopeBullets.length > 3 && <li>...</li>}
                      </ul>
                      <p className="font-semibold mt-2">
                        Project Investment: {formatCurrency(customerFacingTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Scope Option */}
                  <div
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      displayFormat === 'detailed_scope' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    onClick={() => setDisplayFormat('detailed_scope')}
                  >
                    {displayFormat === 'detailed_scope' && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-muted">
                        <List className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">Detailed Scope</p>
                        <p className="text-xs text-muted-foreground">On Request</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Grouped categories with subtotals. Shows more detail without exposing unit costs.
                    </p>
                    <div className="text-xs space-y-1 p-2 bg-muted/50 rounded">
                      <p className="font-medium">Preview:</p>
                      <div className="space-y-1 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Surface Preparation</span>
                          <span>{formatCurrency(calculation?.subtotals.condition || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Surfacing System</span>
                          <span>{formatCurrency((calculation?.subtotals.materials || 0) + (calculation?.subtotals.labor || 0))}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-foreground pt-1 border-t">
                          <span>Total</span>
                          <span>{formatCurrency(customerFacingTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> The Admin View with full cost breakdown is always available to you. 
                  This selection only affects what the customer sees in emails and PDFs.
                </p>
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
