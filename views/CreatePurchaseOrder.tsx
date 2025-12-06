import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Package,
  Truck,
  Calendar,
  FileText,
  Loader2,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import POItemsTable from "@/components/po/POItemsTable";

interface PurchaseOrderItem {
  product_id: string;
  sku: string;
  product_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total: number;
}

export default function CreatePurchaseOrder() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<{
    po_number: string;
    supplier_id: string;
    supplier_name: string;
    status: string;
    items: PurchaseOrderItem[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    expected_date: string;
    warehouse: string;
    notes: string;
  }>({
    po_number: `PO-${Date.now().toString().slice(-6)}`,
    supplier_id: '',
    supplier_name: '',
    status: 'draft',
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    expected_date: '',
    warehouse: '',
    notes: ''
  });

  const [productSearchOpen, setProductSearchOpen] = useState(false);

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
    initialData: [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => base44.entities.Warehouse.list(),
    initialData: [],
  });

  const createPOMutation = useMutation({
    mutationFn: (data: any) => base44.entities.PurchaseOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast.success("Purchase order created");
      router.push(createPageUrl("PurchaseOrders"));
    },
  });

  // Recalculate totals when items change
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const total = subtotal + (formData.tax || 0) + (formData.shipping || 0);
    setFormData(prev => ({ ...prev, subtotal, total }));
  }, [formData.items, formData.tax, formData.shipping]);

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    setFormData(prev => ({
      ...prev,
      supplier_id: supplierId,
      supplier_name: supplier?.name || ''
    }));
  };

  const handleAddProduct = (product: any) => {
    const existingIndex = formData.items.findIndex(i => i.product_id === product.id);

    if (existingIndex >= 0) {
      // Update quantity if already exists
      const newItems = [...formData.items];
      newItems[existingIndex].quantity_ordered += 1;
      newItems[existingIndex].total = newItems[existingIndex].quantity_ordered * newItems[existingIndex].unit_cost;
      setFormData(prev => ({ ...prev, items: newItems }));
    } else {
      // Add new item
      const newItem = {
        product_id: product.id,
        sku: product.sku,
        product_name: product.name,
        quantity_ordered: product.reorder_quantity || 10,
        quantity_received: 0,
        unit_cost: product.cost_price || 0,
        total: (product.reorder_quantity || 10) * (product.cost_price || 0)
      };
      setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }
    setProductSearchOpen(false);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;

    if (field === 'quantity_ordered' || field === 'unit_cost') {
      newItems[index].total = (newItems[index].quantity_ordered || 0) * (newItems[index].unit_cost || 0);
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleAddEmptyItem = () => {
    const newItem = {
      product_id: '',
      sku: '',
      product_name: '',
      quantity_ordered: 1,
      quantity_received: 0,
      unit_cost: 0,
      total: 0
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleSave = async (submitForApproval = false) => {
    if (!formData.supplier_name) {
      toast.error("Please select a supplier");
      return;
    }
    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const dataToSave = {
      ...formData,
      status: submitForApproval ? 'pending_approval' : 'draft'
    };

    await createPOMutation.mutateAsync(dataToSave);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={createPageUrl("PurchaseOrders")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Purchase Order</h1>
            <p className="text-slate-500 mt-1">{formData.po_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={createPOMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => handleSave(true)}
            disabled={createPOMutation.isPending}
          >
            {createPOMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit for Approval
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-slate-400" />
                Supplier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={formData.supplier_id} onValueChange={handleSupplierChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex flex-col">
                        <span>{s.name}</span>
                        <span className="text-xs text-slate-500">{s.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.supplier_name && (
                <p className="text-sm text-slate-500 mt-2">
                  Lead time: {suppliers.find(s => s.id === formData.supplier_id)?.lead_time_days || 'N/A'} days
                </p>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-400" />
                Order Items
              </CardTitle>
              <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search products..." />
                    <CommandList>
                      <CommandEmpty>No products found.</CommandEmpty>
                      <CommandGroup>
                        {products.map(product => (
                          <CommandItem
                            key={product.id}
                            value={product.name}
                            onSelect={() => handleAddProduct(product)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center">
                                <Package className="h-4 w-4 text-slate-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-slate-500">{product.sku} • ${product.cost_price?.toFixed(2) || '0.00'}</p>
                              </div>
                              {product.quantity <= (product.reorder_point || 10) && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Low</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent className="p-0">
              <POItemsTable
                items={formData.items as any}
                onItemChange={handleItemChange}
                onRemoveItem={handleRemoveItem}
                onAddItem={handleAddEmptyItem}
                editable={true}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any notes or special instructions..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Delivery Details */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={formData.expected_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Destination Warehouse</Label>
                <Select
                  value={formData.warehouse}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, warehouse: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">${formData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-600">Tax</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.tax}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                  className="w-24 h-8 text-right"
                />
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-slate-600">Shipping</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipping: parseFloat(e.target.value) || 0 }))}
                  className="w-24 h-8 text-right"
                />
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-xl font-bold text-slate-900">${formData.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-slate-900 mb-2">💡 Pro Tip</h4>
              <p className="text-sm text-slate-600">
                Products with low stock are highlighted when adding items. Click on them to automatically add the suggested reorder quantity.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}