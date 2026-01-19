import React, { useState, useMemo } from 'react';
import { base44, Sale, Product, ProductVariant, Vendor } from "@/api/base44Client";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createPageUrl, getImageUrl } from "@/utils";
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
  X,
  ChevronDown,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  Layers
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";

interface CartItem {
  product_id: string;
  product_name: string;
  variant_sku: string;
  variant_attributes: Record<string, string>;
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

interface Filters {
  category: string;
  status: string;
  sortBy: string;
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
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    status: "all",
    sortBy: "name"
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pos");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
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
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isManagerOrAdmin = useMemo(() => {
    if (!user) return false;
    return ['owner', 'admin', 'manager'].includes(user.role) || user.user_type === 'admin' || user.user_type === 'manager';
  }, [user]);

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', user?.organization_id],
    queryFn: () => base44.entities.Vendor.list({ organization_id: user?.organization_id }),
    enabled: !!user?.organization_id,
  });

  const myVendor = useMemo(() => {
    return vendors.find((v: Vendor) => v.user_id === user?.id);
  }, [vendors, user]);

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list({ sort: '-created_at' }),
  });

  const createSaleMutation = useMutation({
    mutationFn: (data: Partial<Sale>) => base44.entities.Sale.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('saleCompleted'));
      setCart([]);
      setSaleDialogOpen(false);
      resetSaleForm();
    },
    onError: (error: any) => {
      console.error("Sale error:", error);
      toast.error(t('saleFailed'));
    }
  });

  const deleteSaleMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Sale.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success("Sale deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete sale");
    }
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteSale = (saleId: string) => {
    setDeleteId(saleId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteSale = () => {
    if (deleteId) {
      deleteSaleMutation.mutate(deleteId);
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).filter(Boolean);
  }, [products]);

  // Helper functions
  const getProductPriceRange = (product: Product) => {
    const prices = product.variants?.map(v => v.unit_price) || [0];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max, isSame: min === max };
  };

  const getProductTotalStock = (product: Product) => {
    return product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
  };

  const hasLowStockVariant = (product: Product) => {
    return product.variants?.some(v => v.stock <= (product.reorder_point || 10) && v.stock > 0) || false;
  };

  const hasOutOfStockVariant = (product: Product) => {
    return product.variants?.some(v => v.stock === 0) || false;
  };

  const getAvailableVariants = (product: Product) => {
    return product.variants?.filter(v => v.stock > 0) || [];
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

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
    if (filters.category !== "all") {
      result = result.filter(p => p.category === filters.category);
    }

    // Status filter
    if (filters.status === "in_stock") {
      result = result.filter(p => getProductTotalStock(p) > 10);
    } else if (filters.status === "low_stock") {
      result = result.filter(p => hasLowStockVariant(p));
    }

    // Only show products with at least one variant in stock
    result = result.filter(p => getAvailableVariants(p).length > 0);

    // Sort
    switch (filters.sortBy) {
      case "price_low":
        result.sort((a, b) => getProductPriceRange(a).min - getProductPriceRange(b).min);
        break;
      case "price_high":
        result.sort((a, b) => getProductPriceRange(b).max - getProductPriceRange(a).max);
        break;
      case "stock":
        result.sort((a, b) => getProductTotalStock(b) - getProductTotalStock(a));
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, searchTerm, filters]);

  // Cart calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const cartTax = cartSubtotal * 0.1;
  const cartDiscount = saleForm.discount || 0;
  const cartTotal = cartSubtotal + cartTax - cartDiscount;

  // Today's sales stats
  const { todaySales, todayRevenue, todayCount, todayItems } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = sales.filter(s => {
      const saleDate = new Date(s.created_at);
      const d = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
      return d.getTime() === today.getTime();
    });

    const revenue = filtered.reduce((sum, s) => sum + (s.total || 0), 0);
    const count = filtered.length;
    const items = filtered.reduce((sum, s) => sum + (s.items?.reduce((iSum, i) => iSum + i.quantity, 0) || 0), 0);

    return { todaySales: filtered, todayRevenue: revenue, todayCount: count, todayItems: items };
  }, [sales]);

  // Add variant to cart
  const addVariantToCart = (product: Product, variant: ProductVariant) => {
    const existingIndex = cart.findIndex(
      c => c.product_id === product.id && c.variant_sku === variant.sku
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      if (newCart[existingIndex].quantity < variant.stock) {
        newCart[existingIndex].quantity += 1;
        newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].unit_price;
        setCart(newCart);
      } else {
        toast.error(t('notEnoughStock'));
      }
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        variant_sku: variant.sku,
        variant_attributes: variant.attributes || {},
        quantity: 1,
        unit_price: variant.unit_price,
        total: variant.unit_price,
        max_quantity: variant.stock
      }]);
    }
    setExpandedProductId(null);
  };

  // Handle product card click
  const handleProductClick = (product: Product) => {
    const availableVariants = getAvailableVariants(product);

    if (availableVariants.length === 1) {
      // Single variant - auto-add
      addVariantToCart(product, availableVariants[0]);
      toast.success(t('addedToCartSuccess'));
    } else if (availableVariants.length > 1) {
      // Multiple variants - toggle expansion
      setExpandedProductId(expandedProductId === product.id ? null : product.id);
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
      toast.error(t('notEnoughStock'));
      return;
    }

    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleOpenSaleDialog = () => {
    if (cart.length === 0) {
      toast.error(t('addProductsFirst'));
      return;
    }
    setSaleForm(prev => ({ ...prev, vendor_name: user?.full_name || '' }));
    setSaleDialogOpen(true);
  };

  const handleCompleteSale = async () => {
    if (!saleForm.vendor_name) {
      toast.error(t('vendorNameRequired'));
      return;
    }

    const saleData = {
      sale_number: `SALE-${Date.now().toString().slice(-8)}`,
      vendor_id: myVendor?.id,
      vendor_name: saleForm.vendor_name || user?.full_name || 'System',
      vendor_email: user?.email || '',
      organization_id: user?.organization_id ?? undefined,
      client_name: saleForm.client_name || undefined,
      client_email: saleForm.client_email || undefined,
      client_phone: saleForm.client_phone || undefined,
      items: cart.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.variant_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total
      })),
      subtotal: cartSubtotal,
      tax: cartTax,
      discount: cartDiscount,
      total: cartTotal,
      payment_method: saleForm.payment_method,
      notes: saleForm.notes || undefined,
    };

    await createSaleMutation.mutateAsync(saleData);
  };

  const paymentIcons: Record<string, any> = {
    cash: Banknote,
    card: CreditCard,
    transfer: ArrowRightLeft,
    other: Receipt
  };

  // Format variant attributes for display
  const formatAttributes = (attrs: Record<string, string>) => {
    return Object.values(attrs).join(' / ');
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('todaySales')}</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">${todayRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('transactionsToday')}</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{todayCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm bg-white overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('itemsSold')}</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums">{todayItems}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative min-h-[400px]">
            {createSaleMutation.isPending && (
              <div className="absolute inset-0 z-[60] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
                <div className="p-8 bg-white shadow-2xl rounded-2xl flex flex-col items-center gap-4 ring-1 ring-slate-200">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-teal-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-900 uppercase tracking-widest text-sm">{t('completingSale')}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{t('pleaseWait')}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="lg:col-span-2 space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder={t('searchProducts')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filters.category} onValueChange={(v) => setFilters(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('category')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allCategories')}</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder={t('status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allStock')}</SelectItem>
                      <SelectItem value="in_stock">{t('inStock')}</SelectItem>
                      <SelectItem value="low_stock">{t('lowStock')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.sortBy} onValueChange={(v) => setFilters(f => ({ ...f, sortBy: v }))}>
                    <SelectTrigger className="w-[140px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t('sortBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">{t('nameAZ')}</SelectItem>
                      <SelectItem value="price_low">{t('priceLowHigh')}</SelectItem>
                      <SelectItem value="price_high">{t('priceHighLow')}</SelectItem>
                      <SelectItem value="stock">{t('stockLevel')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loadingProducts ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-xl">
                  <Package className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium">{t('noProductsFound')}</p>
                  <p className="text-slate-400 text-sm">{t('tryAdjustingFilters')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const priceRange = getProductPriceRange(product);
                    const totalStock = getProductTotalStock(product);
                    const availableVariants = getAvailableVariants(product);
                    const isLowStock = hasLowStockVariant(product);
                    const isExpanded = expandedProductId === product.id;
                    const itemsInCart = cart.filter(c => c.product_id === product.id);
                    const isInCart = itemsInCart.length > 0;
                    const isSingleVariant = availableVariants.length === 1;

                    return (
                      <div key={product.id} className="h-full">
                        <Card
                          className={cn(
                            "group relative h-full overflow-hidden border-slate-200/60 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1.5 bg-white/80 backdrop-blur-sm",
                            isInCart && "ring-2 ring-teal-500/50 shadow-lg shadow-teal-500/5 border-teal-200/50",
                            isExpanded && "ring-2 ring-teal-500 shadow-xl border-teal-200"
                          )}
                          onClick={() => handleProductClick(product)}
                        >
                          <CardContent className="p-0 flex flex-col h-full bg-slate-50/20">
                            {/* Image Wrapper */}
                            <div className="relative aspect-[4/5] bg-slate-50 overflow-hidden">
                              {product.image_url ? (
                                <img
                                  src={getImageUrl(product.image_url)}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-10 w-10 text-slate-200" />
                                </div>
                              )}

                              {/* Overlays */}
                              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              {/* Status Badges */}
                              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                                {isLowStock && (
                                  <Badge className="bg-orange-500/90 text-white backdrop-blur-md border-0 text-[10px] py-0 px-2 h-5 rounded-full shadow-sm font-bold">
                                    {t('lowStock')}
                                  </Badge>
                                )}
                                {isInCart && (
                                  <Badge className="bg-teal-500/90 text-white backdrop-blur-md border-0 text-[10px] py-0 px-2 h-5 rounded-full shadow-sm animate-in zoom-in-50 font-bold">
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    {itemsInCart.length} {t('inCart')}
                                  </Badge>
                                )}
                              </div>

                              {!isSingleVariant && (
                                <div className="absolute top-2.5 right-2.5">
                                  <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-700 border-0 text-[10px] py-0 px-2 h-5 rounded-full shadow-sm font-bold">
                                    {availableVariants.length} {t('sizes')}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Info Section */}
                            <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                              <div className="space-y-1">
                                <h4 className="font-extrabold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1 leading-tight text-[15px]">{product.name}</h4>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{product.category}</p>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-end justify-between gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('price')}</span>
                                    {priceRange.isSame ? (
                                      <span className="font-black text-teal-600 text-lg tabular-nums tracking-tight">${priceRange.min.toFixed(2)}</span>
                                    ) : (
                                      <span className="font-black text-teal-600 tabular-nums tracking-tight text-base">
                                        ${priceRange.min} - ${priceRange.max}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">{t('available')}</span>
                                    <span className={cn(
                                      "text-xs font-black tabular-nums",
                                      totalStock <= 10 ? "text-orange-600" : "text-slate-700"
                                    )}>
                                      {totalStock} {t('units')}
                                    </span>
                                  </div>
                                </div>

                                {isSingleVariant ? (
                                  <Button
                                    className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 rounded-xl font-black transition-all active:scale-95 text-xs uppercase tracking-widest"
                                  >
                                    <Plus className="h-4 w-4 mr-2" /> {t('addToCart')}
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full h-11 rounded-xl font-black transition-all border-slate-200 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 text-xs uppercase tracking-widest",
                                      isExpanded && "bg-teal-50 border-teal-300 text-teal-600"
                                    )}
                                  >
                                    {t('selectOptions')} <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform duration-300", isExpanded && "rotate-180")} />
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Integration: Slide-up Variant Selector Overlay */}
                            <div
                              className={cn(
                                "absolute inset-0 z-50 bg-white shadow-2xl transition-transform duration-300 ease-out transform flex flex-col overflow-hidden",
                                isExpanded && !isSingleVariant ? "translate-y-0" : "translate-y-full"
                              )}
                              onClick={(e) => e.stopPropagation()} // Prevent clicking selector from triggering card click
                            >
                              {/* Header with Close */}
                              <div className="p-3 border-b flex items-center justify-between bg-teal-50/80 backdrop-blur-sm sticky top-0 z-10">
                                <div className="flex flex-col min-w-0 pr-4">
                                  <h5 className="font-black text-teal-900 text-xs leading-none uppercase tracking-widest mb-1">{t('selectVariant')}</h5>
                                  <p className="text-[10px] text-teal-600 font-black uppercase tracking-tight truncate">{product.name}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-teal-100/80 text-teal-700 flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedProductId(null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Scrollable variant list */}
                              <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 custom-scrollbar">
                                {availableVariants.map((variant) => {
                                  const variantInCart = cart.find(
                                    c => c.product_id === product.id && c.variant_sku === variant.sku
                                  );
                                  const isVariantLowStock = variant.stock <= (product.reorder_point || 10);

                                  return (
                                    <button
                                      key={variant.sku}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addVariantToCart(product, variant);
                                        toast.success(t('addedToCartSuccess'));
                                      }}
                                      className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl hover:bg-teal-50 transition-all text-left group/v border border-slate-100",
                                        variantInCart && "bg-teal-50/50 border-teal-200 ring-2 ring-teal-500/10"
                                      )}
                                    >
                                      <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <span className="text-[10px] font-black font-mono text-teal-600 bg-teal-100/50 px-1.5 py-0.5 rounded uppercase tracking-wider">{variant.sku}</span>
                                          {isVariantLowStock && (
                                            <Badge className="bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 h-4 border-0 uppercase">{t('low')}</Badge>
                                          )}
                                          {variantInCart && (
                                            <CheckCircle className="h-3.5 w-3.5 text-teal-500" />
                                          )}
                                        </div>
                                        {Object.keys(variant.attributes || {}).length > 0 && (
                                          <p className="text-[11px] text-slate-500 font-black truncate uppercase tracking-tight">
                                            {formatAttributes(variant.attributes)}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right ml-2 flex-shrink-0">
                                        <p className="font-black text-sm text-slate-900 tabular-nums">${variant.unit_price.toFixed(2)}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{variant.stock} {t('left')}</p>
                                      </div>
                                      <div className="ml-3 h-9 w-9 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover/v:bg-teal-600 group-hover/v:text-white group-hover/v:border-teal-600 transition-all shadow-sm">
                                        <Plus className="h-4 w-4" />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Inline Cart Summary */}
                              {isInCart && (
                                <div className="p-3 bg-teal-600 text-white text-[10px] font-black flex items-center justify-between uppercase tracking-widest">
                                  <span className="flex items-center gap-2">
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                    {itemsInCart.length} {t('items')} {t('inCart')}
                                  </span>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-teal-600" />
                    {t('cart')}
                    {cart.length > 0 && (
                      <Badge className="ml-auto bg-teal-100 text-teal-700">{cart.length} {t('items')}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">{t('cartEmpty')}</p>
                      <p className="text-slate-400 text-xs mt-1">{t('clickProductsToAdd')}</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {cart.map((item, index) => (
                          <div key={`${item.product_id}-${item.variant_sku}`} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{item.product_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1 rounded">{item.variant_sku}</span>
                                {Object.keys(item.variant_attributes).length > 0 && (
                                  <span className="text-[10px] text-slate-500">{formatAttributes(item.variant_attributes)}</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">${item.unit_price.toFixed(2)} {t('each')}</p>
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
                              <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => updateCartQuantity(index, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">${item.total.toFixed(2)}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-rose-600 mt-1"
                                onClick={() => removeFromCart(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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
                        <div className="flex justify-between text-xl font-bold pt-2 border-t">
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
                  <TableHead>{t('saleNumber')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('client')}</TableHead>
                  <TableHead>{t('items')}</TableHead>
                  <TableHead>{t('payment')}</TableHead>
                  <TableHead className="text-right">{t('total')}</TableHead>
                  {isManagerOrAdmin && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSales ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      {t('noSalesRecorded')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => {
                    const PaymentIcon = paymentIcons[sale.payment_method] || Receipt;
                    return (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium font-mono text-indigo-600">{sale.sale_number}</TableCell>
                        <TableCell>{format(new Date(sale.created_at), "MMM d, h:mm a")}</TableCell>
                        <TableCell>{sale.client_name || 'Walk-in'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sale.items?.length || 0} items</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            <PaymentIcon className="h-3 w-3 mr-1" />
                            {sale.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-teal-600">${sale.total_amount?.toFixed(2)}</TableCell>
                        {isManagerOrAdmin && (
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700" onClick={() => handleDeleteSale(sale.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
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
                  { value: 'cash', label: t('cash'), icon: Banknote },
                  { value: 'card', label: t('card'), icon: CreditCard },
                  { value: 'transfer', label: t('transfer'), icon: ArrowRightLeft },
                  { value: 'other', label: t('other'), icon: Receipt },
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
      {/* Delete Sale Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <DialogTitle className="text-xl">Void Transaction?</DialogTitle>
            <p className="text-sm text-slate-500">
              Are you sure you want to void this sale? This will remove the record and cannot be reversed.
            </p>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSale} disabled={deleteSaleMutation.isPending}>
              {deleteSaleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Confirm Void
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}