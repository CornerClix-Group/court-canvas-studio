/**
 * Admin tab embedded in the Project detail page for managing court colors
 * and the customer approval flow.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { CourtRenderer } from "@/components/court/CourtRenderer";
import { ColorSwatchPicker } from "@/components/court/ColorSwatchPicker";
import {
  COURT_TYPE_LIST,
  CourtType,
  LAYKOLD_COURT_COLORS,
  LAYKOLD_LINES,
} from "@/lib/courtGeometry";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, Send, Download, Loader2, CheckCircle2 } from "lucide-react";

interface CourtRow {
  id: string;
  court_label: string;
  court_type: CourtType;
  inner_color: string;
  outer_color: string;
  line_color: string;
  approved: boolean;
  approved_initials: string | null;
  approved_at: string | null;
  sort_order: number;
}

interface Props {
  projectId: string;
  projectNumber: string | null;
  approvalStatus: string;
  customerEmail?: string | null;
  onChange?: () => void;
}

export function ProjectCourtsTab({ projectId, projectNumber, approvalStatus, customerEmail, onChange }: Props) {
  const { toast } = useToast();
  const [courts, setCourts] = useState<CourtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CourtRow | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("project_courts")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });
    setCourts((data as CourtRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [projectId]);

  const addCourt = async (courtType: CourtType, label: string) => {
    const { error } = await supabase.from("project_courts").insert({
      project_id: projectId,
      court_label: label,
      court_type: courtType,
      sort_order: courts.length,
    });
    if (error) {
      toast({ variant: "destructive", title: "Couldn't add court", description: error.message });
      return;
    }
    setAdding(false);
    load();
    onChange?.();
  };

  const deleteCourt = async (id: string) => {
    if (!confirm("Remove this court?")) return;
    const { error } = await supabase.from("project_courts").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't delete", description: error.message });
      return;
    }
    load();
    onChange?.();
  };

  const saveCourt = async (court: CourtRow) => {
    const { error } = await supabase
      .from("project_courts")
      .update({
        court_label: court.court_label,
        inner_color: court.inner_color,
        outer_color: court.outer_color,
        line_color: court.line_color,
      })
      .eq("id", court.id);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't save", description: error.message });
      return;
    }
    setEditing(null);
    load();
    onChange?.();
  };

  const copyApprovalLink = () => {
    if (!projectNumber) return;
    const url = `${window.location.origin}/court-approval/${projectNumber}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Approval link copied", description: url });
  };

  const downloadPdf = async () => {
    if (!projectNumber) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-approval-pdf`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ project_number: projectNumber }),
    });
    if (!resp.ok) {
      toast({ variant: "destructive", title: "PDF failed" });
      return;
    }
    const blob = await resp.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `approval-${projectNumber}.pdf`;
    a.click();
  };

  const approvedCount = courts.filter((c) => c.approved).length;

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Color Approval</h3>
              <StatusBadge status={approvalStatus} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedCount} of {courts.length} courts approved · Code: <span className="font-mono">{projectNumber || "(none)"}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={copyApprovalLink} disabled={!projectNumber}>
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy approval link
            </Button>
            <Button size="sm" variant="outline" onClick={downloadPdf} disabled={!projectNumber || courts.length === 0}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Courts grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : courts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No courts configured yet for color approval.</p>
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add first court
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {courts.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <div className="bg-muted/30 p-3">
                  <CourtRenderer
                    courtType={c.court_type}
                    innerColor={c.inner_color}
                    outerColor={c.outer_color}
                    lineColor={c.line_color}
                    view="perspective"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{c.court_label}</h4>
                    {c.approved && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        <CheckCircle2 className="h-3 w-3" /> {c.approved_initials}
                      </span>
                    )}
                  </div>
                  <div className="text-xs space-y-0.5 mb-3 text-muted-foreground">
                    <div>Inner: <span className="text-foreground">Laykold {c.inner_color}</span></div>
                    <div>Outer: <span className="text-foreground">Laykold {c.outer_color}</span></div>
                    <div>Lines: <span className="text-foreground">Laykold {c.line_color}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(c)} disabled={c.approved}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteCourt(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Button variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add another court
          </Button>
        </>
      )}

      {/* Add court dialog */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add court</DialogTitle>
          </DialogHeader>
          <AddCourtForm onAdd={addCourt} onCancel={() => setAdding(false)} index={courts.length} />
        </DialogContent>
      </Dialog>

      {/* Edit court dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit court colors</DialogTitle>
          </DialogHeader>
          {editing && <EditCourtAdmin court={editing} onSave={saveCourt} onCancel={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
    partial: { label: "Partial", cls: "bg-yellow-500/15 text-yellow-700" },
    approved: { label: "Approved", cls: "bg-primary/15 text-primary" },
  };
  const m = map[status] || map.pending;
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>{m.label}</span>;
}

function AddCourtForm({ onAdd, onCancel, index }: { onAdd: (t: CourtType, l: string) => void; onCancel: () => void; index: number }) {
  const [type, setType] = useState<CourtType>("tennis");
  const [label, setLabel] = useState(`Court ${index + 1}`);
  return (
    <div className="space-y-4">
      <div>
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as CourtType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {COURT_TYPE_LIST.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onAdd(type, label)}>Add</Button>
      </DialogFooter>
    </div>
  );
}

function EditCourtAdmin({ court, onSave, onCancel }: { court: CourtRow; onSave: (c: CourtRow) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<CourtRow>(court);
  return (
    <div className="space-y-5">
      <div className="bg-muted/30 rounded p-3">
        <CourtRenderer courtType={draft.court_type} innerColor={draft.inner_color} outerColor={draft.outer_color} lineColor={draft.line_color} view="perspective" />
      </div>
      <div>
        <Label>Label</Label>
        <Input value={draft.court_label} onChange={(e) => setDraft({ ...draft, court_label: e.target.value })} />
      </div>
      <ColorSwatchPicker label="Playing surface" colors={LAYKOLD_COURT_COLORS} selected={draft.inner_color} onChange={(v) => setDraft({ ...draft, inner_color: v })} groupByTier />
      <ColorSwatchPicker label="Outer pad" colors={LAYKOLD_COURT_COLORS} selected={draft.outer_color} onChange={(v) => setDraft({ ...draft, outer_color: v })} groupByTier />
      <ColorSwatchPicker label="Lines" colors={LAYKOLD_LINES} selected={draft.line_color} onChange={(v) => setDraft({ ...draft, line_color: v })} />
      <div className="flex justify-end gap-2 sticky bottom-0 bg-background pb-1 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(draft)}>Save</Button>
      </div>
    </div>
  );
}
