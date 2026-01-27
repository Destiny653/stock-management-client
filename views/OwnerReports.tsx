import React, { useState, useMemo } from 'react';
import { base44, Organization, Vendor, User, Sale, Product } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
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
    Building2,
    Users,
    Store,
    DollarSign,
    Loader2,
    FileSpreadsheet,
    HardDrive,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { format, subDays, startOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import { useLanguage } from "@/components/i18n/LanguageContext";

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
    }
}

const COLORS = ['#059669', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#6366f1', '#ec4899'];

const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    suspended: "bg-rose-100 text-rose-700",
    pending: "bg-amber-100 text-amber-700"
};

export default function OwnerReports() {
    const { t } = useSafeLanguage();
    const [dateRange, setDateRange] = useState<string>('30');
    const [selectedOrg, setSelectedOrg] = useState<string>('all');

    // Fetch all data
    const { data: organizations = [], isLoading: loadingOrgs } = useQuery<Organization[]>({
        queryKey: ['organizations'],
        queryFn: () => base44.entities.Organization.list(),
    });

    const { data: vendors = [] } = useQuery<Vendor[]>({
        queryKey: ['vendors'],
        queryFn: () => base44.entities.Vendor.list(),
    });

    const { data: users = [] } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
    });

    const { data: sales = [] } = useQuery<Sale[]>({
        queryKey: ['sales'],
        queryFn: () => base44.entities.Sale.list(),
    });

    const { data: products = [] } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: () => base44.entities.Product.list(),
    });

    const isLoading = loadingOrgs;

    // Filter data by date range
    const filteredSales = useMemo(() => {
        const days = parseInt(dateRange);
        const startDate = subDays(new Date(), days);
        return sales.filter(s => {
            const matchesDate = new Date(s.created_at) >= startDate;
            const matchesOrg = selectedOrg === 'all' || s.organization_id === selectedOrg;
            return matchesDate && matchesOrg;
        });
    }, [sales, dateRange, selectedOrg]);

    // Organization performance data
    const orgPerformanceData = useMemo(() => {
        return organizations.map(org => {
            const orgVendors = vendors.filter(v => v.organization_id === org.id);
            const orgUsers = users.filter(u => u.organization_id === org.id);
            const orgSales = sales.filter(s => s.organization_id === org.id);
            const orgProducts = products.filter(p => p.organization_id === org.id);

            const days = parseInt(dateRange);
            const startDate = subDays(new Date(), days);
            const periodSales = orgSales.filter(s => new Date(s.created_at) >= startDate);

            const revenue = periodSales
                .filter(s => s.status !== 'cancelled')
                .reduce((sum, s) => sum + (s.total || 0), 0);

            // Estimate storage
            const estimatedStorage = (
                (orgProducts.length * 2) +
                (orgVendors.length * 1) +
                (orgUsers.length * 0.5) +
                (orgSales.length * 1.5)
            );

            return {
                id: org.id,
                name: org.name,
                code: org.code,
                status: org.status,
                vendorCount: orgVendors.length,
                userCount: orgUsers.length,
                productCount: orgProducts.length,
                salesCount: periodSales.length,
                revenue,
                storageKB: estimatedStorage,
                plan: org.subscription_plan
            };
        }).sort((a, b) => b.revenue - a.revenue);
    }, [organizations, vendors, users, sales, products, dateRange]);

    // Revenue by organization (for chart)
    const revenueByOrgData = useMemo(() => {
        return orgPerformanceData.slice(0, 8).map(org => ({
            name: org.name?.substring(0, 15) + (org.name?.length > 15 ? '...' : ''),
            revenue: org.revenue,
            sales: org.salesCount
        }));
    }, [orgPerformanceData]);

    // Organization status distribution
    const statusDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        organizations.forEach(org => {
            counts[org.status] = (counts[org.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [organizations]);

    // Plan distribution
    const planDistribution = useMemo(() => {
        const counts: Record<string, number> = {};
        organizations.forEach(org => {
            const plan = org.subscription_plan || 'starter';
            counts[plan] = (counts[plan] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [organizations]);

    const performanceColumns: Column<any>[] = [
        {
            header: 'Organization',
            cell: (org) => (
                <div>
                    <p className="font-medium text-slate-900">{org.name}</p>
                    <p className="text-sm text-slate-500 font-mono">{org.code}</p>
                </div>
            )
        },
        {
            header: 'Status',
            cell: (org) => <Badge className={statusColors[org.status]}>{org.status}</Badge>
        },
        {
            header: 'Plan',
            className: 'capitalize',
            cell: (org) => org.plan
        },
        {
            header: 'Vendors',
            cell: (org) => org.vendorCount
        },
        {
            header: 'Users',
            cell: (org) => org.userCount
        },
        {
            header: 'Products',
            cell: (org) => org.productCount
        },
        {
            header: 'Sales',
            cell: (org) => org.salesCount
        },
        {
            header: 'Revenue',
            className: 'font-medium text-emerald-600',
            cell: (org) => `$${org.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        }
    ];

    const storageColumns: Column<any>[] = [
        {
            header: 'Organization',
            cell: (org) => (
                <div>
                    <p className="font-medium text-slate-900">{org.name}</p>
                    <p className="text-sm text-slate-500 font-mono">{org.code}</p>
                </div>
            )
        },
        {
            header: 'Products',
            cell: (org) => org.productCount
        },
        {
            header: 'Vendors',
            cell: (org) => org.vendorCount
        },
        {
            header: 'Users',
            cell: (org) => org.userCount
        },
        {
            header: 'Sales Records',
            cell: (org) => org.salesCount
        },
        {
            header: 'Estimated Storage',
            className: 'font-medium',
            cell: (org) => (
                org.storageKB > 1024
                    ? `${(org.storageKB / 1024).toFixed(1)} MB`
                    : `${org.storageKB.toFixed(0)} KB`
            )
        },
        {
            header: '% of Total',
            cell: (org) => (
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${(org.storageKB / totalStats.totalStorage) * 100}%` }}
                        />
                    </div>
                    <span className="text-sm text-slate-600">
                        {((org.storageKB / totalStats.totalStorage) * 100).toFixed(1)}%
                    </span>
                </div>
            )
        }
    ];

    // Monthly organization growth
    const growthData = useMemo(() => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(new Date(), i));
            const monthName = format(monthStart, 'MMM yyyy');

            const orgsUpToMonth = organizations.filter(o =>
                new Date(o.created_at) <= monthStart
            ).length;

            const vendorsUpToMonth = vendors.filter(v =>
                new Date(v.created_at) <= monthStart
            ).length;

            const usersUpToMonth = users.filter(u =>
                new Date(u.created_at) <= monthStart
            ).length;

            data.push({
                name: monthName,
                organizations: orgsUpToMonth,
                vendors: vendorsUpToMonth,
                users: usersUpToMonth
            });
        }
        return data;
    }, [organizations, vendors, users]);

    // Total stats
    const totalStats = useMemo(() => {
        const totalRevenue = orgPerformanceData.reduce((sum, o) => sum + o.revenue, 0);
        const totalStorage = orgPerformanceData.reduce((sum, o) => sum + o.storageKB, 0);
        const avgRevenuePerOrg = organizations.length > 0 ? totalRevenue / organizations.length : 0;

        return {
            totalRevenue,
            totalStorage,
            avgRevenuePerOrg,
            totalOrgs: organizations.length,
            totalVendors: vendors.length,
            totalUsers: users.length
        };
    }, [orgPerformanceData, organizations, vendors, users]);

    const exportReport = () => {
        const csvContent = [
            ['Organization', 'Code', 'Status', 'Plan', 'Vendors', 'Users', 'Products', 'Sales', 'Revenue', 'Storage (KB)'].join(','),
            ...orgPerformanceData.map(org => [
                org.name,
                org.code,
                org.status,
                org.plan,
                org.vendorCount,
                org.userCount,
                org.productCount,
                org.salesCount,
                org.revenue.toFixed(2),
                org.storageKB.toFixed(1)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `organization_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        toast.success('Report exported successfully');
    };

    if (isLoading) {
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
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Reports</h1>
                    <p className="text-slate-500 mt-1">Organization performance and analytics</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-40 bg-white rounded-sm py-5">
                            <SelectValue placeholder="Date Range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={exportReport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{totalStats.totalOrgs}</p>
                                <p className="text-sm text-slate-500">Organizations</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    ${totalStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                                <p className="text-sm text-slate-500">Total Revenue ({dateRange}d)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
                                <Store className="h-6 w-6 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{totalStats.totalVendors}</p>
                                <p className="text-sm text-slate-500">Total Vendors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <HardDrive className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {totalStats.totalStorage > 1024
                                        ? `${(totalStats.totalStorage / 1024).toFixed(1)} MB`
                                        : `${totalStats.totalStorage.toFixed(0)} KB`}
                                </p>
                                <p className="text-sm text-slate-500">Total Storage</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 px-6 font-semibold">
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 px-6 font-semibold">
                        Performance
                    </TabsTrigger>
                    <TabsTrigger value="growth" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 px-6 font-semibold">
                        Growth
                    </TabsTrigger>
                    <TabsTrigger value="storage" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 px-6 font-semibold">
                        Storage
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue by Organization */}
                        <Card className='py-6'>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-slate-400" />
                                    Revenue by Organization
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueByOrgData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                                            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                            <Tooltip />
                                            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Distribution */}
                        <Card className='py-6'>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-slate-400" />
                                    Organization Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {statusDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Plan Distribution */}
                    <Card className='py-6'>
                        <CardHeader>
                            <CardTitle>Subscription Plans Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {planDistribution.map((plan, index) => (
                                    <div key={plan.name} className="p-4 rounded-xl bg-slate-50 text-center">
                                        <p className="text-3xl font-bold text-slate-900">{plan.value}</p>
                                        <p className="text-sm text-slate-500 capitalize">{plan.name}</p>
                                        <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${(plan.value / organizations.length) * 100}%`,
                                                    backgroundColor: COLORS[index % COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-6">
                    <Card className='py-6'>
                        <CardHeader>
                            <CardTitle>Organization Performance</CardTitle>
                            <CardDescription>Detailed performance metrics for each organization</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={orgPerformanceData}
                                columns={performanceColumns}
                                emptyMessage="No data available"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Growth Tab */}
                <TabsContent value="growth" className="space-y-6">
                    <Card className='py-6'>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-slate-400" />
                                Platform Growth (Last 6 Months)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData}>
                                        <defs>
                                            <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="vendorGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                        <Tooltip />
                                        <Legend />
                                        <Area type="monotone" dataKey="organizations" stroke="#10b981" fill="url(#orgGrad)" strokeWidth={2} name="Organizations" />
                                        <Area type="monotone" dataKey="vendors" stroke="#8b5cf6" fill="url(#vendorGrad)" strokeWidth={2} name="Vendors" />
                                        <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="url(#userGrad)" strokeWidth={2} name="Users" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Storage Tab */}
                <TabsContent value="storage" className="space-y-6">
                    <Card className='py-6'>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HardDrive className="h-5 w-5 text-slate-400" />
                                Storage Usage by Organization
                            </CardTitle>
                            <CardDescription>Estimated storage consumption based on data volume</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={orgPerformanceData}
                                columns={storageColumns}
                                emptyMessage="No storage data available"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
