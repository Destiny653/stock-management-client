import React, { useState } from 'react';
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bell,
    AlertTriangle,
    Package,
    Clock,
    CheckCircle,
    X,
    Loader2,
    Trash2,
    Check,
    Archive
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/components/i18n/LanguageContext";
import Link from 'next/link';

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return {
            t: (key: string) => key,
            language: 'en',
            setLanguage: () => { },
            translations: {} as any
        };
    }
}

const alertConfig = {
    low_stock: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100", label: "Low Stock" },
    out_of_stock: { icon: Package, color: "text-rose-600", bg: "bg-rose-100", label: "Out of Stock" },
    expiring: { icon: Clock, color: "text-orange-600", bg: "bg-orange-100", label: "Expiring Soon" },
    pending_approval: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100", label: "Pending Approval" },
    po_received: { icon: Package, color: "text-emerald-600", bg: "bg-emerald-100", label: "PO Received" },
    system: { icon: Bell, color: "text-slate-600", bg: "bg-slate-100", label: "System" }
};

const priorityColors = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-amber-100 text-amber-700",
    critical: "bg-rose-100 text-rose-700"
};

type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

interface Alert {
    id: string | number;
    type: string;
    is_read: boolean;
    is_dismissed: boolean;
    title: string;
    message: string;
    priority: AlertPriority;
    created_date: string;
    action_url?: string;
}

export default function Alerts() {
    const { t } = useSafeLanguage();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("all");

    const { data: alerts = [], isLoading } = useQuery<Alert[]>({
        queryKey: ['alerts'],
        queryFn: () => base44.entities.Alert.list('-created_date') as Promise<Alert[]>,
        initialData: [],
    });

    const updateAlertMutation = useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: { is_read?: boolean; is_dismissed?: boolean } }) => base44.entities.Alert.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });

    const deleteAlertMutation = useMutation({
        mutationFn: (id: string | number) => base44.entities.Alert.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            toast.success("Alert deleted");
        },
    });

    const markAsRead = async (alertId: string | number) => {
        await updateAlertMutation.mutateAsync({ id: alertId, data: { is_read: true } });
    };

    const markAllAsRead = async () => {
        const unreadAlerts = alerts.filter(a => !a.is_read);
        for (const alert of unreadAlerts) {
            await updateAlertMutation.mutateAsync({ id: alert.id, data: { is_read: true } });
        }
        toast.success(t('allMarkedRead'));
    };

    const dismissAlert = async (alertId: string | number) => {
        await updateAlertMutation.mutateAsync({ id: alertId, data: { is_dismissed: true } });
        toast.success(t('alertDismissed'));
    };

    const deleteAlert = async (alertId: string | number) => {
        await deleteAlertMutation.mutateAsync(alertId);
    };

    const filteredAlerts = alerts.filter(a => {
        if (a.is_dismissed) return false;
        if (activeTab === "all") return true;
        if (activeTab === "unread") return !a.is_read;
        return a.type === activeTab;
    });

    const unreadCount = alerts.filter(a => !a.is_read && !a.is_dismissed).length;
    const lowStockCount = alerts.filter(a => a.type === 'low_stock' && !a.is_dismissed).length;
    const pendingCount = alerts.filter(a => a.type === 'pending_approval' && !a.is_dismissed).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('alertsNotifications')}</h1>
                    <p className="text-slate-500 mt-1">
                        {unreadCount > 0 ? `${unreadCount} ${t('unreadAlertsCount')}` : t('allCaughtUp')}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={markAllAsRead}>
                        <Check className="h-4 w-4 mr-2" />
                        {t('markAllAsRead')}
                    </Button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className={cn("cursor-pointer transition-all", activeTab === "low_stock" && "ring-2 ring-teal-500")} onClick={() => setActiveTab("low_stock")}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{lowStockCount}</p>
                            <p className="text-sm text-slate-500">{t('lowStockAlerts')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-all", activeTab === "pending_approval" && "ring-2 ring-teal-500")} onClick={() => setActiveTab("pending_approval")}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                            <p className="text-sm text-slate-500">{t('pendingApprovals')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-all", activeTab === "unread" && "ring-2 ring-teal-500")} onClick={() => setActiveTab("unread")}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center">
                            <Bell className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
                            <p className="text-sm text-slate-500">{t('unreadAlerts')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-100">
                    <TabsTrigger value="all">{t('all')}</TabsTrigger>
                    <TabsTrigger value="unread">{t('unread')}</TabsTrigger>
                    <TabsTrigger value="low_stock">{t('lowStock')}</TabsTrigger>
                    <TabsTrigger value="pending_approval">{t('approvals')}</TabsTrigger>
                    <TabsTrigger value="expiring">{t('expiring')}</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Alerts List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900">{t('allCaughtUp')}</h3>
                            <p className="text-slate-500 mt-1">{t('noCategoryAlerts')}</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredAlerts.map((alert) => {
                        const config = alertConfig[alert.type as keyof typeof alertConfig] || alertConfig.system;
                        const Icon = config.icon;

                        return (
                            <Card
                                key={alert.id}
                                className={cn(
                                    "transition-all hover:shadow-md",
                                    !alert.is_read && "border-l-4 border-l-teal-500 bg-teal-50/30"
                                )}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                                            <Icon className={cn("h-5 w-5", config.color)} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-slate-900">{alert.title}</h4>
                                                        <Badge variant="outline" className={priorityColors[alert.priority]}>
                                                            {alert.priority}
                                                        </Badge>
                                                        {!alert.is_read && (
                                                            <span className="h-2 w-2 rounded-full bg-teal-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600">{alert.message}</p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        {format(new Date(alert.created_date), "MMM d, yyyy 'at' h:mm a")}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {!alert.is_read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => markAsRead(alert.id)}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => dismissAlert(alert.id)}
                                                    >
                                                        <Archive className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                                        onClick={() => deleteAlert(alert.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {alert.action_url && (
                                                <Link
                                                    href={createPageUrl(alert.action_url)}
                                                    className="inline-block mt-3"
                                                >
                                                    <Button size="sm" variant="outline">
                                                        {t('viewDetails')}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}