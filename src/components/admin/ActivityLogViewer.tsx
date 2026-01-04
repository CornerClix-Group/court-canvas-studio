import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { 
  Activity, 
  Search, 
  User, 
  FileText, 
  Users, 
  CreditCard, 
  FolderKanban,
  UserPlus,
  LogIn,
  LogOut,
  Mail,
  Download,
  Edit,
  Trash2,
  Plus,
  Key,
  RefreshCw
} from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: unknown;
  created_at: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  login: <LogIn className="h-4 w-4" />,
  logout: <LogOut className="h-4 w-4" />,
  create: <Plus className="h-4 w-4" />,
  update: <Edit className="h-4 w-4" />,
  delete: <Trash2 className="h-4 w-4" />,
  send_email: <Mail className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
  record_payment: <CreditCard className="h-4 w-4" />,
  invite_member: <UserPlus className="h-4 w-4" />,
  reset_password: <Key className="h-4 w-4" />,
  change_password: <Key className="h-4 w-4" />,
};

const entityIcons: Record<string, React.ReactNode> = {
  customer: <Users className="h-4 w-4" />,
  lead: <User className="h-4 w-4" />,
  estimate: <FileText className="h-4 w-4" />,
  invoice: <FileText className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  project: <FolderKanban className="h-4 w-4" />,
  team_member: <Users className="h-4 w-4" />,
  receipt: <FileText className="h-4 w-4" />,
  session: <Activity className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  login: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  create: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  update: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  send_email: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  download: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  record_payment: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  invite_member: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  reset_password: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  change_password: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

function formatActionLabel(action: string): string {
  return action
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatEntityType(type: string): string {
  return type
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ActivityLogViewer() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (entityFilter !== "all") {
        query = query.eq("entity_type", entityFilter);
      }

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter, actionFilter]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.user_email.toLowerCase().includes(searchLower) ||
      log.user_name?.toLowerCase().includes(searchLower) ||
      log.entity_name?.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Track all team member actions and changes
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, email, or entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="estimate">Estimate</SelectItem>
              <SelectItem value="invoice">Invoice</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="team_member">Team Member</SelectItem>
              <SelectItem value="session">Session</SelectItem>
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="send_email">Send Email</SelectItem>
              <SelectItem value="record_payment">Record Payment</SelectItem>
              <SelectItem value="invite_member">Invite Member</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading activity...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity found
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    {actionIcons[log.action] || <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {log.user_name || log.user_email}
                      </span>
                      <Badge variant="secondary" className={actionColors[log.action] || ""}>
                        {formatActionLabel(log.action)}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {entityIcons[log.entity_type]}
                        {formatEntityType(log.entity_type)}
                      </Badge>
                    </div>
                    {log.entity_name && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.entity_name}
                      </p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "MMM d, h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
