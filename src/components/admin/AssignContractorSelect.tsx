import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { HardHat } from "lucide-react";

interface TeamMember {
  user_id: string;
  email: string;
  full_name: string | null;
  roles: string[];
}

interface AssignContractorSelectProps {
  projectId: string;
  currentAssignee: string | null;
  onAssigned?: (userId: string | null) => void;
}

export function AssignContractorSelect({
  projectId,
  currentAssignee,
  onAssigned,
}: AssignContractorSelectProps) {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContractors();
  }, []);

  async function fetchContractors() {
    try {
      // Fetch users with crew_lead or project_manager roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["crew_lead", "project_manager"]);

      if (rolesError) throw rolesError;

      if (!rolesData || rolesData.length === 0) {
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(rolesData.map((r) => r.user_id))];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const members: TeamMember[] = (profilesData || []).map((profile) => {
        const userRoles = rolesData
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role);
        return {
          user_id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          roles: userRoles,
        };
      });

      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching contractors:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(userId: string) {
    setSaving(true);
    try {
      const assigneeId = userId === "unassign" ? null : userId;

      const { error } = await supabase
        .from("projects")
        .update({ assigned_to: assigneeId })
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: assigneeId ? "Contractor assigned" : "Assignment removed",
      });

      onAssigned?.(assigneeId);
    } catch (error) {
      console.error("Error assigning contractor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign contractor",
      });
    } finally {
      setSaving(false);
    }
  }

  function getRoleLabel(roles: string[]): string {
    if (roles.includes("project_manager")) return "PM";
    if (roles.includes("crew_lead")) return "Crew Lead";
    return "";
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <HardHat className="w-4 h-4" />
          Assign Contractor
        </Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <HardHat className="w-4 h-4" />
        Assign Contractor
      </Label>
      <Select
        value={currentAssignee || "unassign"}
        onValueChange={handleAssign}
        disabled={saving}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select contractor..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassign">
            <span className="text-muted-foreground">Unassigned</span>
          </SelectItem>
          {teamMembers.map((member) => (
            <SelectItem key={member.user_id} value={member.user_id}>
              <div className="flex items-center gap-2">
                <span>{member.full_name || member.email}</span>
                <span className="text-xs text-muted-foreground">
                  ({getRoleLabel(member.roles)})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {teamMembers.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No team members with crew_lead or project_manager roles found.
        </p>
      )}
    </div>
  );
}
