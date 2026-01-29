"use client"

import React from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
    status: string;
    variant?: StatusVariant;
    className?: string;
    label?: string;
}

const statusMap: Record<string, { variant: StatusVariant, label: string }> = {
    // PO Statuses
    'draft': { variant: 'default', label: 'Draft' },
    'pending_approval': { variant: 'warning', label: 'Pending Approval' },
    'approved': { variant: 'info', label: 'Approved' },
    'ordered': { variant: 'info', label: 'Ordered' },
    'received': { variant: 'success', label: 'Received' },
    'partially_received': { variant: 'warning', label: 'Partially Received' },
    'cancelled': { variant: 'danger', label: 'Cancelled' },

    // Product Statuses
    'active': { variant: 'success', label: 'Active' },
    'in_stock': { variant: 'success', label: 'In Stock' },
    'low_stock': { variant: 'warning', label: 'Low Stock' },
    'out_of_stock': { variant: 'danger', label: 'Out of Stock' },
    'discontinued': { variant: 'default', label: 'Discontinued' },

    // Organization Statuses
    'inactive': { variant: 'default', label: 'Inactive' },
    'suspended': { variant: 'danger', label: 'Suspended' },
    'pending': { variant: 'warning', label: 'Pending' },
};

export function StatusBadge({
    status,
    variant,
    className,
    label
}: StatusBadgeProps) {
    const config = statusMap[status.toLowerCase()] || { variant: 'default', label: status };
    const finalVariant = variant || config.variant;
    const finalLabel = label || config.label;

    const variantStyles = {
        success: "bg-blue-50 text-blue-700 border-blue-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        default: "bg-slate-50 text-slate-600 border-slate-200"
    };

    return (
        <Badge
            variant="outline"
            className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                variantStyles[finalVariant],
                className
            )}
        >
            {finalLabel}
        </Badge>
    );
}
