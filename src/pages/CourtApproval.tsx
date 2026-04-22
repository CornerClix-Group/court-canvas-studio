import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CourtRenderer } from "@/components/court/CourtRenderer";
import { ColorSwatchPicker } from "@/components/court/ColorSwatchPicker";
import {
  COURT_TYPES,
  CourtType,
  LAYKOLD_COURT_COLORS,
  LAYKOLD_LINES,
} from "@/lib/courtGeometry";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Lock, Loader2, ShieldCheck, Pencil, Download } from "lucide-react";

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

interface ProjectRow {
  id: string;
  project_number: string;
  project_name: string;
  customer_email: string | null;
  color_approval_status: string;
  color_approved_at: string | null;
}

export default function CourtApproval() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const initialNumber = params.projectNumber || searchParams.get("p") || "";
  const [code, setCode] = useState(initialNumber);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [courts, setCourts] = useState<CourtRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCourt, setEditingCourt] = useState<CourtRow | null>(null);
  const [approveCourt, setApproveCourt] = useState<CourtRow | null>(null);
  const [initials, setInitials] = useState("");
  const [busy, setBusy] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (initialNumber) loadProject(initialNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProject = async (num: string) => {
    if (!num) return;
    setLoading(true);
    const { data: p, error: pErr } = await supabase
      .from("projects")
      .select("id, project_number, project_name, customer_email, color_approval_status, color_approved_at")
      .eq("project_number", num.trim())
      .maybeSingle();
    if (pErr || !p) {
      toast({ variant: "destructive", title: "Project not found", description: "Check the project code on your email." });
      setProject(null);
      setCourts([]);
      setLoading(false);
      return;
    }
    setProject(p as ProjectRow);
    const { data: cts } = await supabase
      .from("project_courts")
      .select("*")
      .eq("project_id", p.id)
      .order("sort_order", { ascending: true });
    setCourts((cts as CourtRow[]) || []);
    setLoading(false);
    if (params.projectNumber !== num) {
      navigate(`/court-approval/${num.trim()}`, { replace: true });
    }
  };

  const handleSaveColors = async (changes: Partial<CourtRow>) => {
    if (!editingCourt || !project) return;
    setBusy(true);
    const { error } = await supabase.rpc("update_court_colors_by_number", {
      _project_number: project.project_number,
      _court_id: editingCourt.id,
      _inner_color: changes.inner_color ?? editingCourt.inner_color,
      _outer_color: changes.outer_color ?? editingCourt.outer_color,
      _line_color: changes.line_color ?? editingCourt.line_color,
      _court_label: changes.court_label ?? editingCourt.court_label,
    });
    setBusy(false);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't save", description: error.message });
      return;
    }
    toast({ title: "Saved" });
    setEditingCourt(null);
    loadProject(project.project_number);
  };

  const handleApprove = async () => {
    if (!approveCourt || !project) return;
    if (initials.trim().length < 2) {
      toast({ variant: "destructive", title: "Initials required", description: "Enter at least 2 letters." });
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("approve_court_by_number", {
      _project_number: project.project_number,
      _court_id: approveCourt.id,
      _initials: initials,
      _approved: true,
    });
    setBusy(false);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't approve", description: error.message });
      return;
    }
    setApproveCourt(null);
    setInitials("");
    loadProject(project.project_number);
  };

  const handleUnapprove = async (court: CourtRow) => {
    if (!project) return;
    const { error } = await supabase.rpc("approve_court_by_number", {
      _project_number: project.project_number,
      _court_id: court.id,
      _initials: null,
      _approved: false,
    });
    if (error) {
      toast({ variant: "destructive", title: "Couldn't unapprove", description: error.message });
      return;
    }
    loadProject(project.project_number);
  };

  const handleFinalize = async () => {
    if (!project) return;
    setFinalizing(true);
    const { error } = await supabase.rpc("finalize_project_approval", {
      _project_number: project.project_number,
      _approval_ip: null,
    });
    setFinalizing(false);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't finalize", description: error.message });
      return;
    }
    toast({ title: "Approval finalized", description: "We've recorded your sign-off and notified the team." });
    loadProject(project.project_number);
  };

  const downloadPdf = async () => {
    if (!project) return;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-approval-pdf`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ project_number: project.project_number }),
    });
    if (!resp.ok) {
      toast({ variant: "destructive", title: "PDF failed", description: "Try again in a moment." });
      return;
    }
    const blob = await resp.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `approval-${project.project_number}.pdf`;
    a.click();
  };

  const allApproved = courts.length > 0 && courts.every((c) => c.approved);
  const isFinalApproved = project?.color_approval_status === "approved";

  return (
    <>
      <SEOHead
        title="Court Color Approval | CourtPro Augusta"
        description="Review and approve your court color design."
      />

      <div className="min-h-screen bg-muted/30">
        <header className="bg-card border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">CourtPro Approval</span>
            </div>
            {project && (
              <span className="text-xs text-muted-foreground font-mono">{project.project_number}</span>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Project lookup */}
          {!project && (
            <Card className="max-w-md mx-auto p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-lg font-bold">Enter your project code</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                You'll find your code (e.g., <span className="font-mono">PRJ-2026-0042</span>) in the email from CourtPro Augusta.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadProject(code);
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="PRJ-YYYY-NNNN"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Open"}
                </Button>
              </form>
            </Card>
          )}

          {/* Courts list */}
          {project && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">{project.project_name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Review each court below, make any tweaks, and approve with your initials. You must approve every court before finalizing.
                </p>
              </div>

              {isFinalApproved && (
                <Card className="p-4 mb-6 bg-primary/5 border-primary/20 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Approval finalized</p>
                    <p className="text-xs text-muted-foreground">
                      Signed off {project.color_approved_at && new Date(project.color_approved_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={downloadPdf}>
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </Card>
              )}

              <div className="space-y-6">
                {courts.map((c) => {
                  const meta = COURT_TYPES[c.court_type];
                  return (
                    <Card key={c.id} className="overflow-hidden">
                      <div className="grid md:grid-cols-[1fr_280px]">
                        <div className="p-4 bg-muted/30">
                          <CourtRenderer
                            courtType={c.court_type}
                            innerColor={c.inner_color}
                            outerColor={c.outer_color}
                            lineColor={c.line_color}
                            view="perspective"
                          />
                        </div>
                        <div className="p-5 border-t md:border-t-0 md:border-l border-border flex flex-col">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-foreground">{c.court_label}</h3>
                              <p className="text-xs text-muted-foreground">{meta?.dimensionsLabel}</p>
                            </div>
                            {c.approved && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                                <CheckCircle2 className="h-3 w-3" /> Approved
                              </span>
                            )}
                          </div>
                          <div className="space-y-1.5 text-xs mb-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: getHex(c.inner_color) }} />
                              <span className="text-muted-foreground">Inner:</span>
                              <span className="font-medium text-foreground">Laykold {c.inner_color}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: getHex(c.outer_color) }} />
                              <span className="text-muted-foreground">Outer:</span>
                              <span className="font-medium text-foreground">Laykold {c.outer_color}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: getHex(c.line_color) }} />
                              <span className="text-muted-foreground">Lines:</span>
                              <span className="font-medium text-foreground">Laykold {c.line_color}</span>
                            </div>
                          </div>
                          {c.approved ? (
                            <>
                              <p className="text-xs text-muted-foreground mb-3">
                                Approved by <strong>{c.approved_initials}</strong>
                                {c.approved_at && ` on ${new Date(c.approved_at).toLocaleDateString()}`}
                              </p>
                              {!isFinalApproved && (
                                <Button size="sm" variant="ghost" onClick={() => handleUnapprove(c)}>
                                  Undo approval
                                </Button>
                              )}
                            </>
                          ) : (
                            <div className="mt-auto space-y-2">
                              <Button size="sm" variant="outline" className="w-full" onClick={() => setEditingCourt(c)}>
                                <Pencil className="h-3 w-3 mr-2" /> Tweak colors
                              </Button>
                              <Button size="sm" className="w-full" onClick={() => setApproveCourt(c)}>
                                <CheckCircle2 className="h-3 w-3 mr-2" /> Approve this court
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Finalize bar */}
              {!isFinalApproved && (
                <Card className="mt-8 p-5 bg-primary/5 border-primary/20">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {allApproved ? "Ready to finalize" : `${courts.filter((c) => c.approved).length} of ${courts.length} approved`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {allApproved
                          ? "Once finalized, we'll lock in these colors and start material ordering."
                          : "Approve every court to finalize."}
                      </p>
                    </div>
                    <Button size="lg" disabled={!allApproved || finalizing} onClick={handleFinalize}>
                      {finalizing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                      Finalize approval
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )}
        </main>
      </div>

      {/* Edit colors dialog */}
      <Dialog open={!!editingCourt} onOpenChange={(o) => !o && setEditingCourt(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tweak colors</DialogTitle>
            <DialogDescription>Pick from the official Laykold palette. Save to update the preview.</DialogDescription>
          </DialogHeader>
          {editingCourt && (
            <EditCourtForm
              court={editingCourt}
              onSave={handleSaveColors}
              busy={busy}
              onCancel={() => setEditingCourt(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Approve dialog */}
      <Dialog open={!!approveCourt} onOpenChange={(o) => !o && (setApproveCourt(null), setInitials(""))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {approveCourt?.court_label}</DialogTitle>
            <DialogDescription>
              By entering your initials below you confirm the colors are exactly as you want them. We'll order materials based on this.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="initials">Your initials</Label>
            <Input
              id="initials"
              maxLength={4}
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase())}
              className="font-mono uppercase tracking-widest text-center text-lg mt-1"
              placeholder="ABC"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setApproveCourt(null); setInitials(""); }} disabled={busy}>Cancel</Button>
            <Button onClick={handleApprove} disabled={busy || initials.trim().length < 2}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getHex(name: string): string {
  const all = [...LAYKOLD_COURT_COLORS, ...LAYKOLD_LINES];
  return all.find((c) => c.name === name)?.hex || "#2D4F6E";
}

function EditCourtForm({
  court,
  onSave,
  onCancel,
  busy,
}: {
  court: CourtRow;
  onSave: (changes: Partial<CourtRow>) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [inner, setInner] = useState(court.inner_color);
  const [outer, setOuter] = useState(court.outer_color);
  const [line, setLine] = useState(court.line_color);
  const [label, setLabel] = useState(court.court_label);

  return (
    <div className="space-y-5">
      <div className="bg-muted/30 rounded-md p-3">
        <CourtRenderer
          courtType={court.court_type}
          innerColor={inner}
          outerColor={outer}
          lineColor={line}
          view="perspective"
        />
      </div>
      <div>
        <Label htmlFor="label">Court label</Label>
        <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <ColorSwatchPicker label="Playing surface (inner)" colors={LAYKOLD_COURT_COLORS} selected={inner} onChange={setInner} groupByTier />
      <ColorSwatchPicker label="Outer pad" colors={LAYKOLD_COURT_COLORS} selected={outer} onChange={setOuter} groupByTier />
      <ColorSwatchPicker label="Lines" colors={LAYKOLD_LINES} selected={line} onChange={setLine} />
      <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-1">
        <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button onClick={() => onSave({ inner_color: inner, outer_color: outer, line_color: line, court_label: label })} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Save changes
        </Button>
      </div>
    </div>
  );
}
