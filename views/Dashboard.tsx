import React from 'react';
import { base44, Product, PurchaseOrder, StockMovement } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import KPICard from "@/components/dashboard/KPICard";
import ActivityTimeline, { Activity } from "@/components/dashboard/ActivityTimeline";
import QuickActions from "@/components/dashboard/QuickActions";
import InventoryChart from "@/components/dashboard/InventoryChart";
import CategoryDistribution from "@/components/dashboard/CategoryDistribution";
import LowStockAlert from "@/components/dashboard/LowStockAlert";
import { Package, DollarSign, AlertTriangle, Truck, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";

// Safe language hook that works outside provider
function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
  }
}

interface CategoryData {
  name: string;
  value: number;
}



export default function Dashboard() {
  const { t } = useSafeLanguage();

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: purchaseOrders = [], isLoading: loadingPOs } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders'],
    queryFn: () => base44.entities.PurchaseOrder.list(),
    initialData: [],
  });

  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ['recentMovements'],
    queryFn: () => base44.entities.StockMovement.list({ limit: 10 }),
    initialData: [],
  });

  // Calculate KPIs
  const totalSKUs = products.length;
  const totalValue = products.reduce((sum, p) => {
    const pStock = p.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
    const pPrice = p.variants?.[0]?.unit_price || 0;
    return sum + (pPrice * pStock);
  }, 0);
  const lowStockCount = products.filter(p => {
    const pStock = p.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
    return p.status === 'low_stock' || pStock <= (p.reorder_point || 10);
  }).length;
  const incomingPOs = purchaseOrders.filter(po => ['ordered', 'approved', 'pending_approval'].includes(po.status)).length;

  // Format activities for timeline
  const activities: Activity[] = movements.map(m => {
    let type: Activity['type'] = 'alert';
    if (m.type === 'in') type = 'received';
    else if (m.type === 'out') type = 'dispatched';
    else if (m.type === 'transfer') type = 'transferred';

    return {
      id: m.id,
      type,
      title: `${m.type.charAt(0).toUpperCase() + m.type.slice(1)}: ${m.product_name || 'Product'}`,
      description: `${Math.abs(m.quantity)} units ${m.type === 'in' ? 'added' : m.type === 'out' ? 'removed' : 'adjusted'}`,
      timestamp: m.created_at
    };
  });

  // Calculate category distribution
  const categoryData: CategoryData[] = products.reduce((acc: CategoryData[], p) => {
    const cat = p.category || 'Other';
    const pStock = p.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0;
    const pPrice = p.variants?.[0]?.unit_price || 0;
    const value = pPrice * pStock;
    const existing = acc.find(a => a.name === cat);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: cat, value });
    }
    return acc;
  }, []);

  const isLoading = loadingProducts || loadingPOs;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('dashboard')}</h1>
          <p className="text-slate-500 mt-1">{t('welcomeBack')}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('totalSKUs')}
          value={totalSKUs.toLocaleString()}
          icon={Package}
          variant="primary"
          trend="up"
          trendValue={`+12% ${t('fromLastMonth')}`}
        />
        <KPICard
          title={t('stockValue')}
          value={`$${(totalValue / 1000).toFixed(1)}k`}
          icon={DollarSign}
          variant="default"
          trend="up"
          trendValue={`+8.2% ${t('fromLastMonth')}`}
        />
        <KPICard
          title={t('lowStockItems')}
          value={lowStockCount}
          icon={AlertTriangle}
          variant={lowStockCount > 0 ? "warning" : "default"}
          subtitle=""
        />
        <KPICard
          title={t('incomingOrders')}
          value={incomingPOs}
          icon={Truck}
          variant="default"
          subtitle={t('purchaseOrdersPending')}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <InventoryChart />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryDistribution data={categoryData} />
            <LowStockAlert products={products} />
          </div>
        </div>

        {/* Right Column - Activity & Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
          <ActivityTimeline activities={activities} />
        </div>
      </div>
    </div>
  );
}