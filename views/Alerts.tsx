import React, { useMemo, useState } from 'react';
import { createPageUrl } from "@/utils";
import { base44, Alert } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bell,
    AlertTriangle,
    Package,
    Clock,
    CheckCircle,
    Check,
    Loader2,
    Trash2
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
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

export default function Alerts() {
    const { t } = useSafeLanguage();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("all");

    const alertConfigMap = useMemo(() => ({
        low_stock: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100", label: t('lowStockLabel') || "Low Stock" },
        out_of_stock: { icon: Package, color: "text-destructive", bg: "bg-destructive/10", label: t('outOfStockLabel') || "Out of Stock" },
        expiring: { icon: Clock, color: "text-orange-600", bg: "bg-orange-100", label: t('expiringLabel') || "Expiring Soon" },
        pending_approval: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100", label: t('pendingApprovalLabel') || "Pending Approval" },
        po_received: { icon: Package, color: "text-primary", bg: "bg-primary/10", label: t('poReceivedLabel') || "PO Received" },
        system: { icon: Bell, color: "text-muted-foreground", bg: "bg-muted", label: t('systemLabel') || "System" }
    }), [t]);

    const priorityConfigMap = {
        low: { color: "bg-muted text-muted-foreground", label: "Low" },
        medium: { color: "bg-blue-100 text-blue-700", label: "Medium" },
        high: { color: "bg-orange-100 text-orange-700", label: "High" },
        critical: { color: "bg-destructive/10 text-destructive", label: "Critical" }
    };

    const { data: alerts = [], isLoading } = useQuery({
        queryKey: ['alerts'],
        queryFn: () => base44.entities.Alert.list(),
        initialData: [],
    });

    const updateAlertMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Alert> }) => {
            return base44.entities.Alert.update(id, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
        },
        onError: () => {
            toast.error("Failed to update alert");
        }
    });

    const markAsRead = (id: string) => {
        updateAlertMutation.mutate({ id, data: { is_read: true } });
    };

    const markAllRead = () => {
        // Implementation for mark all read if API supported it in batch, or iterate
        // For now finding unread and updating them could be slow, user might just want individual or we need a bulk endpoint
        // Assuming we rely on individual click for now or wait for backend support
        toast.info("Marking all as read feature coming soon or requires individual click");
    };

    const deleteAlertMutation = useMutation({
        mutationFn: async (id: string) => {
            return base44.entities.Alert.delete(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            toast.success("Alert removed");
        }
    });

    const filteredAlerts = useMemo(() => {
        let filtered = [...alerts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (activeTab === 'unread') {
            filtered = filtered.filter(a => !a.is_read);
        } else if (activeTab === 'low_stock') {
            filtered = filtered.filter(a => a.type === 'low_stock' || a.type === 'out_of_stock');
        } else if (activeTab === 'pending_approval') {
            filtered = filtered.filter(a => a.type === 'pending_approval');
        }

        return filtered;
    }, [alerts, activeTab]);

    const lowStockCount = alerts.filter(a => (a.type === 'low_stock' || a.type === 'out_of_stock') && !a.is_read).length;
    const pendingCount = alerts.filter(a => a.type === 'pending_approval' && !a.is_read).length;
    const unreadCount = alerts.filter(a => !a.is_read).length;

    const groupedAlerts = useMemo(() => {
        const groups = {
            today: [] as Alert[],
            yesterday: [] as Alert[],
            older: [] as Alert[]
        };

        filteredAlerts.forEach(alert => {
            const date = new Date(alert.created_at);
            if (isToday(date)) {
                groups.today.push(alert);
            } else if (isYesterday(date)) {
                groups.yesterday.push(alert);
            } else {
                groups.older.push(alert);
            }
        });

        return groups;
    }, [filteredAlerts]);

    const renderGroup = (groupAlerts: Alert[], title?: string) => {
        if (groupAlerts.length === 0) return null;

        return (
            <div className="mb-6">
                {title && <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">{title}</h3>}
                <div className="space-y-3">
                    {groupAlerts.map(alert => {
                        const config = alertConfigMap[alert.type] || alertConfigMap.system;
                        const Icon = config.icon;

                        return (
                            <div
                                key={alert.id}
                                className={cn(
                                    "flex flex-col sm:flex-row gap-4 p-4 rounded-md border bg-card relative overflow-hidden",
                                    "transition-all  border-border",
                                    !alert.is_read && "border-l-4 border-l-primary bg-primary/5"
                                )}
                            >
                                {!alert.is_read && (
                                    <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
                                )}

                                <div className="shrink-0">
                                    <div className={cn("h-10 w-10 rounded-md flex items-center justify-center", config.bg)}>
                                        <Icon className={cn("h-5 w-5", config.color)} />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <Badge variant="outline" className={cn("text-[10px] uppercase font-bold border-0", priorityConfigMap[alert.priority]?.color || "bg-slate-100")}>
                                            {alert.priority}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(alert.created_at), "h:mm a")}
                                        </span>
                                    </div>
                                    <h4 className={cn("text-base font-bold mb-1", !alert.is_read ? "text-foreground" : "text-muted-foreground")}>
                                        {alert.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {alert.message}
                                    </p>

                                    {alert.action_url && (
                                        <div className="mt-3">
                                            <Link href={createPageUrl(alert.action_url)} className="text-sm font-semibold text-primary hover:underline">
                                                View Details &rarr;
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                <div className="flex sm:flex-col items-center gap-2 pt-2 sm:pt-0 sm:border-l sm:border-border sm:pl-4">
                                    {!alert.is_read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-primary hover:bg-primary/10"
                                            onClick={() => markAsRead(alert.id)}
                                            title="Mark as read"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => deleteAlertMutation.mutate(alert.id)}
                                        title="Delete alert"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3 bg-background overflow-hidden">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground italic">{t('syncingNotifications') || "Syncing..."}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                    <p className="text-muted-foreground">Stay updated with important alerts and activities</p>
                </div>
                <Button variant="outline" onClick={markAllRead} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Mark all as read
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:border-primary/50 bg-card",
                        activeTab === "low_stock" ? "ring-2 ring-primary border-primary" : "border-border"
                    )}
                    onClick={() => setActiveTab("low_stock")}
                >
                    <CardContent className="p-4 py-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-amber-100 flex items-center justify-center ">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-foreground leading-none mb-1">{lowStockCount}</p>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('lowStockAlerts') || "Low Stock"}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:border-primary/50 bg-card",
                        activeTab === "pending_approval" ? "ring-2 ring-primary border-primary" : "border-border"
                    )}
                    onClick={() => setActiveTab("pending_approval")}
                >
                    <CardContent className="p-4 py-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center ">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-foreground leading-none mb-1">{pendingCount}</p>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('pendingApprovals') || "Pending"}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card
                    className={cn(
                        "cursor-pointer transition-all hover:border-primary/50 bg-card",
                        activeTab === "unread" ? "ring-2 ring-primary border-primary" : "border-border"
                    )}
                    onClick={() => setActiveTab("unread")}
                >
                    <CardContent className="p-4 py-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-md bg-rose-100 flex items-center justify-center ">
                            <Bell className="h-6 w-6 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-foreground leading-none mb-1">{unreadCount}</p>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('unreadAlerts') || "Unread"}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-muted p-1 rounded-md w-fit">
                <TabsList className="bg-transparent gap-1">
                    <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]: px-6 font-semibold">{t('all') || "All"}</TabsTrigger>
                    <TabsTrigger value="unread" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]: px-6 font-semibold">{t('unread') || "Unread"}</TabsTrigger>
                    <TabsTrigger value="low_stock" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]: px-6 font-semibold">{t('lowStock') || "Low Stock"}</TabsTrigger>
                    <TabsTrigger value="pending_approval" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]: px-6 font-semibold">{t('approvals') || "Approvals"}</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Alerts List */}
            <div>
                {filteredAlerts.length === 0 ? (
                    <Card className="border-border border-dashed bg-transparent">
                        <CardContent className="p-16 text-center">
                            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground">{t('allCaughtUp') || "All caught up"}</h3>
                            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">{t('noCategoryAlerts') || "No alerts found in this category."}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {renderGroup(groupedAlerts.today, "Today")}
                        {renderGroup(groupedAlerts.yesterday, "Yesterday")}
                        {renderGroup(groupedAlerts.older, "Older")}
                    </div>
                )}
            </div>
        </div>
    );
}