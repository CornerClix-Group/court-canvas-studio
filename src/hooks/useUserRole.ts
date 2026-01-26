import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "admin" | "staff" | "sales" | "project_manager" | "crew_lead" | "accounting";

interface UserRoleState {
  roles: AppRole[];
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isAdminOrAbove: boolean;
  isSalesOrAbove: boolean;
  isManagerOrAbove: boolean;
  isContractor: boolean;
  isCrewLead: boolean;
  isAccounting: boolean;
  hasRole: (role: AppRole) => boolean;
}

export function useUserRole(): UserRoleState {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRoles([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching roles:", error);
          setRoles([]);
        } else {
          setRoles((data || []).map((r) => r.role as AppRole));
        }
      } catch (error) {
        console.error("Error in fetchRoles:", error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRoles();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isOwner = hasRole("owner");
  const isAdmin = hasRole("admin");
  const isAdminOrAbove = isOwner || isAdmin || hasRole("staff");
  const isSalesOrAbove = isAdminOrAbove || hasRole("sales");
  const isManagerOrAbove = isAdminOrAbove || hasRole("project_manager");
  const isContractor = hasRole("crew_lead") || hasRole("project_manager");
  const isCrewLead = hasRole("crew_lead");
  const isAccounting = hasRole("accounting");

  return {
    roles,
    loading,
    isOwner,
    isAdmin,
    isAdminOrAbove,
    isSalesOrAbove,
    isManagerOrAbove,
    isContractor,
    isCrewLead,
    isAccounting,
    hasRole,
  };
}
