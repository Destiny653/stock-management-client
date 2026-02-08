"use client"

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { Loader2, Package, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
    header: string;
    accessorKey?: string;
    cell?: (item: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
    sortable?: boolean;
    sortKey?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: React.ReactNode;
    onRowClick?: (item: T) => void;
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
    onSort?: (key: string) => void;
    rowClassName?: string | ((item: T) => string);
    renderSubComponent?: (item: T) => React.ReactNode;
    isRowExpanded?: (item: T) => boolean;
    footer?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    isLoading,
    emptyMessage = "No results found",
    onRowClick,
    sortConfig,
    onSort,
    rowClassName,
    renderSubComponent,
    isRowExpanded,
    footer
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-card rounded-md border border-border">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Loading data...</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-md border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        {columns.map((column, idx) => {
                            const sortKey = column.sortKey || column.accessorKey;
                            const isSorted = sortConfig?.key === sortKey;

                            return (
                                <TableHead
                                    key={idx}
                                    className={cn(
                                        "h-12 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground",
                                        column.headerClassName
                                    )}
                                >
                                    {column.sortable && onSort && sortKey ? (
                                        <button
                                            onClick={() => onSort(sortKey)}
                                            className="flex items-center gap-1.5 hover:text-primary transition-colors group"
                                        >
                                            {column.header}
                                            {isSorted ? (
                                                sortConfig?.direction === 'asc' ?
                                                    <ChevronUp className="h-3.5 w-3.5 text-primary" /> :
                                                    <ChevronDown className="h-3.5 w-3.5 text-primary" />
                                            ) : (
                                                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary" />
                                            )}
                                        </button>
                                    ) : (
                                        column.header
                                    )}
                                </TableHead>
                            );
                        })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-48">
                                <div className="flex flex-col items-center justify-center text-center">
                                    {typeof emptyMessage === 'string' ? (
                                        <>
                                            <Package className="h-10 w-10 text-muted mb-3" />
                                            <p className="text-muted-foreground font-medium">{emptyMessage}</p>
                                        </>
                                    ) : (
                                        emptyMessage
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item) => (
                            <React.Fragment key={item.id}>
                                <TableRow
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        "hover:bg-muted/50 transition-colors border-b border-border/50",
                                        onRowClick && "cursor-pointer",
                                        typeof rowClassName === 'function' ? rowClassName(item) : rowClassName
                                    )}
                                >
                                    {columns.map((column, cIdx) => (
                                        <TableCell
                                            key={cIdx}
                                            className={cn("px-6 py-4 text-sm text-foreground", column.className)}
                                        >
                                            {column.cell ? column.cell(item) : (column.accessorKey ? (item as any)[column.accessorKey] : '-')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                {renderSubComponent && isRowExpanded?.(item) && (
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableCell colSpan={columns.length} className="p-0 border-b border-border/50">
                                            {renderSubComponent(item)}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        ))
                    )}
                </TableBody>
                {footer && (
                    <TableFooter className="bg-muted/50 border-t border-border">
                        {footer}
                    </TableFooter>
                )}
            </Table>
        </div>
    );
}
