import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPageUrl, getImageUrl } from "@/utils";
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



interface Product {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'low_stock' | 'out_of_stock' | 'discontinued';
  location?: string;
  image_url?: string;
  supplier_name?: string;
  description?: string;
  reorder_point?: number;
  variants?: Array<{
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
  const router = useRouter();
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
    <div className="bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-teal-600/10 hover:bg-teal-600/10 text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100">
            <TableHead className="w-12 text-center p-0"></TableHead>
            {!readOnly && (
              <TableHead className="w-12 text-center p-0">
                <div className="flex justify-center items-center w-full h-full">
                  <Checkbox
                    checked={selectedIds.length === products.length && products.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
              </TableHead>
            )}
            <TableHead className="px-6 py-4 text-left font-bold text-slate-500">Product Details</TableHead>
            <TableHead className="px-6 py-4 text-left font-bold text-slate-500">Category</TableHead>
            <TableHead className="px-6 py-4 text-left font-bold text-slate-500">Variants</TableHead>
            <TableHead className="px-6 py-4 text-left font-bold text-slate-500">Total Stock</TableHead>
            <TableHead className="px-6 py-4 text-left font-bold text-slate-500">Status</TableHead>
            <TableHead className="px-6 py-4 text-right font-bold text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={readOnly ? 7 : 8} className="h-48">
                <div className="flex flex-col items-center justify-center text-center">
                  <Package className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">No products found</p>
                  <p className="text-sm text-slate-400 mt-1">Add your first product to get started</p>
                </div>
              </TableCell>
            </TableRow>
          ) : products.map((product) => {
            const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
            const isLowStock = product.variants?.some(v => v.stock <= (product.reorder_point || 0)) || false;
            const isSelected = selectedIds.includes(product.id);
            const isEditing = editingId === product.id;
            const isExpanded = expandedIds.has(product.id);

            return (
              <React.Fragment key={product.id}>
                <tr
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, a, input, [role="checkbox"]')) return;
                    router.push(createPageUrl(`ProductDetail?id=${product.id}`));
                  }}
                  className={cn(
                    "group transition-colors hover:bg-slate-50 border-b border-slate-50 cursor-pointer",
                    isExpanded && "bg-indigo-50/30",
                    isSelected && "bg-teal-50/50"
                  )}>
                  <td className="w-12 p-0 text-center align-middle">
                    <div className="flex justify-center items-center w-full h-full">
                      <button
                        onClick={() => toggleExpand(product.id)}
                        className="p-1 hover:bg-white rounded transition-colors text-slate-400 group-hover:text-indigo-600"
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    </div>
                  </td>
                  {!readOnly && (
                    <td className="w-12 p-0 text-center align-middle">
                      <div className="flex justify-center items-center w-full h-full">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectOne(product.id, checked === true)}
                        />
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                        {product.image_url ? (
                          <img src={getImageUrl(product.image_url)} className="w-full h-full object-cover" alt={product.name} />
                        ) : (
                          <Package className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={createPageUrl(`ProductDetail?id=${product.id}`)}
                          className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                        >
                          {product.name}
                        </Link>
                        {product.description && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                    {product.variants?.length || 0} SKU(s)
                  </td>
                  <td className="px-6 py-4">
                    {isEditing && !editingSku ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-16 h-8 text-xs px-2"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleSaveEdit(product.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(product)}
                        className={cn(
                          "text-xs font-bold px-2 py-1 rounded hover:bg-white/50 transition-colors",
                          isLowStock ? "text-rose-500" : "text-slate-800"
                        )}
                      >
                        {totalStock} units
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                      isLowStock ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      <Link href={createPageUrl(`ProductDetail?id=${product.id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all">
                        <Eye size={16} />
                      </Link>
                      {!readOnly && (
                        <>
                          <Link href={createPageUrl(`ProductDetail?id=${product.id}&mode=edit`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all">
                            <Edit2 size={16} />
                          </Link>
                          <button
                            onClick={() => onDelete?.(product.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Nested Variant View */}
                {isExpanded && product.variants && product.variants.length > 0 && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={readOnly ? 7 : 8} className="px-12 py-4">
                      <div className="bg-white border border-slate-100 rounded-lg shadow-inner overflow-hidden">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-teal-600/5 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-2 font-bold text-slate-500">SKU</th>
                              <th className="px-4 py-2 font-bold text-slate-500">Attributes</th>
                              <th className="px-4 py-2 font-bold text-slate-500">Stock</th>
                              <th className="px-4 py-2 font-bold text-slate-500">Cost</th>
                              <th className="px-4 py-2 font-bold text-slate-500">Price</th>
                              <th className="px-4 py-2 font-bold text-slate-500 text-right">Value</th>
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {product.variants.map((variant) => {
                              const isVariantEditing = editingId === product.id && editingSku === variant.sku;
                              const variantValue = (variant.stock || 0) * (variant.unit_price || 0);

                              return (
                                <tr key={variant.sku} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 font-mono text-indigo-600">{variant.sku}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(variant.attributes || {}).map(([k, v]) => (
                                        <span key={k} className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase">
                                          {v}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {isVariantEditing ? (
                                      <div className="flex items-center gap-1">
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
                                        className={cn(
                                          "font-bold px-2 py-0.5 rounded hover:bg-slate-100 transition-colors",
                                          variant.stock <= (product.reorder_point || 0) ? "text-rose-500" : "text-slate-700"
                                        )}
                                      >
                                        {variant.stock}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500">${variant.cost_price?.toFixed(2) || '0.00'}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-800">${variant.unit_price?.toFixed(2) || '0.00'}</td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                                    ${variantValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
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