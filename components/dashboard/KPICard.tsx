import React from 'react';
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  variant?: "default" | "primary" | "warning" | "danger";
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default"
}: KPICardProps) {
  const variants = {
    default: "bg-white border-slate-200",
    primary: "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-emerald-700",
    warning: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
    danger: "bg-gradient-to-br from-rose-50 to-red-50 border-rose-200"
  };

  const iconVariants = {
    default: "bg-slate-100 text-slate-600",
    primary: "bg-white/20 text-white",
    warning: "bg-amber-100 text-amber-600",
    danger: "bg-rose-100 text-rose-600"
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className={cn(
            "text-sm font-medium tracking-wide uppercase",
            variant === "primary" ? "text-emerald-100" : "text-slate-500"
          )}>
            {title}
          </p>
          <div className="space-y-1">
            <h3 className={cn(
              "text-3xl font-bold tracking-tight",
              variant === "primary" ? "text-white" : "text-slate-900"
            )}>
              {value}
            </h3>
            {subtitle && (
              <p className={cn(
                "text-sm",
                variant === "primary" ? "text-emerald-100" : "text-slate-500"
              )}>
                {subtitle}
              </p>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-1.5">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              )}
              <span className={cn(
                "text-sm font-medium",
                trend === "up" ? "text-emerald-600" : "text-rose-600"
              )}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "rounded-xl p-3",
            iconVariants[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Decorative element */}
      <div className={cn(
        "absolute -right-8 -bottom-8 h-32 w-32 rounded-full opacity-10",
        variant === "primary" ? "bg-white" : "bg-slate-900"
      )} />
    </div>
  );
}