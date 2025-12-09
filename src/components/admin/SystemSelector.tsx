import { SURFACING_SYSTEMS, type SystemDefinition } from "@/lib/pricingConstants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Zap, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemSelectorProps {
  selectedSystemId: string;
  onSelect: (systemId: string) => void;
  projectType?: string;
}

const systemIcons: Record<string, React.ReactNode> = {
  hard_court: <Shield className="w-6 h-6" />,
  pro_plus_standard: <Zap className="w-6 h-6" />,
  pro_plus_xtreme: <Star className="w-6 h-6" />,
  pro_plus_supreme: <Sparkles className="w-6 h-6" />,
  pickleball_gel: <Sparkles className="w-6 h-6 text-purple-500" />,
};

export function SystemSelector({ selectedSystemId, onSelect, projectType }: SystemSelectorProps) {
  const systems = Object.entries(SURFACING_SYSTEMS);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {systems.map(([key, system]) => (
        <Card
          key={key}
          className={cn(
            "cursor-pointer transition-all hover:shadow-lg relative overflow-hidden",
            selectedSystemId === key
              ? "ring-2 ring-primary border-primary"
              : "hover:border-primary/50"
          )}
          onClick={() => onSelect(key)}
        >
          {system.badge && (
            <div className="absolute top-0 right-0">
              <Badge 
                className={cn(
                  "rounded-none rounded-bl-lg",
                  system.badge === 'Premium' && "bg-purple-600 hover:bg-purple-700",
                  system.badge === 'Best Comfort' && "bg-green-600 hover:bg-green-700",
                  system.badge === 'Popular' && "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {system.badge}
              </Badge>
            </div>
          )}
          
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                selectedSystemId === key ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {systemIcons[system.id] || <Shield className="w-6 h-6" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground leading-tight">
                  {system.shortName}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {system.description}
                </p>
              </div>
              
              {selectedSystemId === key && (
                <div className="p-1 bg-primary rounded-full">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            
            {/* Force Reduction Badge */}
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Force Reduction: {system.forceReduction}
              </Badge>
              {system.cushionLayers > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {system.cushionLayers} layers
                </Badge>
              )}
            </div>
            
            {/* Benefits List */}
            <ul className="mt-4 space-y-1">
              {system.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            
            {/* Coat Breakdown */}
            {!system.isGelSystem && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Application layers:
                </p>
                <div className="flex flex-wrap gap-1">
                  {system.coats.granule > 0 && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      {system.coats.granule}x Granule
                    </Badge>
                  )}
                  {system.coats.powder > 0 && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {system.coats.powder}x Powder
                    </Badge>
                  )}
                  {system.coats.resurfacer > 0 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                      {system.coats.resurfacer}x Resurfacer
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {system.coats.colorCoat}x Color
                  </Badge>
                </div>
              </div>
            )}
            
            {system.isGelSystem && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Premium gel system with advanced cushioning technology
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
