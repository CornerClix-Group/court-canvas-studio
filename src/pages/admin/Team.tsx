import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { RoleSelector, RoleBadge } from "@/components/admin/RoleSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserCircle, Plus, Shield, Pencil, Trash2 } from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  roles: AppRole[];
}

export default function AdminTeam() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { isOwner, isAdmin } = useUserRole();

  const canManageTeam = isOwner || isAdmin;

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  async function fetchTeamMembers() {
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const members: TeamMember[] = (profiles || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.id)
          .map((r) => r.role as AppRole),
      }));

      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load team members",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleEditRoles = (member: TeamMember) => {
    setEditingMember(member);
    setSelectedRoles(member.roles);
  };

  const handleSaveRoles = async () => {
    if (!editingMember) return;

    setSaving(true);
    try {
      // Delete existing roles
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editingMember.id);

      if (deleteError) throw deleteError;

      // Insert new roles
      if (selectedRoles.length > 0) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(selectedRoles.map((role) => ({
            user_id: editingMember.id,
            role,
          })));

        if (insertError) throw insertError;
      }

      toast({
        title: "Roles updated",
        description: `Updated roles for ${editingMember.full_name || editingMember.email}`,
      });

      setEditingMember(null);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error saving roles:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update roles",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoles = async () => {
    if (!deleteConfirm) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", deleteConfirm.id);

      if (error) throw error;

      toast({
        title: "Roles removed",
        description: `Removed all roles from ${deleteConfirm.full_name || deleteConfirm.email}`,
      });

      setDeleteConfirm(null);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error removing roles:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove roles",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage team members and their roles
          </p>
        </div>
      </div>

      {!canManageTeam && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-600">
              You don't have permission to manage team roles. Contact an owner or admin.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <Card key={member.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {member.full_name || "Unnamed User"}
                  </CardTitle>
                  <CardDescription className="truncate">
                    {member.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {member.roles.length > 0 ? (
                    member.roles.map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      No roles assigned
                    </span>
                  )}
                </div>

                {canManageTeam && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditRoles(member)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Roles
                    </Button>
                    {member.roles.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(member)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No team members yet</h3>
            <p className="text-muted-foreground text-center mt-1">
              Team members will appear here once they sign up
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Roles Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Roles</DialogTitle>
            <DialogDescription>
              Assign roles to {editingMember?.full_name || editingMember?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RoleSelector
              selectedRoles={selectedRoles}
              onChange={setSelectedRoles}
              disabled={saving}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoles} disabled={saving}>
              {saving ? "Saving..." : "Save Roles"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove all roles?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all roles from {deleteConfirm?.full_name || deleteConfirm?.email}.
              They will lose access to admin features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoles} className="bg-destructive text-destructive-foreground">
              Remove Roles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
