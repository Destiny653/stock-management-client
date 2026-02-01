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
    <div className="bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
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
            <TableHead className="px-6 py-4 text-left font-bold text-muted-foreground">Product Details</TableHead>
            <TableHead className="px-6 py-4 text-left font-bold text-muted-foreground">Category</TableHead>
            <TableHead className="px-6 py-4 text-left font-bold text-muted-foreground">Variants</TableHead>
            <TableHead className="px-6 py-4 text-left font-bold text-muted-foreground">Total Stock</TableHead>
            <TableHead className="px-6 py-4 text-left font-bold text-muted-foreground">Status</TableHead>
            <TableHead className="px-6 py-4 text-right font-bold text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={readOnly ? 7 : 8} className="h-48">
                <div className="flex flex-col items-center justify-center text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">No products found</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Add your first product to get started</p>
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
                    "group transition-colors hover:bg-muted/50 border-b border-border cursor-pointer",
                    isExpanded && "bg-muted/30",
                    isSelected && "bg-primary/5"
                  )}>
                  <td className="w-12 p-0 text-center align-middle">
                    <div className="flex justify-center items-center w-full h-full">
                      <button
                        onClick={() => toggleExpand(product.id)}
                        className="p-1 hover:bg-card rounded transition-colors text-muted-foreground group-hover:text-primary"
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
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shadow-sm">
                        {product.image_url ? (
                          <img src={getImageUrl(product.image_url)} className="w-full h-full object-cover" alt={product.name} />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={createPageUrl(`ProductDetail?id=${product.id}`)}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {product.name}
                        </Link>
                        {product.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">{product.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                    <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full">{product.category}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">
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
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleSaveEdit(product.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(product)}
                        className={cn(
                          "text-xs font-bold px-2 py-1 rounded hover:bg-card transition-colors",
                          isLowStock ? "text-destructive" : "text-foreground"
                        )}
                      >
                        {totalStock} units
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                      isLowStock ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                    )}>
                      {isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      <Link href={createPageUrl(`ProductDetail?id=${product.id}`)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all">
                        <Eye size={16} />
                      </Link>
                      {!readOnly && (
                        <>
                          <Link href={createPageUrl(`ProductDetail?id=${product.id}&mode=edit`)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all">
                            <Edit2 size={16} />
                          </Link>
                          <button
                            onClick={() => onDelete?.(product.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all"
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
                  <tr className="bg-muted/30">
                    <td colSpan={readOnly ? 7 : 8} className="px-12 py-4">
                      <div className="bg-card border border-border rounded-md shadow-inner overflow-hidden">
                        <table className="w-full text-[11px] text-left">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="px-4 py-2 font-bold text-muted-foreground">SKU</th>
                              <th className="px-4 py-2 font-bold text-muted-foreground">Attributes</th>
                              <th className="px-4 py-2 font-bold text-muted-foreground">Stock</th>
                              <th className="px-4 py-2 font-bold text-muted-foreground">Cost</th>
                              <th className="px-4 py-2 font-bold text-muted-foreground">Price</th>
                              <th className="px-4 py-2 font-bold text-muted-foreground text-right">Value</th>
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {product.variants.map((variant) => {
                              const isVariantEditing = editingId === product.id && editingSku === variant.sku;
                              const variantValue = (variant.stock || 0) * (variant.unit_price || 0);

                              return (
                                <tr key={variant.sku} className="hover:bg-muted/50 transition-colors">
                                  <td className="px-4 py-3 font-mono text-primary">{variant.sku}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {Object.entries(variant.attributes || {}).map(([k, v]) => (
                                        <span key={k} className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[9px] font-medium uppercase">
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
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => handleSaveEdit(product.id)}>
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={handleCancelEdit}>
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleStartEdit(product, variant.sku, variant.stock)}
                                        className={cn(
                                          "font-bold px-2 py-0.5 rounded hover:bg-muted transition-colors",
                                          variant.stock <= (product.reorder_point || 0) ? "text-destructive" : "text-foreground"
                                        )}
                                      >
                                        {variant.stock}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">${variant.cost_price?.toFixed(2) || '0.00'}</td>
                                  <td className="px-4 py-3 font-semibold text-foreground">${variant.unit_price?.toFixed(2) || '0.00'}</td>
                                  <td className="px-4 py-3 text-right font-bold text-foreground">
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