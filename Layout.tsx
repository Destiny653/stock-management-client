import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
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

// Super admin / general admin navigation - full access
const superAdminNavigation = [
  { name: "dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "inventory", href: "Inventory", icon: Package },
  { name: "directSales", href: "DirectSales", icon: ShoppingCart },
  { name: "purchaseOrders", href: "PurchaseOrders", icon: FileText },
  { name: "Organizations", href: "Organizations", icon: Building2 },
  { name: "Vendors", href: "VendorManagement", icon: Store },
  { name: "Payments", href: "VendorPayments", icon: CreditCard },
  { name: "Store Map", href: "StoreLocations", icon: MapPin },
  { name: "reports", href: "Reports", icon: BarChart3 },
  { name: "Profile", href: "Profile", icon: User },
  { name: "settings", href: "Settings", icon: Settings },
];

// Organization admin navigation - can manage vendors but not other orgs
const adminNavigation = [
  { name: "dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "inventory", href: "Inventory", icon: Package },
  { name: "directSales", href: "DirectSales", icon: ShoppingCart },
  { name: "purchaseOrders", href: "PurchaseOrders", icon: FileText },
  { name: "Vendors", href: "VendorManagement", icon: Store },
  { name: "Payments", href: "VendorPayments", icon: CreditCard },
  { name: "Store Map", href: "StoreLocations", icon: MapPin },
  { name: "reports", href: "Reports", icon: BarChart3 },
  { name: "Profile", href: "Profile", icon: User },
  { name: "settings", href: "Settings", icon: Settings },
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
      href={createPageUrl(item.href)}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-teal-50 text-teal-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        mobile && "text-base py-3",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-teal-600" : "text-slate-400")} />
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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.filter({ is_read: false }),
    initialData: [],
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  // Determine user role and type for navigation
  // role: 'admin' = super admin (full access), 'user' = regular
  // user_type: 'admin' = org admin, 'manager', 'vendor', 'staff'
  const isSuperAdmin = user?.role === 'admin';
  const isOrgAdmin = user?.user_type === 'admin';
  const isVendor = user?.user_type === 'vendor';

  let navigation;
  if (isSuperAdmin) {
    navigation = superAdminNavigation;
  } else if (isOrgAdmin) {
    navigation = adminNavigation;
  } else if (isVendor) {
    navigation = vendorNavigation;
  } else {
    // Default to vendor navigation for staff/other
    navigation = vendorNavigation;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left - Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
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
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-slate-900 text-lg tracking-tight">StockFlow</h1>
              </div>
            </Link>
          </div>

          {/* Center - Search (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products, orders, suppliers..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <LanguageSelector />

            <Link href={createPageUrl("Alerts")}>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-sm font-medium">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700">
                    {user?.full_name || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
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
                  onClick={() => base44.auth.logout()}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex fixed left-0 top-16 bottom-0 bg-white border-r border-slate-200 flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[72px]" : "w-64"
      )}>
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-100 z-10"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3 text-slate-600" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-slate-600" />
          )}
        </Button>

        <TooltipProvider>
          <nav className={cn(
            "flex-1 space-y-1 overflow-y-auto transition-all duration-300",
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
          <div className="p-4 border-t border-slate-200">
            <div className="rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 p-4 text-white">
              <p className="font-semibold text-sm">Need Help?</p>
              <p className="text-xs text-teal-100 mt-1">Check our documentation or contact support.</p>
              <Button size="sm" variant="secondary" className="mt-3 w-full bg-white text-teal-700 hover:bg-teal-50">
                View Docs
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className={cn(
        "pt-16 min-h-screen transition-all duration-300 ease-in-out",
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