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
import { 
  PROJECT_TYPES, 
  COAT_SYSTEMS,
  LAYKOLD_COLORS,
  DEFAULT_PROFIT_MARGIN,
  MIN_PROFIT_MARGIN,
  MAX_PROFIT_MARGIN,
} from "@/lib/pricingConstants";
import { calculateMaterials, generateQuoteText, type CourtConfig, type SurfaceCondition } from "@/lib/courtCalculator";
import { 
  ArrowLeft, 
  ArrowRight, 
  Copy,
  Check,
  Building,
  RefreshCw,
  Wrench,
  Droplets,
  CircleDot,
} from "lucide-react";

const WIZARD_STEPS = [
  { id: 1, name: "Client" },
  { id: 2, name: "Dimensions" },
  { id: 3, name: "Condition" },
  { id: 4, name: "System" },
  { id: 5, name: "Quote" },
];

const projectTypeIcons: Record<string, React.ElementType> = {
  new_construction: Building,
  resurfacing: RefreshCw,
  repair_only: Wrench,
};

export default function SalesEstimator() {
  const { toast } = useToast();
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

  // Step 4: System Specs
  const [coatSystem, setCoatSystem] = useState("three_coat");
  const [innerColor, setInnerColor] = useState("dark_green");
  const [outerColor, setOuterColor] = useState("terra_cotta");
  const [stripingType, setStripingType] = useState<'pickleball' | 'tennis'>('pickleball');

  // Step 5: Pricing
  const [profitMargin, setProfitMargin] = useState(DEFAULT_PROFIT_MARGIN);

  // Calculations
  const totalSqFt = courtLength * courtWidth;
  const totalSqYds = Math.round(totalSqFt / 9);

  const surfaceCondition: SurfaceCondition = {
    pressureWash,
    birdbathSqFt,
    primeSeal,
  };

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
    baseType: 'EXISTING_ASPHALT',
    crackRepairLf,
    addons: [],
    surfaceCondition,
    profitMargin,
    innerColor,
    outerColor,
    stripingType,
  }), [projectType, totalSqFt, numberOfCourts, crackRepairLf, surfaceCondition, profitMargin, coatSystem, innerColor, outerColor, stripingType]);

  const calculation = useMemo(() => {
    if (totalSqFt > 0) {
      return calculateMaterials(courtConfig);
    }
    return null;
  }, [courtConfig, totalSqFt]);

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
      total: calculation.grandTotal,
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
        return !!coatSystem;
      case 5:
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
                      <p className="text-muted-foreground">$0.15 per sq ft</p>
                    </div>
                  </div>
                  {pressureWash && (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {formatCurrency(totalSqFt * 0.15)}
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
                    <p className="text-muted-foreground">$2.50 per linear ft (material + labor)</p>
                  </div>
                  {crackRepairLf > 0 && (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {formatCurrency(crackRepairLf * 2.50)}
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
                      <p className="text-muted-foreground">$0.20 per sq ft (prevents bleed-through)</p>
                    </div>
                  </div>
                  {primeSeal && (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {formatCurrency(totalSqFt * 0.20)}
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

      case 5:
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
                  min={MIN_PROFIT_MARGIN}
                  max={MAX_PROFIT_MARGIN}
                  step={0.05}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>20%</span>
                  <span>50%</span>
                  <span>80%</span>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Materials</span>
                  <span className="font-semibold">{formatCurrency(calculation.subtotals.materials)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Labor</span>
                  <span className="font-semibold">{formatCurrency(calculation.subtotals.labor)}</span>
                </div>
                {calculation.subtotals.condition > 0 && (
                  <div className="flex justify-between text-lg">
                    <span>Prep Work</span>
                    <span className="font-semibold">{formatCurrency(calculation.subtotals.condition)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span>Cost Total</span>
                  <span className="font-semibold">{formatCurrency(calculation.costTotal)}</span>
                </div>
                <div className="flex justify-between text-lg text-green-600">
                  <span>Profit ({Math.round((profitMargin - 1) * 100)}%)</span>
                  <span className="font-semibold">+{formatCurrency(calculation.profitAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Final Price */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="py-8 text-center">
                <p className="text-xl mb-2">Final Price</p>
                <p className="text-5xl font-bold">{formatCurrency(calculation.grandTotal)}</p>
                <p className="text-primary-foreground/70 mt-2">
                  ${(calculation.grandTotal / totalSqFt).toFixed(2)} per sq ft
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
          <p className="text-muted-foreground mt-1">Field Quoting Tool</p>
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