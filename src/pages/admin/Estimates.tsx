import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, Plus, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface Estimate {
  id: string;
  estimate_number: string;
  customer_id: string | null;
  status: string;
  subtotal: number;
  total: number;
  valid_until: string | null;
  created_at: string;
  customers: {
    contact_name: string;
    company_name: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-muted",
  sent: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  declined: "bg-red-500/10 text-red-500 border-red-500/20",
  expired: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export default function AdminEstimates() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const fetchEstimates = async () => {
    try {
      let query = supabase
        .from("estimates")
        .select(`
          *,
          customers (
            contact_name,
            company_name
          )
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEstimates(data || []);
    } catch (error) {
      console.error("Error fetching estimates:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load estimates. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, [statusFilter]);

  const filteredEstimates = estimates.filter(
    (estimate) =>
      estimate.estimate_number.toLowerCase().includes(search.toLowerCase()) ||
      estimate.customers?.contact_name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      estimate.customers?.company_name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estimates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage project estimates
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/estimates/new">
            <Plus className="w-4 h-4 mr-2" />
            New Estimate
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by estimate number or customer..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estimates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            All Estimates ({filteredEstimates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading estimates...
            </div>
          ) : filteredEstimates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No estimates match your filters"
                : "No estimates yet. Create your first estimate to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estimate #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstimates.map((estimate) => (
                    <TableRow key={estimate.id}>
                      <TableCell className="font-medium font-mono">
                        {estimate.estimate_number}
                      </TableCell>
                      <TableCell>
                        {estimate.customers ? (
                          <div>
                            <div className="font-medium">
                              {estimate.customers.contact_name}
                            </div>
                            {estimate.customers.company_name && (
                              <div className="text-sm text-muted-foreground">
                                {estimate.customers.company_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[estimate.status]}
                        >
                          {estimate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          {formatCurrency(estimate.total)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {estimate.valid_until ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {format(new Date(estimate.valid_until), "MMM d, yyyy")}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(estimate.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          View
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
    </div>
  );
}
