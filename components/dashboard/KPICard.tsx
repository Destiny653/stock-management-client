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
    default: "bg-card border-border",
    primary: "bg-primary text-primary-foreground border-primary",
    warning: "bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-200/50",
    danger: "bg-gradient-to-br from-destructive/10 to-red-500/10 border-destructive/20"
  };

  const iconVariants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary-foreground/20 text-primary-foreground",
    warning: "bg-orange-100 text-orange-600",
    danger: "bg-destructive/10 text-destructive"
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-md border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
      variants[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className={cn(
            "text-sm font-medium tracking-wide uppercase",
            variant === "primary" ? "text-primary-foreground/90" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <div className="space-y-1">
            <h3 className={cn(
              "text-3xl font-bold tracking-tight",
              variant === "primary" ? "text-primary-foreground" : "text-foreground"
            )}>
              {value}
            </h3>
            {subtitle && (
              <p className={cn(
                "text-sm",
                variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {subtitle}
              </p>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-1.5">
              {trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-500" />
              )}
              <span className={cn(
                "text-sm font-medium",
                trend === "up" ? "text-foreground" : "text-foreground"
              )}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "rounded-md p-3",
            iconVariants[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div >

      {/* Decorative element */}
      < div className={
        cn(
          "absolute -right-8 -bottom-8 h-32 w-32 rounded-full opacity-10",
          variant === "primary" ? "bg-white" : "bg-primary"
        )
      } />
    </div >
  );
}