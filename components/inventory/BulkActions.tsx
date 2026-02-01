import React from 'react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Trash2,
    Tag,
    MapPin,
    Download,
    ChevronDown,
    FileSpreadsheet,
    Archive
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsProps {
    selectedCount: number;
    onDelete: () => void;
    onExport: () => void;
    onChangeCategory: (category: string) => void;
    onChangeLocation: (location: string) => void;
    onArchive: () => void;
}

export default function BulkActions({
    selectedCount,
    onDelete,
    onExport,
    onChangeCategory,
    onChangeLocation,
    onArchive
}: BulkActionsProps) {
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
                            <Tag className="h-4 w-4 mr-2" />
                            Category
                            <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onChangeCategory("Electronics")}>Electronics</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeCategory("Clothing")}>Clothing</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeCategory("Food & Beverage")}>Food & Beverage</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeCategory("Home & Garden")}>Home & Garden</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeCategory("Other")}>Other</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="bg-slate-800 hover:bg-slate-700 text-white border-0">
                            <MapPin className="h-4 w-4 mr-2" />
                            Location
                            <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onChangeLocation("Warehouse A")}>Warehouse A</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeLocation("Warehouse B")}>Warehouse B</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeLocation("Store Front")}>Store Front</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    variant="secondary"
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-700 text-white border-0"
                    onClick={onExport}
                >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export
                </Button>

                <Button
                    variant="secondary"
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-700 text-white border-0"
                    onClick={onArchive}
                >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                </Button>

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