import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface EstimateStats {
  draft: number;
  sent: number;
  approved: number;
  declined: number;
  expired: number;
  total: number;
  totalValue: number;
  approvedValue: number;
}

const statusConfig = [
  { 
    key: "draft" as const, 
    label: "Draft", 
    icon: FileText, 
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    progressColor: "bg-muted-foreground",
  },
  { 
    key: "sent" as const, 
    label: "Sent", 
    icon: Send, 
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    progressColor: "bg-blue-500",
  },
  { 
    key: "approved" as const, 
    label: "Approved", 
    icon: CheckCircle, 
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    progressColor: "bg-green-500",
  },
  { 
    key: "declined" as const, 
    label: "Declined", 
    icon: XCircle, 
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    progressColor: "bg-red-500",
  },
  { 
    key: "expired" as const, 
    label: "Expired", 
    icon: Clock, 
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    progressColor: "bg-yellow-500",
  },
];

export function EstimatePipelineWidget() {
  const [stats, setStats] = useState<EstimateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEstimateStats() {
      try {
        const { data, error } = await supabase
          .from("estimates")
          .select("status, total");

        if (error) throw error;

        const counts = {
          draft: 0,
          sent: 0,
          approved: 0,
          declined: 0,
          expired: 0,
        };

        let totalValue = 0;
        let approvedValue = 0;

        data?.forEach((estimate) => {
          const status = estimate.status as keyof typeof counts;
          if (status in counts) {
            counts[status]++;
          }
          totalValue += estimate.total || 0;
          if (estimate.status === "approved") {
            approvedValue += estimate.total || 0;
          }
        });

        setStats({
          ...counts,
          total: data?.length || 0,
          totalValue,
          approvedValue,
        });
      } catch (error) {
        console.error("Error fetching estimate stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEstimateStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const conversionRate = stats && stats.total > 0 
    ? Math.round((stats.approved / stats.total) * 100) 
    : 0;

  if (loading) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  // Calculate active pipeline (draft + sent)
  const activePipeline = stats.draft + stats.sent;

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Sales Pipeline
            </CardTitle>
            <CardDescription>
              Track your estimates from draft to approval
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/estimates">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{activePipeline}</p>
            <p className="text-xs text-muted-foreground">In Pipeline</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Won</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <p className="text-2xl font-bold text-primary">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        {/* Value Summary */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Approved Value</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(stats.approvedValue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Pipeline Value</span>
            <span className="text-sm font-medium">
              {formatCurrency(stats.totalValue)}
            </span>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">By Status</p>
          {statusConfig.map((status) => {
            const count = stats[status.key];
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            const Icon = status.icon;

            return (
              <Link 
                key={status.key} 
                to={`/admin/estimates?status=${status.key}`}
                className="block"
              >
                <div className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-1.5 rounded ${status.bgColor}`}>
                    <Icon className={`w-4 h-4 ${status.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{status.label}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-1.5"
                      // Custom color via style
                      style={{ 
                        '--progress-background': `hsl(var(--muted))`,
                      } as React.CSSProperties}
                    />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
