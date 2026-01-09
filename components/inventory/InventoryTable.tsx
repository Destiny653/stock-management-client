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
  X
} from "lucide-react";

const statusStyles = {
  active: { label: "In Stock", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  low_stock: { label: "Low Stock", class: "bg-amber-100 text-amber-700 border-amber-200" },
  out_of_stock: { label: "Out of Stock", class: "bg-rose-100 text-rose-700 border-rose-200" },
  discontinued: { label: "Discontinued", class: "bg-slate-100 text-slate-600 border-slate-200" }
};

interface Product {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'low_stock' | 'out_of_stock' | 'discontinued';
  location?: string;
  image_url?: string;
  supplier_name?: string;
  variants?: Array<{
    sku: string;
    stock: number;
    unit_price: number;
  }>;
}

interface InventoryTableProps {
  products?: Product[];
  selectedIds?: string[];
  onSelectionChange: (ids: string[]) => void;
  onQuantityUpdate: (id: string, quantity: number) => Promise<void>;
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
  const [editQuantity, setEditQuantity] = useState("");

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

  const handleStartEdit = (product: Product) => {
    if (readOnly) return;
    setEditingId(product.id);
    const totalQuantity = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
    setEditQuantity(totalQuantity.toString());
  };

  const handleSaveEdit = async (productId: string) => {
    await onQuantityUpdate(productId, parseInt(editQuantity));
    setEditingId(null);
    setEditQuantity("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
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
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            {!readOnly && (
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === products.length && products.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="w-16"></TableHead>
            <TableHead>
              <SortableHeader column="name">Product</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="sku">SKU</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="category">Category</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="quantity">Quantity</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader column="unit_price">Price</SortableHeader>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="w-12"></TableHead>
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
          ) : (
            products.map((product) => {
              const status = statusStyles[product.status] || statusStyles.active;
              const isSelected = selectedIds.includes(product.id);
              const isEditing = editingId === product.id;

              return (
                <TableRow
                  key={product.id}
                  className={cn(
                    "transition-colors",
                    isSelected && "bg-teal-50/50",
                    isEditing && "bg-amber-50/30"
                  )}
                >
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
                    {isEditing && !readOnly ? (
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
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}