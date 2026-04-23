import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Crown } from "lucide-react";
import { SURFACING_SYSTEMS } from "@/lib/pricingConstants";
import { calculateMaterials, type CourtConfig } from "@/lib/courtCalculator";
import { usePricingConfig } from "@/hooks/usePricingConfig";

interface SystemTierComparisonProps {
  baseConfig: Omit<CourtConfig, 'systemId'>;
  selectedSystem: string;
  onSelectSystem: (systemId: string) => void;
}

const TIER_SYSTEMS = ['PRO_PLUS_STANDARD', 'PRO_PLUS_XTREME', 'PRO_PLUS_SUPREME', 'PICKLEBALL_GEL'] as const;

const tierLabels: Record<string, { label: string; icon: typeof Star }> = {
  PRO_PLUS_STANDARD: { label: 'Good', icon: Star },
  PRO_PLUS_XTREME: { label: 'Better', icon: Zap },
  PRO_PLUS_SUPREME: { label: 'Best', icon: Crown },
  PICKLEBALL_GEL: { label: 'Premium', icon: Crown },
};

export function SystemTierComparison({ 
  baseConfig, 
  selectedSystem, 
  onSelectSystem 
}: SystemTierComparisonProps) {
  const { data: pricingConfig } = usePricingConfig();

  const tierCalculations = useMemo(() => {
    return TIER_SYSTEMS.map(systemId => {
      const system = SURFACING_SYSTEMS[systemId];
      const config: CourtConfig = { ...baseConfig, systemId };
      const calculation = calculateMaterials(config, pricingConfig);
      return {
        systemId,
        system,
        calculation,
        tierInfo: tierLabels[systemId],
      };
    });
  }, [baseConfig, pricingConfig]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const lowestPrice = Math.min(...tierCalculations.map(t => t.calculation.grandTotal));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Good / Better / Best Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tierCalculations.map(({ systemId, system, calculation, tierInfo }) => {
            const isSelected = selectedSystem === systemId;
            const TierIcon = tierInfo.icon;
            const priceDiff = calculation.grandTotal - lowestPrice;
            
            return (
              <Card 
                key={systemId}
                className={`relative transition-all cursor-pointer hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-primary border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onSelectSystem(systemId)}
              >
                {system.badge && (
                  <Badge 
                    className="absolute -top-2 right-4 z-10"
                    variant={system.badge === 'Best Comfort' ? 'default' : 'secondary'}
                  >
                    {system.badge}
                  </Badge>
                )}
                <CardContent className="pt-6 space-y-4">
                  {/* Tier Label */}
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                      tierInfo.label === 'Premium'
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                        : tierInfo.label === 'Best' 
                        ? 'bg-primary/10 text-primary' 
                        : tierInfo.label === 'Better'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <TierIcon className="w-4 h-4" />
                      {tierInfo.label}
                    </div>
                  </div>

                  {/* System Name */}
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{system.shortName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {system.isGelSystem ? 'Gel cushion technology' : `${system.cushionLayers} cushion layers`}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-center py-4 border-y">
                    <div className="text-3xl font-bold text-primary">
                      {formatCurrency(calculation.grandTotal)}
                    </div>
                    {priceDiff > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{formatCurrency(priceDiff)} vs Good
                      </p>
                    )}
                  </div>

                  {/* Force Reduction */}
                  <div className="text-center">
                    <span className="text-2xl font-bold">{system.forceReduction}</span>
                    <p className="text-xs text-muted-foreground">Force Reduction</p>
                  </div>

                  {/* Benefits */}
                  <ul className="space-y-2">
                    {system.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Select Button */}
                  <Button 
                    variant={isSelected ? "default" : "outline"} 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSystem(systemId);
                    }}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
