import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import PickleballCourts from "./pages/PickleballCourts";
import TennisCourts from "./pages/TennisCourts";
import CourtResurfacing from "./pages/CourtResurfacing";
import BasketballCourts from "./pages/BasketballCourts";
import MultiSportCourts from "./pages/MultiSportCourts";
import AdminAuth from "./pages/admin/Auth";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLeads from "./pages/admin/Leads";
import AdminCustomers from "./pages/admin/Customers";
import AdminEstimates from "./pages/admin/Estimates";
import AdminInvoices from "./pages/admin/Invoices";
import AdminPayments from "./pages/admin/Payments";
import InvoiceBuilder from "./pages/admin/InvoiceBuilder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/pickleball-courts" element={<PickleballCourts />} />
          <Route path="/tennis-courts" element={<TennisCourts />} />
          <Route path="/court-resurfacing" element={<CourtResurfacing />} />
          <Route path="/basketball-courts" element={<BasketballCourts />} />
          <Route path="/multi-sport-courts" element={<MultiSportCourts />} />
          
          {/* Admin Routes */}
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="estimates" element={<AdminEstimates />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="invoices/new" element={<InvoiceBuilder />} />
            <Route path="invoices/:id" element={<InvoiceBuilder />} />
            <Route path="invoices/from-estimate/:estimateId" element={<InvoiceBuilder />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
