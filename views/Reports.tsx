import React, { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
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
import { useAuth } from "@/contexts/AuthContext";
import OwnerReports from "./OwnerReports";

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
    }
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--primary)', 'var(--chart-1)', 'var(--chart-2)'];

const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover text-popover-foreground px-4 py-3 rounded-md border border-border">
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
    const { user } = useAuth();

    // Check if user is SuperAdmin/Owner - they see organization-focused reports
    const isSuperAdmin = user?.user_type === 'platform-staff';

    // If SuperAdmin/Owner, render the OwnerReports instead
    if (isSuperAdmin) {
        return <OwnerReports />;
    }

    // For regular org users, show the inventory/sales reports
    return <OrgReports />;
}

// Organization-level reports (inventory/sales focused)
function OrgReports() {
    const { t } = useSafeLanguage();
    const [dateRange, setDateRange] = useState<string>('30');

    const getProductStock = (p: any) => p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
    const getProductPrice = (p: any) => p.variants?.[0]?.unit_price || 0;
    const getProductCost = (p: any) => p.variants?.[0]?.cost_price || 0;
    const getProductSKU = (p: any) => p.variants?.[0]?.sku || 'N/A';

    const { data: products = [], isLoading: loadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: () => base44.entities.Product.list(),
    });

    const { data: movements = [] } = useQuery({
        queryKey: ['movements'],
        queryFn: () => base44.entities.StockMovement.list({ sort: '-created_at', limit: 1000 }),
    });

    const { data: purchaseOrders = [] } = useQuery({
        queryKey: ['purchaseOrders'],
        queryFn: () => base44.entities.PurchaseOrder.list(),
        initialData: [],
    });

    const { data: sales = [] } = useQuery({
        queryKey: ['sales'],
        queryFn: () => base44.entities.Sale.list(),
    });

    // Calculate stats
    const totalValue = products.reduce((sum: number, p: any) => sum + (getProductPrice(p) * getProductStock(p)), 0);
    const totalCost = products.reduce((sum: number, p: any) => sum + (getProductCost(p) * getProductStock(p)), 0);
    const totalUnits = products.reduce((sum: number, p: any) => sum + getProductStock(p), 0);
    const lowStockCount = products.filter((p: any) => getProductStock(p) <= (p.reorder_point || 10)).length;

    // Category distribution
    const categoryData = useMemo(() => {
        const data: any[] = products.reduce((acc: any[], p: any) => {
            const cat = p.category || 'Other';
            const stock = getProductStock(p);
            const value = getProductPrice(p) * stock;
            const existing = acc.find((a: any) => a.name === cat);
            if (existing) {
                existing.value += value;
                existing.units += stock;
            } else {
                acc.push({ name: cat, value, units: stock });
            }
            return acc;
        }, []);
        return data.sort((a: any, b: any) => b.value - a.value);
    }, [products]);

    // Inventory trend (calculated backward from current total)
    const inventoryTrend = useMemo(() => {
        const days = parseInt(dateRange);
        const data = [];
        const now = new Date();

        // Sort movements by date descending
        const sortedMovements = [...movements].sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        for (let i = days; i >= 0; i--) {
            const date = subDays(now, i);
            const label = format(date, 'MMM d');

            // Current state
            let totalStockAtDate = totalUnits;
            let totalValueAtDate = totalValue;

            // Reverse movements that happened AFTER this date
            for (const m of sortedMovements) {
                const mDate = new Date(m.created_at);
                if (mDate > date) {
                    const product = products.find((p: any) => p.id === m.product_id);
                    const price = product?.variants?.find((v: any) => v.sku === m.sku)?.unit_price ||
                        product?.variants?.[0]?.unit_price || 0;

                    totalStockAtDate -= m.quantity;
                    totalValueAtDate -= (m.quantity * price);
                } else {
                    break;
                }
            }

            data.push({
                date: label,
                value: Math.max(0, totalValueAtDate),
                units: Math.max(0, totalStockAtDate)
            });
        }

        return data;
    }, [movements, products, dateRange, totalValue, totalUnits]);

    // Trend calculation for summary cards
    const calculateTrend = (current: number, daysBack: number) => {
        const targetDate = subDays(new Date(), daysBack);
        let previousValue = current;

        for (const m of movements) {
            const mDate = new Date(m.created_at);
            if (mDate > targetDate) {
                const product = products.find((p: any) => p.id === m.product_id);
                const price = product?.variants?.find((v: any) => v.sku === m.sku)?.unit_price ||
                    product?.variants?.[0]?.unit_price || 0;
                previousValue -= m.quantity * (daysBack === 30 ? price : 1); // price if value, 1 if units
            }
        }

        if (previousValue <= 0) return { trend: "up", value: "100%" };
        const diff = ((current - previousValue) / previousValue) * 100;
        return {
            trend: diff >= 0 ? "up" : "down",
            value: `${Math.abs(diff).toFixed(1)}%`
        };
    };

    const valueTrend = calculateTrend(totalValue, 30);

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
            [t('0_30_days')]: 0,
            [t('31_60_days')]: 0,
            [t('61_90_days')]: 0,
            [t('90_plus_days')]: 0
        };

        products.forEach((p: any) => {
            const stock = getProductStock(p);
            const price = getProductPrice(p);
            if (p.last_restocked) {
                const days = differenceInDays(now, new Date(p.last_restocked));
                const value = price * stock;

                if (days <= 30) aging[t('0_30_days')] += value;
                else if (days <= 60) aging[t('31_60_days')] += value;
                else if (days <= 90) aging[t('61_90_days')] += value;
                else aging[t('90_plus_days')] += value;
            } else {
                // Assume old if no restock date
                aging[t('90_plus_days')] += price * stock;
            }
        });

        return Object.entries(aging).map(([name, value]) => ({ name, value }));
    }, [products]);

    // Export functions
    const exportInventoryCSV = () => {
        const headers = [t('sku'), t('name'), t('category'), t('quantity'), t('unitPrice'), t('totalValue'), t('status'), t('location'), t('supplier')];
        const rows = products.map((p: any) => {
            const stock = getProductStock(p);
            const price = getProductPrice(p);
            return [
                getProductSKU(p),
                p.name,
                p.category,
                stock,
                price.toFixed(2),
                (price * stock).toFixed(2),
                p.status,
                p.location,
                p.supplier_name
            ];
        });

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
        const headers = [t('date'), t('product'), t('sku'), t('type'), t('quantity'), t('reference'), t('performedBy')];
        const rows = movements.map((m: any) => [
            format(new Date(m.created_at), 'yyyy-MM-dd HH:mm'),
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('reportsAnalytics')}</h1>
                    <p className="text-muted-foreground mt-1">{t('insightsInventory')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40 bg-background rounded-sm py-5">
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
                    <CardContent className="p-6 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('totalStockValue')}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">${(totalValue / 1000).toFixed(1)}k</p>
                                <div className={cn(
                                    "flex items-center gap-1 mt-1",
                                    valueTrend.trend === "up" ? "text-primary" : "text-rose-600"
                                )}>
                                    {valueTrend.trend === "up" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                    <span className="text-xs">{valueTrend.trend === "up" ? '+' : '-'}{valueTrend.value}</span>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('totalUnits')}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{totalUnits.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">{products.length} SKUs</p>
                            </div>
                            <div className="h-12 w-12 rounded-md bg-violet-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-violet-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('inventoryCost')}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">${(totalCost / 1000).toFixed(1)}k</p>
                                <p className="text-xs text-muted-foreground mt-1">{t('profitMargin')}: {totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(1) : 0}%</p>
                            </div>
                            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('lowStockItems')}</p>
                                <p className="text-2xl font-bold text-foreground mt-1">{lowStockCount}</p>
                                <p className="text-xs text-amber-600 mt-1">{t('needsAttention')}</p>
                            </div>
                            <div className="h-12 w-12 rounded-md bg-amber-100 flex items-center justify-center">
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
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                                    <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" name={t('value')} />
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
                                {categoryData.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-sm text-muted-foreground">{item.name}</span>
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} width={100} />
                                    <Tooltip content={<CustomTooltip valueSuffix={` ${t('units')}`} />} />
                                    <Bar dataKey="received" fill="var(--primary)" name={t('received')} radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="dispatched" fill="var(--chart-2)" name={t('dispatched')} radius={[0, 4, 4, 0]} />
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip valuePrefix="$" />} />
                                    <Bar dataKey="value" name={t('value')} radius={[4, 4, 0, 0]}>
                                        {agingData.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={index === 3 ? 'var(--destructive)' : index === 2 ? 'var(--chart-4)' : index === 1 ? 'var(--chart-2)' : 'var(--primary)'}
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
                            <FileSpreadsheet className="h-8 w-8 mr-4 text-primary" />
                            <div className="text-left">
                                <p className="font-medium">{t('inventoryValuation')}</p>
                                <p className="text-xs text-muted-foreground">{t('fullStockListValues')}</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 justify-start" onClick={exportMovementsCSV}>
                            <FileSpreadsheet className="h-8 w-8 mr-4 text-primary" />
                            <div className="text-left">
                                <p className="font-medium">{t('stockMovements')}</p>
                                <p className="text-xs text-muted-foreground">{t('allInventoryTransactions')}</p>
                            </div>
                        </Button>
                        <Button variant="outline" className="h-auto p-4 justify-start" onClick={() => toast.info(t('comingSoon'))}>
                            <FileSpreadsheet className="h-8 w-8 mr-4 text-violet-600" />
                            <div className="text-left">
                                <p className="font-medium">{t('purchaseOrders')}</p>
                                <p className="text-xs text-muted-foreground">{t('poHistoryStatus')}</p>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}