import React from 'react';
import { cn } from "@/lib/utils";
import { X, AlertTriangle, Info, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const variants = {
    info: {
        bg: "bg-blue-50 border-blue-200",
        icon: Info,
        iconColor: "text-blue-600"
    },
    warning: {
        bg: "bg-amber-50 border-amber-200",
        icon: AlertTriangle,
        iconColor: "text-amber-600"
    },
    success: {
        bg: "bg-emerald-50 border-emerald-200",
        icon: CheckCircle,
        iconColor: "text-emerald-600"
    },
    error: {
        bg: "bg-rose-50 border-rose-200",
        icon: AlertCircle,
        iconColor: "text-rose-600"
    }
};

interface AlertBannerProps {
    variant?: 'info' | 'warning' | 'success' | 'error';
    title?: string;
    message?: string;
    action?: React.ReactNode;
    onDismiss?: () => void;
    className?: string;
}

export default function AlertBanner({
    variant = "info",
    title,
    message,
    action,
    onDismiss,
    className
}: AlertBannerProps) {
    const config = variants[variant];
    const Icon = config.icon;

    return (
        <div className={cn(
            "rounded-xl border p-4 flex items-start gap-3",
            config.bg,
            className
        )}>
            <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", config.iconColor)} />
            <div className="flex-1 min-w-0">
                {title && (
                    <p className="font-medium text-slate-900">{title}</p>
                )}
                {message && (
                    <p className="text-sm text-slate-600 mt-0.5">{message}</p>
                )}
                {action && (
                    <div className="mt-3">
                        {action}
                    </div>
                )}
            </div>
            {onDismiss && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-slate-400 hover:text-slate-600"
                    onClick={onDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}