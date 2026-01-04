import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, UserPlus, CheckCircle2, Copy, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Invitation {
  id: string;
  email: string;
  full_name: string | null;
  invited_by: string;
  inviter_name: string | null;
  roles: string[];
  status: string;
  first_login_at: string | null;
  created_at: string;
}

interface RecentInvitationsProps {
  onRefresh?: () => void;
}

export function RecentInvitations({ onRefresh }: RecentInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvitations();
  }, []);

  async function fetchInvitations() {
    try {
      // Fetch invitations from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: invitationsData, error } = await supabase
        .from("team_invitations")
        .select("*")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get inviter names
      const inviterIds = [...new Set((invitationsData || []).map(i => i.invited_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", inviterIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p.full_name || p.email])
      );

      const enrichedInvitations: Invitation[] = (invitationsData || []).map(inv => ({
        ...inv,
        inviter_name: profileMap.get(inv.invited_by) || "Unknown",
      }));

      setInvitations(enrichedInvitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleResendCredentials = async (invitation: Invitation) => {
    toast({
      title: "Feature coming soon",
      description: "Resend credentials functionality will be added",
    });
  };

  if (loading) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  const formatRoles = (roles: string[]) => {
    return roles.map(r => r.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Recent Invitations</CardTitle>
        </div>
        <CardDescription>
          Team members invited in the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-start justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">
                    {invitation.full_name || invitation.email}
                  </span>
                  {invitation.status === "pending_login" ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending Login
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {invitation.email}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                  <span>
                    Invited by {invitation.inviter_name}
                  </span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                  </span>
                  {invitation.roles.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-primary">
                        {formatRoles(invitation.roles)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {invitation.status === "pending_login" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 ml-2"
                  onClick={() => handleResendCredentials(invitation)}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Resend
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
