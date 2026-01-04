import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { RoleSelector, RoleBadge } from "@/components/admin/RoleSelector";
import { InviteTeamMemberDialog } from "@/components/admin/InviteTeamMemberDialog";
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog";
import { ManagePermissionsDialog } from "@/components/admin/ManagePermissionsDialog";
import { ActivityLogViewer } from "@/components/admin/ActivityLogViewer";
import { RecentInvitations } from "@/components/admin/RecentInvitations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, Plus, Shield, Pencil, Trash2, MoreVertical, KeyRound, Settings, Users, Activity } from "lucide-react";

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
  
  // New state for dialogs
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [resetPasswordMember, setResetPasswordMember] = useState<TeamMember | null>(null);
  const [permissionsMember, setPermissionsMember] = useState<TeamMember | null>(null);
  
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
            Manage team members, roles, permissions, and view activity
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite Team Member
          </Button>
        )}
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

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members
          </TabsTrigger>
          {canManageTeam && (
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {canManageTeam && <RecentInvitations onRefresh={fetchTeamMembers} />}
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <Card key={member.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
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
                {canManageTeam && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRoles(member)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit Roles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPermissionsMember(member)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setResetPasswordMember(member)}>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      {member.roles.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteConfirm(member)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove All Roles
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
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
                  {canManageTeam 
                    ? "Click 'Invite Team Member' to add your first team member"
                    : "Team members will appear here once they are added"}
                </p>
                {canManageTeam && (
                  <Button className="mt-4" onClick={() => setShowInviteDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Team Member
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {canManageTeam && (
          <TabsContent value="activity">
            <ActivityLogViewer />
          </TabsContent>
        )}
      </Tabs>

      {/* Invite Team Member Dialog */}
      <InviteTeamMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={fetchTeamMembers}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={!!resetPasswordMember}
        onOpenChange={(open) => !open && setResetPasswordMember(null)}
        member={resetPasswordMember}
      />

      {/* Manage Permissions Dialog */}
      <ManagePermissionsDialog
        open={!!permissionsMember}
        onOpenChange={(open) => !open && setPermissionsMember(null)}
        member={permissionsMember}
        onSuccess={fetchTeamMembers}
      />

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
