import { Product } from "@/api/base44Client";
import React from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { AlertTriangle, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LowStockAlertProps {
  products?: Product[];
}

const getProductStock = (p: Product) => p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;

export default function LowStockAlert({ products = [] }: LowStockAlertProps) {
  const lowStockItems = products.filter(p =>
    p.status === 'low_stock' || getProductStock(p) <= (p.reorder_point || 10)
  ).slice(0, 5);

  if (lowStockItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Low Stock Alerts</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <Package className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-sm text-slate-600">All stock levels are healthy</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-900">Low Stock Alerts</h3>
        </div>
        <Link href={createPageUrl("Inventory?filter=low_stock")}>
          <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">
            View all <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {lowStockItems.map((item) => {
          const itemStock = getProductStock(item);
          const percentRemaining = ((itemStock / (item.reorder_point || 10)) * 100);
          const isOutOfStock = itemStock === 0;

          return (
            <Link
              key={item.id}
              href={createPageUrl(`ProductDetail?id=${item.id}`)}
              className="block"
            >
              <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold",
                  isOutOfStock ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                )}>
                  {itemStock}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">SKU: {item.variants?.[0]?.sku || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-xs font-medium",
                    isOutOfStock ? "text-rose-600" : "text-amber-600"
                  )}>
                    {isOutOfStock ? "Out of Stock" : `${percentRemaining.toFixed(0)}% remaining`}
                  </p>
                  <p className="text-xs text-slate-400">Reorder: {item.reorder_point || 10}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}