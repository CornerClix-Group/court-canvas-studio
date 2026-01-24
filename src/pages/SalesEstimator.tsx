import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePricingConfig } from "@/hooks/usePricingConfig";
import { 
  PRICING,
  PROJECT_TYPES, 
  COAT_SYSTEMS,
  LAYKOLD_COLORS,
} from "@/lib/pricingConstants";
import { calculateMaterials, generateQuoteText, type CourtConfig, type SurfaceCondition, type ConstructionOptions } from "@/lib/courtCalculator";
import { 
  ArrowLeft, 
  ArrowRight, 
  Copy,
  Check,
  Building,
  RefreshCw,
  Wrench,
  CircleDot,
  TruckIcon,
  Fence,
  Lightbulb,
  TreePine,
  HardHat,
  PlusCircle,
} from "lucide-react";

const WIZARD_STEPS = [
  { id: 1, name: "Client" },
  { id: 2, name: "Dimensions" },
  { id: 3, name: "Condition" },
  { id: 4, name: "Construction" },
  { id: 5, name: "System" },
  { id: 6, name: "Quote" },
];

const projectTypeIcons: Record<string, React.ElementType> = {
  new_construction: Building,
  resurfacing: RefreshCw,
  repair_only: Wrench,
};

export default function SalesEstimator() {
  const { toast } = useToast();
  const { data: pricingConfig } = usePricingConfig();
  const [currentStep, setCurrentStep] = useState(1);
  const [copied, setCopied] = useState(false);

  // Step 1: Client Info
  const [projectName, setProjectName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState("resurfacing");

  // Step 2: Dimensions
  const [numberOfCourts, setNumberOfCourts] = useState(2);
  const [courtLength, setCourtLength] = useState(60);
  const [courtWidth, setCourtWidth] = useState(60);

  // Step 3: Surface Condition
  const [pressureWash, setPressureWash] = useState(false);
  const [crackRepairLf, setCrackRepairLf] = useState(0);
  const [birdbathSqFt, setBirdbathSqFt] = useState(0);
  const [primeSeal, setPrimeSeal] = useState(false);

  // Step 4: Construction & Lighting
  const [newConstruction, setNewConstruction] = useState(false);
  const [constructionType, setConstructionType] = useState<'asphalt' | 'post_tension' | null>(null);
  const [fencingRequired, setFencingRequired] = useState(false);
  const [fencingLinearFeet, setFencingLinearFeet] = useState(0);
  const [lightingRequired, setLightingRequired] = useState(false);
  const [lightPoleCount, setLightPoleCount] = useState(4);
  const [playgroundInterest, setPlaygroundInterest] = useState(false);
  // Equipment add-ons
  const [netPostSets, setNetPostSets] = useState(0);
  const [benchCount, setBenchCount] = useState(0);
  const [windscreenLinearFeet, setWindscreenLinearFeet] = useState(0);
  const [ballContainmentLinearFeet, setBallContainmentLinearFeet] = useState(0);

  // Step 4: System Specs
  const [coatSystem, setCoatSystem] = useState("three_coat");
  const [innerColor, setInnerColor] = useState("dark_green");
  const [outerColor, setOuterColor] = useState("terra_cotta");
  const [stripingType, setStripingType] = useState<'pickleball' | 'tennis'>('pickleball');

  // Step 6: Pricing
  const [profitMargin, setProfitMargin] = useState(PRICING.DEFAULT_MARGIN);

  // Calculations
  const totalSqFt = courtLength * courtWidth;
  const totalSqYds = Math.round(totalSqFt / 9);
  
  // Calculate perimeter for fencing default
  const courtPerimeter = useMemo(() => {
    return 2 * (courtLength + courtWidth);
  }, [courtLength, courtWidth]);

  const surfaceCondition: SurfaceCondition = {
    pressureWash,
    birdbathSqFt,
    primeSeal,
  };

  const constructionOptions: ConstructionOptions = useMemo(() => ({
    newConstruction,
    constructionType: newConstruction ? constructionType : null,
    fencingRequired,
    fencingLinearFeet: fencingRequired ? fencingLinearFeet : 0,
    lightingRequired,
    lightPoleCount: lightingRequired ? lightPoleCount : 0,
    playgroundInterest,
    netPostSets,
    benchCount,
    windscreenLinearFeet,
    ballContainmentLinearFeet,
  }), [newConstruction, constructionType, fencingRequired, fencingLinearFeet, lightingRequired, lightPoleCount, playgroundInterest, netPostSets, benchCount, windscreenLinearFeet, ballContainmentLinearFeet]);

  // Map coat system to surfacing system
  const getSystemId = () => {
    switch (coatSystem) {
      case 'two_coat':
        return 'HARD_COURT';
      case 'cushion':
        return 'PRO_PLUS_STANDARD';
      default:
        return 'HARD_COURT';
    }
  };

  const courtConfig: CourtConfig = useMemo(() => ({
    projectType,
    totalSqFt,
    numberOfCourts,
    systemId: getSystemId(),
    baseType: newConstruction && constructionType 
      ? (constructionType === 'asphalt' ? 'NEW_ASPHALT' : 'POST_TENSION_CONCRETE')
      : 'EXISTING_ASPHALT',
    crackRepairLf,
    addons: [],
    surfaceCondition,
    constructionOptions,
    profitMargin,
    innerColor,
    outerColor,
    stripingType,
  }), [projectType, totalSqFt, numberOfCourts, crackRepairLf, surfaceCondition, constructionOptions, profitMargin, coatSystem, innerColor, outerColor, stripingType, newConstruction, constructionType]);

  const calculation = useMemo(() => {
    if (totalSqFt > 0) {
      return calculateMaterials(courtConfig, pricingConfig);
    }
    return null;
  }, [courtConfig, totalSqFt, pricingConfig]);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const handleCopyToClipboard = async () => {
    if (!calculation) return;
    
    const quoteText = generateQuoteText(calculation, {
      projectName,
      contactName,
      email,
    });
    
    try {
      await navigator.clipboard.writeText(quoteText);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Quote copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again",
      });
    }
  };

  const handleSaveQuote = () => {
    if (!calculation) return;
    
    const quote = {
      id: Date.now(),
      projectName,
      contactName,
      email,
      projectType,
      totalSqFt,
      numberOfCourts,
      total: calculation.clientPrice,
      createdAt: new Date().toISOString(),
    };
    
    const savedQuotes = JSON.parse(localStorage.getItem('courtpro_quotes') || '[]');
    savedQuotes.unshift(quote);
    localStorage.setItem('courtpro_quotes', JSON.stringify(savedQuotes.slice(0, 50)));
    
    toast({
      title: "Quote Saved",
      description: "Quote saved to local storage",
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!projectType;
      case 2:
        return totalSqFt > 0 && numberOfCourts > 0;
      case 3:
        return true;
      case 4:
        // Construction step - valid if not doing new construction, or if construction type is selected
        return !newConstruction || !!constructionType;
      case 5:
        return !!coatSystem;
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
            <div className="grid gap-4">
              <div>
                <Label htmlFor="projectName" className="text-lg">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Smith Residence Pickleball Court"
                  className="h-14 text-lg bg-background"
                />
              </div>
              <div>
                <Label htmlFor="contactName" className="text-lg">Contact Name</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="John Smith"
                  className="h-14 text-lg bg-background"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-lg">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="h-14 text-lg bg-background"
                />
              </div>
            </div>

            <div>
              <Label className="text-lg mb-4 block">Project Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['new_construction', 'resurfacing', 'repair_only'].map((type) => {
                  const typeInfo = PROJECT_TYPES[type.toUpperCase() as keyof typeof PROJECT_TYPES];
                  const Icon = projectTypeIcons[type];
                  return (
                    <Card
                      key={type}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        projectType === type ? "ring-2 ring-primary border-primary" : ""
                      }`}
                      onClick={() => setProjectType(type)}
                    >
                      <CardContent className="p-6 text-center">
                        {Icon && <Icon className="w-10 h-10 mx-auto mb-2 text-primary" />}
                        <p className="font-semibold text-lg">{typeInfo?.name || type}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="courts" className="text-lg">Number of Courts</Label>
                <Input
                  id="courts"
                  type="number"
                  min={1}
                  value={numberOfCourts}
                  onChange={(e) => setNumberOfCourts(parseInt(e.target.value) || 1)}
                  className="h-14 text-xl font-bold text-center bg-background"
                />
              </div>
              <div>
                <Label htmlFor="length" className="text-lg">Length (ft)</Label>
                <Input
                  id="length"
                  type="number"
                  value={courtLength}
                  onChange={(e) => setCourtLength(parseInt(e.target.value) || 0)}
                  className="h-14 text-xl font-bold text-center bg-background"
                />
              </div>
              <div>
                <Label htmlFor="width" className="text-lg">Width (ft)</Label>
                <Input
                  id="width"
                  type="number"
                  value={courtWidth}
                  onChange={(e) => setCourtWidth(parseInt(e.target.value) || 0)}
                  className="h-14 text-xl font-bold text-center bg-background"
                />
              </div>
            </div>

            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <p className="text-muted-foreground text-lg">Total Square Feet</p>
                    <p className="text-4xl font-bold text-primary">{totalSqFt.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-lg">Total Square Yards</p>
                    <p className="text-4xl font-bold text-primary">{totalSqYds.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "30' x 60'", l: 60, w: 30, courts: 1 },
                { label: "60' x 60'", l: 60, w: 60, courts: 2 },
                { label: "60' x 120'", l: 120, w: 60, courts: 4 },
                { label: "90' x 120'", l: 120, w: 90, courts: 6 },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  className="h-14 text-lg"
                  onClick={() => {
                    setCourtLength(preset.l);
                    setCourtWidth(preset.w);
                    setNumberOfCourts(preset.courts);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card className={`cursor-pointer transition-all ${pressureWash ? 'ring-2 ring-primary border-primary' : ''}`}
                  onClick={() => setPressureWash(!pressureWash)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox checked={pressureWash} className="h-6 w-6" />
                    <div>
                      <p className="font-semibold text-lg">Pressure Wash</p>
                      <p className="text-muted-foreground">${PRICING.LABOR.WASH_PER_SF.toFixed(2)} per sq ft</p>
                    </div>
                  </div>
                  {pressureWash && (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {formatCurrency(totalSqFt * PRICING.LABOR.WASH_PER_SF)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-lg">Crack Repair</p>
                    <p className="text-muted-foreground">${PRICING.LABOR.CRACK_REPAIR_PER_LF.toFixed(2)} per linear ft (material + labor)</p>
                  </div>
                  {crackRepairLf > 0 && (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {formatCurrency(crackRepairLf * PRICING.LABOR.CRACK_REPAIR_PER_LF)}
                    </Badge>
                  )}
                </div>
                <Input
                  type="number"
                  min={0}
                  value={crackRepairLf || ''}
                  onChange={(e) => setCrackRepairLf(parseInt(e.target.value) || 0)}
                  placeholder="Linear feet of cracks"
                  className="h-14 text-lg bg-background"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-lg">Birdbath / Low Spot Patching</p>
                    <p className="text-muted-foreground">$3.50 per sq ft (material + labor)</p>
                  </div>
                  {birdbathSqFt > 0 && (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {formatCurrency(birdbathSqFt * 3.50)}
                    </Badge>
                  )}
                </div>
                <Input
                  type="number"
                  min={0}
                  value={birdbathSqFt || ''}
                  onChange={(e) => setBirdbathSqFt(parseInt(e.target.value) || 0)}
                  placeholder="Square feet of patching"
                  className="h-14 text-lg bg-background"
                />
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-all ${primeSeal ? 'ring-2 ring-primary border-primary' : ''}`}
                  onClick={() => setPrimeSeal(!primeSeal)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox checked={primeSeal} className="h-6 w-6" />
                    <div>
                      <p className="font-semibold text-lg">Apply 1K PrimeSeal</p>
                      <p className="text-muted-foreground">~$0.40 per sq ft (material + labor)</p>
                    </div>
                  </div>
                  {primeSeal && (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {formatCurrency(totalSqFt * 0.40)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* New Court Construction Toggle */}
            <Card className={`cursor-pointer transition-all ${newConstruction ? 'ring-2 ring-primary border-primary' : ''}`}
                  onClick={() => {
                    setNewConstruction(!newConstruction);
                    if (!newConstruction) {
                      setFencingLinearFeet(courtPerimeter);
                    }
                  }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox checked={newConstruction} className="h-6 w-6" />
                    <div>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-primary" />
                        New Court Construction?
                      </p>
                      <p className="text-muted-foreground">Building a new court from scratch</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Construction Type Selection */}
            {newConstruction && (
              <div className="pl-4 border-l-4 border-primary/30 space-y-4">
                <Label className="text-lg block">Base Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      constructionType === 'asphalt' ? "ring-2 ring-primary border-primary" : ""
                    }`}
                    onClick={() => setConstructionType('asphalt')}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold text-lg">Asphalt</p>
                      <p className="text-muted-foreground text-sm">1.5" Overlay</p>
                      <p className="text-primary font-bold mt-1">${PRICING.CONSTRUCTION.ASPHALT_PAVING_PER_SF.toFixed(2)}/sf</p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      constructionType === 'post_tension' ? "ring-2 ring-primary border-primary" : ""
                    }`}
                    onClick={() => setConstructionType('post_tension')}
                  >
                    <CardContent className="p-4 text-center">
                      <p className="font-semibold text-lg">Post-Tension</p>
                      <p className="text-muted-foreground text-sm">Concrete Slab</p>
                      <p className="text-primary font-bold mt-1">${PRICING.CONSTRUCTION.CONCRETE_PT_PER_SF.toFixed(2)}/sf</p>
                    </CardContent>
                  </Card>
                </div>
                {constructionType && (
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    Base Cost: {formatCurrency(totalSqFt * (constructionType === 'asphalt' ? PRICING.CONSTRUCTION.ASPHALT_PAVING_PER_SF : PRICING.CONSTRUCTION.CONCRETE_PT_PER_SF))}
                  </Badge>
                )}
              </div>
            )}

            {/* Fencing Toggle */}
            <Card className={`cursor-pointer transition-all ${fencingRequired ? 'ring-2 ring-primary border-primary' : ''}`}
                  onClick={() => {
                    const newVal = !fencingRequired;
                    setFencingRequired(newVal);
                    if (newVal && fencingLinearFeet === 0) {
                      setFencingLinearFeet(courtPerimeter);
                    }
                  }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox checked={fencingRequired} className="h-6 w-6" />
                    <div>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        <Fence className="w-5 h-5 text-primary" />
                        Fencing Required?
                      </p>
                      <p className="text-muted-foreground">10' Black Vinyl Chain Link @ ${PRICING.CONSTRUCTION.FENCING_10FT_PER_LF}/lf</p>
                    </div>
                  </div>
                  {fencingRequired && fencingLinearFeet > 0 && (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {formatCurrency(fencingLinearFeet * PRICING.CONSTRUCTION.FENCING_10FT_PER_LF)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {fencingRequired && (
              <div className="pl-4 border-l-4 border-primary/30">
                <Label className="text-base mb-2 block">Linear Feet of Fencing</Label>
                <Input
                  type="number"
                  min={0}
                  value={fencingLinearFeet || ''}
                  onChange={(e) => setFencingLinearFeet(parseInt(e.target.value) || 0)}
                  placeholder={`Court perimeter: ${courtPerimeter} ft`}
                  className="h-14 text-lg bg-background"
                />
              </div>
            )}

            {/* Lighting Toggle */}
            <Card className={`cursor-pointer transition-all ${lightingRequired ? 'ring-2 ring-primary border-primary' : ''}`}
                  onClick={() => setLightingRequired(!lightingRequired)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox checked={lightingRequired} className="h-6 w-6" />
                    <div>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        Lighting?
                      </p>
                      <p className="text-muted-foreground">LED Light Poles @ ${PRICING.CONSTRUCTION.LIGHT_POLE_UNIT.toLocaleString()}/pole (w/ electrical)</p>
                    </div>
                  </div>
                  {lightingRequired && lightPoleCount > 0 && (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {formatCurrency(lightPoleCount * PRICING.CONSTRUCTION.LIGHT_POLE_UNIT)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {lightingRequired && (
              <div className="pl-4 border-l-4 border-primary/30">
                <Label className="text-base mb-2 block">Number of Light Poles</Label>
                <div className="grid grid-cols-4 gap-3">
                  {[2, 4, 6, 8].map((count) => (
                    <Button
                      key={count}
                      variant={lightPoleCount === count ? "default" : "outline"}
                      className="h-14 text-lg"
                      onClick={() => setLightPoleCount(count)}
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Playground Interest Toggle */}
            <Card className={`cursor-pointer transition-all ${playgroundInterest ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/20' : ''}`}
                  onClick={() => setPlaygroundInterest(!playgroundInterest)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox checked={playgroundInterest} className="h-6 w-6" />
                    <div>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        <TreePine className="w-5 h-5 text-amber-600" />
                        Playground Interest?
                      </p>
                      <p className="text-muted-foreground">Adds allowance + flags for consultation</p>
                    </div>
                  </div>
                  {playgroundInterest && (
                    <Badge variant="outline" className="text-lg px-4 py-2 border-amber-500 text-amber-600">
                      {formatCurrency(PRICING.CONSTRUCTION.PLAYGROUND_BUDGET)} allowance
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Equipment Add-ons Section */}
            <div className="border-t pt-6">
              <Label className="text-lg mb-4 block flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Equipment Add-ons
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Net Post Sets */}
                <Card className={netPostSets > 0 ? "ring-2 ring-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">Net Post Sets</p>
                        <p className="text-sm text-muted-foreground">Pair of posts with sleeves</p>
                        <p className="text-sm font-medium text-primary">{formatCurrency(PRICING.EQUIPMENT.NET_POST_SET)}/set</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setNetPostSets(Math.max(0, netPostSets - 1))}
                        disabled={netPostSets === 0}
                      >-</Button>
                      <span className="w-8 text-center font-bold">{netPostSets}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setNetPostSets(netPostSets + 1)}
                      >+</Button>
                      {netPostSets > 0 && (
                        <span className="ml-auto font-semibold">{formatCurrency(netPostSets * PRICING.EQUIPMENT.NET_POST_SET)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Player Benches */}
                <Card className={benchCount > 0 ? "ring-2 ring-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">Player Benches (6ft)</p>
                        <p className="text-sm text-muted-foreground">Aluminum courtside bench</p>
                        <p className="text-sm font-medium text-primary">{formatCurrency(PRICING.EQUIPMENT.PLAYER_BENCH_6FT)}/bench</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setBenchCount(Math.max(0, benchCount - 1))}
                        disabled={benchCount === 0}
                      >-</Button>
                      <span className="w-8 text-center font-bold">{benchCount}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setBenchCount(benchCount + 1)}
                      >+</Button>
                      {benchCount > 0 && (
                        <span className="ml-auto font-semibold">{formatCurrency(benchCount * PRICING.EQUIPMENT.PLAYER_BENCH_6FT)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Windscreen */}
                <Card className={windscreenLinearFeet > 0 ? "ring-2 ring-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <p className="font-semibold">Windscreen</p>
                      <p className="text-sm text-muted-foreground">Privacy/wind mesh</p>
                      <p className="text-sm font-medium text-primary">{formatCurrency(PRICING.EQUIPMENT.WINDSCREEN_PER_LF)}/linear ft</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={windscreenLinearFeet || ''}
                        onChange={(e) => setWindscreenLinearFeet(parseInt(e.target.value) || 0)}
                        placeholder="Linear feet"
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">LF</span>
                      {windscreenLinearFeet > 0 && (
                        <span className="ml-auto font-semibold">{formatCurrency(windscreenLinearFeet * PRICING.EQUIPMENT.WINDSCREEN_PER_LF)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ball Containment */}
                <Card className={ballContainmentLinearFeet > 0 ? "ring-2 ring-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <p className="font-semibold">Ball Containment</p>
                      <p className="text-sm text-muted-foreground">Overhead netting system</p>
                      <p className="text-sm font-medium text-primary">{formatCurrency(PRICING.EQUIPMENT.BALL_CONTAINMENT_PER_LF)}/linear ft</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={ballContainmentLinearFeet || ''}
                        onChange={(e) => setBallContainmentLinearFeet(parseInt(e.target.value) || 0)}
                        placeholder="Linear feet"
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">LF</span>
                      {ballContainmentLinearFeet > 0 && (
                        <span className="ml-auto font-semibold">{formatCurrency(ballContainmentLinearFeet * PRICING.EQUIPMENT.BALL_CONTAINMENT_PER_LF)}</span>
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
              <Label className="text-lg mb-4 block">Coat System</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(COAT_SYSTEMS).map(([key, system]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      coatSystem === key ? "ring-2 ring-primary border-primary" : ""
                    }`}
                    onClick={() => setCoatSystem(key)}
                  >
                    <CardContent className="p-6 text-center">
                      <p className="font-semibold text-xl mb-1">{system.name}</p>
                      <p className="text-muted-foreground">{system.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-lg mb-2 block">Inner Color (Playing Surface)</Label>
                <Select value={innerColor} onValueChange={setInnerColor}>
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYKOLD_COLORS.map((color) => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded border"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-lg mb-2 block">Outer Color (Surround)</Label>
                <Select value={outerColor} onValueChange={setOuterColor}>
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYKOLD_COLORS.map((color) => (
                      <SelectItem key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded border"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-lg mb-4 block">Line Striping</Label>
              <div className="grid grid-cols-2 gap-4">
                {(['pickleball', 'tennis'] as const).map((type) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      stripingType === type ? "ring-2 ring-primary border-primary" : ""
                    }`}
                    onClick={() => setStripingType(type)}
                  >
                    <CardContent className="p-6 text-center">
                      <CircleDot className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-lg capitalize">{type} Lines</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return calculation ? (
          <div className="space-y-6">
            {/* Profit Margin Slider */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>Profit Margin</span>
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    {Math.round((profitMargin - 1) * 100)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Slider
                  value={[profitMargin]}
                  onValueChange={(values) => setProfitMargin(values[0])}
                  min={PRICING.MIN_MARGIN}
                  max={PRICING.MAX_MARGIN}
                  step={0.05}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>30%</span>
                  <span>45%</span>
                  <span>60%</span>
                </div>
              </CardContent>
            </Card>

            {/* Consultation Required Alert */}
            {calculation.requiresConsultation && (
              <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
                    <TreePine className="w-6 h-6" />
                    <div>
                      <p className="font-semibold">Consultation Required</p>
                      <p className="text-sm">Playground allowance included - final pricing requires site visit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estimated Job Cost (Internal) */}
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground">Estimated Job Cost (Internal)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Materials</span>
                  <span className="font-medium">{formatCurrency(calculation.subtotals.materials)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Labor (Install + Striping)</span>
                  <span className="font-medium">{formatCurrency(calculation.subtotals.labor)}</span>
                </div>
                {calculation.subtotals.condition > 0 && (
                  <div className="flex justify-between">
                    <span>Prep Work</span>
                    <span className="font-medium">{formatCurrency(calculation.subtotals.condition)}</span>
                  </div>
                )}
                {calculation.subtotals.construction > 0 && (
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <HardHat className="w-4 h-4" />
                      Construction & Add-Ons
                    </span>
                    <span className="font-medium">{formatCurrency(calculation.subtotals.construction)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <TruckIcon className="w-4 h-4" />
                    Mobilization
                  </span>
                  <span className="font-medium">{formatCurrency(calculation.subtotals.mobilization)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Job Cost</span>
                  <span>{formatCurrency(calculation.jobCost)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Profit Breakdown */}
            <Card>
              <CardContent className="py-4">
                <div className="flex justify-between text-lg">
                  <span>Job Cost</span>
                  <span className="font-semibold">{formatCurrency(calculation.jobCost)}</span>
                </div>
                <div className="flex justify-between text-lg text-green-600 dark:text-green-400 mt-2">
                  <span>Profit ({Math.round((profitMargin - 1) * 100)}%)</span>
                  <span className="font-semibold">+{formatCurrency(calculation.profitAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Final Client Price */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="py-8 text-center">
                <p className="text-xl mb-2">Client Price</p>
                <p className="text-5xl font-bold">{formatCurrency(calculation.clientPrice)}</p>
                <p className="text-primary-foreground/70 mt-2">
                  ${(calculation.clientPrice / totalSqFt).toFixed(2)} per sq ft
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                className="h-14 text-lg"
                onClick={handleSaveQuote}
              >
                Save Quote
              </Button>
              <Button
                size="lg"
                className="h-14 text-lg"
                onClick={handleCopyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">CourtPro Estimator</h1>
          <p className="text-muted-foreground mt-1">2026 Pricing • Field Quoting Tool</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {WIZARD_STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                step.id === currentStep
                  ? 'text-primary font-semibold'
                  : step.id < currentStep
                  ? 'text-primary/60'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg font-bold ${
                  step.id === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step.id < currentStep
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id < currentStep ? '✓' : step.id}
              </div>
              <span className="text-sm hidden md:block">{step.name}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{WIZARD_STEPS[currentStep - 1].name}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="lg"
            className="h-14 px-8"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>

          {currentStep < WIZARD_STEPS.length && (
            <Button
              size="lg"
              className="h-14 px-8"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
