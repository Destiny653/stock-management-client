import React, { useState, useMemo } from 'react';
import { base44, Sale, Product } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Package,
  DollarSign,
  User,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Receipt,
  Loader2,
  CheckCircle,
  X
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";

interface CartItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total: number;
  max_quantity: number;
}

interface SaleForm {
  vendor_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  payment_method: 'cash' | 'card' | 'transfer' | 'other';
  notes: string;
  discount: number;
}

function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
  }
}

export default function DirectSales() {
  const { t } = useSafeLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pos");
  const [saleForm, setSaleForm] = useState<SaleForm>({
    vendor_name: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    payment_method: 'cash',
    notes: '',
    discount: 0
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
    initialData: [],
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-created_date'),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createSaleMutation = useMutation({
    mutationFn: (data: Partial<Sale>) => base44.entities.Sale.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("Sale completed successfully!");
      setCart([]);
      setSaleDialogOpen(false);
      resetSaleForm();
    },
  });

  const resetSaleForm = () => {
    setSaleForm({
      vendor_name: user?.full_name || '',
      client_name: '',
      client_email: '',
      client_phone: '',
      payment_method: 'cash',
      notes: '',
      discount: 0
    });
  };

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products.filter(p => p.quantity > 0);
    const search = searchTerm.toLowerCase();
    return products.filter(p =>
      p.quantity > 0 && (
        p.name?.toLowerCase().includes(search) ||
        p.sku?.toLowerCase().includes(search) ||
        p.barcode?.toLowerCase().includes(search)
      )
    );
  }, [products, searchTerm]);

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const cartTax = cartSubtotal * 0.1; // 10% tax
  const cartDiscount = saleForm.discount || 0;
  const cartTotal = cartSubtotal + cartTax - cartDiscount;

  // Today's sales stats
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.created_date).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
  const todayItems = todaySales.reduce((sum, s) => sum + (s.items?.reduce((iSum, i) => iSum + i.quantity, 0) || 0), 0);

  const addToCart = (product: any) => {
    const existingIndex = cart.findIndex(item => item.product_id === product.id);

    if (existingIndex >= 0) {
      const newCart = [...cart];
      if (newCart[existingIndex].quantity < product.quantity) {
        newCart[existingIndex].quantity += 1;
        newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].unit_price;
        setCart(newCart);
      } else {
        toast.error("Not enough stock available");
      }
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: 1,
        unit_price: product.unit_price,
        total: product.unit_price,
        max_quantity: product.quantity
      }]);
    }
  };

  const updateCartQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    const newQty = newCart[index].quantity + delta;

    if (newQty <= 0) {
      newCart.splice(index, 1);
    } else if (newQty <= newCart[index].max_quantity) {
      newCart[index].quantity = newQty;
      newCart[index].total = newQty * newCart[index].unit_price;
    } else {
      toast.error("Not enough stock available");
      return;
    }

    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleOpenSaleDialog = () => {
    if (cart.length === 0) {
      toast.error("Add products to cart first");
      return;
    }
    setSaleForm(prev => ({ ...prev, vendor_name: user?.full_name || '' }));
    setSaleDialogOpen(true);
  };

  const handleCompleteSale = async () => {
    if (!saleForm.vendor_name) {
      toast.error("Vendor name is required");
      return;
    }

    const saleData = {
      sale_number: `SALE-${Date.now().toString().slice(-8)}`,
      vendor_name: saleForm.vendor_name,
      vendor_email: user?.email || '',
      client_name: saleForm.client_name || undefined,
      client_email: saleForm.client_email || undefined,
      client_phone: saleForm.client_phone || undefined,
      items: cart.map(({ product_id, product_name, sku, quantity, unit_price, total }) => ({
        product_id, product_name, sku, quantity, unit_price, total
      })),
      subtotal: cartSubtotal,
      tax: cartTax,
      discount: cartDiscount,
      total: cartTotal,
      payment_method: saleForm.payment_method,
      notes: saleForm.notes || undefined,
    };

    // Update product quantities
    for (const item of cart) {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const newQuantity = product.quantity - item.quantity;
        let status: Product['status'] = 'active';
        if (newQuantity === 0) status = 'out_of_stock';
        else if (newQuantity <= (product.reorder_point || 10)) status = 'low_stock';

        await base44.entities.Product.update(item.product_id, { quantity: newQuantity, status });

        // Create stock movement
        await base44.entities.StockMovement.create({
          product_id: item.product_id,
          product_name: item.product_name,
          type: 'out',
          quantity: -item.quantity,
          reference_id: saleData.sale_number,
          reason: `Direct sale to ${saleForm.client_name || 'Walk-in customer'}`
        });
      }
    }

    await createSaleMutation.mutateAsync(saleData);
  };

  const paymentIcons: Record<string, any> = {
    cash: Banknote,
    card: CreditCard,
    transfer: ArrowRightLeft,
    other: Receipt
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('directSales')}</h1>
          <p className="text-slate-500 mt-1">{t('processWalkInSales')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('todaySales')}</p>
              <p className="text-2xl font-bold text-slate-900">${todayRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('transactionsToday')}</p>
              <p className="text-2xl font-bold text-slate-900">{todaySales.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('itemsSold')}</p>
              <p className="text-2xl font-bold text-slate-900">{todayItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> {t('pointOfSale')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" /> {t('salesHistory')}
          </TabsTrigger>
        </TabsList>

        {/* POS Tab */}
        <TabsContent value="pos" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t('searchProducts')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loadingProducts ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
                        cart.some(c => c.product_id === product.id) && "ring-2 ring-teal-500"
                      )}
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-square rounded-lg bg-slate-100 flex items-center justify-center mb-2 overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-8 w-8 text-slate-300" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm text-slate-900 truncate">{product.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{product.sku}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-teal-600">${product.unit_price?.toFixed(2)}</span>
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            product.quantity <= 10 ? "bg-amber-50 text-amber-700" : "bg-slate-50"
                          )}>
                            {product.quantity} left
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-slate-400" />
                    {t('cart')} ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">{t('cartEmpty')}</p>
                      <p className="text-slate-400 text-xs mt-1">{t('clickProductsToAdd')}</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {cart.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.product_name}</p>
                              <p className="text-xs text-slate-500">${item.unit_price?.toFixed(2)} each</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateCartQuantity(index, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateCartQuantity(index, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm font-medium w-16 text-right">${item.total?.toFixed(2)}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-rose-600"
                              onClick={() => removeFromCart(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">{t('subtotal')}</span>
                          <span>${cartSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">{t('tax')} (10%)</span>
                          <span>${cartTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t">
                          <span>{t('total')}</span>
                          <span className="text-teal-600">${cartTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        size="lg"
                        onClick={handleOpenSaleDialog}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {t('completeSale')}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Sales History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale #</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('vendor')}</TableHead>
                  <TableHead>{t('client')}</TableHead>
                  <TableHead>{t('items')}</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">{t('total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSales ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      {t('noSalesRecorded')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => {
                    const PaymentIcon = paymentIcons[sale.payment_method] || Receipt;
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">{sale.sale_number}</TableCell>
                        <TableCell>{format(new Date(sale.created_date), "MMM d, h:mm a")}</TableCell>
                        <TableCell>{sale.vendor_name}</TableCell>
                        <TableCell>{sale.client_name || '-'}</TableCell>
                        <TableCell>{sale.items?.length || 0} items</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            <PaymentIcon className="h-3 w-3 mr-1" />
                            {sale.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">${sale.total?.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sale Dialog */}
      <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-teal-600" />
              {t('completeSale')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Vendor Info */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                {t('vendorName')} *
              </Label>
              <Input
                value={saleForm.vendor_name}
                onChange={(e) => setSaleForm({ ...saleForm, vendor_name: e.target.value })}
                placeholder={t('vendorName')}
              />
            </div>

            {/* Client Info (Optional) */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <p className="text-sm font-medium text-slate-700">{t('customerInformation')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t('clientName')}</Label>
                  <Input
                    value={saleForm.client_name}
                    onChange={(e) => setSaleForm({ ...saleForm, client_name: e.target.value })}
                    placeholder={t('customerName')}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('clientPhone')}</Label>
                  <Input
                    value={saleForm.client_phone}
                    onChange={(e) => setSaleForm({ ...saleForm, client_phone: e.target.value })}
                    placeholder={t('phoneNumber')}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('clientEmail')}</Label>
                <Input
                  type="email"
                  value={saleForm.client_email}
                  onChange={(e) => setSaleForm({ ...saleForm, client_email: e.target.value })}
                  placeholder={t('emailAddress')}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>{t('paymentMethod')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'cash', label: 'Cash', icon: Banknote },
                  { value: 'card', label: 'Card', icon: CreditCard },
                  { value: 'transfer', label: 'Transfer', icon: ArrowRightLeft },
                  { value: 'other', label: 'Other', icon: Receipt },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSaleForm({ ...saleForm, payment_method: value as SaleForm['payment_method'] })}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                      saleForm.payment_method === value
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", saleForm.payment_method === value ? "text-teal-600" : "text-slate-400")} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label>{t('discount')} ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={saleForm.discount || ''}
                onChange={(e) => setSaleForm({ ...saleForm, discount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{t('notes')}</Label>
              <Textarea
                value={saleForm.notes}
                onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                placeholder={t('anyAdditionalNotes')}
                rows={2}
              />
            </div>

            {/* Order Summary */}
            <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{t('subtotal')}</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">{t('tax')} (10%)</span>
                <span>${cartTax.toFixed(2)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{t('discount')}</span>
                  <span className="text-emerald-400">-${cartDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-700">
                <span>{t('total')}</span>
                <span className="text-teal-400">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaleDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleCompleteSale}
              disabled={createSaleMutation.isPending}
            >
              {createSaleMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {t('completeSale')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}