"use client"

import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: "up" | "down";
    trendValue?: string;
    variant?: "default" | "primary" | "warning" | "danger" | "success";
    onClick?: () => void;
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    variant = "default",
    onClick
}: StatsCardProps) {
    const variants = {
        default: "bg-white border-slate-200",
        primary: "bg-emerald-600 text-white border-emerald-700",
        success: "bg-emerald-50 border-emerald-100 text-emerald-900",
        warning: "bg-amber-50 border-amber-100 text-amber-900",
        danger: "bg-rose-50 border-rose-100 text-rose-900"
    };

    const iconVariants = {
        default: "bg-slate-100 text-slate-500",
        primary: "bg-white/20 text-white",
        success: "bg-emerald-100 text-emerald-600",
        warning: "bg-amber-100 text-amber-600",
        danger: "bg-rose-100 text-rose-600"
    };

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300 hover:shadow-md",
                onClick && "cursor-pointer hover:-translate-y-0.5",
                variants[variant]
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className={cn(
                            "text-[11px] font-bold uppercase tracking-wider",
                            variant === "primary" ? "text-emerald-100" : "text-slate-500"
                        )}>
                            {title}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className={cn(
                                "text-2xl font-bold tracking-tight",
                                variant === "primary" ? "text-white" : "text-slate-900"
                            )}>
                                {value}
                            </h3>
                        </div>
                        {(subtitle || trend) && (
                            <div className="flex items-center gap-1.5 mt-1">
                                {trend && (
                                    <span className={cn(
                                        "flex items-center gap-0.5 text-xs font-semibold",
                                        trend === "up" ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {trendValue}
                                    </span>
                                )}
                                {subtitle && (
                                    <span className={cn(
                                        "text-xs font-medium",
                                        variant === "primary" ? "text-emerald-100/80" : "text-slate-400"
                                    )}>
                                        {subtitle}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className={cn(
                            "rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110",
                            iconVariants[variant]
                        )}>
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
