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
        default: "bg-white border-border",
        primary: "bg-primary text-primary-foreground border-primary",
        success: "bg-primary/10 border-primary/20 text-primary",
        warning: "bg-amber-50 border-amber-100 text-amber-900",
        danger: "bg-muted border-border text-foreground"
    };

    const iconVariants = {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary-foreground/20 text-primary-foreground",
        success: "bg-primary/20 text-primary",
        warning: "bg-amber-100 text-amber-600",
        danger: "bg-muted text-foreground"
    };

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300 ",
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
                            variant === "primary" ? "text-primary-foreground/90" : "text-muted-foreground"
                        )}>
                            {title}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className={cn(
                                "text-2xl font-bold tracking-tight",
                                variant === "primary" ? "text-primary-foreground" : "text-foreground"
                            )}>
                                {value}
                            </h3>
                        </div>
                        {(subtitle || trend) && (
                            <div className="flex items-center gap-1.5 mt-1">
                                {trend && (
                                    <span className={cn(
                                        "flex items-center gap-0.5 text-xs font-semibold",
                                        trend === "up" ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {trendValue}
                                    </span>
                                )}
                                {subtitle && (
                                    <span className={cn(
                                        "text-xs font-medium",
                                        variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
                                    )}>
                                        {subtitle}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className={cn(
                            "rounded-md p-2.5 transition-transform duration-300 group-hover:scale-110",
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
