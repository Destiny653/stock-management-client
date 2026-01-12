import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#0d9488', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#6366f1', '#ec4899'];

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: {
    name: string;
    value: number;
    total: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-xs text-slate-300 mt-1">
          Value: <span className="text-white font-semibold">${payload[0].value.toLocaleString()}</span>
        </p>
        <p className="text-xs text-slate-300">
          Share: <span className="text-white font-semibold">{((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

interface CategoryData {
  name: string;
  value: number;
}

interface CategoryDistributionProps {
  data?: CategoryData[];
}

export default function CategoryDistribution({ data = [] }: CategoryDistributionProps) {
  const chartData = data;

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = chartData.map(item => ({ ...item, total }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Category Distribution</h3>
        <p className="text-sm text-slate-500 mt-0.5">Stock value by category</p>
      </div>

      <div className="flex items-center gap-6">
        <div className="h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithTotal}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {dataWithTotal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2">
          {dataWithTotal.slice(0, 5).map((item, index) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-slate-600">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-slate-900">
                ${(item.value / 1000).toFixed(1)}k
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}