import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/hooks/useUserRole";
import { 
  PERMISSION_DEFINITIONS, 
  DEFAULT_PERMISSIONS_BY_ROLE,
  PermissionKey 
} from "@/hooks/useUserPermissions";
import { PermissionToggles } from "@/components/admin/PermissionToggles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ManagePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    email: string;
    full_name: string | null;
    roles: AppRole[];
  } | null;
  onSuccess?: () => void;
}

export function ManagePermissionsDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
}: ManagePermissionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Map<PermissionKey, boolean>>(new Map());
  const { toast } = useToast();

  // Load existing permissions when dialog opens
  useEffect(() => {
    if (open && member) {
      loadPermissions();
    }
  }, [open, member?.id]);

  const loadPermissions = async () => {
    if (!member) return;

    setLoading(true);
    try {
      // Get default permissions from roles
      const defaultPerms = new Set<PermissionKey>();
      member.roles.forEach(role => {
        (DEFAULT_PERMISSIONS_BY_ROLE[role] || []).forEach(perm => {
          defaultPerms.add(perm);
        });
      });

      // Get existing overrides
      const { data: overrides } = await supabase
        .from("user_permissions")
        .select("permission_key, enabled")
        .eq("user_id", member.id);

      // Build permissions map
      const permMap = new Map<PermissionKey, boolean>();
      Object.keys(PERMISSION_DEFINITIONS).forEach(key => {
        const permKey = key as PermissionKey;
        permMap.set(permKey, defaultPerms.has(permKey));
      });

      // Apply overrides
      (overrides || []).forEach(override => {
        const key = override.permission_key as PermissionKey;
        if (key in PERMISSION_DEFINITIONS) {
          permMap.set(key, override.enabled);
        }
      });

      setPermissions(permMap);
    } catch (error) {
      console.error("Error loading permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (key: PermissionKey, enabled: boolean) => {
    setPermissions(prev => {
      const next = new Map(prev);
      next.set(key, enabled);
      return next;
    });
  };

  const handleSave = async () => {
    if (!member) return;

    setSaving(true);
    try {
      // Get default permissions for comparison
      const defaultPerms = new Set<PermissionKey>();
      member.roles.forEach(role => {
        (DEFAULT_PERMISSIONS_BY_ROLE[role] || []).forEach(perm => {
          defaultPerms.add(perm);
        });
      });

      // Delete existing overrides
      await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", member.id);

      // Insert new overrides (only where different from default)
      const overrides: { user_id: string; permission_key: string; enabled: boolean }[] = [];
      
      permissions.forEach((enabled, key) => {
        const isDefault = defaultPerms.has(key);
        // Only save if different from role-based default
        if (enabled !== isDefault) {
          overrides.push({
            user_id: member.id,
            permission_key: key,
            enabled,
          });
        }
      });

      if (overrides.length > 0) {
        const { error } = await supabase
          .from("user_permissions")
          .insert(overrides);

        if (error) throw error;
      }

      toast({
        title: "Permissions updated",
        description: `Updated permissions for ${member.full_name || member.email}`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save permissions",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setPermissions(new Map());
    onOpenChange(false);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Manage Permissions
          </DialogTitle>
          <DialogDescription>
            Customize access for {member.full_name || member.email}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[50vh] pr-4">
            <PermissionToggles
              userRoles={member.roles}
              permissions={permissions}
              onPermissionChange={handlePermissionChange}
              disabled={saving}
            />
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
