import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createPageUrl } from "@/utils";
import { base44, Product, StockMovement, Supplier, Warehouse } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Save,
  Trash2,
  Package,
  MapPin,
  Truck as TruckIcon,
  History,
  Paperclip,
  AlertTriangle,
  Loader2,
  Upload,
  Plus,
  Edit2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";




const categories = [
  "Electronics", "Clothing", "Food & Beverage", "Home & Garden",
  "Sports", "Beauty", "Office Supplies", "Other"
];

export default function ProductDetail() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const productId = searchParams?.get('id');
  const mode = searchParams?.get('mode') || 'view';

  const [isEditing, setIsEditing] = useState(mode === 'new' || mode === 'edit');
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Other',
    description: '',
    unit_price: 0,
    cost_price: 0,
    quantity: 0,
    reorder_point: 10,
    reorder_quantity: 50,
    location: '',
    supplier_name: '',
    barcode: '',
    weight: 0,
    dimensions: '',
    image_url: '',
    status: 'active' as Product['status']
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.filter({ id: productId }),
    enabled: !!productId,
  });

  const productData = (product as Product[])?.[0];

  const { data: movements = [] } = useQuery({
    queryKey: ['movements', productId],
    queryFn: () => base44.entities.StockMovement.filter({ product_id: productId }),
    enabled: !!productId,
    initialData: [] as StockMovement[],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
    initialData: [] as Supplier[],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => base44.entities.Warehouse.list(),
    initialData: [] as Warehouse[],
  });

  useEffect(() => {
    if (productData) {
      setFormData({
        name: productData.name,
        sku: productData.sku,
        category: productData.category,
        description: productData.description || '',
        unit_price: productData.unit_price,
        cost_price: productData.cost_price || 0,
        quantity: productData.quantity,
        reorder_point: productData.reorder_point || 0,
        reorder_quantity: productData.reorder_quantity || 0,
        location: productData.location || '',
        supplier_name: productData.supplier_name || '',
        barcode: productData.barcode || '',
        weight: productData.weight || 0,
        dimensions: productData.dimensions || '',
        image_url: productData.image_url || '',
        status: productData.status || 'active'
      });
    }
  }, [productData]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => base44.entities.Product.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product created successfully");
      router.push(createPageUrl("Inventory"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (!productId) throw new Error("Product ID is required");
      return base44.entities.Product.update(productId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success("Product updated successfully");
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!productId) throw new Error("Product ID is required");
      return base44.entities.Product.delete(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product deleted");
      router.push(createPageUrl("Inventory"));
    },
  });

  const handleSave = async () => {
    if (!formData.name || !formData.sku) {
      toast.error("Name and SKU are required");
      return;
    }

    // Calculate status based on quantity
    let status: Product['status'] = 'active';
    if (formData.quantity === 0) status = 'out_of_stock';
    else if (formData.quantity <= formData.reorder_point) status = 'low_stock';

    const dataToSave = { ...formData, status };

    if (mode === 'new') {
      await createMutation.mutateAsync(dataToSave);
    } else {
      await updateMutation.mutateAsync(dataToSave);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteMutation.mutateAsync();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success("Image uploaded");
    }
  };

  if (isLoading && productId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    low_stock: "bg-amber-100 text-amber-700",
    out_of_stock: "bg-rose-100 text-rose-700",
    discontinued: "bg-slate-100 text-slate-600"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={createPageUrl("Inventory")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === 'new' ? 'Add New Product' : formData.name || 'Product Details'}
            </h1>
            {productId && (
              <p className="text-slate-500 mt-1">SKU: {formData.sku}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {productId && !isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button variant="outline" className="text-rose-600 hover:text-rose-700" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </>
          )}
          {isEditing && (
            <>
              {productId && (
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                {mode === 'new' ? 'Create Product' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-400" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., PRD-001"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Scan or enter barcode"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Selling Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <Input
                      id="unit_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unit_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                      disabled={!isEditing}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <Input
                      id="cost_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                      disabled={!isEditing}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Current Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorder_point">Reorder Point</Label>
                  <Input
                    id="reorder_point"
                    type="number"
                    min="0"
                    value={formData.reorder_point}
                    onChange={(e) => setFormData(prev => ({ ...prev, reorder_point: parseInt(e.target.value) || 0 }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {formData.quantity <= formData.reorder_point && formData.quantity > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Stock is below reorder point. Consider creating a purchase order.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location & Supplier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-400" />
                Location & Supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Warehouse Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Primary Supplier</Label>
                  <Select
                    value={formData.supplier_name}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_name: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movement History */}
          {productId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-400" />
                  Stock Movement History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No stock movements recorded</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.slice(0, 10).map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-sm">
                            {format(new Date(m.created_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              m.type === 'in' && "bg-emerald-50 text-emerald-700",
                              m.type === 'out' && "bg-blue-50 text-blue-700",
                              m.type === 'adjustment' && "bg-amber-50 text-amber-700"
                            )}>
                              {m.type}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn(
                            "font-medium",
                            m.quantity > 0 ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {m.reference_id || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {m.created_by || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Image */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden relative group">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 text-slate-300" />
                )}
                {isEditing && (
                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="text-white text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <span className="text-sm">Upload Image</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status & Quick Stats */}
          {productId && (
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  <Badge className={statusColors[formData.status]}>
                    {formData.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Stock Value</span>
                  <span className="font-semibold">
                    ${((formData.unit_price || 0) * (formData.quantity || 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Margin</span>
                  <span className="font-semibold text-emerald-600">
                    {formData.cost_price > 0
                      ? `${(((formData.unit_price - formData.cost_price) / formData.cost_price) * 100).toFixed(1)}%`
                      : '-'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          {productId && !isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={createPageUrl(`CreatePurchaseOrder?product=${productId}`)} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" /> Create Purchase Order
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <History className="h-4 w-4 mr-2" /> Record Adjustment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}