import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { createPageUrl } from "@/utils";
import { base44, Organization, Vendor, User, Sale, Product, OrganizationPayment } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/ui/data-table";
import {
    Building2,
    Users,
    Store,
    TrendingUp,
    Database,
    HardDrive,
    ArrowUpRight,
    Package,
    DollarSign,
    Activity,
    Loader2,
    Eye,
    BarChart3,
    Globe,
    CreditCard,
    Clock,
    CheckCircle,
    AlertCircle,
    Plus,
    Receipt,
    FileCheck,
    Banknote,
    Search,
    Filter,
    MoreVertical,
    XCircle,
    Edit2,
    Calendar,
    Crown,
    Wallet
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from "@/components/i18n/LanguageContext";

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
    }
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-1)'];

const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary",
    inactive: "bg-muted text-muted-foreground",
    suspended: "bg-destructive/10 text-destructive",
    pending: "bg-amber-100 text-amber-700"
};

export default function OwnerDashboard() {
    const { t } = useSafeLanguage();

    // Fetch all organizations
    const { data: organizations = [], isLoading: loadingOrgs } = useQuery<Organization[]>({
        queryKey: ['organizations'],
        queryFn: () => base44.entities.Organization.list(),
    });

    // Fetch all vendors
    const { data: vendors = [], isLoading: loadingVendors } = useQuery<Vendor[]>({
        queryKey: ['vendors'],
        queryFn: () => base44.entities.Vendor.list(),
    });

    // Fetch all users
    const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
    });

    // Fetch all sales for revenue tracking
    const { data: sales = [] } = useQuery<Sale[]>({
        queryKey: ['sales'],
        queryFn: () => base44.entities.Sale.list(),
    });

    // Fetch all products for storage estimation
    const { data: products = [] } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: () => base44.entities.Product.list(),
    });

    const isLoading = loadingOrgs || loadingVendors || loadingUsers;
    const queryClient = useQueryClient();

    // Fetch all payments
    const { data: payments = [], isLoading: loadingPayments } = useQuery<OrganizationPayment[]>({
        queryKey: ['organization-payments'],
        queryFn: () => base44.entities.OrganizationPayment.list(),
    });

    // Payment form state
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
    const [paymentForm, setPaymentForm] = useState<{
        organization_id: string;
        amount: string;
        currency: string;
        payment_method: 'bank_transfer' | 'card' | 'mobile_money' | 'paypal' | 'stripe' | 'other';
        payment_type: 'subscription' | 'addon' | 'upgrade' | 'renewal';
        billing_period: 'monthly' | 'yearly';
        status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
        reference_number: string;
        invoice_number: string;
        payment_date: string;
        notes: string;
    }>({
        organization_id: '',
        amount: '',
        currency: 'USD',
        payment_method: 'bank_transfer',
        payment_type: 'subscription',
        billing_period: 'monthly',
        status: 'pending',
        reference_number: '',
        invoice_number: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });

    // Payment status colors
    // Payment status colors
    const paymentStatusColors: Record<string, string> = {
        pending: "bg-amber-100 text-amber-700",
        completed: "bg-primary/10 text-primary",
        failed: "bg-destructive/10 text-destructive",
        refunded: "bg-primary/10 text-primary",
        cancelled: "bg-muted text-muted-foreground"
    };

    // Create payment mutation
    const createPaymentMutation = useMutation({
        mutationFn: (data: Partial<OrganizationPayment>) => base44.entities.OrganizationPayment.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization-payments'] });
            setIsPaymentDialogOpen(false);
            resetPaymentForm();
        }
    });

    // Update payment mutation (for confirming/rejecting)
    const updatePaymentMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<OrganizationPayment> }) =>
            base44.entities.OrganizationPayment.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization-payments'] });
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
        }
    });

    // Subscription edit state
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
    const [selectedOrgForSubscription, setSelectedOrgForSubscription] = useState<Organization | null>(null);
    const [subscriptionForm, setSubscriptionForm] = useState<{
        subscription_plan: string;
        billing_cycle: 'monthly' | 'yearly';
        status: 'active' | 'inactive' | 'suspended' | 'pending';
        trial_ends_at: string;
        max_vendors: number;
        max_users: number;
    }>({
        subscription_plan: 'starter',
        billing_cycle: 'monthly',
        status: 'active',
        trial_ends_at: '',
        max_vendors: 10,
        max_users: 5
    });

    // Subscription plan pricing
    const subscriptionPlanPricing: Record<string, { monthly: number; yearly: number; maxVendors: number; maxUsers: number }> = {
        starter: { monthly: 29, yearly: 290, maxVendors: 10, maxUsers: 5 },
        business: { monthly: 79, yearly: 790, maxVendors: 50, maxUsers: 20 },
        enterprise: { monthly: 199, yearly: 1990, maxVendors: 999, maxUsers: 100 }
    };

    // Update organization mutation
    const updateOrganizationMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Organization> }) =>
            base44.entities.Organization.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            setIsSubscriptionDialogOpen(false);
            setSelectedOrgForSubscription(null);
        }
    });

    const handleEditSubscription = (org: Organization) => {
        setSelectedOrgForSubscription(org);
        setSubscriptionForm({
            subscription_plan: org.subscription_plan || 'starter',
            billing_cycle: org.billing_cycle || 'monthly',
            status: org.status,
            trial_ends_at: org.trial_ends_at || '',
            max_vendors: org.max_vendors || subscriptionPlanPricing[org.subscription_plan || 'starter']?.maxVendors || 10,
            max_users: org.max_users || subscriptionPlanPricing[org.subscription_plan || 'starter']?.maxUsers || 5
        });
        setIsSubscriptionDialogOpen(true);
    };

    const handleSaveSubscription = () => {
        if (!selectedOrgForSubscription) return;

        updateOrganizationMutation.mutate({
            id: selectedOrgForSubscription.id,
            data: {
                subscription_plan: subscriptionForm.subscription_plan,
                billing_cycle: subscriptionForm.billing_cycle,
                status: subscriptionForm.status,
                trial_ends_at: subscriptionForm.trial_ends_at || undefined,
                max_vendors: subscriptionForm.max_vendors,
                max_users: subscriptionForm.max_users
            }
        });
    };

    const resetPaymentForm = () => {
        setPaymentForm({
            organization_id: '',
            amount: '',
            currency: 'USD',
            payment_method: 'bank_transfer',
            payment_type: 'subscription',
            billing_period: 'monthly',
            status: 'pending',
            reference_number: '',
            invoice_number: '',
            payment_date: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
    };

    const handleCreatePayment = () => {
        if (!paymentForm.organization_id || !paymentForm.amount) return;

        const invoiceNumber = paymentForm.invoice_number || `INV-${Date.now().toString().slice(-8)}`;

        createPaymentMutation.mutate({
            ...paymentForm,
            amount: parseFloat(paymentForm.amount),
            invoice_number: invoiceNumber,
            created_at: new Date().toISOString()
        });
    };

    const handleConfirmPayment = (payment: OrganizationPayment) => {
        updatePaymentMutation.mutate({
            id: payment.id,
            data: {
                status: 'completed',
                payment_date: new Date().toISOString()
            }
        });
    };

    const handleRejectPayment = (payment: OrganizationPayment) => {
        updatePaymentMutation.mutate({
            id: payment.id,
            data: {
                status: 'cancelled'
            }
        });
    };

    // Filter payments
    const filteredPayments = useMemo(() => {
        return payments.filter(payment => {
            const org = organizations.find(o => o.id === payment.organization_id);
            const matchesSearch = !paymentSearch ||
                org?.name?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                payment.reference_number?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                payment.invoice_number?.toLowerCase().includes(paymentSearch.toLowerCase());
            const matchesStatus = paymentStatusFilter === 'all' || payment.status === paymentStatusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [payments, organizations, paymentSearch, paymentStatusFilter]);

    // Payment stats
    const paymentStats = useMemo(() => {
        const pending = payments.filter(p => p.status === 'pending');
        const completed = payments.filter(p => p.status === 'completed');
        const thisMonthCompleted = completed.filter(p =>
            new Date(p.created_at) >= startOfMonth(new Date())
        );
        const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);
        const thisMonthRevenue = thisMonthCompleted.reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);

        return {
            totalPayments: payments.length,
            pendingPayments: pending.length,
            completedPayments: completed.length,
            totalRevenue,
            thisMonthRevenue,
            pendingAmount
        };
    }, [payments]);

    // Calculate stats per organization
    const orgStats = useMemo(() => {
        return organizations.map(org => {
            const orgVendors = vendors.filter(v => v.organization_id === org.id);
            const orgUsers = users.filter(u => u.organization_id === org.id);
            const orgSales = sales.filter(s => s.organization_id === org.id);
            const orgProducts = products.filter(p => p.organization_id === org.id);

            // Estimate storage (rough estimation based on data count)
            const estimatedStorage = (
                (orgProducts.length * 2) + // ~2KB per product
                (orgVendors.length * 1) + // ~1KB per vendor
                (orgUsers.length * 0.5) + // ~0.5KB per user
                (orgSales.length * 1.5) // ~1.5KB per sale
            );

            const thisMonthRevenue = orgSales
                .filter(s => new Date(s.created_at) >= startOfMonth(new Date()) && s.status !== 'cancelled')
                .reduce((sum, s) => sum + (s.total || 0), 0);

            return {
                ...org,
                vendorCount: orgVendors.length,
                userCount: orgUsers.length,
                productCount: orgProducts.length,
                salesCount: orgSales.length,
                estimatedStorageKB: estimatedStorage,
                thisMonthRevenue
            };
        });
    }, [organizations, vendors, users, sales, products]);

    // Organization subscription stats with payment info
    const orgSubscriptionStats = useMemo(() => {
        return organizations.map(org => {
            // Get payments for this organization
            const orgPayments = payments.filter(p => p.organization_id === org.id);
            const completedPayments = orgPayments.filter(p => p.status === 'completed');
            const pendingPayments = orgPayments.filter(p => p.status === 'pending');

            // Get the last completed payment
            const lastPayment = completedPayments.length > 0
                ? completedPayments.sort((a, b) =>
                    new Date(b.payment_date || b.created_at).getTime() - new Date(a.payment_date || a.created_at).getTime()
                )[0]
                : null;

            // Calculate next billing date based on last payment and billing cycle
            let nextBillingDate: Date | null = null;
            if (lastPayment && lastPayment.payment_date) {
                const lastDate = new Date(lastPayment.payment_date);
                const billingCycle = org.billing_cycle || 'monthly';
                if (billingCycle === 'yearly') {
                    nextBillingDate = new Date(lastDate.setFullYear(lastDate.getFullYear() + 1));
                } else {
                    nextBillingDate = new Date(lastDate.setMonth(lastDate.getMonth() + 1));
                }
            }

            // Get the subscription plan price
            const planPrices = subscriptionPlanPricing[org.subscription_plan || 'starter'] || subscriptionPlanPricing.starter;
            const billingAmount = org.billing_cycle === 'yearly' ? planPrices.yearly : planPrices.monthly;

            // Payment status
            let paymentStatus: 'paid' | 'pending' | 'overdue' | 'no_payment' = 'no_payment';
            if (pendingPayments.length > 0) {
                paymentStatus = 'pending';
            } else if (lastPayment) {
                if (nextBillingDate && new Date() > nextBillingDate) {
                    paymentStatus = 'overdue';
                } else {
                    paymentStatus = 'paid';
                }
            }

            // Total paid amount
            const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

            return {
                ...org,
                lastPayment,
                nextBillingDate,
                billingAmount,
                paymentStatus,
                totalPaid,
                completedPaymentsCount: completedPayments.length,
                pendingPaymentsCount: pendingPayments.length
            };
        });
    }, [organizations, payments, subscriptionPlanPricing]);

    // Overall platform stats
    const platformStats = useMemo(() => {
        const totalRevenue = sales
            .filter(s => new Date(s.created_at) >= startOfMonth(new Date()) && s.status !== 'cancelled')
            .reduce((sum, s) => sum + (s.total || 0), 0);

        const totalStorage = orgStats.reduce((sum, o) => sum + o.estimatedStorageKB, 0);

        return {
            totalOrganizations: organizations.length,
            activeOrganizations: organizations.filter(o => o.status === 'active').length,
            totalVendors: vendors.length,
            activeVendors: vendors.filter(v => v.status === 'active').length,
            totalUsers: users.length,
            totalProducts: products.length,
            totalSales: sales.length,
            totalRevenue,
            totalStorageKB: totalStorage,
            avgStoragePerOrg: organizations.length > 0 ? totalStorage / organizations.length : 0
        };
    }, [organizations, vendors, users, sales, products, orgStats]);

    // Organization distribution by status
    const orgStatusData = useMemo(() => {
        const statusCounts: Record<string, number> = {};
        organizations.forEach(org => {
            statusCounts[org.status] = (statusCounts[org.status] || 0) + 1;
        });
        return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    }, [organizations]);

    // Recent activity (new organizations, vendors added in last 7 days)
    const recentOrgActivity = useMemo(() => {
        const sevenDaysAgo = subDays(new Date(), 7);
        return organizations
            .filter(o => new Date(o.created_at) >= sevenDaysAgo)
            .slice(0, 5);
    }, [organizations]);

    // Subscription plan distribution
    const subscriptionPlanData = useMemo(() => {
        const planCounts: Record<string, number> = {};
        organizations.forEach(org => {
            const plan = org.subscription_plan || 'starter';
            planCounts[plan] = (planCounts[plan] || 0) + 1;
        });
        return Object.entries(planCounts).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        }));
    }, [organizations]);

    // Pending organizations awaiting approval
    const pendingOrganizations = useMemo(() => {
        return organizations.filter(o => o.status === 'pending' || o.status === 'inactive');
    }, [organizations]);

    // Monthly recurring revenue estimate (based on subscription plans)
    const estimatedMRR = useMemo(() => {
        const planPrices: Record<string, number> = {
            starter: 29,
            business: 79,
            enterprise: 199
        };
        return organizations
            .filter(o => o.status === 'active')
            .reduce((sum, org) => sum + (planPrices[org.subscription_plan || 'starter'] || 29), 0);
    }, [organizations]);

    const paymentColumns: Column<OrganizationPayment>[] = [
        {
            header: 'Organization',
            cell: (payment) => {
                const org = organizations.find(o => o.id === payment.organization_id);
                return (
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                            {org?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{org?.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{org?.code}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            header: 'Invoice',
            cell: (payment) => (
                <>
                    <span className="font-mono text-sm">{payment.invoice_number}</span>
                    {payment.reference_number && (
                        <p className="text-xs text-muted-foreground">Ref: {payment.reference_number}</p>
                    )}
                </>
            )
        },
        {
            header: 'Amount',
            cell: (payment) => (
                <>
                    <span className="font-semibold text-foreground">
                        {payment.currency === 'USD' ? '$' : payment.currency === 'EUR' ? '€' : payment.currency === 'XAF' ? 'CFA ' : '£'}
                        {payment.amount.toLocaleString()}
                    </span>
                    <p className="text-xs text-muted-foreground capitalize">{payment.billing_period}</p>
                </>
            )
        },
        {
            header: 'Method',
            className: 'capitalize text-sm',
            cell: (payment) => payment.payment_method.replace('_', ' ')
        },
        {
            header: 'Type',
            className: 'capitalize text-sm',
            cell: (payment) => payment.payment_type
        },
        {
            header: 'Date',
            className: 'text-sm',
            cell: (payment) => (
                payment.payment_date
                    ? format(new Date(payment.payment_date), 'MMM d, yyyy')
                    : format(new Date(payment.created_at), 'MMM d, yyyy')
            )
        },
        {
            header: 'Status',
            cell: (payment) => (
                <Badge className={cn(paymentStatusColors[payment.status], "capitalize")}>
                    {payment.status}
                </Badge>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (payment) => (
                <>
                    {payment.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmPayment(payment)}
                                disabled={updatePaymentMutation.isPending}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectPayment(payment)}
                                disabled={updatePaymentMutation.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    {payment.status === 'completed' && (
                        <span className="text-xs text-primary flex items-center justify-end gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Confirmed
                        </span>
                    )}
                    {payment.status === 'cancelled' && (
                        <span className="text-xs text-muted-foreground">Cancelled</span>
                    )}
                </>
            )
        }
    ];

    const orgStatsColumns: Column<any>[] = [
        {
            header: 'Organization',
            cell: (org) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {org.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{org.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{org.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Vendors',
            cell: (org) => (
                <>
                    <span className="font-medium">{org.vendorCount}</span>
                    <span className="text-muted-foreground"> / {org.max_vendors}</span>
                </>
            )
        },
        {
            header: 'Users',
            cell: (org) => (
                <>
                    <span className="font-medium">{org.userCount}</span>
                    <span className="text-muted-foreground"> / {org.max_users}</span>
                </>
            )
        },
        {
            header: 'Products',
            cell: (org) => org.productCount
        },
        {
            header: 'Storage',
            cell: (org) => (
                org.estimatedStorageKB > 1024
                    ? `${(org.estimatedStorageKB / 1024).toFixed(1)} MB`
                    : `${org.estimatedStorageKB.toFixed(0)} KB`
            )
        },
        {
            header: 'Revenue (MTD)',
            className: 'font-medium text-primary',
            cell: (org) => `$${org.thisMonthRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        },
        {
            header: 'Status',
            cell: (org) => <Badge className={statusColors[org.status]}>{org.status}</Badge>
        },
        {
            header: '',
            className: 'w-12',
            cell: (org) => (
                <Link href={createPageUrl(`OrganizationMembers?id=${org.id}`)}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
            )
        }
    ];

    const subscriptionColumns: Column<any>[] = [
        {
            header: 'Organization',
            cell: (org) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {org.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{org.name}</p>
                        <p className="text-sm text-slate-500 font-mono">{org.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Plan',
            cell: (org) => (
                <Badge className={cn(
                    "capitalize",
                    org.subscription_plan === 'enterprise' && "bg-primary/20 text-primary",
                    org.subscription_plan === 'business' && "bg-primary/10 text-primary",
                    (!org.subscription_plan || org.subscription_plan === 'starter') && "bg-muted text-muted-foreground"
                )}>
                    <Crown className="h-3 w-3 mr-1" />
                    {org.subscription_plan || 'starter'}
                </Badge>
            )
        },
        {
            header: 'Billing Cycle',
            className: 'capitalize text-sm font-medium',
            cell: (org) => org.billing_cycle || 'monthly'
        },
        {
            header: 'Amount',
            cell: (org) => (
                <>
                    <span className="font-semibold text-slate-900">
                        ${org.billingAmount}
                    </span>
                    <span className="text-xs text-slate-400">
                        /{org.billing_cycle === 'yearly' ? 'yr' : 'mo'}
                    </span>
                </>
            )
        },
        {
            header: 'Last Payment',
            cell: (org) => (
                org.lastPayment ? (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                            {format(new Date(org.lastPayment.payment_date || org.lastPayment.created_at), 'MMM d, yyyy')}
                        </span>
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">No payment yet</span>
                )
            )
        },
        {
            header: 'Next Billing',
            cell: (org) => (
                org.nextBillingDate ? (
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={cn(
                            "text-sm",
                            new Date() > org.nextBillingDate && "text-destructive font-medium"
                        )}>
                            {format(org.nextBillingDate, 'MMM d, yyyy')}
                        </span>
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                )
            )
        },
        {
            header: 'Payment Status',
            cell: (org) => (
                <Badge className={cn(
                    org.paymentStatus === 'paid' && "bg-primary/10 text-primary",
                    org.paymentStatus === 'pending' && "bg-yellow-500/10 text-yellow-600",
                    org.paymentStatus === 'overdue' && "bg-destructive/10 text-destructive",
                    org.paymentStatus === 'no_payment' && "bg-muted text-muted-foreground"
                )}>
                    {org.paymentStatus === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {org.paymentStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {org.paymentStatus === 'overdue' && <AlertCircle className="h-3 w-3 mr-1" />}
                    <span className="capitalize">{org.paymentStatus.replace('_', ' ')}</span>
                </Badge>
            )
        },
        {
            header: 'Total Paid',
            cell: (org) => (
                <>
                    <div className="flex items-center gap-1">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">
                            ${org.totalPaid.toLocaleString()}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{org.completedPaymentsCount} payments</p>
                </>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (org) => (
                <div className="flex justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSubscription(org)}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setPaymentForm(prev => ({
                                ...prev,
                                organization_id: org.id,
                                amount: org.billingAmount.toString(),
                                payment_type: 'subscription'
                            }));
                            setIsPaymentDialogOpen(true);
                        }}
                        className="text-primary hover:text-primary/90 hover:bg-primary/10"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Payment
                    </Button>
                </div>
            )
        }
    ];

    // Growth chart data (last 30 days)
    const growthChartData = useMemo(() => {
        const days = 30;
        const data = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(now, i);
            const dateStr = format(date, 'yyyy-MM-dd');

            const orgsUpToDate = organizations.filter(o =>
                format(new Date(o.created_at), 'yyyy-MM-dd') <= dateStr
            ).length;

            const vendorsUpToDate = vendors.filter(v =>
                format(new Date(v.created_at), 'yyyy-MM-dd') <= dateStr
            ).length;

            data.push({
                name: format(date, 'MMM d'),
                organizations: orgsUpToDate,
                vendors: vendorsUpToDate
            });
        }
        return data;
    }, [organizations, vendors]);

    if (isLoading) {
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
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Platform Overview</h1>
                    <p className="text-muted-foreground mt-1">Manage and monitor all organizations</p>
                </div>
                <Link href={createPageUrl("Organizations")}>
                    <Button className="bg-primary hover:bg-primary/90">
                        <Building2 className="h-4 w-4 mr-2" />
                        Manage Organizations
                    </Button>
                </Link>
            </div>

            {/* Platform KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{platformStats.totalOrganizations}</p>
                                <p className="text-sm text-muted-foreground">Total Organizations</p>
                                <p className="text-xs text-primary">{platformStats.activeOrganizations} active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                                <Store className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{platformStats.totalVendors}</p>
                                <p className="text-sm text-muted-foreground">Total Vendors</p>
                                <p className="text-xs text-primary">{platformStats.activeVendors} active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{platformStats.totalUsers}</p>
                                <p className="text-sm text-muted-foreground">Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    ${platformStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                                <p className="text-sm text-muted-foreground">Platform Revenue (MTD)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Storage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className='p-6'>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-muted-foreground" />
                            Storage Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-primary">
                                    {platformStats.totalStorageKB > 1024
                                        ? `${(platformStats.totalStorageKB / 1024).toFixed(1)} MB`
                                        : `${platformStats.totalStorageKB.toFixed(0)} KB`}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Total Estimated Storage</p>
                            </div>
                            <div className="pt-4 border-t space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Avg per Organization</span>
                                    <span className="font-medium">{platformStats.avgStoragePerOrg.toFixed(1)} KB</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Products</span>
                                    <span className="font-medium">{platformStats.totalProducts}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Sales Records</span>
                                    <span className="font-medium">{platformStats.totalSales}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className='p-6'>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                            Organization Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={orgStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {orgStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {orgStatusData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-sm text-muted-foreground capitalize">{entry.name} ({entry.value})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className='p-6'>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentOrgActivity.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">No new organizations in the last 7 days</p>
                        ) : (
                            <div className="space-y-3">
                                {recentOrgActivity.map(org => (
                                    <div key={org.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                {org.name?.charAt(0) || 'O'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{org.name}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(org.created_at), 'MMM d, yyyy')}</p>
                                            </div>
                                        </div>
                                        <Badge className={statusColors[org.status]}>{org.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Subscription Management Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className='p-6'>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                            Subscription Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-primary">
                                    ${estimatedMRR.toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Estimated MRR</p>
                            </div>
                            <div className="pt-4 border-t space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Active Subscriptions</span>
                                    <span className="font-medium">{platformStats.activeOrganizations}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Annual Revenue (Est.)</span>
                                    <span className="font-medium">${(estimatedMRR * 12).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Avg. Revenue/Org</span>
                                    <span className="font-medium">
                                        ${platformStats.activeOrganizations > 0
                                            ? Math.round(estimatedMRR / platformStats.activeOrganizations)
                                            : 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className='p-6'>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-muted-foreground" />
                            Plan Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subscriptionPlanData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {subscriptionPlanData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {subscriptionPlanData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-sm text-muted-foreground">{entry.name} ({entry.value})</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className='p-6'>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            Pending Approvals
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingOrganizations.length === 0 ? (
                            <div className="text-center py-6">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">No pending organizations</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendingOrganizations.slice(0, 5).map(org => (
                                    <div key={org.id} className="flex items-center justify-between p-2 rounded-md bg-amber-50 border border-amber-200">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-amber-100 flex items-center justify-center">
                                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{org.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{org.subscription_plan || 'starter'} plan</p>
                                            </div>
                                        </div>
                                        <Link href={createPageUrl(`OrganizationMembers?id=${org.id}`)}>
                                            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                                                Review
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                                {pendingOrganizations.length > 5 && (
                                    <p className="text-xs text-center text-slate-500">
                                        +{pendingOrganizations.length - 5} more pending
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Payment Management Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Payment Management</h2>
                        <p className="text-sm text-muted-foreground">Track and confirm subscription payments</p>
                    </div>
                    <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90">
                                <Plus className="h-4 w-4 mr-2" />
                                Record Payment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Record New Payment</DialogTitle>
                                <DialogDescription>
                                    Manually record a payment received from an organization.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="org">Organization *</Label>
                                    <Select
                                        value={paymentForm.organization_id}
                                        onValueChange={(value) => setPaymentForm({ ...paymentForm, organization_id: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select organization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {organizations.map(org => (
                                                <SelectItem key={org.id} value={org.id}>
                                                    {org.name} ({org.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={paymentForm.amount}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency</Label>
                                        <Select
                                            value={paymentForm.currency}
                                            onValueChange={(value) => setPaymentForm({ ...paymentForm, currency: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                                <SelectItem value="XAF">XAF (CFA)</SelectItem>
                                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="method">Payment Method</Label>
                                        <Select
                                            value={paymentForm.payment_method}
                                            onValueChange={(value: 'bank_transfer' | 'card' | 'mobile_money' | 'paypal' | 'stripe' | 'other') =>
                                                setPaymentForm({ ...paymentForm, payment_method: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                                <SelectItem value="card">Card</SelectItem>
                                                <SelectItem value="paypal">PayPal</SelectItem>
                                                <SelectItem value="stripe">Stripe</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Payment Type</Label>
                                        <Select
                                            value={paymentForm.payment_type}
                                            onValueChange={(value: 'subscription' | 'addon' | 'upgrade' | 'renewal') =>
                                                setPaymentForm({ ...paymentForm, payment_type: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="subscription">Subscription</SelectItem>
                                                <SelectItem value="renewal">Renewal</SelectItem>
                                                <SelectItem value="upgrade">Upgrade</SelectItem>
                                                <SelectItem value="addon">Add-on</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="billing">Billing Period</Label>
                                        <Select
                                            value={paymentForm.billing_period}
                                            onValueChange={(value: 'monthly' | 'yearly') =>
                                                setPaymentForm({ ...paymentForm, billing_period: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Monthly</SelectItem>
                                                <SelectItem value="yearly">Yearly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={paymentForm.status}
                                            onValueChange={(value: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled') =>
                                                setPaymentForm({ ...paymentForm, status: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="failed">Failed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reference">Reference Number</Label>
                                        <Input
                                            id="reference"
                                            placeholder="e.g., TRX123456"
                                            value={paymentForm.reference_number}
                                            onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Payment Date</Label>
                                        <DatePicker
                                            date={paymentForm.payment_date}
                                            onChange={(date) => setPaymentForm({ ...paymentForm, payment_date: date })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Additional notes about this payment..."
                                        value={paymentForm.notes}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreatePayment}
                                    disabled={!paymentForm.organization_id || !paymentForm.amount || createPaymentMutation.isPending}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    {createPaymentMutation.isPending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Receipt className="h-4 w-4 mr-2" />
                                            Record Payment
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Payment Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                                    <Banknote className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-primary">
                                        ${paymentStats.totalRevenue.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Total Confirmed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-md bg-amber-100 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-amber-600">
                                        ${paymentStats.pendingAmount.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{paymentStats.pendingPayments} Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-primary">
                                        ${paymentStats.thisMonthRevenue.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-muted-foreground">This Month</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                                    <FileCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-primary">
                                        {paymentStats.completedPayments}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Completed Payments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payments Table */}
                <Card className="p-4">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-muted-foreground" />
                            Payment Records
                        </CardTitle>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search payments..."
                                    className="pl-9 w-full sm:w-64"
                                    value={paymentSearch}
                                    onChange={(e) => setPaymentSearch(e.target.value)}
                                />
                            </div>
                            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                    <SelectItem value="refunded">Refunded</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            data={filteredPayments.slice(0, 10)}
                            columns={paymentColumns}
                            isLoading={loadingPayments}
                            emptyMessage="No payment records found"
                        />
                        {filteredPayments.length > 10 && (
                            <div className="text-center py-3 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Showing 10 of {filteredPayments.length} payments
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Growth Chart */}
            <Card className='p-6'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                        Platform Growth (Last 30 Days)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthChartData}>
                                <defs>
                                    <linearGradient id="orgGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="vendorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                                <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                                <Tooltip />
                                <Area type="monotone" dataKey="organizations" stroke="#10b981" fill="url(#orgGradient)" strokeWidth={2} name="Organizations" />
                                <Area type="monotone" dataKey="vendors" stroke="var(--chart-2)" fill="url(#vendorGradient)" strokeWidth={2} name="Vendors" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Organizations Table */}
            <Card className='p-4'>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        All Organizations
                    </CardTitle>
                    <Link href={createPageUrl("Organizations")}>
                        <Button variant="outline" size="sm">
                            View All <ArrowUpRight className="h-4 w-4 ml-1" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent className="p-0">
                    <DataTable
                        data={orgStats.slice(0, 10)}
                        columns={orgStatsColumns}
                        emptyMessage="No organizations found"
                    />
                </CardContent>
            </Card>

            {/* Subscription Management Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Subscription Management</h2>
                        <p className="text-sm text-muted-foreground">View and manage organization subscription plans and billing</p>
                    </div>
                </div>

                {/* Subscription Table */}
                <Card className="p-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-500" />
                            Organization Subscriptions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable
                            data={orgSubscriptionStats}
                            columns={subscriptionColumns}
                            isLoading={loadingOrgs || loadingPayments}
                            emptyMessage="No organizations found"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Edit Subscription Dialog */}
            <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Crown className="h-5 w-5 text-amber-500" />
                            Edit Subscription
                        </DialogTitle>
                        <DialogDescription>
                            Update subscription details for {selectedOrgForSubscription?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan">Subscription Plan</Label>
                            <Select
                                value={subscriptionForm.subscription_plan}
                                onValueChange={(value) => {
                                    const planPrices = subscriptionPlanPricing[value] || subscriptionPlanPricing.starter;
                                    setSubscriptionForm({
                                        ...subscriptionForm,
                                        subscription_plan: value,
                                        max_vendors: planPrices.maxVendors,
                                        max_users: planPrices.maxUsers
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="starter">
                                        <div className="flex items-center gap-2">
                                            <span>Starter</span>
                                            <span className="text-xs text-slate-400">$29/mo</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="business">
                                        <div className="flex items-center gap-2">
                                            <span>Business</span>
                                            <span className="text-xs text-slate-400">$79/mo</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="enterprise">
                                        <div className="flex items-center gap-2">
                                            <span>Enterprise</span>
                                            <span className="text-xs text-slate-400">$199/mo</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="billing">Billing Cycle</Label>
                                <Select
                                    value={subscriptionForm.billing_cycle}
                                    onValueChange={(value: 'monthly' | 'yearly') =>
                                        setSubscriptionForm({ ...subscriptionForm, billing_cycle: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="yearly">Yearly (Save 17%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={subscriptionForm.status}
                                    onValueChange={(value: 'active' | 'inactive' | 'suspended' | 'pending') =>
                                        setSubscriptionForm({ ...subscriptionForm, status: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="max_vendors">Max Vendors</Label>
                                <Input
                                    id="max_vendors"
                                    type="number"
                                    value={subscriptionForm.max_vendors}
                                    onChange={(e) => setSubscriptionForm({
                                        ...subscriptionForm,
                                        max_vendors: parseInt(e.target.value) || 0
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max_users">Max Users</Label>
                                <Input
                                    id="max_users"
                                    type="number"
                                    value={subscriptionForm.max_users}
                                    onChange={(e) => setSubscriptionForm({
                                        ...subscriptionForm,
                                        max_users: parseInt(e.target.value) || 0
                                    })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="trial_ends">Trial Ends At</Label>
                            <DatePicker
                                date={subscriptionForm.trial_ends_at}
                                onChange={(date) => setSubscriptionForm({
                                    ...subscriptionForm,
                                    trial_ends_at: date
                                })}
                            />
                            <p className="text-xs text-slate-400">Leave empty if no trial period</p>
                        </div>

                        {/* Plan summary */}
                        <div className="mt-2 p-4 bg-muted/30 rounded-md">
                            <h4 className="font-medium text-slate-900 mb-2">Plan Summary</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Plan:</span>
                                    <span className="font-medium capitalize">{subscriptionForm.subscription_plan}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Billing:</span>
                                    <span className="font-medium capitalize">{subscriptionForm.billing_cycle}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Price:</span>
                                    <span className="font-medium text-primary">
                                        ${subscriptionForm.billing_cycle === 'yearly'
                                            ? subscriptionPlanPricing[subscriptionForm.subscription_plan]?.yearly || 290
                                            : subscriptionPlanPricing[subscriptionForm.subscription_plan]?.monthly || 29
                                        }/{subscriptionForm.billing_cycle === 'yearly' ? 'year' : 'month'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Limits:</span>
                                    <span className="font-medium">{subscriptionForm.max_vendors} vendors, {subscriptionForm.max_users} users</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubscriptionDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveSubscription}
                            disabled={updateOrganizationMutation.isPending}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {updateOrganizationMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
