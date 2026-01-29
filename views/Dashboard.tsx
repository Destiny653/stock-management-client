import React, { useMemo } from 'react';
import { base44, Product, PurchaseOrder, StockMovement, Sale } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ActivityTimeline, { Activity } from "@/components/dashboard/ActivityTimeline";
import QuickActions from "@/components/dashboard/QuickActions";
import InventoryChart from "@/components/dashboard/InventoryChart";
import CategoryDistribution from "@/components/dashboard/CategoryDistribution";
import LowStockAlert from "@/components/dashboard/LowStockAlert";
import { Package, DollarSign, AlertTriangle, Truck, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import OwnerDashboard from "./OwnerDashboard";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";

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
  const { user } = useAuth();

  // Check if user is SuperAdmin/Owner - they see the organization-focused dashboard
  const isSuperAdmin = user?.role === 'admin' || user?.role === 'owner';

  // If SuperAdmin/Owner, render the OwnerDashboard instead
  if (isSuperAdmin) {
    return <OwnerDashboard />;
  }

  // For regular org users, show the inventory dashboard
  return <OrgDashboard />;
}

// Organization-level dashboard (inventory focused)
function OrgDashboard() {
  const { t } = useSafeLanguage();

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: purchaseOrders = [], isLoading: loadingPOs } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders'],
    queryFn: () => base44.entities.PurchaseOrder.list(),
  });

  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ['recentMovements'],
    queryFn: () => base44.entities.StockMovement.list({ limit: 1000 }),
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  // Calculate KPIs
  const totalSKUs = products.length;
  const totalValue = products.reduce((sum, p) => {
    const pValue = p.variants?.reduce((s, v) => s + ((v.stock || 0) * (v.unit_price || 0)), 0) || 0;
    return sum + pValue;
  }, 0);

  const lowStockCount = products.filter(p => {
    // Check if any variant is low stock or the product status is low_stock
    const isAnyVariantLow = p.variants?.some(v => v.stock <= (p.reorder_point || 10));
    return p.status === 'low_stock' || isAnyVariantLow;
  }).length;

  const incomingPOs = purchaseOrders.filter(po => ['ordered', 'approved', 'pending_approval'].includes(po.status)).length;

  const thisMonthRevenue = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return sales
      .filter(s => new Date(s.created_at) >= startOfMonth && s.status !== 'cancelled')
      .reduce((sum, s) => sum + (s.total || 0), 0);
  }, [sales]);

  // Format activities for timeline
  const activities: Activity[] = movements.map(m => {
    let type: Activity['type'] = 'alert';
    const mType = m.type.toLowerCase();

    if (mType === 'in' || mType === 'received') type = 'received';
    else if (mType === 'out' || mType === 'dispatched') type = 'dispatched';
    else if (mType === 'transfer' || mType === 'transferred') type = 'transferred';

    return {
      id: m.id,
      type,
      title: `${mType.charAt(0).toUpperCase() + mType.slice(1)}: ${m.product_name || 'Product'}`,
      description: `${Math.abs(m.quantity)} units ${['in', 'received'].includes(mType) ? 'added' : ['out', 'dispatched'].includes(mType) ? 'removed' : 'adjusted'}`,
      timestamp: m.created_at
    };
  });

  // Calculate category distribution
  const categoryData: CategoryData[] = products.reduce((acc: CategoryData[], p) => {
    const cat = p.category || 'Other';
    const pValue = p.variants?.reduce((s, v) => s + ((v.stock || 0) * (v.unit_price || 0)), 0) || 0;

    const existing = acc.find(a => a.name === cat);
    if (existing) {
      existing.value += pValue;
    } else {
      acc.push({ name: cat, value: pValue });
    }
    return acc;
  }, []);

  // Calculate Inventory Trend (last 7 days)
  const chartData = React.useMemo(() => {
    const days = 7;
    const data: any[] = [];
    const now = new Date();

    // Sort movements by date
    const sortedMovements = [...movements].sort((a, b) =>
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    );

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toDateString();
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      // Start with current stock and value
      let totalStockAtDate = products.reduce((sum, p) =>
        sum + (p.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0), 0
      );
      let totalValueAtDate = totalValue;

      // Work backwards from NOW to the end of this date
      for (const m of sortedMovements) {
        const mDate = new Date(m.created_at || '');
        if (mDate > date) {
          // If the movement happened AFTER the target date, reverse it to see stock BEFORE it
          const product = products.find(p => p.id === m.product_id);
          const price = product?.variants?.find(v => v.sku === m.sku)?.unit_price ||
            product?.variants?.[0]?.unit_price || 0;

          totalStockAtDate -= m.quantity;
          totalValueAtDate -= (m.quantity * price);
        } else {
          // Since movements are sorted descending, if we hit a movement BEFORE the date, 
          // all subsequent movements are also before it.
          break;
        }
      }

      data.push({
        name: label,
        value: Math.max(0, totalValueAtDate),
        units: Math.max(0, totalStockAtDate),
      });
    }
    return data;
  }, [products, movements, totalValue]);

  // Calculate trends
  const calculateTrend = (current: number, daysBack: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysBack);

    let previousValue = current;
    // Work backwards through movements to find value before targetDate
    for (const m of movements) {
      const mDate = new Date(m.created_at || '');
      if (mDate > targetDate) {
        const product = products.find(p => p.id === m.product_id);
        const price = product?.variants?.find(v => v.sku === m.sku)?.unit_price ||
          product?.variants?.[0]?.unit_price || 0;
        previousValue -= m.quantity;
      }
    }

    if (previousValue <= 0) return { trend: "up" as const, value: "100%" };
    const diff = ((current - previousValue) / previousValue) * 100;
    return {
      trend: diff >= 0 ? "up" as const : "down" as const,
      value: `${Math.abs(diff).toFixed(1)}%`
    };
  };

  const skuTrend = calculateTrend(totalSKUs, 30); // Actually movements don't create SKUs usually, but we'll use it for demo
  const valueTrend = calculateTrend(totalValue, 30);

  const revenueTrend = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const currentMonthRevenue = sales
      .filter(s => new Date(s.created_at) >= startOfCurrentMonth && s.status !== 'cancelled')
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const lastMonthRevenue = sales
      .filter(s => {
        const d = new Date(s.created_at);
        return d >= startOfLastMonth && d < startOfCurrentMonth && s.status !== 'cancelled';
      })
      .reduce((sum, s) => sum + (s.total || 0), 0);

    if (lastMonthRevenue === 0) return { trend: "up" as const, value: "100%" };
    const diff = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    return {
      trend: diff >= 0 ? "up" as const : "down" as const,
      value: `${Math.abs(diff).toFixed(1)}%`
    };
  }, [sales]);

  const isLoading = loadingProducts || loadingPOs || loadingSales;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard')}
        subtitle={t('welcomeBack')}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('thisMonthRevenue')}
          value={`$${thisMonthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          variant="primary"
          trend={revenueTrend.trend}
          trendValue={`${revenueTrend.value} ${t('fromLastMonth')}`}
        />
        <StatsCard
          title={t('stockValue')}
          value={totalValue > 1000 ? `$${(totalValue / 1000).toFixed(1)}k` : `$${totalValue.toFixed(2)}`}
          icon={Package}
          subtitle={t('totalInventoryValue')}
        />
        <StatsCard
          title={t('lowStockItems')}
          value={lowStockCount}
          icon={AlertTriangle}
          variant={lowStockCount > 0 ? "warning" : "default"}
          subtitle={t('itemsNeedingRestock')}
        />
        <StatsCard
          title={t('incomingOrders')}
          value={incomingPOs}
          icon={Truck}
          subtitle={t('purchaseOrdersPending')}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          <InventoryChart data={chartData} />

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