import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserCircle,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { MercuryBalanceCard } from "@/components/admin/MercuryBalanceCard";

interface DashboardStats {
  leads: number;
  customers: number;
  estimates: number;
  invoices: number;
  pendingPayments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    leads: 0,
    customers: 0,
    estimates: 0,
    invoices: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [leadsRes, customersRes, estimatesRes, invoicesRes] = await Promise.all([
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase.from("customers").select("id", { count: "exact", head: true }),
          supabase.from("estimates").select("id", { count: "exact", head: true }),
          supabase.from("invoices").select("id, status", { count: "exact" }),
        ]);

        const pendingInvoices = invoicesRes.data?.filter(
          (inv) => inv.status === "sent" || inv.status === "partially_paid"
        ).length || 0;

        setStats({
          leads: leadsRes.count || 0,
          customers: customersRes.count || 0,
          estimates: estimatesRes.count || 0,
          invoices: invoicesRes.count || 0,
          pendingPayments: pendingInvoices,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Leads",
      value: stats.leads,
      icon: UserCircle,
      href: "/admin/leads",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Customers",
      value: stats.customers,
      icon: Users,
      href: "/admin/customers",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Estimates",
      value: stats.estimates,
      icon: FileText,
      href: "/admin/estimates",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Invoices",
      value: stats.invoices,
      icon: Receipt,
      href: "/admin/invoices",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const quickActions = [
    { label: "New Estimate", href: "/admin/estimates/new", icon: FileText },
    { label: "New Invoice", href: "/admin/invoices/new", icon: Receipt },
    { label: "Add Customer", href: "/admin/customers/new", icon: Users },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to your CourtPro business management dashboard
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button key={action.href} asChild variant="outline">
              <Link to={action.href}>
                <Plus className="w-4 h-4 mr-2" />
                {action.label}
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} to={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {loading ? "—" : stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    View all <ArrowRight className="w-3 h-3 ml-1" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Mercury Bank Balance */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MercuryBalanceCard />
      </div>

      {/* Pending Payments Alert */}
      {stats.pendingPayments > 0 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <CreditCard className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Pending Payments</CardTitle>
                <CardDescription>
                  You have {stats.pendingPayments} invoice{stats.pendingPayments !== 1 ? "s" : ""} awaiting payment
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/admin/invoices?status=pending">
                View Pending Invoices
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Getting Started Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Follow these steps to set up your business workflow
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>
                <strong>Leads</strong> — New inquiries from your website will automatically appear in the Leads section
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>
                <strong>Customers</strong> — Convert qualified leads into customers with their contact info
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>
                <strong>Estimates</strong> — Create detailed estimates with line items and send them to customers
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>
                <strong>Invoices</strong> — Convert approved estimates to invoices and track payments
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
