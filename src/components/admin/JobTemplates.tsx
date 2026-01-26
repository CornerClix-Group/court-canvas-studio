import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Target, Circle, CircleDot, LayoutGrid, LucideIcon } from "lucide-react";

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  projectType: string;
  courtPreset: string;
  numberOfCourts: number;
  customSqFt: number;
  baseType: string;
  crackRepairLf: number;
  selectedSystem: string;
  surfaceCondition: {
    pressureWash: boolean;
    birdbathSqFt: number;
    primeSeal: boolean;
  };
}

const projectIcons: Record<string, LucideIcon> = {
  pickleball: Target,
  tennis: Circle,
  basketball: CircleDot,
  multi_sport: LayoutGrid,
};

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    id: "pickleball_2_resurface",
    name: "2-Court Pickleball Resurface",
    description: "Standard 2-court pickleball on existing asphalt",
    projectType: "pickleball",
    courtPreset: "PICKLEBALL_2",
    numberOfCourts: 2,
    customSqFt: 0,
    baseType: "EXISTING_ASPHALT",
    crackRepairLf: 0,
    selectedSystem: "PRO_PLUS_STANDARD",
    surfaceCondition: {
      pressureWash: true,
      birdbathSqFt: 0,
      primeSeal: false,
    },
  },
  {
    id: "pickleball_4_resurface",
    name: "4-Court Pickleball Complex",
    description: "4-court facility with pressure wash",
    projectType: "pickleball",
    courtPreset: "PICKLEBALL_4",
    numberOfCourts: 4,
    customSqFt: 0,
    baseType: "EXISTING_ASPHALT",
    crackRepairLf: 100,
    selectedSystem: "PRO_PLUS_STANDARD",
    surfaceCondition: {
      pressureWash: true,
      birdbathSqFt: 50,
      primeSeal: false,
    },
  },
  {
    id: "tennis_single_resurface",
    name: "Single Tennis Resurface",
    description: "Full tennis court resurfacing",
    projectType: "tennis",
    courtPreset: "TENNIS_1",
    numberOfCourts: 1,
    customSqFt: 0,
    baseType: "EXISTING_ASPHALT",
    crackRepairLf: 50,
    selectedSystem: "PRO_PLUS_STANDARD",
    surfaceCondition: {
      pressureWash: true,
      birdbathSqFt: 0,
      primeSeal: false,
    },
  },
  {
    id: "tennis_2_resurface",
    name: "2-Court Tennis Resurface",
    description: "Dual tennis court resurfacing with crack repair",
    projectType: "tennis",
    courtPreset: "TENNIS_2",
    numberOfCourts: 2,
    customSqFt: 0,
    baseType: "EXISTING_ASPHALT",
    crackRepairLf: 100,
    selectedSystem: "PRO_PLUS_STANDARD",
    surfaceCondition: {
      pressureWash: true,
      birdbathSqFt: 25,
      primeSeal: false,
    },
  },
  {
    id: "basketball_half_resurface",
    name: "Half Court Basketball",
    description: "Residential half court resurfacing",
    projectType: "basketball",
    courtPreset: "BASKETBALL_HALF",
    numberOfCourts: 1,
    customSqFt: 0,
    baseType: "EXISTING_ASPHALT",
    crackRepairLf: 0,
    selectedSystem: "PRO_PLUS_STANDARD",
    surfaceCondition: {
      pressureWash: true,
      birdbathSqFt: 0,
      primeSeal: false,
    },
  },
  {
    id: "basketball_full_resurface",
    name: "Full Court Basketball",
    description: "Regulation full court resurfacing",
    projectType: "basketball",
    courtPreset: "BASKETBALL_FULL",
    numberOfCourts: 1,
    customSqFt: 0,
    baseType: "EXISTING_ASPHALT",
    crackRepairLf: 75,
    selectedSystem: "PRO_PLUS_STANDARD",
    surfaceCondition: {
      pressureWash: true,
      birdbathSqFt: 0,
      primeSeal: false,
    },
  },
  {
    id: "tennis_new_concrete",
    name: "New Tennis on Concrete",
    description: "Tennis court on new post-tension concrete base",
    projectType: "tennis",
    courtPreset: "TENNIS_1",
    numberOfCourts: 1,
    customSqFt: 0,
    baseType: "POST_TENSION_CONCRETE",
    crackRepairLf: 0,
    selectedSystem: "PRO_PLUS_PREMIUM",
    surfaceCondition: {
      pressureWash: false,
      birdbathSqFt: 0,
      primeSeal: true,
    },
  },
  {
    id: "multi_sport_combo",
    name: "Multi-Sport Combo Court",
    description: "Tennis with pickleball lines overlay",
    projectType: "multi_sport",
    courtPreset: "TENNIS_1",
    numberOfCourts: 1,
    customSqFt: 0,
    baseType: "EXISTING_ASPHALT",
    crackRepairLf: 50,
    selectedSystem: "PRO_PLUS_STANDARD",
    surfaceCondition: {
      pressureWash: true,
      birdbathSqFt: 0,
      primeSeal: false,
    },
  },
];

interface JobTemplatesProps {
  onSelectTemplate: (template: JobTemplate) => void;
}

export function JobTemplates({ onSelectTemplate }: JobTemplatesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span className="text-sm font-medium">Quick Start Templates</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {JOB_TEMPLATES.map((template) => {
          const IconComponent = projectIcons[template.projectType];
          return (
            <Card
              key={template.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {IconComponent && (
                    <IconComponent className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {template.numberOfCourts} court{template.numberOfCourts > 1 ? 's' : ''}
                      </Badge>
                      {template.surfaceCondition.pressureWash && (
                        <Badge variant="secondary" className="text-xs">PW</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
