import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type AppRole = "owner" | "admin" | "staff" | "sales" | "project_manager" | "crew_lead" | "accounting";

interface RoleSelectorProps {
  selectedRoles: AppRole[];
  onChange: (roles: AppRole[]) => void;
  disabled?: boolean;
}

const ROLES: { value: AppRole; label: string; description: string; color: string }[] = [
  { value: "owner", label: "Owner", description: "Full access to everything", color: "bg-amber-500" },
  { value: "admin", label: "Admin", description: "Full access + team management", color: "bg-red-500" },
  { value: "staff", label: "Staff", description: "General staff access", color: "bg-blue-500" },
  { value: "sales", label: "Sales", description: "Leads, customers, estimates", color: "bg-green-500" },
  { value: "project_manager", label: "Project Manager", description: "Projects and milestones", color: "bg-purple-500" },
  { value: "crew_lead", label: "Crew Lead", description: "Assigned projects only", color: "bg-orange-500" },
  { value: "accounting", label: "Accounting", description: "Invoices and payments", color: "bg-cyan-500" },
];

export function RoleSelector({ selectedRoles, onChange, disabled }: RoleSelectorProps) {
  const handleToggle = (role: AppRole) => {
    if (selectedRoles.includes(role)) {
      onChange(selectedRoles.filter((r) => r !== role));
    } else {
      onChange([...selectedRoles, role]);
    }
  };

  return (
    <div className="space-y-3">
      {ROLES.map((role) => (
        <div
          key={role.value}
          className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
        >
          <Checkbox
            id={`role-${role.value}`}
            checked={selectedRoles.includes(role.value)}
            onCheckedChange={() => handleToggle(role.value)}
            disabled={disabled}
          />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Label
                htmlFor={`role-${role.value}`}
                className="font-medium cursor-pointer"
              >
                {role.label}
              </Label>
              <Badge variant="secondary" className={`${role.color} text-white text-xs`}>
                {role.value}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{role.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoleBadge({ role }: { role: AppRole }) {
  const roleConfig = ROLES.find((r) => r.value === role);
  if (!roleConfig) return null;

  return (
    <Badge variant="secondary" className={`${roleConfig.color} text-white`}>
      {roleConfig.label}
    </Badge>
  );
}
