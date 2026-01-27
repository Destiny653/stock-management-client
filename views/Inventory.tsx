import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl, getImageUrl } from "@/utils";
import { base44, Product } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Download, Upload, Loader2, Grid3X3, List, Package, MoreHorizontal, Eye, Edit2, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import BulkActions from "@/components/inventory/BulkActions";
import { toast } from "sonner";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

// Safe language hook that works outside provider
function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
  }
}

export default function Inventory() {
  const { t } = useSafeLanguage();
  const queryClient = useQueryClient();

  // Check user permissions
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Vendors can only view inventory, not edit
  const isVendor = user?.user_type === 'vendor';
  const canEdit = user && ['owner', 'admin', 'manager'].includes(user.role);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    supplier: "all",
    location: "all"
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState([
    "image", "name", "sku", "category", "stock", "price", "status", "location"
  ]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: "name", direction: "asc" });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [deleteProductItem, setDeleteProductItem] = useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  // Create a map for location names
  const locationNameMap = useMemo(() => {
    return locations.reduce((acc, loc) => {
      acc[loc.id] = loc.name;
      return acc;
    }, {} as Record<string, string>);
  }, [locations]);

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => base44.entities.Product.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product updated");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Product.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product deleted");
    },
  });

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = products.map(p => ({
      ...p,
      // Ensure location displays name not ID
      location: p.location_id ? locationNameMap[p.location_id] : p.location
    }));

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(search) ||
        p.variants?.some(v =>
          v.sku?.toLowerCase().includes(search) ||
          v.barcode?.toLowerCase().includes(search)
        )
      );
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      result = result.filter(p => p.category === filters.category);
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      result = result.filter(p => p.status === filters.status);
    }

    // Supplier filter
    if (filters.supplier && filters.supplier !== "all") {
      result = result.filter(p => p.supplier_id === filters.supplier);
    }

    // Location filter
    if (filters.location && filters.location !== "all") {
      result = result.filter(p => p.location_id === filters.location);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Product];
      let bVal: any = b[sortConfig.key as keyof Product];

      // Handle variant fields
      if (sortConfig.key === 'sku') {
        aVal = a.variants?.[0]?.sku || "";
        bVal = b.variants?.[0]?.sku || "";
      } else if (sortConfig.key === 'stock') {
        aVal = a.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
        bVal = b.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0;
      } else if (sortConfig.key === 'price') {
        aVal = a.variants?.[0]?.unit_price || 0;
        bVal = b.variants?.[0]?.unit_price || 0;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [products, searchTerm, filters, sortConfig, locationNameMap]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleStockUpdate = async (productId: string, stock: number, sku?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const variants = [...(product.variants || [])];
    if (sku) {
      const vIdx = variants.findIndex(v => v.sku === sku);
      if (vIdx >= 0) {
        variants[vIdx] = { ...variants[vIdx], stock };
      }
    } else if (variants.length > 0) {
      variants[0] = { ...variants[0], stock };
    } else {
      variants.push({ attributes: {}, sku: `${product.name}-1`, unit_price: 0, cost_price: 0, stock: stock, barcode: '', weight: 0, dimensions: '' });
    }

    const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    let status: Product['status'] = "active";
    if (totalStock === 0) status = "out_of_stock";
    else if (product.reorder_point && totalStock <= product.reorder_point) status = "low_stock";

    try {
      await updateProductMutation.mutateAsync({
        id: productId,
        data: { variants, status } as any
      });
      toast.success("Stock updated");
    } catch (e) {
      toast.error("Failed to update stock");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteProductItem(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteProductItem) {
      await deleteProductMutation.mutateAsync(deleteProductItem);
      setIsDeleteDialogOpen(false);
      setDeleteProductItem(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteProductMutation.mutateAsync(id);
    }
    setSelectedIds([]);
    setIsBulkDeleteDialogOpen(false);
  };

  const handleExport = () => {
    const exportData = filteredProducts.map(p => ({
      SKU: p.variants?.[0]?.sku || 'N/A',
      Name: p.name,
      Category: p.category,
      Stock: p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0,
      "Unit Price": p.variants?.[0]?.unit_price || 0,
      Status: p.status,
      Location: p.location,
      Supplier: p.supplier_name
    }));

    const csv = [
      Object.keys(exportData[0] || {}).join(","),
      ...exportData.map(row => Object.values(row).map(v => `"${v || ''}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_export.csv";
    a.click();
    toast.success("Export downloaded");
  };

  const handleBulkCategoryChange = async (category: string) => {
    for (const id of selectedIds) {
      await updateProductMutation.mutateAsync({ id, data: { category } });
    }
    setSelectedIds([]);
    toast.success(`Updated ${selectedIds.length} products`);
  };

  const handleBulkLocationChange = async (location: string) => {
    for (const id of selectedIds) {
      await updateProductMutation.mutateAsync({ id, data: { location } });
    }
    setSelectedIds([]);
    toast.success(`Updated ${selectedIds.length} products`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('inventory')}
        subtitle={`${filteredProducts.length} ${t('products')}`}
      >
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          {t('export')}
        </Button>
        {canEdit && (
          <Link href={createPageUrl("ProductDetail?mode=new")}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('addProduct')}
            </Button>
          </Link>
        )}
      </PageHeader>

      {/* Filters and View Toggle */}
      <div className="">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <InventoryFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filters}
              onFilterChange={setFilters}
              visibleColumns={visibleColumns}
              onColumnsChange={setVisibleColumns}
              suppliers={suppliers}
              locations={locations}
            />
          </div>
          <div className="flex gap-1 border rounded-lg p-1 h-fit self-start">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
              title={t('gridView') || 'Grid View'}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
              title={t('listView') || 'List View'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">{t('noProductsFound') || 'No products found'}</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const statusStyles: Record<string, { label: string; class: string }> = {
                active: { label: t('inStock') || 'In Stock', class: "bg-emerald-100 text-emerald-700" },
                low_stock: { label: t('lowStock') || 'Low Stock', class: "bg-amber-100 text-amber-700" },
                out_of_stock: { label: t('outOfStock') || 'Out of Stock', class: "bg-rose-100 text-rose-700" },
                discontinued: { label: t('discontinued') || 'Discontinued', class: "bg-slate-100 text-slate-600" }
              };
              const status = statusStyles[product.status] || statusStyles.active;

              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={getImageUrl(product.image_url)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-slate-400" />
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={createPageUrl(`ProductDetail?id=${product.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> {t('viewDetails') || 'View Details'}
                            </Link>
                          </DropdownMenuItem>
                          {canEdit && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={createPageUrl(`ProductDetail?id=${product.id}&mode=edit`)}>
                                  <Edit2 className="h-4 w-4 mr-2" /> {t('edit') || 'Edit'}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-rose-600"
                                onClick={() => handleDelete(product.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> {t('delete') || 'Delete'}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mb-3">
                      <Link
                        href={createPageUrl(`ProductDetail?id=${product.id}`)}
                        className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-slate-500 font-mono">
                        {product.variants?.[0]?.sku || 'No SKU'}
                        {product.variants && product.variants.length > 1 && ` (+${product.variants.length - 1} more)`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <Badge className={cn("font-medium", status.class)}>
                        {status.label}
                      </Badge>
                      <span className="text-sm text-slate-500">{product.category}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-lg font-bold text-slate-900">
                          {product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0}
                        </p>
                        <p className="text-xs text-slate-500">Stock</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">
                          ${product.variants?.[0]?.unit_price?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-slate-500">{t('price') || 'Price'}</p>
                      </div>
                    </div>

                    {product.location && (
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        📍 {product.location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        /* List View (Table) */
        <Card>
          <CardContent className="p-0">
            <InventoryTable
              products={filteredProducts}
              selectedIds={canEdit ? selectedIds : []}
              onSelectionChange={canEdit ? setSelectedIds : () => { }}
              onQuantityUpdate={canEdit ? handleStockUpdate : async () => { }}
              onDelete={canEdit ? handleDelete : undefined}
              sortConfig={sortConfig}
              onSort={handleSort}
              readOnly={!canEdit}
            />
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions - only for users with edit permissions */}
      {canEdit && (
        <BulkActions
          selectedCount={selectedIds.length}
          onDelete={handleBulkDelete}
          onExport={handleExport}
          onChangeCategory={handleBulkCategoryChange}
          onChangeLocation={handleBulkLocationChange}
          onArchive={() => toast.info("Archive feature coming soon")}
        />
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <DialogTitle className="text-xl">Delete Product?</DialogTitle>
            <p className="text-sm text-slate-500">
              Are you sure you want to delete this product? This action will remove all variants and cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteProductMutation.isPending}>
              {deleteProductMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <DialogTitle className="text-xl">Delete {selectedIds.length} Products?</DialogTitle>
            <p className="text-sm text-slate-500">
              This will permanently delete multiple products and all their variants. This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete} disabled={deleteProductMutation.isPending}>
              {deleteProductMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Confirm Bulk Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}