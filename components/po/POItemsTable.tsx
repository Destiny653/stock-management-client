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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Package } from "lucide-react";

interface POItem {
  product_name?: string;
  sku?: string;
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead className="w-16"></TableHead>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead className="w-24">Qty</TableHead>
            {showReceived && <TableHead className="w-24">Received</TableHead>}
            <TableHead className="w-28">Unit Cost</TableHead>
            <TableHead className="w-28 text-right">Total</TableHead>
            {editable && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={editable ? 8 : 7} className="h-32">
                <div className="flex flex-col items-center justify-center text-center">
                  <Package className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-slate-600">No items added</p>
                  {editable && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => onAddItem?.()}>
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Package className="h-5 w-5 text-slate-400" />
                  </div>
                </TableCell>
                <TableCell>
                  {editable ? (
                    <Input
                      value={item.product_name || ''}
                      onChange={(e) => onItemChange?.(index, 'product_name', e.target.value)}
                      placeholder="Product name"
                      className="bg-transparent border-0 px-0 focus-visible:ring-0"
                    />
                  ) : (
                    <span className="font-medium text-slate-900">{item.product_name}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <Input
                      value={item.sku || ''}
                      onChange={(e) => onItemChange?.(index, 'sku', e.target.value)}
                      placeholder="SKU"
                      className="bg-transparent border-0 px-0 focus-visible:ring-0 font-mono text-sm"
                    />
                  ) : (
                    <span className="font-mono text-sm text-slate-600">{item.sku}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editable ? (
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity_ordered || ''}
                      onChange={(e) => onItemChange?.(index, 'quantity_ordered', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  ) : (
                    <span>{item.quantity_ordered}</span>
                  )}
                </TableCell>
                {showReceived && (
                  <TableCell>
                    <span className={((item.quantity_received ?? 0) < (item.quantity_ordered ?? 0)) ? "text-amber-600" : "text-emerald-600"}>
                      {item.quantity_received || 0}
                    </span>
                  </TableCell>
                )}
                <TableCell>
                  {editable ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_cost || ''}
                      onChange={(e) => onItemChange?.(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  ) : (
                    <span>${item.unit_cost?.toFixed(2)}</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${(item.total || 0).toFixed(2)}
                </TableCell>
                {editable && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600"
                      onClick={() => onRemoveItem?.(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
        {items.length > 0 && (
          <TableFooter>
            <TableRow className="bg-slate-50">
              <TableCell colSpan={showReceived ? 6 : 5} className="text-right font-medium">
                Subtotal
              </TableCell>
              <TableCell className="text-right font-bold text-lg">
                ${subtotal.toFixed(2)}
              </TableCell>
              {editable && <TableCell />}
            </TableRow>
          </TableFooter>
        )}
      </Table>

      {editable && items.length > 0 && (
        <div className="p-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => onAddItem?.()}>
            <Plus className="h-4 w-4 mr-2" /> Add Another Item
          </Button>
        </div>
      )}
    </div>
  );
}