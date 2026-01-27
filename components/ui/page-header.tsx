"use client"

import React from 'react';
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    subtitle?: string | number;
    children?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    children,
    className
}: PageHeaderProps) {
    return (
        <div className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2",
            className
        )}>
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                {subtitle !== undefined && (
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
}
