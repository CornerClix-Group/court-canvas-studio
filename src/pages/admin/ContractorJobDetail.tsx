import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
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
  notes: string | null;
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

interface ProjectPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  photo_type: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  sold: "bg-blue-500",
  scheduled: "bg-cyan-500",
  in_progress: "bg-amber-500",
  completed: "bg-green-500",
  on_hold: "bg-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  sold: "Sold",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
};

export default function ContractorJobDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  async function fetchProjectData() {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, project_name, status, sport_type, system_type, site_address, site_city, site_state, site_zip, scheduled_start_date, target_completion_date, notes")
        .eq("id", id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);
      setNotes(projectData.notes || "");

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", id)
        .order("sort_order");

      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from("project_photos")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (photosError) throw photosError;
      setPhotos(photosData || []);
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load project data",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleMilestoneToggle(milestone: Milestone) {
    const newStatus = milestone.status === "completed" ? "pending" : "completed";
    const completedDate = newStatus === "completed" ? new Date().toISOString() : null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("project_milestones")
        .update({
          status: newStatus,
          completed_date: completedDate,
          completed_by: newStatus === "completed" ? user?.id : null,
        })
        .eq("id", milestone.id);

      if (error) throw error;
      
      toast({
        title: newStatus === "completed" ? "Milestone completed" : "Milestone reopened",
      });
      
      fetchProjectData();
    } catch (error) {
      console.error("Error updating milestone:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update milestone",
      });
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage (we'll use the estimate-attachments bucket for now)
        const { error: uploadError } = await supabase.storage
          .from("estimate-attachments")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("estimate-attachments")
          .getPublicUrl(fileName);

        // Create photo record
        const { error: insertError } = await supabase
          .from("project_photos")
          .insert({
            project_id: id,
            photo_url: urlData.publicUrl,
            photo_type: "progress",
            uploaded_by: user.id,
          });

        if (insertError) throw insertError;
      }

      toast({ title: "Photos uploaded successfully" });
      fetchProjectData();
    } catch (error) {
      console.error("Error uploading photos:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload photos",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ notes })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Notes saved" });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notes",
      });
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading job details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found or access denied.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/admin/portal">Back to My Jobs</Link>
        </Button>
      </div>
    );
  }

  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const progressPercent = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  const fullAddress = [
    project.site_address,
    project.site_city,
    project.site_state,
    project.site_zip,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/portal">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {/* Project Info */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground">{project.project_name}</h1>
          <Badge className={`${STATUS_COLORS[project.status] || "bg-gray-500"} text-white shrink-0`}>
            {STATUS_LABELS[project.status] || project.status}
          </Badge>
        </div>
        {fullAddress && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{fullAddress}</span>
          </div>
        )}
        {(project.sport_type || project.system_type) && (
          <div className="flex gap-2 mt-2">
            {project.sport_type && (
              <Badge variant="outline">{project.sport_type}</Badge>
            )}
            {project.system_type && (
              <Badge variant="secondary">{project.system_type}</Badge>
            )}
          </div>
        )}
      </div>

      {/* Schedule */}
      {(project.scheduled_start_date || project.target_completion_date) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {project.scheduled_start_date
                  ? format(new Date(project.scheduled_start_date), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Target Completion</p>
              <p className="font-medium">
                {project.target_completion_date
                  ? format(new Date(project.target_completion_date), "MMM d, yyyy")
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Progress</CardTitle>
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {completedMilestones} of {milestones.length} milestones completed
          </p>
        </CardContent>
      </Card>

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleMilestoneToggle(milestone)}
                >
                  {milestone.status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  ) : milestone.status === "in_progress" ? (
                    <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
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
                        Completed {format(new Date(milestone.completed_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Photos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Progress Photos
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  Add Photo
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No photos uploaded yet</p>
              <p className="text-xs">Tap "Add Photo" to upload progress pictures</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || "Progress photo"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes & Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about job progress, issues, or updates..."
            rows={4}
          />
          <Button
            size="sm"
            onClick={handleSaveNotes}
            disabled={savingNotes || notes === (project.notes || "")}
          >
            {savingNotes ? "Saving..." : "Save Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
