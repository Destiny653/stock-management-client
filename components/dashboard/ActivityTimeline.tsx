import React from 'react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Package, 
  Truck, 
  ArrowRightLeft, 
  AlertTriangle, 
  CheckCircle2,
  FileText 
} from "lucide-react";
import Link from 'next/link';

const activityIcons = {
  received: { icon: Truck, color: "text-emerald-600", bg: "bg-emerald-100" },
  dispatched: { icon: Package, color: "text-blue-600", bg: "bg-blue-100" },
  transferred: { icon: ArrowRightLeft, color: "text-violet-600", bg: "bg-violet-100" },
  alert: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100" },
  approved: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
  po_created: { icon: FileText, color: "text-slate-600", bg: "bg-slate-100" }
};

export interface Activity {
  id: string;
  type: 'received' | 'dispatched' | 'transferred' | 'alert' | 'approved' | 'po_created';
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityTimelineProps {
  activities?: Activity[];
}

export default function ActivityTimeline({ activities = [] }: ActivityTimelineProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Recent Activity</h3>
      
      <div className="space-y-1">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No recent activity</p>
        ) : (
          activities.map((activity, index) => {
            const config = activityIcons[activity.type] || activityIcons.alert;
            const Icon = config.icon;
            
            
            return (
              <div key={activity.id || index} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Timeline line */}
                {index !== activities.length - 1 && (
                  <div className="absolute left-5 top-10 h-full w-px bg-slate-200" />
                )}
                
                {/* Icon */}
                <div className={cn(
                  "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  config.bg
                )}>
                  <Icon className={cn("h-5 w-5", config.color)} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {activity.timestamp ? format(new Date(activity.timestamp), "MMM d, h:mm a") : "Just now"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}