import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCircle, Mail, Phone, MapPin, Calendar, AlertTriangle, ArrowRight, X } from "lucide-react";
import { format, isToday, isPast, differenceInHours } from "date-fns";
import CustomerFormModal from "@/components/admin/CustomerFormModal";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  project_type: string | null;
  notes: string | null;
  source: string | null;
  status: string;
  created_at: string;
  job_type: string | null;
  base_type: string | null;
  court_condition: string | null;
  ownership_type: string | null;
  number_of_courts: number | null;
  budget_range: string | null;
  urgency: string | null;
  ai_score: number | null;
  ai_tags: string[] | null;
  lost_reason: string | null;
  follow_up_date: string | null;
  last_contacted_at: string | null;
  follow_up_count: number | null;
  converted_customer_id: string | null;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  qualified: "bg-green-500/10 text-green-500 border-green-500/20",
  converted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  lost: "bg-red-500/10 text-red-500 border-red-500/20",
  archived: "bg-muted text-muted-foreground border-muted",
};

const lostReasons = [
  { value: "too_expensive", label: "Too Expensive" },
  { value: "competitor", label: "Went with Competitor" },
  { value: "project_cancelled", label: "Project Cancelled" },
  { value: "no_response", label: "No Response" },
  { value: "bad_fit", label: "Bad Fit / Out of Area" },
  { value: "timing", label: "Timing — Not Ready" },
];

function formatLabel(value: string | null): string {
  if (!value) return "";
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 7 ? "bg-green-500/10 text-green-600 border-green-500/20" :
                score >= 4 ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                "bg-red-500/10 text-red-600 border-red-500/20";
  return <Badge variant="outline" className={color}>{score}/10</Badge>;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lostDialogLead, setLostDialogLead] = useState<Lead | null>(null);
  const [selectedLostReason, setSelectedLostReason] = useState("");
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const { toast } = useToast();

  const fetchLeads = async () => {
    try {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLeads((data as Lead[]) || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load leads." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    if (newStatus === "lost") {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setLostDialogLead(lead);
        setSelectedLostReason("");
      }
      return;
    }

    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "contacted") {
        updateData.last_contacted_at = new Date().toISOString();
        const lead = leads.find(l => l.id === leadId);
        updateData.follow_up_count = (lead?.follow_up_count || 0) + 1;
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) throw error;
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, ...updateData } : lead
        )
      );
      toast({ title: "Status updated", description: `Lead status changed to ${newStatus}` });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update lead status." });
    }
  };

  const confirmLost = async () => {
    if (!lostDialogLead || !selectedLostReason) return;
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: "lost", lost_reason: selectedLostReason })
        .eq("id", lostDialogLead.id);

      if (error) throw error;
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === lostDialogLead.id ? { ...lead, status: "lost", lost_reason: selectedLostReason } : lead
        )
      );
      toast({ title: "Lead marked as lost", description: `Reason: ${formatLabel(selectedLostReason)}` });
      setLostDialogLead(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update lead." });
    }
  };

  const handleConvertClick = (lead: Lead) => {
    setConvertLead(lead);
    setShowCustomerModal(true);
  };

  const handleCustomerCreated = async (customerId: string) => {
    if (!convertLead) return;
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: "converted", converted_customer_id: customerId })
        .eq("id", convertLead.id);

      if (error) throw error;
      setLeads(prev =>
        prev.map(l => l.id === convertLead.id ? { ...l, status: "converted", converted_customer_id: customerId } : l)
      );
      toast({ title: "Lead converted!", description: "Customer record created successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update lead after conversion." });
    }
    setShowCustomerModal(false);
    setConvertLead(null);
  };

  const setFollowUp = async (leadId: string, date: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ follow_up_date: date })
        .eq("id", leadId);

      if (error) throw error;
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, follow_up_date: date } : l));
      toast({ title: "Follow-up set", description: `Follow-up scheduled for ${format(new Date(date), "MMM d, yyyy")}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to set follow-up date." });
    }
  };

  // Leads needing attention
  const needsFollowUp = leads.filter(l => {
    if (l.status === "lost" || l.status === "converted" || l.status === "archived") return false;
    if (l.follow_up_date && (isToday(new Date(l.follow_up_date)) || isPast(new Date(l.follow_up_date)))) return true;
    if (l.status === "new" && differenceInHours(new Date(), new Date(l.created_at)) > 24) return true;
    return false;
  });

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leads</h1>
        <p className="text-muted-foreground mt-1">Manage incoming leads from your website</p>
      </div>

      {/* Follow-up Alerts */}
      {needsFollowUp.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-4 h-4" />
              Needs Follow-Up ({needsFollowUp.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsFollowUp.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{lead.name}</span>
                    {lead.follow_up_date && (
                      <span className="text-muted-foreground">— follow-up {format(new Date(lead.follow_up_date), "MMM d")}</span>
                    )}
                    {!lead.follow_up_date && lead.status === "new" && (
                      <span className="text-muted-foreground">— new lead, no contact yet</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => updateLeadStatus(lead.id, "contacted")}>
                      Mark Contacted
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => handleConvertClick(lead)}>
                      Convert
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            All Leads ({filteredLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No leads match your filters"
                : "No leads yet. They will appear here when submitted through your website."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Follow-Up</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {lead.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <a href={`mailto:${lead.email}`} className="hover:text-primary">{lead.email}</a>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <a href={`tel:${lead.phone}`} className="hover:text-primary">{lead.phone}</a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(lead.city || lead.state) && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {[lead.city, lead.state].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.project_type && <Badge variant="secondary">{lead.project_type}</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          {lead.job_type && <div>{formatLabel(lead.job_type)}</div>}
                          {lead.ownership_type && <div className="text-muted-foreground">{formatLabel(lead.ownership_type)}</div>}
                          {lead.court_condition && <div className="text-muted-foreground">Condition: {formatLabel(lead.court_condition)}</div>}
                          {lead.budget_range && <div className="text-muted-foreground">{formatLabel(lead.budget_range)}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ScoreBadge score={lead.ai_score} />
                        {lead.ai_tags && lead.ai_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.ai_tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">{formatLabel(tag)}</Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <Badge variant="outline" className={statusColors[lead.status]}>
                              {lead.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        {lead.lost_reason && (
                          <div className="text-xs text-red-500 mt-1">{formatLabel(lead.lost_reason)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Input
                            type="date"
                            className="h-7 text-xs w-32"
                            value={lead.follow_up_date || ""}
                            onChange={(e) => setFollowUp(lead.id, e.target.value)}
                          />
                          {lead.follow_up_count ? (
                            <div className="text-[10px] text-muted-foreground">{lead.follow_up_count}x contacted</div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(lead.created_at), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={lead.status === "converted"}
                          onClick={() => handleConvertClick(lead)}
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Convert
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lost Reason Dialog */}
      <Dialog open={!!lostDialogLead} onOpenChange={(open) => !open && setLostDialogLead(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Lead as Lost</DialogTitle>
            <DialogDescription>
              Why was this lead lost? This helps track patterns and improve your close rate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Select value={selectedLostReason} onValueChange={setSelectedLostReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {lostReasons.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setLostDialogLead(null)}>Cancel</Button>
              <Button variant="destructive" disabled={!selectedLostReason} onClick={confirmLost}>
                Confirm Lost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert to Customer Modal */}
      {showCustomerModal && convertLead && (
        <CustomerFormModal
          open={showCustomerModal}
          onOpenChange={(open) => {
            setShowCustomerModal(open);
            if (!open) setConvertLead(null);
          }}
          onSuccess={handleCustomerCreated}
          initialData={{
            contact_name: convertLead.name,
            email: convertLead.email || "",
            phone: convertLead.phone || "",
            city: convertLead.city || "",
            state: convertLead.state || "",
          }}
        />
      )}
    </div>
  );
}
