import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { base44, Product } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Download, Upload, Loader2 } from "lucide-react";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import BulkActions from "@/components/inventory/BulkActions";
import { toast } from "sonner";
import { useLanguage } from "@/components/i18n/LanguageContext";

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
  const canEdit = user?.role === 'admin' || user?.user_type === 'admin' || user?.user_type === 'manager';
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    supplier: "all",
    location: "all"
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState([
    "image", "name", "sku", "category", "quantity", "price", "status", "location"
  ]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: "name", direction: "asc" });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
    initialData: [],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => base44.entities.Warehouse.list(),
    initialData: [],
  });

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
    let result = [...products];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search) ||
        p.barcode?.toLowerCase().includes(search)
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
      result = result.filter(p => p.location === filters.location);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Product] || "";
      const bVal = b[sortConfig.key as keyof Product] || "";
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [products, searchTerm, filters, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const handleQuantityUpdate = async (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    let status: Product['status'] = "active";
    if (quantity === 0) status = "out_of_stock";
    else if (quantity <= (product?.reorder_point || 10)) status = "low_stock";

    await updateProductMutation.mutateAsync({
      id: productId,
      data: { quantity, status }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProductMutation.mutateAsync(id);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} products?`)) {
      for (const id of selectedIds) {
        await deleteProductMutation.mutateAsync(id);
      }
      setSelectedIds([]);
    }
  };

  const handleExport = () => {
    const exportData = filteredProducts.map(p => ({
      SKU: p.sku,
      Name: p.name,
      Category: p.category,
      Quantity: p.quantity,
      "Unit Price": p.unit_price,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('inventory')}</h1>
          <p className="text-slate-500 mt-1">{filteredProducts.length} {t('products')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('export')}
          </Button>
          {canEdit && (
            <Link href={createPageUrl("ProductDetail?mode=new")}>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('addProduct')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <InventoryFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={setFilters}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        suppliers={suppliers}
        warehouses={warehouses}
      />

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <InventoryTable
          products={filteredProducts}
          selectedIds={canEdit ? selectedIds : []}
          onSelectionChange={canEdit ? setSelectedIds : () => { }}
          onQuantityUpdate={canEdit ? handleQuantityUpdate : async () => { }}
          onDelete={canEdit ? handleDelete : undefined}
          sortConfig={sortConfig}
          onSort={handleSort}
          readOnly={!canEdit}
        />
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
    </div>
  );
}