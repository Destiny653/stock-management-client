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
  const lowStockVariants = products.flatMap(p =>
    (p.variants || []).filter(v =>
      (v.stock <= (p.reorder_point || 10))
    ).map(v => ({
      ...v,
      productName: p.name,
      productId: p.id,
      reorderPoint: p.reorder_point || 10
    }))
  ).sort((a, b) => a.stock - b.stock).slice(0, 5);

  if (lowStockVariants.length === 0) {
    return (
      <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 tracking-tight">Low Stock Alerts</h3>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-slate-600">Inventory Levels are Healthy</p>
          <p className="text-xs text-slate-400 mt-1">All variants are above reorder points</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 rounded-md">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Low Stock Alerts</h3>
        </div>
        <Link href={createPageUrl("Inventory?filter=low_stock")}>
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs uppercase tracking-wider transition-all">
            Manage <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {lowStockVariants.map((item) => {
          const percentRemaining = (item.stock / (item.reorderPoint || 10)) * 100;
          const isOutOfStock = item.stock === 0;

          return (
            <Link
              key={`${item.productId}-${item.sku}`}
              href={createPageUrl(`ProductDetail?id=${item.productId}`)}
              className="block group"
            >
              <div className="flex items-center gap-4 p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                <div className={cn(
                  "h-11 w-11 rounded-md flex items-center justify-center text-sm font-black shadow-sm",
                  isOutOfStock ? "bg-rose-100 text-rose-600 ring-4 ring-rose-50" : "bg-amber-100 text-amber-600 ring-4 ring-amber-50"
                )}>
                  {item.stock}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.productName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{item.sku}</span>
                    <div className="flex items-center gap-1">
                      {Object.entries(item.attributes || {}).map(([k, v]: [string, any]) => (
                        <span key={k} className="text-[9px] text-slate-400 font-medium uppercase">{v}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-xs font-black uppercase tracking-wider",
                    isOutOfStock ? "text-rose-600" : "text-amber-600"
                  )}>
                    {isOutOfStock ? "EMPTY" : `${percentRemaining.toFixed(0)}%`}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Limit: {item.reorderPoint}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}