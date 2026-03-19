import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { type ProductLine, PRODUCT_LINE_LABELS } from "@/hooks/usePricingConfig";
import {
  Save,
  Package,
  Wrench,
  Building2,
  Target,
  Percent,
  Loader2,
  RefreshCw,
  Boxes,
  Layers
} from "lucide-react";

interface PricingConfigItem {
  id: string;
  category: string;
  key: string;
  label: string;
  value: number;
  unit: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  product_line: string;
}

const CATEGORY_CONFIG = {
  materials: {
    label: "Materials",
    description: "Laykold 2026 Price Sheet - What you pay for materials",
    icon: Package,
    color: "bg-blue-500",
  },
  labor: {
    label: "Labor & Subs",
    description: "Subcontractor rates for GA market",
    icon: Wrench,
    color: "bg-orange-500",
  },
  construction: {
    label: "Construction",
    description: "New build and infrastructure costs",
    icon: Building2,
    color: "bg-green-500",
  },
  equipment: {
    label: "Equipment",
    description: "Court equipment and accessories",
    icon: Boxes,
    color: "bg-cyan-500",
  },
  coverage: {
    label: "Coverage Rates",
    description: "Material coverage and application rates",
    icon: Target,
    color: "bg-purple-500",
  },
  margins: {
    label: "Margins",
    description: "Profit margin multipliers",
    icon: Percent,
    color: "bg-amber-500",
  },
};

const UNIT_LABELS: Record<string, string> = {
  per_gal: "/ gal",
  per_sf: "/ sq ft",
  per_lf: "/ lin ft",
  per_unit: "/ unit",
  per_court: "/ court",
  flat: "flat",
  multiplier: "×",
  gal_per_sy: "gal / sq yd",
};

const PRODUCT_LINE_KEYS = ['resurfacer_per_gal', 'color_concentrate_per_gal', 'premium_color_add_on'];

export default function PricingConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<PricingConfigItem[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("materials");
  const [activeProductLine, setActiveProductLine] = useState<ProductLine>("advantage");
  const [settingsRowId, setSettingsRowId] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pricing_config")
      .select("*")
      .order("category")
      .order("sort_order");

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load pricing configuration" });
    } else {
      const allRows = (data || []) as PricingConfigItem[];
      setConfigs(allRows);

      // Find settings row for active product line
      const settingsRow = allRows.find(r => r.category === 'settings' && r.key === 'active_product_line');
      if (settingsRow) {
        setSettingsRowId(settingsRow.id);
        const val = settingsRow.value;
        if (val === 1) setActiveProductLine('colorflex');
        else if (val === 2) setActiveProductLine('masters');
        else setActiveProductLine('advantage');
      }

      const values: Record<string, number> = {};
      allRows.forEach((item) => { values[item.id] = item.value; });
      setEditedValues(values);
    }
    setLoading(false);
  };

  useEffect(() => { fetchConfigs(); }, []);

  const handleProductLineChange = async (line: ProductLine) => {
    const numVal = line === 'colorflex' ? 1 : line === 'masters' ? 2 : 0;

    if (settingsRowId) {
      const { error } = await supabase
        .from("pricing_config")
        .update({ value: numVal })
        .eq("id", settingsRowId);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update product line" });
        return;
      }
    }

    setActiveProductLine(line);
    queryClient.invalidateQueries({ queryKey: ['active-product-line'] });
    queryClient.invalidateQueries({ queryKey: ['pricing-config'] });
    toast({ title: "Product Line Updated", description: `Switched to ${PRODUCT_LINE_LABELS[line]}` });
  };

  // Filter configs to show: shared items ('all') + active product line items for material category
  const getVisibleConfigs = (category: string) => {
    return configs.filter((c) => {
      if (c.category !== category) return false;
      if (PRODUCT_LINE_KEYS.includes(c.key)) {
        return c.product_line === activeProductLine;
      }
      return c.product_line === 'all';
    });
  };

  const handleValueChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedValues((prev) => ({ ...prev, [id]: numValue }));
  };

  const hasChanges = () => {
    return configs.some((config) => config.category !== 'settings' && config.value !== editedValues[config.id]);
  };

  const getChangedItems = () => {
    return configs.filter((config) => config.category !== 'settings' && config.value !== editedValues[config.id]);
  };

  const handleSave = async () => {
    const changedItems = getChangedItems();
    if (changedItems.length === 0) return;

    setSaving(true);
    try {
      for (const item of changedItems) {
        const { error } = await supabase
          .from("pricing_config")
          .update({ value: editedValues[item.id] })
          .eq("id", item.id);
        if (error) throw error;
      }

      toast({
        title: "Pricing Updated",
        description: `${changedItems.length} value${changedItems.length > 1 ? "s" : ""} saved successfully.`,
      });

      queryClient.invalidateQueries({ queryKey: ['pricing-config'] });
      await fetchConfigs();
    } catch (error) {
      console.error("Error saving pricing config:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to save pricing changes" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const values: Record<string, number> = {};
    configs.forEach((item) => { values[item.id] = item.value; });
    setEditedValues(values);
  };

  const renderConfigItems = (category: string) => {
    const items = getVisibleConfigs(category);

    return (
      <div className="grid gap-4">
        {items.map((item) => {
          const isChanged = item.value !== editedValues[item.id];
          return (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                isChanged ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{item.label}</Label>
                  {isChanged && (
                    <Badge variant="secondary" className="text-xs">Modified</Badge>
                  )}
                  {PRODUCT_LINE_KEYS.includes(item.key) && (
                    <Badge variant="outline" className="text-xs">
                      {PRODUCT_LINE_LABELS[activeProductLine]}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {item.unit !== "multiplier" && item.unit !== "gal_per_sy" ? "$" : ""}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={editedValues[item.id] ?? item.value}
                    onChange={(e) => handleValueChange(item.id, e.target.value)}
                    className={`w-32 ${item.unit !== "multiplier" && item.unit !== "gal_per_sy" ? "pl-7" : "pl-3"} text-right`}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-16">
                  {item.unit ? UNIT_LABELS[item.unit] || item.unit : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const changedCount = getChangedItems().length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pricing Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Manage material costs, labor rates, and profit margins
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges() && (
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges() || saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
            {changedCount > 0 && (
              <Badge variant="secondary" className="ml-2">{changedCount}</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Product Line Selector */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Layers className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <Label className="text-base font-semibold">Active Product Line</Label>
              <p className="text-sm text-muted-foreground">
                This sets which Laykold product line pricing is used across all estimates and calculations.
              </p>
            </div>
            <Select value={activeProductLine} onValueChange={(v) => handleProductLineChange(v as ProductLine)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advantage">Advantage (Factory Textured)</SelectItem>
                <SelectItem value="colorflex">ColorFlex (Highly Flexible)</SelectItem>
                <SelectItem value="masters">Masters (ColorCoat Concentrate)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const categoryChanges = getVisibleConfigs(key).filter(
              (c) => c.value !== editedValues[c.id]
            ).length;
            return (
              <TabsTrigger key={key} value={key} className="relative">
                <Icon className="w-4 h-4 mr-2" />
                {config.label}
                {categoryChanges > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {categoryChanges}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <config.icon className="w-5 h-5" />
                  {config.label}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>{renderConfigItems(key)}</CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Reference Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Quick Reference: Margin Math</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-muted-foreground">1.30× multiplier</p>
              <p className="font-bold text-lg">30% Gross Margin</p>
              <p className="text-xs text-muted-foreground">Cost $1,000 → Price $1,300</p>
            </div>
            <div className="p-3 bg-background rounded-lg border border-primary">
              <p className="text-muted-foreground">1.40× multiplier</p>
              <p className="font-bold text-lg text-primary">40% Gross Margin</p>
              <p className="text-xs text-muted-foreground">Cost $1,000 → Price $1,400</p>
            </div>
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-muted-foreground">1.60× multiplier</p>
              <p className="font-bold text-lg">60% Gross Margin</p>
              <p className="text-xs text-muted-foreground">Cost $1,000 → Price $1,600</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
