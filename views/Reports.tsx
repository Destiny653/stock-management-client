import React, { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import {
    Download,
    TrendingUp,
    Package,
    Clock,
    DollarSign,
    Loader2,
    FileSpreadsheet,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { format, subDays, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/components/i18n/LanguageContext";

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
    }
}

const COLORS = ['#0d9488', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#6366f1', '#ec4899'];

const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl">
                <p className="text-sm font-medium mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-semibold">{valuePrefix}{entry.value.toLocaleString()}{valueSuffix}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Reports() {
    const { t } = useSafeLanguage();
    const [dateRange, setDateRange] = useState('30');

    const { data: products = [], isLoading: loadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: () => base44.entities.Product.list(),
        initialData: [],
    });

    const { data: movements = [] } = useQuery({
        queryKey: ['movements'],
        queryFn: () => base44.entities.StockMovement.list('-created_date', 500),
        initialData: [],
    });

    const { data: purchaseOrders = [] } = useQuery({
        queryKey: ['purchaseOrders'],
        queryFn: () => base44.entities.PurchaseOrder.list(),
        initialData: [],
    });

    // Calculate stats
    const totalValue = products.reduce((sum: number, p: any) => sum + ((p.unit_price || 0) * (p.quantity || 0)), 0);
    const totalCost = products.reduce((sum: number, p: any) => sum + ((p.cost_price || 0) * (p.quantity || 0)), 0);
    const totalUnits = products.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
    const lowStockCount = products.filter((p: any) => p.quantity <= (p.reorder_point || 10)).length;

    // Category distribution
    const categoryData = useMemo(() => {
        const data: any[] = products.reduce((acc: any[], p: any) => {
            const cat = p.category || 'Other';
            const value = (p.unit_price || 0) * (p.quantity || 0);
            const existing = acc.find((a: any) => a.name === cat);
            if (existing) {
                existing.value += value;
                existing.units += p.quantity || 0;
            } else {
                acc.push({ name: cat, value, units: p.quantity || 0 });
            }
            return acc;
        }, []);
        return data.sort((a: any, b: any) => b.value - a.value);
    }, [products]);

    // Inventory trend (simulated based on movements)
    const inventoryTrend = useMemo(() => {
        const days = parseInt(dateRange);
        const data = [];
        let runningValue = totalValue;

        for (let i = days; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dayMovements = movements.filter((m: any) => {
                const movementDate = new Date(m.created_date);
                return format(movementDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
            });

            const dayChange = dayMovements.reduce((sum: number, m: any) => {
                return sum + (m.quantity * (m.type === 'received' ? 1 : -1) * 10); // Simplified value change
            }, 0);

            data.push({
                date: format(date, 'MMM d'),
                value: Math.max(0, runningValue + dayChange),
                units: Math.max(0, totalUnits + Math.floor(dayChange / 10))
            });
        }

        return data;
    }, [movements, dateRange, totalValue, totalUnits]);

    // Top movers
    const topMovers = useMemo(() => {
        const movementCounts: any = {};
        movements.forEach((m: any) => {
            if (!movementCounts[m.product_name]) {
                movementCounts[m.product_name] = { name: m.product_name, received: 0, dispatched: 0 };
            }
            if (m.type === 'received') {
                movementCounts[m.product_name].received += Math.abs(m.quantity);
            } else if (m.type === 'dispatched') {
                movementCounts[m.product_name].dispatched += Math.abs(m.quantity);
            }
        });

        return Object.values(movementCounts)
            .map((p: any) => ({ ...p, total: p.received + p.dispatched }))
            .sort((a: any, b: any) => b.total - a.total)
            .slice(0, 10);
    }, [movements]);

    // Aging inventory
    const agingData = useMemo(() => {
        const now = new Date();
        const aging: any = {
            '0-30 days': 0,
            '31-60 days': 0,
            '61-90 days': 0,
            '90+ days': 0
        };

        products.forEach((p: any) => {
            if (p.last_restocked) {
                const days = differenceInDays(now, new Date(p.last_restocked));
                const value = (p.unit_price || 0) * (p.quantity || 0);

                if (days <= 30) aging['0-30 days'] += value;
                else if (days <= 60) aging['31-60 days'] += value;
                else if (days <= 90) aging['61-90 days'] += value;
                else aging['90+ days'] += value;
            } else {
                // Assume old if no restock date
                aging['90+ days'] += (p.unit_price || 0) * (p.quantity || 0);
            }
        });

        return Object.entries(aging).map(([name, value]) => ({ name, value }));
    }, [products]);

    // Export functions
    const exportInventoryCSV = () => {
        const headers = ['SKU', 'Name', 'Category', 'Quantity', 'Unit Price', 'Total Value', 'Status', 'Location', 'Supplier'];
        const rows = products.map((p: any) => [
            p.sku,
            p.name,
            p.category,
            p.quantity,
            p.unit_price?.toFixed(2),
            ((p.unit_price || 0) * (p.quantity || 0)).toFixed(2),
            p.status,
            p.location,
            p.supplier_name
        ]);

        const csv = [headers.join(','), ...rows.map((r: any) => r.map((v: any) => `"${v || ''}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_valuation_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        toast.success(t('reportExported'));
    };

    const exportMovementsCSV = () => {
        const headers = ['Date', 'Product', 'SKU', 'Type', 'Quantity', 'Reference', 'Performed By'];
        const rows = movements.map((m: any) => [
            format(new Date(m.created_date), 'yyyy-MM-dd HH:mm'),
            m.product_name,
            m.sku,
            m.type,
            m.quantity,
            m.reference,
            m.performed_by
        ]);

        const csv = [headers.join(','), ...rows.map((r: any) => r.map((v: any) => `"${v || ''}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock_movements_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        toast.success(t('reportExported'));
    };

    if (loadingProducts) {
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('reportsAnalytics')}</h1>
                    <p className="text-slate-500 mt-1">{t('insightsInventory')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">{t('last7Days')}</SelectItem>
                            <SelectItem value="30">{t('last30Days')}</SelectItem>
                            <SelectItem value="90">{t('last90Days')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={exportInventoryCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        {t('exportCSV')}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{t('totalStockValue')}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">${(totalValue / 1000).toFixed(1)}k</p>
                                <div className="flex items-center gap-1 mt-1 text-emerald-600">
                                    <ArrowUpRight className="h-4 w-4" />
                                    <span className="text-xs">+12.5%</span>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-teal-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{t('totalUnits')}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{totalUnits.toLocaleString()}</p>
                                <p className="text-xs text-slate-400 mt-1">{products.length} SKUs</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-violet-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{t('inventoryCost')}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">${(totalCost / 1000).toFixed(1)}k</p>
                                <p className="text-xs text-slate-400 mt-1">{t('profitMargin')}: {totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(1) : 0}%</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{t('lowStockItems')}</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{lowStockCount}</p>
                                <p className="text-xs text-amber-600 mt-1">{t('needsAttention')}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory Value Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('inventoryValueTrend')}</CardTitle>
                        <CardDescription>{t('stockValueOverTime')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={inventoryTrend}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                                    <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" name="Value" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('categoryDistribution')}</CardTitle>
                        <CardDescription>{t('stockValueByCategory')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72 flex items-center">
                            <div className="w-1/2">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-1/2 space-y-2">
                                {categoryData.slice(0, 5).map((item: any, index: number) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                            <span className="text-sm text-slate-600 truncate">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-medium">${(item.value / 1000).toFixed(1)}k</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Movers */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('topMovingProducts')}</CardTitle>
                        <CardDescription>{t('productsWithMostMovements')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topMovers} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                                    <Tooltip content={<CustomTooltip valueSuffix=" units" />} />
                                    <Bar dataKey="received" fill="#10b981" name="Received" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="dispatched" fill="#3b82f6" name="Dispatched" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Aging Inventory */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('agingInventory')}</CardTitle>
                        <CardDescription>{t('stockValueByAge')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={agingData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                                    <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
                                        {agingData.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === 3 ? '#ef4444' : index === 2 ? '#f59e0b' : index === 1 ? '#3b82f6' : '#10b981'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Export Section */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('exportReports')}</CardTitle>
                    <CardDescription>{t('downloadDetailedReports')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Button variant="outline" className="h-auto p-4 justify-start" onClick={exportInventoryCSV}>
                            <FileSpreadsheet className="h-8 w-8 mr-4 text-emerald-600" />
                            <div className="text-left">
                                <p className="font-medium">{t('inventoryValuation')}</p>
                                <p className="text-xs text-slate-500">{t('fullStockListValues')}</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 justify-start" onClick={exportMovementsCSV}>
                            <FileSpreadsheet className="h-8 w-8 mr-4 text-blue-600" />
                            <div className="text-left">
                                <p className="font-medium">{t('stockMovements')}</p>
                                <p className="text-xs text-slate-500">{t('allInventoryTransactions')}</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 justify-start" onClick={() => toast.info(t('comingSoon'))}>
                            <FileSpreadsheet className="h-8 w-8 mr-4 text-violet-600" />
                            <div className="text-left">
                                <p className="font-medium">{t('purchaseOrders')}</p>
                                <p className="text-xs text-slate-500">{t('poHistoryStatus')}</p>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}