import React from 'react';
import { Button } from "@/components/ui/button";
import { PurchaseOrder } from "@/api/base44Client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Trash2,
    CheckCircle,
    Truck,
    Download,
    ChevronDown,
    FileText,
    XCircle,
    Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface POBulkActionsProps {
    selectedCount: number;
    onDelete: () => void;
    onExport: (format: 'pdf' | 'csv') => void;
    onChangeStatus: (status: PurchaseOrder['status']) => void;
}

export default function POBulkActions({
    selectedCount,
    onDelete,
    onExport,
    onChangeStatus,
}: POBulkActionsProps) {
    if (selectedCount === 0) return null;

    return (
        <div className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "bg-popover text-popover-foreground rounded-md shadow-2xl border border-border",
            "px-6 py-4 flex items-center gap-4",
            "animate-in slide-in-from-bottom-4 duration-300"
        )}>
            <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
                <span className="text-2xl font-bold">{selectedCount}</span>
                <span className="text-slate-400 text-sm">selected</span>
            </div>

            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="bg-muted hover:bg-muted/80 text-foreground border-0">
                            <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                            Update Status
                            <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onChangeStatus("pending_approval")}>
                            <Send className="h-4 w-4 mr-2" /> Submit for Approval
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeStatus("approved")}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeStatus("ordered")}>
                            <Truck className="h-4 w-4 mr-2" /> Mark as Ordered
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeStatus("received")}>
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark as Received
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeStatus("cancelled")} className="text-destructive">
                            <XCircle className="h-4 w-4 mr-2" /> Cancel
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="bg-slate-800 hover:bg-slate-700 text-white border-0">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                            <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onExport('pdf')}>
                            <FileText className="h-4 w-4 mr-2 text-red-500" /> PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onExport('csv')}>
                            <Download className="h-4 w-4 mr-2 text-green-500" /> CSV
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-6 bg-slate-700 mx-1" />

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </Button>
            </div>
        </div>
    );
}
