import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPageUrl, getImageUrl } from "@/utils";
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
  Check,
  X,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";

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

  const columns: Column<Product>[] = [
    {
      header: '',
      className: 'w-12 p-0 text-center',
      cell: (product) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(product.id);
          }}
          className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary mx-auto block"
        >
          {expandedIds.has(product.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
      )
    },
    ...(!readOnly ? [{
      header: '',
      headerClassName: 'w-12 p-0 text-center',
      className: 'w-12 p-0 text-center',
      cell: (product: Product) => (
        <div className="flex justify-center items-center w-full" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.includes(product.id)}
            onCheckedChange={(checked) => handleSelectOne(product.id, checked === true)}
          />
        </div>
      )
    } as Column<Product>] : []),
    {
      header: 'Product Details',
      accessorKey: 'name',
      sortable: true,
      cell: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shadow-sm">
            {product.image_url ? (
              <img src={getImageUrl(product.image_url)} className="w-full h-full object-cover" alt={product.name} />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <Link
              href={createPageUrl(`ProductDetail?id=${product.id}`)}
              className="text-sm font-bold text-foreground hover:text-primary transition-colors block truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {product.name}
            </Link>
            {product.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-1">{product.description}</p>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (product) => (
        <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 uppercase tracking-wide">
          {product.category}
        </Badge>
      )
    },
    {
      header: 'Variants',
      cell: (product) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {product.variants?.length || 0} SKU(s)
        </span>
      )
    },
    {
      header: 'Total Stock',
      accessorKey: 'stock',
      sortable: true,
      cell: (product) => {
        const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        const isLowStock = product.variants?.some(v => v.stock <= (product.reorder_point ?? 10)) || false;
        const isEditing = editingId === product.id && !editingSku;

        if (isEditing) {
          return (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
          );
        }

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStartEdit(product);
            }}
            className={cn(
              "text-xs font-bold px-2 py-1 rounded hover:bg-muted transition-colors",
              isLowStock ? "text-destructive" : "text-foreground"
            )}
          >
            {totalStock} units
          </button>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (product) => {
        const isLowStock = product.variants?.some(v => v.stock <= (product.reorder_point ?? 10)) || false;
        return (
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
            isLowStock ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            {isLowStock ? 'Low Stock' : 'In Stock'}
          </span>
        );
      }
    },
    {
      header: '',
      className: 'w-24 text-right',
      cell: (product) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
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
      )
    }
  ];

  const renderVariantTable = (product: Product) => (
    <div className="px-12 py-4">
      <div className="bg-card border border-border rounded-md shadow-inner overflow-hidden">
        <table className="w-full text-[11px] text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-widest">SKU</th>
              <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-widest">Attributes</th>
              <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-widest">Stock</th>
              <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-widest">Cost</th>
              <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-widest">Price</th>
              <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-widest text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {product.variants?.map((variant) => {
              const isVariantEditing = editingId === product.id && editingSku === variant.sku;
              const variantValue = (variant.stock || 0) * (variant.unit_price || 0);

              return (
                <tr key={variant.sku} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-primary font-semibold">{variant.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(variant.attributes || {}).map(([k, v]) => (
                        <span key={k} className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight">
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
                          variant.stock <= (product.reorder_point ?? 10) ? "text-destructive" : "text-foreground"
                        )}
                      >
                        {variant.stock} units
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-medium">${variant.cost_price?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-3 font-bold text-foreground">${variant.unit_price?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-3 text-right font-black text-slate-900 tabular-nums">
                    ${variantValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <DataTable
      data={products}
      columns={columns}
      sortConfig={sortConfig}
      onSort={onSort}
      onRowClick={(product) => router.push(createPageUrl(`ProductDetail?id=${product.id}`))}
      renderSubComponent={renderVariantTable}
      isRowExpanded={(product) => expandedIds.has(product.id)}
      rowClassName={(product) => cn(
        expandedIds.has(product.id) && "bg-muted/30",
        selectedIds.includes(product.id) && "bg-primary/5"
      )}
    />
  );
}