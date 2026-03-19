import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, Clock, UserCircle } from "lucide-react";
import { differenceInHours, format, isPast, isToday } from "date-fns";

interface FollowUpLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  follow_up_date: string | null;
  job_type: string | null;
  budget_range: string | null;
}

export function FollowUpWidget() {
  const [leads, setLeads] = useState<FollowUpLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowUps() {
      try {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

        // Get leads needing follow-up: overdue follow_up_date OR new leads older than 24h
        const [followUpRes, staleRes] = await Promise.all([
          supabase
            .from("leads")
            .select("id, name, email, phone, status, created_at, follow_up_date, job_type, budget_range")
            .not("status", "in", '("converted","lost")')
            .not("follow_up_date", "is", null)
            .lte("follow_up_date", now.toISOString().split("T")[0])
            .order("follow_up_date", { ascending: true })
            .limit(10),
          supabase
            .from("leads")
            .select("id, name, email, phone, status, created_at, follow_up_date, job_type, budget_range")
            .eq("status", "new")
            .lte("created_at", twentyFourHoursAgo)
            .is("follow_up_date", null)
            .order("created_at", { ascending: true })
            .limit(5),
        ]);

        const combined = [...(followUpRes.data || []), ...(staleRes.data || [])];
        // Deduplicate by id
        const unique = Array.from(new Map(combined.map((l) => [l.id, l])).values());
        setLeads(unique.slice(0, 8));
      } catch (error) {
        console.error("Error fetching follow-ups:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFollowUps();
  }, []);

  if (loading || leads.length === 0) return null;

  return (
    <Card className="border-orange-500/50 bg-orange-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Needs Follow-Up ({leads.length})</CardTitle>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/leads">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leads.map((lead) => {
            const isOverdue = lead.follow_up_date && isPast(new Date(lead.follow_up_date + "T23:59:59"));
            const isDueToday = lead.follow_up_date && isToday(new Date(lead.follow_up_date));
            const isStale = !lead.follow_up_date && differenceInHours(new Date(), new Date(lead.created_at)) > 24;

            return (
              <Link
                key={lead.id}
                to="/admin/leads"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserCircle className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.job_type || lead.budget_range || lead.email || "No details"}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  )}
                  {isDueToday && !isOverdue && (
                    <Badge className="bg-orange-500 text-white text-xs">
                      Today
                    </Badge>
                  )}
                  {isStale && (
                    <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Stale
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
