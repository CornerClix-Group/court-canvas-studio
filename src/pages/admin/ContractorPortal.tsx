import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Calendar, HardHat } from "lucide-react";
import { format } from "date-fns";

interface AssignedProject {
  id: string;
  project_name: string;
  status: string;
  sport_type: string | null;
  site_city: string | null;
  site_state: string | null;
  scheduled_start_date: string | null;
  target_completion_date: string | null;
  milestones: { status: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  sold: "bg-blue-500",
  scheduled: "bg-cyan-500",
  in_progress: "bg-amber-500",
  completed: "bg-green-500",
  on_hold: "bg-gray-500",
  cancelled: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  sold: "Sold",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
  cancelled: "Cancelled",
};

export default function ContractorPortal() {
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

  async function fetchAssignedProjects() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          project_name,
          status,
          sport_type,
          site_city,
          site_state,
          scheduled_start_date,
          target_completion_date,
          milestones:project_milestones(status)
        `)
        .eq("assigned_to", user.id)
        .not("status", "eq", "cancelled")
        .order("scheduled_start_date", { ascending: true, nullsFirst: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching assigned projects:", error);
    } finally {
      setLoading(false);
    }
  }

  function calculateProgress(milestones: { status: string }[]): number {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.status === "completed").length;
    return Math.round((completed / milestones.length) * 100);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading your jobs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <HardHat className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Assigned Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {projects.length} active {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HardHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Jobs Assigned</h3>
            <p className="text-muted-foreground">
              You don't have any projects assigned to you yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {projects.map((project) => {
            const progress = calculateProgress(project.milestones);
            return (
              <Link
                key={project.id}
                to={`/admin/portal/${project.id}`}
                className="block"
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {project.project_name}
                          </h3>
                          {project.sport_type && (
                            <Badge variant="outline" className="shrink-0">
                              {project.sport_type}
                            </Badge>
                          )}
                        </div>
                        
                        {(project.site_city || project.site_state) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>
                              {[project.site_city, project.site_state]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}

                        {(project.scheduled_start_date || project.target_completion_date) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {project.scheduled_start_date && (
                                <>Start: {format(new Date(project.scheduled_start_date), "MMM d")}</>
                              )}
                              {project.scheduled_start_date && project.target_completion_date && " | "}
                              {project.target_completion_date && (
                                <>Due: {format(new Date(project.target_completion_date), "MMM d")}</>
                              )}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>

                      <Badge
                        className={`${STATUS_COLORS[project.status] || "bg-gray-500"} text-white shrink-0`}
                      >
                        {STATUS_LABELS[project.status] || project.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
