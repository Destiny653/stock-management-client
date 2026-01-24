import React, { useMemo, useState } from 'react';
import { createPageUrl } from "@/utils";
import { base44, Alert } from "@/api/base44Client";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function Alerts() {
    const { t } = useSafeLanguage();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("all");

    const alertConfigMap = useMemo(() => ({
        low_stock: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100", label: t('lowStockLabel') },
        out_of_stock: { icon: Package, color: "text-rose-600", bg: "bg-rose-100", label: t('outOfStockLabel') },
        expiring: { icon: Clock, color: "text-orange-600", bg: "bg-orange-100", label: t('expiringLabel') },
        pending_approval: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100", label: t('pendingApprovalLabel') },
        po_received: { icon: Package, color: "text-emerald-600", bg: "bg-emerald-100", label: t('poReceivedLabel') },
        system: { icon: Bell, color: "text-slate-600", bg: "bg-slate-100", label: t('systemLabel') }
    }), [t]);

    const priorityConfigMap = useMemo(() => ({
        low: { color: "bg-slate-100 text-slate-600", label: t('lowPriority') },
        medium: { color: "bg-blue-100 text-blue-700", label: t('mediumPriority') },
        high: { color: "bg-amber-100 text-amber-700", label: t('highPriority') },
        critical: { color: "bg-rose-100 text-rose-700", label: t('criticalPriority') }
    }), [t]);

    const { data: alerts = [], isLoading } = useQuery<Alert[]>({
        queryKey: ['alerts'],
        queryFn: () => base44.entities.Alert.list(),
    });

    const updateAlertMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { is_read?: boolean; is_dismissed?: boolean } }) => base44.entities.Alert.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
    });

    const deleteAlertMutation = useMutation({
        mutationFn: (id: string) => base44.entities.Alert.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            toast.success(t('alertDeleted'));
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: (organizationId: string) => base44.entities.Alert.markAllRead(organizationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            toast.success(t('allMarkedRead'));
        },
        onError: () => {
            toast.error(t('error'));
        }
    });

    const markAsRead = async (alertId: string) => {
        await updateAlertMutation.mutateAsync({ id: alertId, data: { is_read: true } });
    };

    const markAllAsRead = async () => {
        const user = JSON.parse(localStorage.getItem('base44_currentUser') || '{}');
        if (user.organization_id) {
            await markAllReadMutation.mutateAsync(user.organization_id);
        }
    };

    const dismissAlert = async (alertId: string) => {
        await updateAlertMutation.mutateAsync({ id: alertId, data: { is_dismissed: true } });
        toast.success(t('alertDismissed'));
    };

    const deleteAlert = async (alertId: string) => {
        await deleteAlertMutation.mutateAsync(alertId);
    };

    const unreadCount = useMemo(() => alerts.filter(a => !a.is_read).length, [alerts]);
    const lowStockCount = useMemo(() => alerts.filter(a => a.type === 'low_stock' || a.type === 'out_of_stock').length, [alerts]);
    const pendingCount = useMemo(() => alerts.filter(a => a.type === 'pending_approval').length, [alerts]);

    const filteredAlerts = useMemo(() => {
        if (activeTab === "all") return alerts;
        if (activeTab === "unread") return alerts.filter(a => !a.is_read);
        if (activeTab === "low_stock") return alerts.filter(a => a.type === 'low_stock' || a.type === 'out_of_stock');
        if (activeTab === "pending_approval") return alerts.filter(a => a.type === 'pending_approval');
        return alerts;
    }, [alerts, activeTab]);

    // Group by date
    const groupedAlerts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const groups: Record<string, { title: string; alerts: Alert[] }> = {
            today: { title: t('today'), alerts: [] },
            yesterday: { title: t('yesterday'), alerts: [] },
            older: { title: t('older'), alerts: [] }
        };

        filteredAlerts.forEach(alert => {
            const date = new Date(alert.created_at);
            date.setHours(0, 0, 0, 0);

            if (date.getTime() === today.getTime()) {
                groups.today.alerts.push(alert);
            } else if (date.getTime() === yesterday.getTime()) {
                groups.yesterday.alerts.push(alert);
            } else {
                groups.older.alerts.push(alert);
            }
        });

        return groups;
    }, [filteredAlerts, t]);

    const renderGroup = (groupData: { title: string; alerts: Alert[] }) => {
        if (groupData.alerts.length === 0) return null;

        return (
            <div className="space-y-4 mb-8">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-1">
                    {groupData.title}
                </h3>
                <div className="space-y-3">
                    {groupData.alerts.map((alert) => {
                        const config = (alertConfigMap as any)[alert.type] || alertConfigMap.system;
                        const priority = (priorityConfigMap as any)[alert.priority] || priorityConfigMap.low;
                        const Icon = config.icon;

                        return (
                            <Card
                                key={alert.id}
                                className={cn(
                                    "transition-all hover:shadow-md border-slate-200",
                                    !alert.is_read && "border-l-4 border-l-emerald-500 bg-emerald-50/20"
                                )}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", config.bg)}>
                                            <Icon className={cn("h-5 w-5", config.color)} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className={cn(
                                                            "font-semibold text-slate-900",
                                                            !alert.is_read ? "text-slate-900" : "text-slate-600"
                                                        )}>
                                                            {alert.title}
                                                        </h4>
                                                        <Badge variant="secondary" className={cn("capitalize px-2 py-0 text-[10px] font-bold", priority.color)}>
                                                            {priority.label}
                                                        </Badge>
                                                        {!alert.is_read && (
                                                            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 leading-relaxed">{alert.message}</p>
                                                    <div className="flex items-center gap-2 pt-1">
                                                        <Clock className="h-3 w-3 text-slate-400" />
                                                        <p className="text-xs text-slate-400">
                                                            {format(new Date(alert.created_at), "h:mm a")}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Actions will show on hover or always on mobile */}
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {!alert.is_read && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        disabled={updateAlertMutation.isPending}
                                                                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                                                        onClick={() => markAsRead(alert.id)}
                                                                    >
                                                                        {updateAlertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t('markAsRead')}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={updateAlertMutation.isPending}
                                                                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                                                    onClick={() => dismissAlert(alert.id)}
                                                                >
                                                                    {updateAlertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('archive')}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={deleteAlertMutation.isPending}
                                                                    className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                                                    onClick={() => deleteAlert(alert.id)}
                                                                >
                                                                    {deleteAlertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('delete')}</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>

                                            {alert.action_url && (
                                                <div className="mt-4">
                                                    <Link href={createPageUrl(alert.action_url)}>
                                                        <Button size="sm" variant="outline" className="h-8 px-4 text-xs font-semibold hover:bg-slate-50 border-slate-200">
                                                            {t('viewDetails')}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('alertsNotifications')}</h1>
                    <p className="text-slate-500 mt-1">
                        {unreadCount > 0 ? `${unreadCount} ${t('unreadAlertsCount')}` : t('allCaughtUp')}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        onClick={markAllAsRead}
                        disabled={markAllReadMutation.isPending}
                        className="border-slate-200 hover:bg-slate-50 shadow-sm"
                    >
                        {markAllReadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Check className="h-4 w-4 mr-2" />
                        )}
                        {t('markAllAsRead')}
                    </Button>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className={cn("cursor-pointer transition-all hover:border-emerald-200 shadow-sm", activeTab === "low_stock" ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200")} onClick={() => setActiveTab("low_stock")}>
                    <CardContent className="p-4 py-12 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shadow-inner">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none mb-1">{lowStockCount}</p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('lowStockAlerts')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-all hover:border-emerald-200 shadow-sm", activeTab === "pending_approval" ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200")} onClick={() => setActiveTab("pending_approval")}>
                    <CardContent className="p-4 py-12 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-inner">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none mb-1">{pendingCount}</p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pendingApprovals')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className={cn("cursor-pointer transition-all hover:border-emerald-200 shadow-sm", activeTab === "unread" ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200")} onClick={() => setActiveTab("unread")}>
                    <CardContent className="p-4 py-12 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center shadow-inner">
                            <Bell className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 leading-none mb-1">{unreadCount}</p>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('unreadAlerts')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-100 p-1 rounded-xl w-fit">
                <TabsList className="bg-transparent gap-1">
                    <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm px-6 font-semibold">{t('all')}</TabsTrigger>
                    <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm px-6 font-semibold">{t('unread')}</TabsTrigger>
                    <TabsTrigger value="low_stock" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm px-6 font-semibold">{t('lowStock')}</TabsTrigger>
                    <TabsTrigger value="pending_approval" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm px-6 font-semibold">{t('approvals')}</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Alerts List */}
            <div>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white overflow-hidden">
                        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                        <p className="text-sm font-medium text-slate-500 italic">{t('syncingNotifications')}</p>
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <Card className="border-slate-200 border-dashed bg-transparent shadow-none">
                        <CardContent className="p-16 text-center">
                            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <CheckCircle className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{t('allCaughtUp')}</h3>
                            <p className="text-slate-500 mt-2 max-w-xs mx-auto">{t('noCategoryAlerts')}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {renderGroup(groupedAlerts.today)}
                        {renderGroup(groupedAlerts.yesterday)}
                        {renderGroup(groupedAlerts.older)}
                    </div>
                )}
            </div>
        </div>
    );
}