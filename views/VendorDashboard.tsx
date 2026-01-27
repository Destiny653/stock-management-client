import React, { useMemo } from 'react';
import { createPageUrl } from "@/utils";
import { base44, Vendor, Sale, VendorPayment } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Calendar,
  CreditCard,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  Store
} from "lucide-react";
import { format, subDays, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from "@/lib/utils";
import Link from 'next/link';

export default function VendorDashboard() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ['vendors', user?.organization_id],
    queryFn: () => base44.entities.Vendor.list({ organization_id: user?.organization_id }),
  });

  const { data: sales = [] } = useQuery<Sale[]>({
    queryKey: ['sales', user?.organization_id],
    queryFn: () => base44.entities.Sale.list({ organization_id: user?.organization_id, sort: '-created_at' }),
  });

  const { data: payments = [] } = useQuery<VendorPayment[]>({
    queryKey: ['payments', user?.organization_id],
    queryFn: () => base44.entities.VendorPayment.list({ organization_id: user?.organization_id }),
  });

  // Find vendor for current user
  const myVendor = (vendors as Vendor[]).find(v => v.user_id === user?.id);

  // Filter sales for this vendor
  const mySales = useMemo(() => {
    if (!myVendor) return [];
    return (sales as Sale[]).filter(s => s.vendor_id === myVendor.id);
  }, [sales, myVendor]);

  // Fetch location for myVendor
  const { data: myLocation } = useQuery({
    queryKey: ['location', myVendor?.location_id],
    queryFn: () => base44.entities.Location.get(myVendor!.location_id!),
    enabled: !!myVendor?.location_id,
  });

  // My payments
  const myPayments = useMemo(() => {
    if (!myVendor) return [];
    return (payments as VendorPayment[]).filter(p => p.vendor_id === myVendor.id);
  }, [payments, myVendor]);

  // Calculate sales stats
  const salesStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dailySales = mySales.filter(s => new Date(s.created_at) >= today);
    const weekStart = startOfWeek(now);
    const weeklySales = mySales.filter(s => new Date(s.created_at) >= weekStart);
    const monthStart = startOfMonth(now);
    const monthlySales = mySales.filter(s => new Date(s.created_at) >= monthStart);
    const yearStart = startOfYear(now);
    const yearlySales = mySales.filter(s => new Date(s.created_at) >= yearStart);

    return {
      daily: { total: dailySales.reduce((sum, s) => sum + (s.total || 0), 0), count: dailySales.length },
      weekly: { total: weeklySales.reduce((sum, s) => sum + (s.total || 0), 0), count: weeklySales.length },
      monthly: { total: monthlySales.reduce((sum, s) => sum + (s.total || 0), 0), count: monthlySales.length },
      yearly: { total: yearlySales.reduce((sum, s) => sum + (s.total || 0), 0), count: yearlySales.length },
      all: { total: mySales.reduce((sum, s) => sum + (s.total || 0), 0), count: mySales.length }
    };
  }, [mySales]);

  // Chart data - last 30 days
  const chartData = useMemo(() => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStr = format(date, 'yyyy-MM-dd');
      const daySales = mySales.filter(s => s.created_at && s.created_at.startsWith(dayStr));
      last30Days.push({
        date: format(date, 'MMM d'),
        sales: daySales.reduce((sum, s) => sum + (s.total || 0), 0),
        orders: daySales.length
      });
    }
    return last30Days;
  }, [mySales]);

  const salesColumns: Column<Sale>[] = [
    {
      header: 'Sale #',
      className: 'font-medium',
      cell: (sale) => sale.sale_number
    },
    {
      header: 'Date',
      cell: (sale) => format(new Date(sale.created_at), 'MMM d, HH:mm')
    },
    {
      header: 'Customer',
      cell: (sale) => sale.client_name || 'Walk-in'
    },
    {
      header: 'Items',
      cell: (sale) => `${sale.items?.length || 0} items`
    },
    {
      header: 'Total',
      className: 'font-semibold',
      cell: (sale) => `$${sale.total?.toFixed(2)}`
    },
    {
      header: 'Payment',
      className: 'capitalize',
      cell: (sale) => sale.payment_method
    }
  ];

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name || 'Vendor'}!
          </h1>
          <p className="text-slate-500 mt-1">Here's your store performance overview</p>
        </div>
        <Link href={createPageUrl("DirectSales")}>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Sale
          </Button>
        </Link>
      </div>

      {/* Store Info Card */}
      {myVendor && (
        <Card className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {myVendor.store_name?.charAt(0) || 'V'}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{myVendor.store_name}</h2>
                  <p className="text-emerald-100">{myLocation ? `${myLocation.city}, ${myLocation.country}` : 'No location set'}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={cn(
                  "text-sm",
                  myVendor.status === 'active' ? 'bg-white/20 text-white' : 'bg-amber-400 text-amber-900'
                )}>
                  {myVendor.status}
                </Badge>
                <p className="text-sm text-emerald-100 mt-2">
                  Plan: <span className="capitalize font-medium text-white">{myVendor.subscription_plan}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Period Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 py-12">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">Today</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">${salesStats.daily.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.daily.count} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 py-12">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">This Week</p>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">${salesStats.weekly.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.weekly.count} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 py-12">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">This Month</p>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">${salesStats.monthly.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.monthly.count} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 py-12">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">This Year</p>
              <Package className="h-4 w-4 text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">${salesStats.yearly.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.yearly.count} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 py-12">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500">All Time</p>
              <Store className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">${salesStats.all.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.all.count} orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-400" />
              Sales Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="vendorSalesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" fill="url(#vendorSalesGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-slate-400" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myVendor && (
              <>
                <div className="p-4 rounded-xl bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500">Monthly Fee</span>
                    <span className="font-semibold">${myVendor.monthly_fee || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500">Commission Rate</span>
                    <span className="font-semibold">{myVendor.commission_rate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Status</span>
                    <Badge className={cn(
                      myVendor.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        myVendor.payment_status === 'overdue' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                    )}>
                      {myVendor.payment_status || 'pending'}
                    </Badge>
                  </div>
                </div>

                {myVendor.payment_status === 'overdue' && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                    <p className="text-sm text-rose-800">Payment overdue. Please contact admin.</p>
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-xs text-slate-500 mb-2">Recent Payments</p>
                  {myPayments.length === 0 ? (
                    <p className="text-sm text-slate-500">No payment records</p>
                  ) : (
                    <div className="space-y-2">
                      {myPayments.slice(0, 3).map(payment => (
                        <div key={payment.id} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">
                            {format(new Date(payment.created_at), 'MMM d, yyyy')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${payment.amount}</span>
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              payment.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            )}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-slate-400" />
            Recent Sales
          </CardTitle>
          <Link href={createPageUrl("DirectSales")}>
            <Button variant="outline" size="sm">
              View All <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {mySales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No sales yet</p>
              <Link href={createPageUrl("DirectSales")}>
                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Make Your First Sale</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white overflow-hidden">
              <DataTable
                data={mySales.slice(0, 5)}
                columns={salesColumns}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}