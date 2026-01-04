import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/hooks/useUserRole";

// Define all available permissions
export const PERMISSION_DEFINITIONS = {
  // Leads
  "leads.view": { label: "View Leads", category: "Leads", description: "Can view lead information" },
  "leads.edit": { label: "Edit Leads", category: "Leads", description: "Can create and edit leads" },
  
  // Customers
  "customers.view": { label: "View Customers", category: "Customers", description: "Can view customer information" },
  "customers.edit": { label: "Edit Customers", category: "Customers", description: "Can create and edit customers" },
  
  // Estimates
  "estimates.view": { label: "View Estimates", category: "Estimates", description: "Can view estimates" },
  "estimates.edit": { label: "Edit Estimates", category: "Estimates", description: "Can create and edit estimates" },
  
  // Projects
  "projects.view": { label: "View Projects", category: "Projects", description: "Can view projects" },
  "projects.edit": { label: "Edit Projects", category: "Projects", description: "Can create and edit projects" },
  
  // Invoices
  "invoices.view": { label: "View Invoices", category: "Invoices", description: "Can view invoices" },
  "invoices.edit": { label: "Edit Invoices", category: "Invoices", description: "Can create and edit invoices" },
  
  // Payments
  "payments.view": { label: "View Payments", category: "Payments", description: "Can view payments" },
  "payments.record": { label: "Record Payments", category: "Payments", description: "Can record new payments" },
  
  // Team
  "team.view": { label: "View Team", category: "Team", description: "Can view team members" },
  "team.manage": { label: "Manage Team", category: "Team", description: "Can invite and manage team members" },
} as const;

export type PermissionKey = keyof typeof PERMISSION_DEFINITIONS;

// Default permissions by role
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<AppRole, PermissionKey[]> = {
  owner: Object.keys(PERMISSION_DEFINITIONS) as PermissionKey[],
  admin: Object.keys(PERMISSION_DEFINITIONS) as PermissionKey[],
  staff: [
    "leads.view", "leads.edit",
    "customers.view", "customers.edit",
    "estimates.view", "estimates.edit",
    "projects.view", "projects.edit",
    "invoices.view", "invoices.edit",
    "payments.view", "payments.record",
    "team.view",
  ],
  sales: [
    "leads.view", "leads.edit",
    "customers.view", "customers.edit",
    "estimates.view", "estimates.edit",
  ],
  project_manager: [
    "customers.view",
    "projects.view", "projects.edit",
  ],
  crew_lead: [
    "projects.view",
  ],
  accounting: [
    "customers.view",
    "invoices.view", "invoices.edit",
    "payments.view", "payments.record",
  ],
};

interface UserPermissionOverride {
  permission_key: string;
  enabled: boolean;
}

interface UseUserPermissionsReturn {
  loading: boolean;
  permissions: Map<PermissionKey, boolean>;
  hasPermission: (key: PermissionKey) => boolean;
  refetch: () => Promise<void>;
}

export function useUserPermissions(userId?: string): UseUserPermissionsReturn {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Map<PermissionKey, boolean>>(new Map());

  const fetchPermissions = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Get user's roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const roles = (userRoles || []).map(r => r.role as AppRole);

      // Build default permissions from roles
      const defaultPerms = new Set<PermissionKey>();
      roles.forEach(role => {
        (DEFAULT_PERMISSIONS_BY_ROLE[role] || []).forEach(perm => {
          defaultPerms.add(perm);
        });
      });

      // Get permission overrides
      const { data: overrides } = await supabase
        .from("user_permissions")
        .select("permission_key, enabled")
        .eq("user_id", userId);

      // Build final permissions map
      const permMap = new Map<PermissionKey, boolean>();
      
      // Start with all permissions set to their default based on roles
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
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [userId]);

  const hasPermission = (key: PermissionKey): boolean => {
    return permissions.get(key) ?? false;
  };

  return {
    loading,
    permissions,
    hasPermission,
    refetch: fetchPermissions,
  };
}

// Hook to get permissions for the current user
export function useCurrentUserPermissions(): UseUserPermissionsReturn {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  return useUserPermissions(userId);
}
