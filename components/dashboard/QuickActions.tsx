import React from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import {
  Plus,
  FileText,
  Truck,
  BarChart3,
  Package,
  ArrowRight,
  UserPlus,
  ShoppingBag
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function QuickActions() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const orgId = user?.organization_id || base44.auth.getOrganizationId();

  const allActions = [
    {
      label: "Add Product",
      description: "Create a new inventory item",
      icon: Plus,
      href: "ProductDetail?mode=new",
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      roles: ['owner', 'admin', 'manager']
    },
    {
      label: "POS / New Sale",
      description: "Record a new sale",
      icon: ShoppingBag,
      href: "DirectSales",
      color: "bg-primary hover:bg-primary/90 text-primary-foreground",
      roles: ['staff', 'manager', 'vendor']
    },
    {
      label: "Manage Team",
      description: "Manage organization members",
      icon: UserPlus,
      href: `OrganizationMembers?orgId=${orgId}`,
      color: "bg-blue-600 hover:bg-blue-700 text-white",
      roles: ['owner', 'admin', 'manager'],
      requireOrg: true
    },
    {
      label: "Create PO",
      description: "Start a new purchase order",
      icon: FileText,
      href: "CreatePurchaseOrder",
      color: "bg-slate-900 hover:bg-slate-800 text-white",
      roles: ['owner', 'admin', 'manager']
    },
    {
      label: "Receive Shipment",
      description: "Log incoming inventory",
      icon: Truck,
      href: "PurchaseOrders?filter=ordered",
      color: "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200",
      roles: ['owner', 'admin', 'manager', 'staff']
    },
    {
      label: "View Reports",
      description: "Analytics and insights",
      icon: BarChart3,
      href: "Reports",
      color: "bg-white hover:bg-slate-50 text-slate-900 border border-slate-200",
      roles: ['owner', 'admin', 'manager']
    }
  ];

  const filteredActions = allActions.filter(action => {
    if (action.requireOrg && !orgId) return false;
    if (action.roles && user && !action.roles.includes(user.role)) return false;
    return true;
  }).slice(0, 4);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3">
        {filteredActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={createPageUrl(action.href)}
              className="block"
            >
              <button className={`
                w-full flex items-center gap-3 rounded-xl p-4 transition-all duration-200
                ${action.color}
                group
              `}>
                <div className="shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-sm">{action.label}</p>
                  <p className="text-xs opacity-70 truncate">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}