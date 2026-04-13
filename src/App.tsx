import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SmsTerms from "./pages/SmsTerms";
import OptIn from "./pages/OptIn";
import PickleballCourts from "./pages/PickleballCourts";
import TennisCourts from "./pages/TennisCourts";
import CourtResurfacing from "./pages/CourtResurfacing";
import BasketballCourts from "./pages/BasketballCourts";
import MultiSportCourts from "./pages/MultiSportCourts";
import FAQPage from "./pages/FAQPage";
import SalesEstimator from "./pages/SalesEstimator";
import Pay from "./pages/Pay";
import PaySuccess from "./pages/PaySuccess";
import AdminAuth from "./pages/admin/Auth";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminLeads from "./pages/admin/Leads";
import AdminCustomers from "./pages/admin/Customers";
import AdminEstimates from "./pages/admin/Estimates";
import AdminInvoices from "./pages/admin/Invoices";
import AdminPayments from "./pages/admin/Payments";
import InvoiceBuilder from "./pages/admin/InvoiceBuilder";
import EstimateBuilder from "./pages/admin/EstimateBuilder";
import EstimateDetailView from "./pages/admin/EstimateDetailView";
import AdminProjects from "./pages/admin/Projects";
import ProjectDetail from "./pages/admin/ProjectDetail";
import AdminTeam from "./pages/admin/Team";
import PricingConfig from "./pages/admin/PricingConfig";
import Inventory from "./pages/admin/Inventory";
import MaterialCalculator from "./pages/admin/MaterialCalculator";
import ContractorPortal from "./pages/admin/ContractorPortal";
import ContractorJobDetail from "./pages/admin/ContractorJobDetail";
import BidDocuments from "./pages/admin/BidDocuments";

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
          <Route path="/sms-terms" element={<SmsTerms />} />
          <Route path="/optin" element={<OptIn />} />
          <Route path="/pickleball-courts" element={<PickleballCourts />} />
          <Route path="/tennis-courts" element={<TennisCourts />} />
          <Route path="/court-resurfacing" element={<CourtResurfacing />} />
          <Route path="/basketball-courts" element={<BasketballCourts />} />
          <Route path="/multi-sport-courts" element={<MultiSportCourts />} />
          
          {/* Sales Estimator - Public field tool */}
          <Route path="/estimator" element={<SalesEstimator />} />
          
          {/* Payment Portal - Public routes for customer payments */}
          <Route path="/pay/:token" element={<Pay />} />
          <Route path="/pay/:token/success" element={<PaySuccess />} />
          
          {/* Admin Routes */}
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="estimates" element={<AdminEstimates />} />
            <Route path="estimates/new" element={<EstimateBuilder />} />
            <Route path="estimates/:id" element={<EstimateDetailView />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="invoices/new" element={<InvoiceBuilder />} />
            <Route path="invoices/:id" element={<InvoiceBuilder />} />
            <Route path="invoices/from-estimate/:estimateId" element={<InvoiceBuilder />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="pricing" element={<PricingConfig />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="calculator" element={<MaterialCalculator />} />
            <Route path="portal" element={<ContractorPortal />} />
            <Route path="portal" element={<ContractorPortal />} />
            <Route path="portal/:id" element={<ContractorJobDetail />} />
            <Route path="bid-documents" element={<BidDocuments />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
