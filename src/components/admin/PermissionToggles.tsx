import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  PERMISSION_DEFINITIONS, 
  DEFAULT_PERMISSIONS_BY_ROLE,
  PermissionKey 
} from "@/hooks/useUserPermissions";
import { AppRole } from "@/hooks/useUserRole";

interface PermissionTogglesProps {
  userRoles: AppRole[];
  permissions: Map<PermissionKey, boolean>;
  onPermissionChange: (key: PermissionKey, enabled: boolean) => void;
  disabled?: boolean;
}

export function PermissionToggles({
  userRoles,
  permissions,
  onPermissionChange,
  disabled = false,
}: PermissionTogglesProps) {
  // Group permissions by category
  const categories = new Map<string, PermissionKey[]>();
  Object.entries(PERMISSION_DEFINITIONS).forEach(([key, def]) => {
    const permKey = key as PermissionKey;
    if (!categories.has(def.category)) {
      categories.set(def.category, []);
    }
    categories.get(def.category)!.push(permKey);
  });

  // Get default permissions based on roles
  const defaultPerms = new Set<PermissionKey>();
  userRoles.forEach(role => {
    (DEFAULT_PERMISSIONS_BY_ROLE[role] || []).forEach(perm => {
      defaultPerms.add(perm);
    });
  });

  const isDefaultEnabled = (key: PermissionKey) => defaultPerms.has(key);
  const isOverridden = (key: PermissionKey) => {
    const current = permissions.get(key);
    const defaultValue = isDefaultEnabled(key);
    return current !== undefined && current !== defaultValue;
  };

  return (
    <div className="space-y-6">
      {Array.from(categories.entries()).map(([category, perms]) => (
        <div key={category} className="space-y-3">
          <h4 className="font-medium text-sm text-foreground border-b pb-2">
            {category}
          </h4>
          <div className="space-y-3">
            {perms.map(permKey => {
              const def = PERMISSION_DEFINITIONS[permKey];
              const enabled = permissions.get(permKey) ?? isDefaultEnabled(permKey);
              const overridden = isOverridden(permKey);

              return (
                <div key={permKey} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={permKey} className="text-sm font-medium">
                        {def.label}
                      </Label>
                      {overridden && (
                        <Badge variant="outline" className="text-xs">
                          Modified
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {def.description}
                    </p>
                  </div>
                  <Switch
                    id={permKey}
                    checked={enabled}
                    onCheckedChange={(checked) => onPermissionChange(permKey, checked)}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
