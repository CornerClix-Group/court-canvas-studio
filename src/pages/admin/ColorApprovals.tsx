/**
 * Dashboard listing every project's color approval state.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Palette, CheckCircle2, Clock } from "lucide-react";

interface Row {
  id: string;
  project_number: string;
  project_name: string;
  color_approval_status: string;
  color_approved_at: string | null;
  customer_email: string | null;
  approved_count: number;
  total_count: number;
}

export default function ColorApprovals() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "partial" | "approved">("all");
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: projects } = await supabase
      .from("projects")
      .select("id, project_number, project_name, color_approval_status, color_approved_at, customer_email")
      .not("project_number", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    const ids = (projects || []).map((p) => p.id);
    let counts: Record<string, { approved: number; total: number }> = {};
    if (ids.length) {
      const { data: cts } = await supabase
        .from("project_courts")
        .select("project_id, approved")
        .in("project_id", ids);
      (cts || []).forEach((r: any) => {
        counts[r.project_id] = counts[r.project_id] || { approved: 0, total: 0 };
        counts[r.project_id].total += 1;
        if (r.approved) counts[r.project_id].approved += 1;
      });
    }
    setRows(
      (projects || []).map((p) => ({
        ...(p as any),
        approved_count: counts[p.id]?.approved || 0,
        total_count: counts[p.id]?.total || 0,
      })) as Row[]
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows
    .filter((r) => filter === "all" || r.color_approval_status === filter)
    .filter((r) =>
      !q ||
      r.project_number?.toLowerCase().includes(q.toLowerCase()) ||
      r.project_name?.toLowerCase().includes(q.toLowerCase()) ||
      r.customer_email?.toLowerCase().includes(q.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Palette className="h-6 w-6 text-primary" /> Color Approvals
        </h1>
        <p className="text-sm text-muted-foreground">Track customer color sign-offs across all active projects.</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search project number, name, or email…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-1.5">
            {(["all", "pending", "partial", "approved"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No projects match.</Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Link key={r.id} to={`/admin/projects/${r.id}?tab=colors`}>
              <Card className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{r.project_number}</span>
                      <h3 className="font-semibold text-foreground truncate">{r.project_name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.customer_email || "no email"} · {r.approved_count}/{r.total_count} courts approved
                    </p>
                  </div>
                  <StatusPill status={r.color_approval_status} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "approved")
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary"><CheckCircle2 className="h-3 w-3" /> Approved</span>;
  if (status === "partial")
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-700"><Clock className="h-3 w-3" /> In Review</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground"><Clock className="h-3 w-3" /> Pending</span>;
}
