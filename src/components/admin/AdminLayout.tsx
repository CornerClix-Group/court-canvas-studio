import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { AlertTriangle } from "lucide-react";
import { ChangePasswordDialog } from "@/components/admin/ChangePasswordDialog";
import { ForcePasswordChangeDialog } from "@/components/admin/ForcePasswordChangeDialog";
import { ActivityLogger } from "@/lib/activityLogger";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  CreditCard,
  LogOut,
  Menu,
  X,
  UserCircle,
  ChevronRight,
  FolderKanban,
  Shield,
  Key,
  DollarSign,
  HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const fullNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/leads", label: "Leads", icon: UserCircle },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/estimates", label: "Estimates", icon: FileText },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/team", label: "Team", icon: Shield },
  { href: "/admin/pricing", label: "Pricing", icon: DollarSign },
];

const salesNavItems: NavItem[] = [
  { href: "/admin/leads", label: "Leads", icon: UserCircle },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/estimates", label: "Estimates", icon: FileText },
];

const accountingNavItems: NavItem[] = [
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export default function AdminLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { roles, loading: rolesLoading, isAdminOrAbove, isContractor, isAccounting, hasRole } = useUserRole();

  // Build navigation items based on role
  const getNavItems = (): NavItem[] => {
    // Admin/staff/owner get full navigation
    if (isAdminOrAbove) {
      return fullNavItems;
    }

    const items: NavItem[] = [];

    // Contractors (crew_lead or project_manager) get My Jobs
    if (isContractor) {
      items.push({ href: "/admin/portal", label: "My Jobs", icon: HardHat, exact: true });
    }

    // Project managers also see all projects (read-only)
    if (hasRole("project_manager")) {
      items.push({ href: "/admin/projects", label: "All Projects", icon: FolderKanban });
    }

    // Sales role
    if (hasRole("sales")) {
      items.push(...salesNavItems);
    }

    // Accounting role
    if (isAccounting) {
      items.push(...accountingNavItems);
    }

    return items;
  };

  const navItems = getNavItems();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session) {
        navigate("/admin/auth");
      } else if (session.user?.user_metadata?.requires_password_change) {
        setForcePasswordChange(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (!session) {
        navigate("/admin/auth");
      } else if (session.user?.user_metadata?.requires_password_change) {
        setForcePasswordChange(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await ActivityLogger.logout();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    } else {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/admin/auth");
    }
  };

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has any admin/staff role or specialized role
  const hasAnyRole = isAdminOrAbove || isContractor || hasRole("sales") || isAccounting;
  
  if (!hasAnyRole && roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            Your account does not have permission to access the admin dashboard. 
            Please contact an administrator to request access.
          </p>
          <div className="space-y-2">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
            <Button onClick={() => navigate("/")} variant="ghost" className="w-full">
              Return to Website
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isActiveRoute = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CP</span>
              </div>
              <span className="font-bold text-lg">CourtPro Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-muted rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.full_name || "Admin User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setChangePasswordOpen(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="h-16 flex items-center justify-between px-4 bg-card border-b border-border lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold">CourtPro Admin</span>
          <div className="w-9" /> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />

      {/* Force Password Change Dialog (cannot be dismissed) */}
      <ForcePasswordChangeDialog
        open={forcePasswordChange}
        onSuccess={() => setForcePasswordChange(false)}
      />
    </div>
  );
}
