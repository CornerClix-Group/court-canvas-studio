import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  Receipt,
  CheckCircle2,
  Circle,
  Clock,
  Save,
  Award,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import USTAApplicationForm from "@/components/admin/USTAApplicationForm";
import { AssignContractorSelect } from "@/components/admin/AssignContractorSelect";
import { ProjectMaterialsTable } from "@/components/admin/ProjectMaterialsTable";

interface Project {
  id: string;
  project_number: string | null;
  project_name: string;
  status: string;
  sport_type: string | null;
  system_type: string | null;
  site_address: string | null;
  site_city: string | null;
  site_state: string | null;
  site_zip: string | null;
  scheduled_start_date: string | null;
  target_completion_date: string | null;
  actual_start_date: string | null;
  actual_completion_date: string | null;
  contract_value: number;
  notes: string | null;
  estimate_id: string | null;
  customer_id: string | null;
  is_usta_funded: boolean | null;
  assigned_to: string | null;
  customer: { contact_name: string; email: string | null; phone: string | null } | null;
}

interface Milestone {
  id: string;
  milestone_type: string;
  milestone_name: string;
  status: string;
  scheduled_date: string | null;
  completed_date: string | null;
  sort_order: number;
  notes: string | null;
}

const STATUS_OPTIONS = [
  { value: "sold", label: "Sold" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

const DEFAULT_MILESTONES = [
  { type: "site_prep", name: "Site Preparation", order: 1 },
  { type: "base_work", name: "Base Work", order: 2 },
  { type: "concrete", name: "Concrete Pour", order: 3 },
  { type: "curing", name: "Curing Period", order: 4 },
  { type: "surfacing", name: "Surface Coating", order: 5 },
  { type: "color_coating", name: "Color Coating", order: 6 },
  { type: "line_striping", name: "Line Striping", order: 7 },
  { type: "net_posts", name: "Net Posts & Hardware", order: 8 },
  { type: "final_walkthrough", name: "Final Walkthrough", order: 9 },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedProject, setEditedProject] = useState<Partial<Project>>({});

  const isNew = id === "new";

  useEffect(() => {
    if (isNew) {
      setLoading(false);
    } else {
      fetchProject();
    }
  }, [id]);

  async function fetchProject() {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          *,
          customer:customers(contact_name, email, phone)
        `)
        .eq("id", id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);
      setEditedProject(projectData);

      const { data: milestonesData, error: milestonesError } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", id)
        .order("sort_order");

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load project",
      });
    } finally {
      setLoading(false);
    }
  }

  async function generateProjectNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const { count, error } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .like("project_number", `PRJ-${currentYear}-%`);

    if (error) {
      console.error("Error counting projects:", error);
    }
    const nextNumber = (count || 0) + 1;
    return `PRJ-${currentYear}-${String(nextNumber).padStart(4, "0")}`;
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (isNew) {
        const projectNumber = await generateProjectNumber();
        
        const { data, error } = await supabase
          .from("projects")
          .insert({
            project_number: projectNumber,
            project_name: editedProject.project_name || "New Project",
            status: editedProject.status || "sold",
            site_address: editedProject.site_address,
            site_city: editedProject.site_city,
            site_state: editedProject.site_state,
            site_zip: editedProject.site_zip,
            sport_type: editedProject.sport_type,
            system_type: editedProject.system_type,
            scheduled_start_date: editedProject.scheduled_start_date,
            target_completion_date: editedProject.target_completion_date,
            contract_value: editedProject.contract_value || 0,
            notes: editedProject.notes,
            customer_id: editedProject.customer_id,
          })
          .select()
          .single();

        if (error) throw error;

        // Create default milestones
        const { error: milestonesError } = await supabase
          .from("project_milestones")
          .insert(
            DEFAULT_MILESTONES.map((m) => ({
              project_id: data.id,
              milestone_type: m.type,
              milestone_name: m.name,
              sort_order: m.order,
              status: "pending",
            }))
          );

        if (milestonesError) console.error("Error creating milestones:", milestonesError);

        toast({ title: "Project created" });
        navigate(`/admin/projects/${data.id}`);
      } else {
        const { error } = await supabase
          .from("projects")
          .update({
            project_name: editedProject.project_name,
            status: editedProject.status,
            site_address: editedProject.site_address,
            site_city: editedProject.site_city,
            site_state: editedProject.site_state,
            site_zip: editedProject.site_zip,
            sport_type: editedProject.sport_type,
            system_type: editedProject.system_type,
            scheduled_start_date: editedProject.scheduled_start_date,
            target_completion_date: editedProject.target_completion_date,
            actual_start_date: editedProject.actual_start_date,
            actual_completion_date: editedProject.actual_completion_date,
            contract_value: editedProject.contract_value,
            notes: editedProject.notes,
          })
          .eq("id", id);

        if (error) throw error;
        toast({ title: "Project updated" });
        fetchProject();
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save project",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleMilestoneToggle(milestone: Milestone) {
    const newStatus = milestone.status === "completed" ? "pending" : "completed";
    const completedDate = newStatus === "completed" ? new Date().toISOString() : null;

    try {
      const { error } = await supabase
        .from("project_milestones")
        .update({
          status: newStatus,
          completed_date: completedDate,
        })
        .eq("id", milestone.id);

      if (error) throw error;
      fetchProject();
    } catch (error) {
      console.error("Error updating milestone:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update milestone",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const progressPercent = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/projects">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">
              {isNew ? "New Project" : editedProject.project_name}
            </h1>
            {project?.project_number && (
              <Badge variant="outline" className="text-sm font-mono">
                {project.project_number}
              </Badge>
            )}
          </div>
          {project?.customer && (
            <p className="text-muted-foreground mt-1">
              {project.customer.contact_name}
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Project"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project_name">Project Name</Label>
                  <Input
                    id="project_name"
                    value={editedProject.project_name || ""}
                    onChange={(e) =>
                      setEditedProject({ ...editedProject, project_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editedProject.status || "sold"}
                    onValueChange={(value) =>
                      setEditedProject({ ...editedProject, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sport_type">Sport Type</Label>
                  <Input
                    id="sport_type"
                    value={editedProject.sport_type || ""}
                    onChange={(e) =>
                      setEditedProject({ ...editedProject, sport_type: e.target.value })
                    }
                    placeholder="e.g., Pickleball, Tennis"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system_type">System Type</Label>
                  <Input
                    id="system_type"
                    value={editedProject.system_type || ""}
                    onChange={(e) =>
                      setEditedProject({ ...editedProject, system_type: e.target.value })
                    }
                    placeholder="e.g., Laykold Pro Plus"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_value">Contract Value</Label>
                  <Input
                    id="contract_value"
                    type="number"
                    value={editedProject.contract_value || ""}
                    onChange={(e) =>
                      setEditedProject({
                        ...editedProject,
                        contract_value: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_usta_funded"
                    checked={editedProject.is_usta_funded || false}
                    onCheckedChange={(checked) =>
                      setEditedProject({ ...editedProject, is_usta_funded: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_usta_funded">USTA Grant Funded</Label>
                </div>
              </div>

              {/* Contractor Assignment */}
              {!isNew && project && (
                <div className="pt-4 border-t">
                  <AssignContractorSelect
                    projectId={project.id}
                    currentAssignee={project.assigned_to}
                    onAssigned={() => fetchProject()}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Site Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_address">Address</Label>
                <Input
                  id="site_address"
                  value={editedProject.site_address || ""}
                  onChange={(e) =>
                    setEditedProject({ ...editedProject, site_address: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="site_city">City</Label>
                  <Input
                    id="site_city"
                    value={editedProject.site_city || ""}
                    onChange={(e) =>
                      setEditedProject({ ...editedProject, site_city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_state">State</Label>
                  <Input
                    id="site_state"
                    value={editedProject.site_state || ""}
                    onChange={(e) =>
                      setEditedProject({ ...editedProject, site_state: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_zip">ZIP</Label>
                  <Input
                    id="site_zip"
                    value={editedProject.site_zip || ""}
                    onChange={(e) =>
                      setEditedProject({ ...editedProject, site_zip: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_start_date">Scheduled Start</Label>
                  <Input
                    id="scheduled_start_date"
                    type="date"
                    value={editedProject.scheduled_start_date || ""}
                    onChange={(e) =>
                      setEditedProject({
                        ...editedProject,
                        scheduled_start_date: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_completion_date">Target Completion</Label>
                  <Input
                    id="target_completion_date"
                    type="date"
                    value={editedProject.target_completion_date || ""}
                    onChange={(e) =>
                      setEditedProject({
                        ...editedProject,
                        target_completion_date: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual_start_date">Actual Start</Label>
                  <Input
                    id="actual_start_date"
                    type="date"
                    value={editedProject.actual_start_date || ""}
                    onChange={(e) =>
                      setEditedProject({
                        ...editedProject,
                        actual_start_date: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual_completion_date">Actual Completion</Label>
                  <Input
                    id="actual_completion_date"
                    type="date"
                    value={editedProject.actual_completion_date || ""}
                    onChange={(e) =>
                      setEditedProject({
                        ...editedProject,
                        actual_completion_date: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editedProject.notes || ""}
                onChange={(e) =>
                  setEditedProject({ ...editedProject, notes: e.target.value })
                }
                placeholder="Add project notes..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* USTA Grant Section */}
          {!isNew && editedProject.is_usta_funded && project && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  USTA Grant Application
                </CardTitle>
              </CardHeader>
              <CardContent>
                <USTAApplicationForm
                  projectId={project.id}
                  project={{
                    id: project.id,
                    project_name: project.project_name,
                    site_address: project.site_address,
                    site_city: project.site_city,
                    site_state: project.site_state,
                    site_zip: project.site_zip,
                    contract_value: project.contract_value,
                    target_completion_date: project.target_completion_date,
                    customer: project.customer,
                  }}
                  completionPercentage={Math.round(progressPercent)}
                />
              </CardContent>
            </Card>
          )}

          {/* Project Materials */}
          {!isNew && id && (
            <ProjectMaterialsTable projectId={id} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress */}
          {!isNew && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {completedMilestones} of {milestones.length} milestones completed
                </p>
              </CardContent>
            </Card>
          )}

          {/* Milestones */}
          {!isNew && milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => handleMilestoneToggle(milestone)}
                    >
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : milestone.status === "in_progress" ? (
                        <Clock className="w-5 h-5 text-amber-500 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            milestone.status === "completed"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {milestone.milestone_name}
                        </p>
                        {milestone.completed_date && (
                          <p className="text-xs text-muted-foreground">
                            Completed {format(new Date(milestone.completed_date), "MMM d")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Info */}
          {project?.customer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{project.customer.contact_name}</span>
                </div>
                {project.customer.email && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {project.customer.email}
                    </span>
                  </div>
                )}
                {project.customer.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {project.customer.phone}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Links */}
          {project?.estimate_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link to={`/admin/estimates/${project.estimate_id}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Estimate
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
