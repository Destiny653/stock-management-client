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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
];

const managerNavigation = [
  { name: "dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "Team", href: "OrganizationMembers", icon: Users },
  { name: "inventory", href: "Inventory", icon: Package },
  { name: "directSales", href: "DirectSales", icon: ShoppingCart },
  { name: "purchaseOrders", href: "PurchaseOrders", icon: FileText },
  { name: "Vendors", href: "VendorManagement", icon: Store },
  { name: "Reports", href: "Reports", icon: BarChart3 },
];

const staffNavigation = [
  { name: "dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "inventory", href: "Inventory", icon: Package },
  { name: "directSales", href: "DirectSales", icon: ShoppingCart },
];

// Vendor navigation - limited access, view-only inventory
const vendorNavigation = [
  { name: "My Dashboard", href: "VendorDashboard", icon: LayoutDashboard },
  { name: "directSales", href: "DirectSales", icon: ShoppingCart },
  { name: "inventory", href: "Inventory", icon: Package },
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
        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
        mobile
          ? isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
          : isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground font-bold -primary/20"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn(
        "h-5 w-5 shrink-0 transition-colors",
        mobile
          ? isActive ? "text-primary" : "text-muted-foreground"
          : isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70"
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
  const { t } = useLanguage();

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.filter({ is_read: false }),
    initialData: [],
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  // Determine user access level based on role and user_type
  // user_type determines SCOPE: 
  //   - 'platform-staff' = manages the platform, can see ALL organizations
  //   - 'business-staff' = manages their own organization only
  // role determines PERMISSIONS within that scope:
  //   - 'admin' = full admin permissions
  //   - 'manager' = management permissions
  //   - 'vendor' = vendor/sales permissions
  //   - 'user' = basic user permissions

  const isPlatformStaff = user?.user_type === 'platform-staff';
  const isBusinessStaff = user?.user_type === 'business-staff';

  // Platform staff with admin role = super admin (full platform access)
  const isSuperAdmin = isPlatformStaff && user?.role === 'admin';
  // Platform staff with other roles = can still see all orgs but limited permissions
  const isPlatformManager = isPlatformStaff && user?.role === 'manager';

  // Business staff roles - within their own organization only
  const isOrgAdmin = isBusinessStaff && user?.role === 'admin';
  const isManager = isBusinessStaff && user?.role === 'manager';
  const isVendor = user?.role === 'vendor';
  const isRegularUser = user?.role === 'user';

  let navigation;
  if (isSuperAdmin || isPlatformManager) {
    // Platform staff can see all organizations
    navigation = superAdminNavigation;
  } else if (isOrgAdmin) {
    // Business admin - full access to their own organization
    navigation = adminNavigation;
  } else if (isManager) {
    // Business manager - management access in their organization
    navigation = managerNavigation;
  } else if (isVendor) {
    navigation = vendorNavigation;
  } else {
    // Regular users and default
    navigation = staffNavigation;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Glow - Reflects the theme under the transparent header */}
      <div className="fixed top-0 left-0 right-0 h-96 bg-linear-to-b from-primary/10 via-primary/5 to-transparent pointer-events-none z-0" />
      <div className="fixed -top-24 -left-24 h-96 w-96 bg-primary/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/60 backdrop-blur-xl border-b border-primary/10 z-40 shadow-sm">
        <div className="flex items-center h-full">
          {/* Left Section - Logo area with sidebar width */}
          <div className={cn(
            "hidden md:flex items-center justify-between h-full border-r border-primary/10 px-6 transition-all duration-300 ease-in-out bg-background/40 backdrop-blur-sm",
            sidebarCollapsed ? "w-[72px] px-4" : "w-64"
          )}>
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <h1 className="font-black text-foreground text-lg tracking-tighter leading-none">STOCKFLOW</h1>
                  <span className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">Inventory</span>
                </div>
              )}
            </Link>
          </div>

          {/* Mobile Logo & Menu */}
          <div className="flex md:hidden items-center gap-3 px-4">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground/70 hover:bg-muted">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] max-w-72 p-0 bg-background flex flex-col">
                <div className="p-6 border-b border-border">
                  <Link href="/" className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="font-bold text-foreground">StockFlow</h1>
                      <p className="text-xs text-muted-foreground">Inventory Management</p>
                    </div>
                  </Link>
                </div>
                <nav className="p-4 flex-1 flex flex-col gap-1 overflow-y-auto">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      item={item}
                      currentPage={currentPageName}
                      mobile
                    />
                  ))}
                </nav>
                <div className="p-4 border-t border-border mt-auto bg-muted/20">
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3 px-2">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                        {user?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{user?.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Button variant="outline" size="sm" asChild className="justify-start h-9 text-xs bg-white">
                        <Link href={createPageUrl("Profile")} onClick={() => setMobileMenuOpen(false)}>
                          <User className="h-3.5 w-3.5 mr-2" /> Profile
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="justify-start h-9 text-xs bg-white">
                        <Link href={createPageUrl("Settings")} onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="h-3.5 w-3.5 mr-2" /> Settings
                        </Link>
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10 text-sm font-bold text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      onClick={() => setShowLogoutConfirm(true)}
                    >
                      <LogOut className="h-4 w-4 mr-3 text-rose-500" /> Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                <Package className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="font-black text-foreground text-base tracking-tighter">STOCKFLOW</h1>
            </Link>
          </div>

          {/* Center - Search (Desktop) */}
          <div className="hidden md:flex gap-4 flex-1 max-w-xl mx-8 relative z-10">
            {/* Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-10 w-10 text-primary/70 hover:text-primary hover:bg-primary/10 transition-all duration-200 rounded-lg"
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-foreground placeholder:text-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 focus:bg-background transition-all"
              />
            </div>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3 ml-auto px-4 lg:px-8 relative z-10">
            <LanguageSelector />

            <Link href={createPageUrl("Alerts")}>
              <Button variant="ghost" size="icon" className="relative text-primary/70 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background ring-offset-0 animate-pulse" />
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-1.5 sm:px-2 text-foreground hover:bg-primary/5 transition-all duration-200 rounded-xl border border-transparent border-hover:border-primary/10 shadow-sm hover:shadow-md">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black shrink-0 border border-primary/20">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden lg:flex flex-col items-start leading-none text-left">
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary/70 mb-0.5">Account</span>
                    <span className="text-sm font-bold truncate max-w-[100px]">
                      {user?.full_name?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-primary/40 hidden sm:block ml-1 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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
                  className="text-primary"
                  onClick={() => setShowLogoutConfirm(true)}
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
        "hidden md:flex fixed left-0 top-16 bottom-0 bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[72px]" : "w-64"
      )}>
        <TooltipProvider>
          <nav className={cn(
            "flex-1 flex flex-col gap-1 overflow-y-auto sidebar-scrollbar transition-all duration-300",
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

        <div className="mt-auto border-t border-sidebar-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-14 flex items-center gap-3 px-2 text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all",
                  sidebarCollapsed ? "justify-center" : "justify-start"
                )}
              >
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0 shadow-sm border border-primary/20">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                {!sidebarCollapsed && (
                  <div className="flex flex-1 flex-col items-start min-w-0">
                    <span className="text-sm font-bold truncate w-full text-sidebar-foreground">
                      {user?.full_name || 'User Account'}
                    </span>
                    <span className="text-[10px] text-sidebar-foreground/50 truncate w-full">
                      {user?.email}
                    </span>
                  </div>
                )}
                {!sidebarCollapsed && <ChevronDown className="h-4 w-4 text-sidebar-foreground/40" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-64 bg-white p-2 shadow-2xl border-sidebar-border/50 animate-in slide-in-from-left-2 duration-200">
              <div className="px-3 py-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0 shadow-inner">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate leading-none mb-1.5 uppercase tracking-tight">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 truncate font-medium">{user?.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge variant="outline" className="text-[9px] font-black h-4 px-1 bg-primary/5 text-primary border-primary/10 uppercase tracking-tighter">
                      {user?.role || 'User'}
                    </Badge>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <div className="grid grid-cols-2 gap-1 p-1">
                <DropdownMenuItem asChild className="p-0">
                  <Link
                    href={createPageUrl("Profile")}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-md hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/10"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <User className="h-4.5 w-4.5 text-slate-500 group-hover:text-primary" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest">Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link
                    href={createPageUrl("Settings")}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-md hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/10"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Settings className="h-4.5 w-4.5 text-slate-500 group-hover:text-primary" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest">Settings</span>
                  </Link>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem
                className="flex items-center gap-3 p-3 rounded-md text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer group m-1"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <div className="h-8 w-8 rounded-full bg-rose-100/50 flex items-center justify-center text-rose-500 group-hover:bg-rose-100">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "pt-16 min-h-screen transition-all duration-300 ease-in-out bg-muted/30",
        sidebarCollapsed ? "md:pl-[72px]" : "md:pl-64"
      )}>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out of StockFlow? You will need to log in again to access your account."
        onConfirm={() => {
          logout();
          router.push('/login');
          setShowLogoutConfirm(false);
        }}
        confirmText="Sign Out"
        cancelText="Stay logged in"
        variant="destructive"
      />
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