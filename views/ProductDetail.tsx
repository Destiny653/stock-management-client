import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createPageUrl, getImageUrl } from "@/utils";
import { base44, Product, StockMovement, Supplier, Location, ProductVariant } from "@/api/base44Client";
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
import { DataTable, Column } from "@/components/ui/data-table";
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
  Grid3X3,
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
    category: 'Other',
    description: '',
    reorder_point: 10,
    reorder_quantity: 50,
    location_id: '',
    supplier_name: '',
    image_url: '',
    status: 'active' as Product['status'],
    variants: [] as ProductVariant[]
  });

  const { data: productData, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.get(productId as string),
    enabled: !!productId && mode !== 'new',
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load product details");
      console.error("Product load error:", error);
    }
  }, [error]);

  const { data: movements = [] } = useQuery({
    queryKey: ['movements', productId],
    queryFn: () => base44.entities.StockMovement.list({ product_id: productId }),
    enabled: !!productId,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  useEffect(() => {
    if (productData) {
      // Use id or _id depending on what backend returns
      const id = (productData as any).id || (productData as any)._id;

      setFormData({
        name: productData.name || '',
        category: productData.category || 'Other',
        description: productData.description || '',
        reorder_point: productData.reorder_point || 0,
        reorder_quantity: productData.reorder_quantity || 0,
        location_id: productData.location_id || '',
        supplier_name: productData.supplier_name || '',
        image_url: productData.image_url || '',
        status: productData.status || 'active',
        variants: productData.variants || []
      });
    }
  }, [productData]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => base44.entities.Product.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Product created successfully");
      router.push(createPageUrl("Inventory"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (!productId) throw new Error("Product ID is required");
      return base44.entities.Product.update(productId, data as any);
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
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    if (formData.variants.length === 0) {
      toast.error("At least one variant is required");
      return;
    }

    // Calculate total stock across variants
    const totalStock = formData.variants.reduce((acc, v) => acc + (v.stock || 0), 0);

    // Calculate status based on total stock
    let status: Product['status'] = 'active';
    if (totalStock === 0) status = 'out_of_stock';
    else if (totalStock <= (formData.reorder_point || 0)) status = 'low_stock';

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

  if (isLoading && productId && mode !== 'new') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Loading Product...</p>
        </div>
      </div>
    );
  }

  // Guard against missing data when in view/edit mode
  if (!productData && productId && mode !== 'new' && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="p-4 bg-rose-50 rounded-full mb-4">
          <AlertTriangle className="h-8 w-8 text-rose-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Product Not Found</h2>
        <p className="text-slate-500 max-w-xs mt-2">The product you are looking for does not exist or you do not have permission to view it.</p>
        <Link href={createPageUrl("Inventory")} className="mt-6">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inventory
          </Button>
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary border-primary/20",
    low_stock: "bg-amber-100 text-amber-700",
    out_of_stock: "bg-rose-100 text-rose-700",
    discontinued: "bg-slate-100 text-slate-600"
  };

  const movementColumns: Column<StockMovement>[] = [
    {
      header: 'Date',
      className: 'text-sm',
      cell: (m) => (m.created_at ? format(new Date(m.created_at), "MMM d, yyyy") : '-')
    },
    {
      header: 'Type',
      cell: (m) => (
        <Badge variant="outline" className={cn(
          m.type === 'in' && "bg-primary/10 text-primary",
          m.type === 'out' && "bg-blue-50 text-blue-700",
          m.type === 'adjustment' && "bg-amber-50 text-amber-700"
        )}>
          {m.type}
        </Badge>
      )
    },
    {
      header: 'Quantity',
      className: 'font-medium',
      cell: (m) => (
        <span className={cn(m.quantity > 0 ? "text-primary" : "text-rose-600")}>
          {m.quantity > 0 ? '+' : ''}{m.quantity}
        </span>
      )
    },
    {
      header: 'Reference',
      className: 'text-sm text-slate-600',
      cell: (m) => m.reference_id || '-'
    },
    {
      header: 'By',
      className: 'text-sm text-slate-600',
      cell: (m) => m.performed_by || '-'
    }
  ];

  return (
    <div className="flex flex-col gap-6">
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
            {productId && formData.variants?.[0]?.sku && (
              <p className="text-slate-500 mt-1">SKU: {formData.variants[0].sku}</p>
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
                className="bg-primary hover:bg-primary/90"
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
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-400" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g. Wireless Mouse"
                  />
                </div>
                <div className="flex flex-col gap-2">
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
              </div>

              <div className="flex flex-col gap-2">
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

          {/* Product Variants Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-slate-400" />
                Product Variants
              </CardTitle>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      variants: [
                        ...prev.variants,
                        { attributes: {}, sku: '', unit_price: 0, cost_price: 0, stock: 0, barcode: '', weight: 0, dimensions: '' }
                      ]
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {formData.variants.reduce((acc, v) => acc + v.stock, 0) <= formData.reorder_point && formData.variants.reduce((acc, v) => acc + v.stock, 0) > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Total stock is below reorder point. Consider creating a purchase order.
                  </p>
                </div>
              )}

              {formData.variants.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-md">
                  <p className="text-slate-500">No variants defined for this product</p>
                  {isEditing && (
                    <Button
                      variant="link"
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          variants: [{ attributes: {}, sku: '', unit_price: 0, cost_price: 0, stock: 0, barcode: '', weight: 0, dimensions: '' }]
                        }));
                      }}
                    >
                      Create first variant
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {formData.variants.map((variant, vIdx) => (
                    <div key={vIdx} className="p-4 border rounded-md bg-slate-50/50 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Variant #{vIdx + 1}</h4>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-rose-500 hover:text-rose-600 h-8 w-8"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                variants: prev.variants.filter((_, i) => i !== vIdx)
                              }));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label>Variant SKU</Label>
                          <Input
                            value={variant.sku}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[vIdx].sku = e.target.value;
                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            disabled={!isEditing}
                            placeholder="e.g. SKU-XL"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Unit Price</Label>
                          <Input
                            type="number"
                            value={variant.unit_price}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[vIdx].unit_price = parseFloat(e.target.value) || 0;
                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Cost Price</Label>
                          <Input
                            type="number"
                            value={variant.cost_price}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[vIdx].cost_price = parseFloat(e.target.value) || 0;
                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Stock</Label>
                          <Input
                            type="number"
                            value={variant.stock}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[vIdx].stock = parseInt(e.target.value) || 0;
                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Barcode</Label>
                          <Input
                            value={variant.barcode || ''}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[vIdx].barcode = e.target.value;
                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            disabled={!isEditing}
                            placeholder="Variant Barcode"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Weight</Label>
                          <Input
                            type="number"
                            value={variant.weight || 0}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[vIdx].weight = parseFloat(e.target.value) || 0;
                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            disabled={!isEditing}
                            placeholder="Weight"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Dimensions</Label>
                          <Input
                            value={variant.dimensions || ''}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[vIdx].dimensions = e.target.value;
                              setFormData(prev => ({ ...prev, variants: newVariants }));
                            }}
                            disabled={!isEditing}
                            placeholder="L x W x H"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>Attributes</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(variant.attributes).map(([key, value], attrIdx) => (
                            <div key={key} className="flex gap-2">
                              <Input
                                value={key}
                                readOnly
                                className="w-1/3 bg-slate-100"
                              />
                              <Input
                                value={value}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants];
                                  newVariants[vIdx].attributes[key] = e.target.value;
                                  setFormData(prev => ({ ...prev, variants: newVariants }));
                                }}
                                disabled={!isEditing}
                                className="flex-1"
                              />
                              {isEditing && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newVariants = [...formData.variants];
                                    delete newVariants[vIdx].attributes[key];
                                    setFormData(prev => ({ ...prev, variants: newVariants }));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-slate-400" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <div className="flex gap-2">
                              <Input
                                placeholder="New Attribute (e.g. Size)"
                                id={`new-attr-key-${vIdx}`}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const keyInput = document.getElementById(`new-attr-key-${vIdx}`) as HTMLInputElement;
                                  const key = keyInput.value.trim();
                                  if (key) {
                                    const newVariants = [...formData.variants];
                                    newVariants[vIdx].attributes[key] = '';
                                    setFormData(prev => ({ ...prev, variants: newVariants }));
                                    keyInput.value = '';
                                  }
                                }}
                              >
                                Add Attribute
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="location">Inventory Location</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
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
                  <div className="bg-white overflow-hidden">
                    <DataTable
                      data={movements.slice(0, 10)}
                      columns={movementColumns}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}


        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Product Image */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-md bg-slate-100 flex items-center justify-center overflow-hidden relative group">
                {formData.image_url ? (
                  <img
                    src={getImageUrl(formData.image_url)}
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
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  <Badge className={statusColors[formData.status]}>
                    {formData.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Stock Value</span>
                  <span className="font-semibold">
                    ${formData.variants.reduce((acc, v) => acc + (v.unit_price * v.stock), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Margin (Avg)</span>
                  <span className="font-semibold text-primary">
                    {formData.variants?.[0]?.cost_price > 0
                      ? `${(((formData.variants[0].unit_price - formData.variants[0].cost_price) / formData.variants[0].cost_price) * 100).toFixed(1)}%`
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
              <CardContent className="flex flex-col gap-2">
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