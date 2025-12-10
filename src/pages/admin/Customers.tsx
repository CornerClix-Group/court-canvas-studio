import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Mail, Phone, MapPin, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CustomerFormModal } from "@/components/admin/CustomerFormModal";

interface Customer {
  id: string;
  company_name: string | null;
  contact_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
  notes?: string | null;
}

interface LinkedRecords {
  invoices: number;
  estimates: number;
  payments: number;
  projects: number;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [linkedRecords, setLinkedRecords] = useState<LinkedRecords | null>(null);
  const [checkingLinks, setCheckingLinks] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load customers. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.contact_name.toLowerCase().includes(search.toLowerCase()) ||
      customer.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      customer.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalOpen(true);
  };

  const handleSuccess = (customer: Customer) => {
    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? customer : c))
      );
    } else {
      setCustomers((prev) => [customer, ...prev]);
    }
  };

  const checkLinkedRecords = async (customerId: string) => {
    setCheckingLinks(true);
    try {
      const [invoicesRes, estimatesRes, paymentsRes, projectsRes] = await Promise.all([
        supabase.from("invoices").select("id", { count: "exact", head: true }).eq("customer_id", customerId),
        supabase.from("estimates").select("id", { count: "exact", head: true }).eq("customer_id", customerId),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("customer_id", customerId),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("customer_id", customerId),
      ]);

      setLinkedRecords({
        invoices: invoicesRes.count || 0,
        estimates: estimatesRes.count || 0,
        payments: paymentsRes.count || 0,
        projects: projectsRes.count || 0,
      });
    } catch (error) {
      console.error("Error checking linked records:", error);
    } finally {
      setCheckingLinks(false);
    }
  };

  const handleDeleteClick = async (customer: Customer) => {
    setCustomerToDelete(customer);
    setLinkedRecords(null);
    await checkLinkedRecords(customer.id);
  };

  const hasLinkedRecords = linkedRecords && (
    linkedRecords.invoices > 0 ||
    linkedRecords.estimates > 0 ||
    linkedRecords.payments > 0 ||
    linkedRecords.projects > 0
  );

  const handleDeleteCustomer = async () => {
    if (!customerToDelete || hasLinkedRecords) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerToDelete.id);

      if (error) throw error;

      toast({
        title: "Customer Deleted",
        description: `${customerToDelete.contact_name} has been removed.`,
      });

      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete customer. Please try again.",
      });
    } finally {
      setDeleting(false);
      setCustomerToDelete(null);
      setLinkedRecords(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
        <Button onClick={handleAddCustomer}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Customers ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search
                ? "No customers match your search"
                : "No customers yet. Add your first customer to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.contact_name}
                      </TableCell>
                      <TableCell>{customer.company_name || "—"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <a
                                href={`mailto:${customer.email}`}
                                className="hover:text-primary"
                              >
                                {customer.email}
                              </a>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <a
                                href={`tel:${customer.phone}`}
                                className="hover:text-primary"
                              >
                                {customer.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(customer.city || customer.state) && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {[customer.city, customer.state]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(customer.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(customer)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={editingCustomer}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!customerToDelete} onOpenChange={() => { setCustomerToDelete(null); setLinkedRecords(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {checkingLinks ? (
                  <span>Checking for linked records...</span>
                ) : hasLinkedRecords ? (
                  <div className="space-y-2">
                    <p className="text-destructive font-medium">
                      Cannot delete {customerToDelete?.contact_name}. This customer has linked records:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {linkedRecords!.invoices > 0 && <li>{linkedRecords!.invoices} invoice(s)</li>}
                      {linkedRecords!.estimates > 0 && <li>{linkedRecords!.estimates} estimate(s)</li>}
                      {linkedRecords!.payments > 0 && <li>{linkedRecords!.payments} payment(s)</li>}
                      {linkedRecords!.projects > 0 && <li>{linkedRecords!.projects} project(s)</li>}
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please remove or reassign these records before deleting the customer.
                    </p>
                  </div>
                ) : (
                  <span>
                    Are you sure you want to delete {customerToDelete?.contact_name}? This action cannot be undone.
                  </span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            {!hasLinkedRecords && !checkingLinks && (
              <AlertDialogAction
                onClick={handleDeleteCustomer}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}