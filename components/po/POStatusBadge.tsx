import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    FileEdit,
    Clock,
    CheckCircle,
    Truck,
    PackageCheck,
    XCircle,
    AlertCircle
} from "lucide-react";

const statusConfig = {
    draft: {
        label: "Draft",
        icon: FileEdit,
        class: "bg-slate-100 text-slate-700 border-slate-200"
    },
    pending_approval: {
        label: "Pending Approval",
        icon: Clock,
        class: "bg-amber-100 text-amber-700 border-amber-200"
    },
    approved: {
        label: "Approved",
        icon: CheckCircle,
        class: "bg-blue-100 text-blue-700 border-blue-200"
    },
    ordered: {
        label: "Ordered",
        icon: Truck,
        class: "bg-violet-100 text-violet-700 border-violet-200"
    },
    partially_received: {
        label: "Partially Received",
        icon: AlertCircle,
        class: "bg-orange-100 text-orange-700 border-orange-200"
    },
    received: {
        label: "Received",
        icon: PackageCheck,
        class: "bg-primary/10 text-primary border-primary/20"
    },
    cancelled: {
        label: "Cancelled",
        icon: XCircle,
        class: "bg-rose-100 text-rose-700 border-rose-200"
    }
};

interface POStatusBadgeProps {
    status: string;
    showIcon?: boolean;
    size?: 'default' | 'lg';
}

export default function POStatusBadge({ status, showIcon = true, size = "default" }: POStatusBadgeProps) {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn(
                "font-medium",
                config.class,
                size === "lg" && "px-3 py-1 text-sm"
            )}
        >
            {showIcon && <Icon className={cn("mr-1.5", size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5")} />}
            {config.label}
        </Badge>
    );
}