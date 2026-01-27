import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { base44, type Vendor, type VendorPayment } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    DollarSign,
    CheckCircle,
    Clock,
    AlertTriangle,
    Loader2,
    Eye,
    CreditCard,
    TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
    }
}

const paymentStatusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-emerald-100 text-emerald-700",
    failed: "bg-rose-100 text-rose-700",
    refunded: "bg-slate-100 text-slate-600"
};

export default function VendorPayments() {
    const { t } = useSafeLanguage();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const { data: payments = [], isLoading: loadingPayments } = useQuery<VendorPayment[]>({
        queryKey: ['payments'],
        queryFn: () => base44.entities.VendorPayment.list(),
    });

    const { data: vendors = [], isLoading: loadingVendors } = useQuery<Vendor[]>({
        queryKey: ['vendors'],
        queryFn: () => base44.entities.Vendor.list(),
    });

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const isLoading = loadingPayments || loadingVendors;

    const confirmPaymentMutation = useMutation({
        mutationFn: ({ paymentId, data }: { paymentId: string; data: any }) => base44.entities.VendorPayment.update(paymentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            toast.success("Payment confirmed");
        },
    });

    const updateVendorMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => base44.entities.Vendor.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
    });

    const handleConfirmPayment = async (payment: any) => {
        await confirmPaymentMutation.mutateAsync({
            paymentId: payment.id,
            data: {
                status: 'confirmed',
                confirmed_by: user?.email,
                confirmed_date: new Date().toISOString()
            }
        });

        // Update vendor payment status
        const vendor = vendors.find((v: any) => v.id === payment.vendor_id);
        if (vendor) {
            await updateVendorMutation.mutateAsync({
                id: vendor.id,
                data: {
                    payment_status: 'paid',
                    last_payment_date: new Date().toISOString().split('T')[0]
                }
            });
        }
    };

    const columns: Column<VendorPayment>[] = [
        {
            header: t('date'),
            cell: (payment) => format(new Date(payment.created_at), 'MMM d, yyyy')
        },
        {
            header: t('vendor'),
            cell: (payment) => (
                <Link
                    href={createPageUrl(`VendorDetail?id=${payment.vendor_id}`)}
                    className="font-medium text-slate-900 hover:text-emerald-600"
                >
                    {payment.vendor_name}
                </Link>
            )
        },
        {
            header: t('paymentType'),
            className: 'capitalize',
            cell: (payment) => payment.payment_type
        },
        {
            header: t('amount'),
            className: 'font-bold text-emerald-600',
            cell: (payment) => `$${payment.amount?.toLocaleString()}`
        },
        {
            header: t('method'),
            className: 'capitalize text-slate-600',
            cell: (payment) => payment.payment_method?.replace('_', ' ')
        },
        {
            header: t('reference'),
            className: 'text-slate-600 font-mono text-sm',
            cell: (payment) => payment.reference_number || '-'
        },
        {
            header: t('status'),
            cell: (payment) => (
                <Badge className={paymentStatusColors[payment.status]}>
                    {payment.status}
                </Badge>
            )
        },
        {
            header: t('confirmedBy'),
            className: 'text-sm text-slate-500',
            cell: (payment) => payment.confirmed_by || '-'
        },
        {
            header: t('actions'),
            cell: (payment) => (
                payment.status === 'pending' ? (
                    <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleConfirmPayment(payment)}
                        disabled={confirmPaymentMutation.isPending}
                    >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t('confirm')}
                    </Button>
                ) : (
                    <Link href={createPageUrl(`VendorDetail?id=${payment.vendor_id}`)}>
                        <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            {t('view')}
                        </Button>
                    </Link>
                )
            )
        }
    ];

    const filteredPayments = useMemo(() => {
        let result = [...payments];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter((p: any) =>
                p.vendor_name?.toLowerCase().includes(search) ||
                p.reference_number?.toLowerCase().includes(search)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter((p: any) => p.status === statusFilter);
        }

        if (typeFilter !== "all") {
            result = result.filter((p: any) => p.payment_type === typeFilter);
        }

        return result;
    }, [payments, searchTerm, statusFilter, typeFilter]);

    // Stats
    const stats = {
        total: payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        pending: payments.filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        confirmed: payments.filter((p: any) => p.status === 'confirmed').reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        pendingCount: payments.filter((p: any) => p.status === 'pending').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('paymentManagement')}</h1>
                    <p className="text-slate-500 mt-1">{t('reviewConfirmPayments')}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className='py-10'>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{t('totalCollected')}</p>
                                <p className="text-2xl font-bold text-slate-900">${stats.confirmed.toLocaleString()}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className='py-10'>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{t('pendingAmount')}</p>
                                <p className="text-2xl font-bold text-amber-600">${stats.pending.toLocaleString()}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className='py-10'>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{t('pendingReviews')}</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.pendingCount}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-slate-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className='py-10'>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">{t('totalPayments')}</p>
                                <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-emerald-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder={t('searchByVendorReference')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 rounded-sm py-5 max-w-[60%] bg-white border-slate-200 focus:bg-white"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-white rounded-sm py-5">
                            <SelectValue placeholder={t('status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allStatus')}</SelectItem>
                            <SelectItem value="pending">{t('pending')}</SelectItem>
                            <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                            <SelectItem value="failed">{t('error')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-40 bg-white rounded-sm py-5">
                            <SelectValue placeholder={t('paymentType')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('allTypes')}</SelectItem>
                            <SelectItem value="subscription">{t('subscription')}</SelectItem>
                            <SelectItem value="commission">{t('commission')}</SelectItem>
                            <SelectItem value="other">{t('other')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Payments Table */}
            <Card>
                <CardContent className="p-0">
                    <DataTable
                        data={filteredPayments}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage={t('noPaymentsFound')}
                    />
                </CardContent>
            </Card>
        </div>
    );
}