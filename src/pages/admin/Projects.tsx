import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FolderKanban,
  List,
  Plus,
  Search,
  Calendar,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  project_number: string | null;
  project_name: string;
  status: string;
  sport_type: string | null;
  system_type: string | null;
  site_city: string | null;
  site_state: string | null;
  scheduled_start_date: string | null;
  target_completion_date: string | null;
  contract_value: number;
  customer: { contact_name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  sold: { label: "Sold", color: "bg-blue-500" },
  scheduled: { label: "Scheduled", color: "bg-purple-500" },
  in_progress: { label: "In Progress", color: "bg-amber-500" },
  completed: { label: "Completed", color: "bg-green-500" },
  on_hold: { label: "On Hold", color: "bg-gray-500" },
  cancelled: { label: "Cancelled", color: "bg-red-500" },
};

const KANBAN_COLUMNS = ["sold", "scheduled", "in_progress", "completed"];

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [view, setView] = useState<"list" | "kanban">("kanban");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          project_number,
          project_name,
          status,
          sport_type,
          system_type,
          site_city,
          site_state,
          scheduled_start_date,
          target_completion_date,
          contract_value,
          customer:customers(contact_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.project_name.toLowerCase().includes(search.toLowerCase()) ||
      project.customer?.contact_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectsByStatus = (status: string) =>
    filteredProjects.filter((p) => p.status === status);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Track projects from sale to completion
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/projects/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg">
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("kanban")}
            className="rounded-r-none"
          >
            <FolderKanban className="w-4 h-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {KANBAN_COLUMNS.map((status) => {
            const config = STATUS_CONFIG[status];
            const columnProjects = getProjectsByStatus(status);
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <h3 className="font-semibold text-sm">{config.label}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {columnProjects.length}
                  </Badge>
                </div>
                <div className="space-y-3 min-h-[200px] p-2 bg-muted/30 rounded-lg">
                  {columnProjects.map((project) => (
                    <Link key={project.id} to={`/admin/projects/${project.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                        <CardContent className="p-4 space-y-2">
                          {project.project_number && (
                            <p className="text-xs font-mono text-muted-foreground">
                              {project.project_number}
                            </p>
                          )}
                          <h4 className="font-medium text-sm truncate">
                            {project.project_name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {project.customer?.contact_name || "No customer"}
                          </p>
                          {project.site_city && project.site_state && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {project.site_city}, {project.site_state}
                            </div>
                          )}
                          {project.scheduled_start_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(project.scheduled_start_date), "MMM d")}
                            </div>
                          )}
                          <div className="text-sm font-semibold text-primary">
                            {formatCurrency(project.contract_value)}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {columnProjects.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No projects
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project #</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                const statusConfig = STATUS_CONFIG[project.status];
                return (
                  <TableRow key={project.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {project.project_number || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {project.project_name}
                    </TableCell>
                    <TableCell>
                      {project.customer?.contact_name || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig.color} text-white`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.site_city && project.site_state
                        ? `${project.site_city}, ${project.site_state}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {project.scheduled_start_date
                        ? format(new Date(project.scheduled_start_date), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(project.contract_value)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/projects/${project.id}`}>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No projects found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
