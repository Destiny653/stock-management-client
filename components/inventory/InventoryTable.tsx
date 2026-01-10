import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  Package,
  ArrowUpDown,
  Check,
  X,
  ChevronRight,
  ChevronDown
} from "lucide-react";

const statusStyles = {
  active: { label: "In Stock", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  low_stock: { label: "Low Stock", class: "bg-amber-100 text-amber-700 border-amber-200" },
  out_of_stock: { label: "Out of Stock", class: "bg-rose-100 text-rose-700 border-rose-200" },
  discontinued: { label: "Discontinued", class: "bg-slate-100 text-slate-600 border-slate-200" }
};

description ?: string;
reorder_point ?: number;
variants ?: Array<{
  sku: string;
  stock: number;
  unit_price: number;
  cost_price: number;
  attributes: Record<string, string>;
}>;
}

interface InventoryTableProps {
  products?: Product[];
  selectedIds?: string[];
  onSelectionChange: (ids: string[]) => void;
  onQuantityUpdate: (id: string, quantity: number, sku?: string) => Promise<void>;
  onDelete?: (id: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (column: string) => void;
  readOnly?: boolean;
}

export default function InventoryTable({
  products = [],
  selectedIds = [],
  onSelectionChange,
  onQuantityUpdate,
  onDelete,
  sortConfig,
  onSort,
  readOnly = false
}: InventoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(products.map(p => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(i => i !== id));
    }
  };

  const handleStartEdit = (product: Product, sku?: string, stock?: number) => {
    if (readOnly) return;
    setEditingId(product.id);
    setEditingSku(sku || null);
    const initialQuantity = stock !== undefined ? stock : (product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0);
    setEditQuantity(initialQuantity.toString());
  };

  const handleSaveEdit = async (productId: string) => {
    await onQuantityUpdate(productId, parseInt(editQuantity), editingSku || undefined);
    setEditingId(null);
    setEditingSku(null);
    setEditQuantity("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingSku(null);
    setEditQuantity("");
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <button
      className="flex items-center gap-1 hover:text-slate-900 transition-colors"
      onClick={() => onSort(column)}
    >
      {children}
      <ArrowUpDown className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 hover:bg-slate-50">
            <TableHead className="w-12 text-center"></TableHead>
            {!readOnly && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === products.length && products.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            <th className="px-6 py-4">Product Details</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Variants</th>
            <th className="px-6 py-4">Total Stock</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-48">
                <div className="flex flex-col items-center justify-center text-center">
                  <Package className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">No products found</p>
                  <p className="text-sm text-slate-400 mt-1">Add your first product to get started</p>
                </div>
              </TableCell>
            </TableRow>
          ) : products.map((product) => {
            const status = statusStyles[product.status] || statusStyles.active;
            const isSelected = selectedIds.includes(product.id);
            const isEditing = editingId === product.id;
            const isExpanded = expandedIds.has(product.id);
            const hasVariants = product.variants && product.variants.length > 1;

            return (
              <React.Fragment key={product.id}>
                <TableRow
                  className={cn(
                    "transition-colors",
                    isSelected && "bg-teal-50/50",
                    isEditing && !editingSku && "bg-amber-50/30"
                  )}
                >
                  <TableCell className="w-8 p-0">
                    {hasVariants && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        onClick={() => toggleExpand(product.id)}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    )}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(product.id, checked === true)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={createPageUrl(`ProductDetail?id=${product.id}`)}
                      className="font-medium text-slate-900 hover:text-teal-600 transition-colors"
                    >
                      {product.name}
                    </Link>
                    {product.supplier_name && (
                      <p className="text-xs text-slate-500 mt-0.5">{product.supplier_name}</p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">
                    {product.variants?.[0]?.sku || '-'}
                    {product.variants && product.variants.length > 1 && (
                      <span className="ml-1 text-[10px] text-slate-400">+{product.variants.length - 1}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{product.category}</span>
                  </TableCell>
                  <TableCell>
                    {isEditing && !editingSku && !readOnly ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-20 h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-600"
                          onClick={() => handleSaveEdit(product.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-400"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      (() => {
                        const totalQuantity = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
                        return readOnly ? (
                          <span className="font-medium text-slate-900">{totalQuantity}</span>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(product)}
                            className="font-medium text-slate-900 hover:text-teal-600 transition-colors px-2 py-1 -mx-2 rounded hover:bg-slate-100"
                          >
                            {totalQuantity}
                          </button>
                        );
                      })()
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    ${product.variants?.[0]?.unit_price?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-medium", status.class)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {product.location || '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={createPageUrl(`ProductDetail?id=${product.id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        {!readOnly && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={createPageUrl(`ProductDetail?id=${product.id}&mode=edit`)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={() => onDelete?.(product.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                {/* Variant Sub-table */}
                {isExpanded && product.variants && product.variants.length > 0 && (
                  <TableRow className="bg-slate-50/30">
                    <TableCell colSpan={readOnly ? 8 : 11} className="py-0 px-12">
                      <div className="border-l-2 border-slate-200 pl-4 py-3 space-y-2">
                        <h5 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Variants for {product.name}</h5>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-transparent hover:bg-transparent border-b border-slate-200">
                              <TableHead className="h-8 text-[10px] text-slate-500">SKU</TableHead>
                              <TableHead className="h-8 text-[10px] text-slate-500">Attributes</TableHead>
                              <TableHead className="h-8 text-[10px] text-slate-500 text-right">Stock</TableHead>
                              <TableHead className="h-8 text-[10px] text-slate-500 text-right">Price</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {product.variants.map((variant) => {
                              const isVariantEditing = editingId === product.id && editingSku === variant.sku;

                              return (
                                <TableRow key={variant.sku} className="hover:bg-slate-100/50 transition-colors border-none group">
                                  <TableCell className="py-2 text-xs font-mono text-slate-600">{variant.sku}</TableCell>
                                  <TableCell className="py-2 text-xs text-slate-500">
                                    {Object.entries(variant.attributes).map(([k, v]) => (
                                      <Badge key={k} variant="secondary" className="mr-1 py-0 px-1 text-[10px] font-normal capitalize">
                                        <span className="text-slate-400 mr-1">{k}:</span> {v}
                                      </Badge>
                                    ))}
                                  </TableCell>
                                  <TableCell className="py-2 text-right">
                                    {isVariantEditing ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <Input
                                          type="number"
                                          value={editQuantity}
                                          onChange={(e) => setEditQuantity(e.target.value)}
                                          className="w-16 h-7 text-[10px] px-1"
                                          autoFocus
                                        />
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => handleSaveEdit(product.id)}>
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={handleCancelEdit}>
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleStartEdit(product, variant.sku, variant.stock)}
                                        className="text-xs font-medium text-slate-900 hover:text-teal-600 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                                      >
                                        {variant.stock}
                                      </button>
                                    )}
                                  </TableCell>
                                  <TableCell className="py-2 text-xs font-medium text-slate-900 text-right">
                                    ${variant.unit_price.toFixed(2)}
                                  </TableCell>
                                  <TableCell></TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })
          }
        </TableBody>
      </Table>
    </div>
  );
}