import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Package } from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { TableRow, TableCell } from "@/components/ui/table";
import { getImageUrl } from "@/utils";

interface POItem {
  product_name?: string;
  sku?: string;
  image_url?: string;
  quantity_ordered?: number;
  quantity_received?: number;
  unit_cost?: number;
  total?: number;
}

interface POItemsTableProps {
  items?: POItem[];
  onItemChange?: (index: number, field: string, value: string | number) => void;
  onRemoveItem?: (index: number) => void;
  onAddItem?: () => void;
  editable?: boolean;
  showReceived?: boolean;
}

export default function POItemsTable({
  items = [],
  onItemChange,
  onRemoveItem,
  onAddItem,
  editable = true,
  showReceived = false
}: POItemsTableProps) {
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

  // Map items to include an ID for DataTable
  const data = items.map((item, index) => ({ ...item, id: index }));

  const columns: Column<any>[] = [
    {
      header: '',
      className: 'w-16',
      cell: (item) => (
        <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
          {item.image_url ? (
            <img src={getImageUrl(item.image_url)} alt={item.product_name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-5 w-5 text-slate-400" />
          )}
        </div>
      )
    },
    {
      header: 'Product',
      cell: (item) => (
        editable ? (
          <Input
            value={item.product_name || ''}
            onChange={(e) => onItemChange?.(item.id, 'product_name', e.target.value)}
            placeholder="Product name"
            className="bg-transparent border-0 px-0 focus-visible:ring-0 h-8"
          />
        ) : (
          <span className="font-medium text-slate-900">{item.product_name}</span>
        )
      )
    },
    {
      header: 'SKU',
      cell: (item) => (
        editable ? (
          <Input
            value={item.sku || ''}
            onChange={(e) => onItemChange?.(item.id, 'sku', e.target.value)}
            placeholder="SKU"
            className="bg-transparent border-0 px-0 focus-visible:ring-0 font-mono text-sm h-8"
          />
        ) : (
          <span className="font-mono text-sm text-slate-600">{item.sku}</span>
        )
      )
    },
    {
      header: 'Qty',
      className: 'w-24',
      cell: (item) => (
        editable ? (
          <Input
            type="number"
            min="1"
            value={item.quantity_ordered || ''}
            onChange={(e) => onItemChange?.(item.id, 'quantity_ordered', parseInt(e.target.value) || 0)}
            className="w-20 h-8"
          />
        ) : (
          <span className="text-sm">{item.quantity_ordered}</span>
        )
      )
    },
    ...(showReceived ? [{
      header: 'Received',
      className: 'w-24',
      cell: (item: any) => (
        <span className={cn(
          "text-sm font-medium",
          ((item.quantity_received ?? 0) < (item.quantity_ordered ?? 0)) ? "text-amber-600" : "text-primary"
        )}>
          {item.quantity_received || 0}
        </span>
      )
    } as Column<any>] : []),
    {
      header: 'Unit Cost',
      className: 'w-28',
      cell: (item) => (
        editable ? (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.unit_cost || ''}
            onChange={(e) => onItemChange?.(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
            className="w-24 h-8"
          />
        ) : (
          <span className="text-sm">${item.unit_cost?.toFixed(2)}</span>
        )
      )
    },
    {
      header: 'Total',
      className: 'w-28 text-right font-medium',
      cell: (item) => `$${(item.total || 0).toFixed(2)}`
    },
    ...(editable ? [{
      header: '',
      className: 'w-12',
      cell: (item: any) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-rose-600"
          onClick={() => onRemoveItem?.(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    } as Column<any>] : [])
  ];

  const footer = (
    <>
      <TableRow className="bg-slate-50/50">
        <TableCell colSpan={showReceived ? 6 : 5} className="text-right font-medium text-slate-600">
          Subtotal
        </TableCell>
        <TableCell className="text-right font-black text-slate-900 text-lg tabular-nums">
          ${subtotal.toFixed(2)}
        </TableCell>
        {editable && <TableCell />}
      </TableRow>
      {editable && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={showReceived ? 8 : 7} className="p-4">
            <Button
              variant="outline"
              size="sm"
              className="font-bold uppercase tracking-wider text-[10px] h-9 border-slate-200 hover:bg-slate-50"
              onClick={() => onAddItem?.()}
            >
              <Plus className="h-3.5 w-3.5 mr-2" /> Add Another Item
            </Button>
          </TableCell>
        </TableRow>
      )}
    </>
  );

  return (
    <div className="bg-white border border-slate-200/60 rounded-lg overflow-hidden">
      <DataTable
        data={data}
        columns={columns}
        footer={items.length > 0 ? footer : null}
        emptyMessage={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No items added to this order</p>
            {editable && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 font-bold uppercase tracking-wider text-[10px]"
                onClick={() => onAddItem?.()}
              >
                <Plus className="h-3.5 w-3.5 mr-2" /> Add First Item
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}

// Helper function for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}