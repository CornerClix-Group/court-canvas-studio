import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, DollarSign, Clock } from "lucide-react";

interface AnalyticsData {
  closeRate: number;
  avgJobSize: number;
  avgDaysToClose: number;
  pipelineValue: number;
  wonCount: number;
  lostCount: number;
}

export function SalesAnalyticsWidget() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        const [estimatesRes, pendingRes] = await Promise.all([
          supabase
            .from("estimates")
            .select("id, total, outcome, created_at, approved_at, status")
            .gte("created_at", ninetyDaysAgo),
          supabase
            .from("estimates")
            .select("total")
            .in("status", ["sent", "draft"]),
        ]);

        const estimates = estimatesRes.data || [];
        const pending = pendingRes.data || [];

        const won = estimates.filter((e) => e.outcome === "won" || e.status === "approved");
        const lost = estimates.filter((e) => e.outcome === "lost" || e.status === "declined");
        const total = won.length + lost.length;

        const closeRate = total > 0 ? (won.length / total) * 100 : 0;
        const avgJobSize = won.length > 0
          ? won.reduce((sum, e) => sum + Number(e.total), 0) / won.length
          : 0;

        // Average days to close for won estimates
        const daysToClose = won
          .filter((e) => e.approved_at)
          .map((e) => {
            const created = new Date(e.created_at).getTime();
            const approved = new Date(e.approved_at!).getTime();
            return (approved - created) / (1000 * 60 * 60 * 24);
          });
        const avgDaysToClose = daysToClose.length > 0
          ? daysToClose.reduce((a, b) => a + b, 0) / daysToClose.length
          : 0;

        const pipelineValue = pending.reduce((sum, e) => sum + Number(e.total), 0);

        setData({
          closeRate,
          avgJobSize,
          avgDaysToClose,
          pipelineValue,
          wonCount: won.length,
          lostCount: lost.length,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

  if (loading) return null;

  const stats = [
    {
      label: "Close Rate (90d)",
      value: `${(data?.closeRate ?? 0).toFixed(0)}%`,
      detail: `${data?.wonCount ?? 0}W / ${data?.lostCount ?? 0}L`,
      icon: Target,
      color: "text-green-500",
    },
    {
      label: "Avg Job Size",
      value: formatCurrency(data?.avgJobSize ?? 0),
      detail: "Won estimates",
      icon: DollarSign,
      color: "text-blue-500",
    },
    {
      label: "Days to Close",
      value: `${(data?.avgDaysToClose ?? 0).toFixed(0)}d`,
      detail: "Avg time to win",
      icon: Clock,
      color: "text-orange-500",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(data?.pipelineValue ?? 0),
      detail: "Open estimates",
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Sales Analytics (Last 90 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center space-y-1">
                <Icon className={`w-5 h-5 mx-auto ${stat.color}`} />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/70">{stat.detail}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
