import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  type?: 'inventory' | 'sales';
}

const CustomTooltip = ({ active, payload, label, type = 'inventory' }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground px-4 py-3 rounded-md shadow-xl border border-border">
        <p className="text-sm font-medium mb-1">{label}</p>
        {type === 'inventory' ? (
          <>
            <p className="text-xs text-muted-foreground">
              Stock Value: <span className="text-foreground font-semibold">${payload[0].value.toLocaleString()}</span>
            </p>
            {payload[1] && (
              <p className="text-xs text-muted-foreground">
                Units: <span className="text-foreground font-semibold">{payload[1].value.toLocaleString()}</span>
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Total Sales: <span className="text-foreground font-semibold">${payload[0].value.toLocaleString()}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

interface InventoryChartProps {
  data: any[];
  activeTab?: 'inventory' | 'sales';
  onTabChange?: (tab: 'inventory' | 'sales') => void;
}

export default function InventoryChart({ data = [], activeTab = 'inventory', onTabChange }: InventoryChartProps) {
  const chartData = data;
  const isInventory = activeTab === 'inventory';

  return (
    <div className="bg-card rounded-md border border-border p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {isInventory ? 'Inventory Value Trend' : 'Sales History'}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isInventory ? 'Stock value over time' : 'Daily sales performance'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg self-start sm:self-center">
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 text-xs px-3", isInventory && "bg-background shadow-sm")}
            onClick={() => onTabChange?.('inventory')}
          >
            Inventory
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 text-xs px-3", !isInventory && "bg-background shadow-sm")}
            onClick={() => onTabChange?.('sales')}
          >
            Sales
          </Button>
        </div>
        <div className="flex items-center gap-4">
          {isInventory ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Value ($)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                <span className="text-xs text-muted-foreground">Units</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Revenue ($)</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {isInventory ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000)}k`}
              />
              <Tooltip content={<CustomTooltip type="inventory" />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
              <Area
                type="monotone"
                dataKey="units"
                stroke="var(--muted-foreground)"
                strokeWidth={2}
                fillOpacity={0}
                strokeDasharray="4 4"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.1 }} content={<CustomTooltip type="sales" />} />
              <Bar
                dataKey="sales"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                barSize={32}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}