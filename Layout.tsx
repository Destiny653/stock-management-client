import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Package,
  FileText,
  Truck,
  Bell,
  BarChart3,
  Settings,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Building2,
  Users,
  Search,
  ShoppingCart,
  Store,
  CreditCard,
  MapPin,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { LanguageProvider, useLanguage } from "@/components/i18n/LanguageContext";
import LanguageSelector from "@/components/ui/LanguageSelector";
import Link from 'next/link';

// Super admin / owner navigation - organization management focus (NO inventory, orders, sales, payments)
const superAdminNavigation = [
  { name: "dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "Organizations", href: "Organizations", icon: Building2 },
  { name: "Reports", href: "Reports", icon: BarChart3 },
  { name: "Profile", href: "Profile", icon: User },
  { name: "Settings", href: "Settings", icon: Settings },
];

// Organization admin navigation - can manage vendors but not other orgs
const adminNavigation = [
  { name: "dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "Team", href: "OrganizationMembers", icon: Users },
  { name: "inventory", href: "Inventory", icon: Package },
  { name: "directSales", href: "DirectSales", icon: ShoppingCart },
  { name: "purchaseOrders", href: "PurchaseOrders", icon: FileText },
  { name: "Orders", href: "Orders", icon: Truck },
  { name: "Vendors", href: "VendorManagement", icon: Store },
  { name: "Payments", href: "VendorPayments", icon: CreditCard },
  { name: "Store Map", href: "StoreLocations", icon: MapPin },
  { name: "reports", href: "Reports", icon: BarChart3 },
  { name: "Profile", href: "Profile", icon: User },
  { name: "settings", href: "Settings", icon: Settings },
];

const managerNavigation = [
  { name: "dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "Team", href: "OrganizationMembers", icon: Users },
  { name: "inventory", href: "Inventory", icon: Package },
  { name: "directSales", href: "DirectSales", icon: ShoppingCart },
  { name: "purchaseOrders", href: "PurchaseOrders", icon: FileText },
  { name: "Vendors", href: "VendorManagement", icon: Store },
  { name: "Reports", href: "Reports", icon: BarChart3 },
  { name: "Profile", href: "Profile", icon: User },
  { name: "Settings", href: "Settings", icon: Settings },
];

const staffNavigation = [
  { name: "dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "inventory", href: "Inventory", icon: Package },
  { name: "directSales", href: "DirectSales", icon: ShoppingCart },
  { name: "Profile", href: "Profile", icon: User },
];

// Vendor navigation - limited access, view-only inventory
const vendorNavigation = [
  { name: "My Dashboard", href: "VendorDashboard", icon: LayoutDashboard },
  { name: "directSales", href: "DirectSales", icon: ShoppingCart },
  { name: "inventory", href: "Inventory", icon: Package },
  { name: "Profile", href: "Profile", icon: User },
];

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function NavLink({ item, currentPage, mobile = false, collapsed = false }: { item: NavItem; currentPage: string; mobile?: boolean; collapsed?: boolean }) {
  const { t } = useLanguage();
  const isActive = currentPage === item.href;
  const Icon = item.icon;
  const translatedName = t(item.name as any);

  const linkContent = (
    <Link
      href={item.href === 'OrganizationMembers' ? `${createPageUrl(item.href)}?id=${base44.auth.getOrganizationId()}` : createPageUrl(item.href)}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        mobile
          ? isActive
            ? "bg-emerald-50 text-emerald-700"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          : isActive
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn(
        "h-5 w-5 flex-shrink-0 transition-colors",
        mobile
          ? isActive ? "text-emerald-600" : "text-slate-400"
          : isActive ? "text-emerald-400" : "text-slate-500"
      )} />
      {!collapsed && (
        <span className="truncate">{translatedName}</span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {translatedName}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

interface LayoutProps {
  children: React.ReactNode;
  currentPageName: string;
}

function LayoutContent({ children, currentPageName }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const { user, logout } = useAuth();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.filter({ is_read: false }),
    initialData: [],
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  // Determine user role and type for navigation
  // role: 'admin' = super admin (full access), 'user' = regular
  // user_type: 'admin' = org admin, 'manager', 'vendor', 'staff'
  const isSuperAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isOrgAdmin = user?.user_type === 'admin';
  const isManager = user?.user_type === 'manager' || user?.role === 'manager';
  const isVendor = user?.user_type === 'vendor';
  const isStaff = user?.user_type === 'staff' || user?.role === 'staff';

  let navigation;
  if (isSuperAdmin) {
    navigation = superAdminNavigation;
  } else if (isOrgAdmin) {
    navigation = adminNavigation;
  } else if (isManager) {
    navigation = managerNavigation;
  } else if (isVendor) {
    navigation = vendorNavigation;
  } else if (isStaff) {
    navigation = staffNavigation;
  } else {
    // Default to minimum safe navigation
    navigation = staffNavigation;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header - Dark theme */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#004030] border-b border-emerald-900/50 z-40">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left - Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-300 hover:text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-white">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h1 className="font-bold text-slate-900">StockFlow</h1>
                      <p className="text-xs text-slate-500">Inventory Management</p>
                    </div>
                  </div>
                </div>
                <nav className="p-4 space-y-1">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      item={item}
                      currentPage={currentPageName}
                      mobile
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <Link href={createPageUrl("Dashboard")} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-white text-lg tracking-tight">StockFlow</h1>
              </div>
            </Link>
          </div>

          {/* Center - Search (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search products, orders, suppliers..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-800/50 border border-emerald-800/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <LanguageSelector />

            <Link href={createPageUrl("Alerts")}>
              <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2 text-slate-300 hover:text-white hover:bg-white/10">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-medium shadow-lg shadow-emerald-500/25">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.full_name || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={createPageUrl("Profile")} className="flex items-center">
                    <User className="h-4 w-4 mr-2" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={createPageUrl("Settings")} className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-600"
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar - Dark theme */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-16 bottom-0 bg-[#004030] border-r border-emerald-900/50 flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[72px]" : "w-64"
      )}>
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-emerald-800/50 bg-[#004030] shadow-sm hover:bg-slate-800 z-10"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3 text-slate-400" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-slate-400" />
          )}
        </Button>

        <TooltipProvider>
          <nav className={cn(
            "flex-1 space-y-1 overflow-y-auto sidebar-scrollbar transition-all duration-300",
            sidebarCollapsed ? "p-2" : "p-4"
          )}>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                item={item}
                currentPage={currentPageName}
                collapsed={sidebarCollapsed}
              />
            ))}
          </nav>
        </TooltipProvider>

        {!sidebarCollapsed && (
          <div className="p-4 border-t border-emerald-900/50">
            <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white shadow-lg shadow-emerald-500/20">
              <p className="font-semibold text-sm">Need Help?</p>
              <p className="text-xs text-emerald-100 mt-1">Check our documentation or contact support.</p>
              <Button size="sm" variant="secondary" className="mt-3 w-full bg-white text-emerald-700 hover:bg-emerald-50">
                View Docs
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={cn(
        "pt-16 min-h-screen transition-all duration-300 ease-in-out bg-slate-50",
        sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64"
      )}>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Layout({ children, currentPageName }: LayoutProps) {
  return (
    <LanguageProvider>
      <LayoutContent currentPageName={currentPageName}>
        {children}
      </LayoutContent>
    </LanguageProvider>
  );
}