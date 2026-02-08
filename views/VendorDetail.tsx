import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createPageUrl } from "@/utils";
import { base44, type Vendor, type Sale, type VendorPayment } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Store,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  TrendingUp,
  Package,
  Loader2,
  Plus,
  Edit
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-primary/10 text-primary border-primary/10 dashed border",
  suspended: "bg-destructive/10 text-destructive border-destructive/40"
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-primary/10 text-primary dashed border",
  overdue: "bg-destructive/10 text-destructive",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  failed: "bg-destructive/10 text-destructive"
};

// ... (imports remain)

export default function VendorDetail() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const queryClient = useQueryClient();

  // State
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<Partial<VendorPayment>>({
    amount: 0,
    payment_type: 'subscription',
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: '',
    status: 'pending'
  });

  // Fetch the user first (the vendor is a user with role='vendor')
  const { data: vendorUser, isLoading: loadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => userId ? base44.entities.User.get(userId) : Promise.reject('No user ID'),
    enabled: !!userId
  });

  // Fetch the vendor business data by user_id
  const { data: vendor, isLoading: loadingVendor, error: vendorError } = useQuery({
    queryKey: ['vendor-by-user', userId],
    queryFn: () => userId ? base44.entities.Vendor.getByUserId(userId) : Promise.reject('No user ID'),
    enabled: !!userId,
    retry: false  // Don't retry on 404 - vendor profile may not exist yet
  });

  const { data: vendorSales = [] } = useQuery({
    queryKey: ['vendor-sales', vendor?.id],
    queryFn: () => vendor?.id ? base44.entities.Sale.list({ vendor_id: vendor.id }) : Promise.resolve([]),
    enabled: !!vendor?.id
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['vendor-payments', vendor?.id],
    queryFn: () => vendor?.id ? base44.entities.VendorPayment.list({ vendor_id: vendor.id }) : Promise.resolve([]),
    enabled: !!vendor?.id
  });

  // Use vendorUser directly since we already fetched the user
  const linkedUser = vendorUser;

  const { data: location } = useQuery({
    queryKey: ['location', vendor?.location_id],
    queryFn: () => vendor?.location_id ? base44.entities.Location.get(vendor.location_id) : Promise.resolve(null),
    enabled: !!vendor?.location_id
  });

  // Mutations
  const confirmPaymentMutation = useMutation({
    mutationFn: (payment: VendorPayment) => base44.entities.VendorPayment.update(payment.id, {
      status: 'confirmed',
      confirmed_by: 'Super Admin',
      confirmed_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-payments', vendor?.id] });
      toast.success("Payment confirmed successfully");
    },
    onError: () => toast.error("Failed to confirm payment")
  });


  const recordPaymentMutation = useMutation({
    mutationFn: (data: Partial<VendorPayment>) => base44.entities.VendorPayment.create({
      ...data,
      vendor_id: vendor?.id as string,
      created_at: new Date().toISOString(),
      status: 'pending'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-payments', vendor?.id] });
      setIsPaymentDialogOpen(false);
      setPaymentForm({
        amount: 0,
        payment_type: 'subscription',
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: '',
        status: 'pending'
      });
      toast.success("Payment recorded successfully");
    },
    onError: () => toast.error("Failed to record payment")
  });

  // Handlers
  const handleConfirmPayment = (payment: VendorPayment) => {
    confirmPaymentMutation.mutate(payment);
  };

  const handleRecordPayment = () => {
    if (!vendor?.id) return;
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    recordPaymentMutation.mutate(paymentForm);
  };

  // Calculations
  const salesStats = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const startWeek = startOfWeek(now);
    const startMonth = startOfMonth(now);
    const startYear = startOfYear(now);

    const filterSales = (startDate: Date) => {
      const filtered = vendorSales.filter(s => new Date(s.created_at) >= startDate);
      return {
        total: filtered.reduce((acc, s) => acc + (s.total || 0), 0),
        count: filtered.length
      };
    };

    const dailySales = vendorSales.filter(s => s.created_at.startsWith(todayStr));

    return {
      daily: {
        total: dailySales.reduce((acc, s) => acc + (s.total || 0), 0),
        count: dailySales.length
      },
      weekly: filterSales(startWeek),
      monthly: filterSales(startMonth),
      yearly: filterSales(startYear),
      all: {
        total: vendorSales.reduce((acc, s) => acc + (s.total || 0), 0),
        count: vendorSales.length
      }
    };
  }, [vendorSales]);

  const paymentColumns: Column<VendorPayment>[] = [
    {
      header: 'Date',
      cell: (p) => format(new Date(p.created_at), 'MMM d, yyyy')
    },
    {
      header: 'Type',
      className: 'capitalize',
      cell: (p) => p.payment_type
    },
    {
      header: 'Amount',
      className: 'font-medium',
      cell: (p) => `$${p.amount}`
    },
    {
      header: 'Method',
      className: 'capitalize',
      cell: (p) => p.payment_method?.replace('_', ' ')
    },
    {
      header: 'Reference',
      cell: (p) => p.reference_number || '-'
    },
    {
      header: 'Status',
      cell: (p) => (
        <Badge className={paymentStatusColors[p.status]}>{p.status}</Badge>
      )
    },
    {
      header: 'Actions',
      cell: (payment) => (
        <>
          {payment.status === 'pending' && (
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90"
              onClick={() => handleConfirmPayment(payment)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm
            </Button>
          )}
          {payment.status === 'confirmed' && (
            <span className="text-sm text-muted-foreground">
              by {payment.confirmed_by}
            </span>
          )}
        </>
      )
    }
  ];

  const salesColumns: Column<Sale>[] = [
    {
      header: 'Date',
      cell: (s) => format(new Date(s.created_at), 'MMM d, yyyy')
    },
    {
      header: 'Sale ID',
      cell: (s) => s.sale_number
    },
    {
      header: 'Items',
      cell: (s) => s.items.length
    },
    {
      header: 'Total',
      className: 'font-medium',
      cell: (s) => `$${s.total?.toLocaleString() || '0'}`
    },
    {
      header: 'Status',
      cell: (s) => <Badge variant="outline">{s.status}</Badge>
    }
  ];

  // Chart data
  const chartData = useMemo(() => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStr = format(date, 'yyyy-MM-dd');
      const daySales = vendorSales.filter(s =>
        s.created_at && s.created_at.startsWith(dayStr)
      );
      last30Days.push({
        date: format(date, 'MMM d'),
        sales: daySales.reduce((sum, s) => sum + (s.total || 0), 0),
        orders: daySales.length
      });
    }
    return last30Days;
  }, [vendorSales]);
  // State for vendor registration form
  const [registrationForm, setRegistrationForm] = useState<Partial<Vendor>>({
    store_name: '',
    name: '',
    status: 'pending',
    subscription_plan: 'basic',
    commission_rate: 5,
    monthly_fee: 0,
    notes: ''
  });

  // Mutation for creating vendor profile
  const createVendorMutation = useMutation({
    mutationFn: (data: Partial<Vendor>) => base44.entities.Vendor.create({
      ...data,
      user_id: userId!,
      organization_id: vendorUser?.organization_id || '',
      join_date: new Date().toISOString().split('T')[0],
      total_sales: 0,
      total_orders: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-by-user', userId] });
      toast.success("Vendor profile created successfully");
    },
    onError: () => toast.error("Failed to create vendor profile")
  });

  const handleCreateVendorProfile = () => {
    if (!registrationForm.store_name) {
      toast.error("Please enter a store name");
      return;
    }
    createVendorMutation.mutate(registrationForm);
  };

  // Loading state
  if (loadingUser || loadingVendor) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // User not found
  if (!vendorUser) {
    return (
      <div className="text-center py-12">
        <Store className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">User not found</p>
        <Link href={createPageUrl("VendorManagement")}>
          <Button className="mt-4">Back to Vendors</Button>
        </Link>
      </div>
    );
  }

  // User exists but no Vendor profile - show registration form
  if (!vendor) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={createPageUrl("VendorManagement")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Complete Vendor Registration</h1>
            <p className="text-muted-foreground">Set up the vendor profile for {vendorUser.full_name || vendorUser.username}</p>
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{vendorUser.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{vendorUser.phone || 'No phone'}</span>
            </div>
            <div>
              <Badge variant="outline" className="capitalize">{vendorUser.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store_name">Store Name *</Label>
                <Input
                  id="store_name"
                  placeholder="Enter store/business name"
                  value={registrationForm.store_name || ''}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, store_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Legal Business Name</Label>
                <Input
                  id="name"
                  placeholder="Legal/registered name (optional)"
                  value={registrationForm.name || ''}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Subscription Plan</Label>
                <Select
                  value={registrationForm.subscription_plan || 'basic'}
                  onValueChange={(value) => setRegistrationForm({ ...registrationForm, subscription_plan: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  value={registrationForm.commission_rate || 0}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, commission_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_fee">Monthly Fee</Label>
                <Input
                  id="monthly_fee"
                  type="number"
                  min="0"
                  value={registrationForm.monthly_fee || 0}
                  onChange={(e) => setRegistrationForm({ ...registrationForm, monthly_fee: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this vendor..."
                value={registrationForm.notes || ''}
                onChange={(e) => setRegistrationForm({ ...registrationForm, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href={createPageUrl("VendorManagement")}>
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleCreateVendorProfile}
                disabled={createVendorMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {createVendorMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Vendor Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={createPageUrl("VendorManagement")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xl">
              {vendor.store_name?.charAt(0) || 'V'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{vendor.store_name}</h1>
              <p className="text-muted-foreground">{linkedUser?.full_name || 'No contact'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("text-sm px-3 py-1", statusColors[vendor.status])}>
            {vendor.status}
          </Badge>
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* ... (dialog content same structure, just rely on Shadcn defaults which are themed) ... */}
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Type</Label>
                    <Select value={paymentForm.payment_type} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, payment_type: v as VendorPayment['payment_type'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="commission">Commission</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, payment_method: v as VendorPayment['payment_method'] }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="Transaction reference"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
                  <Button className="bg-primary hover:bg-primary/90" onClick={handleRecordPayment}>
                    Record Payment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sales Period Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className={cn("cursor-pointer transition-all", salesPeriod === 'daily' && "ring-2 ring-primary")} onClick={() => setSalesPeriod('daily')}>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-2xl font-bold text-foreground">${salesStats.daily.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{salesStats.daily.count} orders</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", salesPeriod === 'weekly' && "ring-2 ring-primary")} onClick={() => setSalesPeriod('weekly')}>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold text-foreground">${salesStats.weekly.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{salesStats.weekly.count} orders</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", salesPeriod === 'monthly' && "ring-2 ring-primary")} onClick={() => setSalesPeriod('monthly')}>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-muted-foreground">This Month</p>
            <p className="text-2xl font-bold text-primary">${salesStats.monthly.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{salesStats.monthly.count} orders</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", salesPeriod === 'yearly' && "ring-2 ring-primary")} onClick={() => setSalesPeriod('yearly')}>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-muted-foreground">This Year</p>
            <p className="text-2xl font-bold text-foreground">${salesStats.yearly.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{salesStats.yearly.count} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-muted-foreground">All Time</p>
            <p className="text-2xl font-bold text-foreground">${salesStats.all.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{salesStats.all.count} orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Sales Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="var(--primary)" fill="url(#salesGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Info */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{linkedUser?.email || 'No email linked'}</span>
            </div>
            {linkedUser?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{linkedUser.phone}</span>
              </div>
            )}
            {vendor.location_id && location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{location.address}, {location.city}, {location.country}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Joined {vendor.join_date ? format(new Date(vendor.join_date), 'MMM d, yyyy') : 'N/A'}</span>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subscription</span>
                <Badge variant="outline" className="capitalize">{vendor.subscription_plan}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monthly Fee</span>
                <span className="font-medium">${vendor.monthly_fee || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Commission</span>
                <span className="font-medium">{vendor.commission_rate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Payment Status</span>
                <Badge className={paymentStatusColors[vendor.payment_status || 'pending']}>
                  {vendor.payment_status || 'pending'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={payments}
            columns={paymentColumns}
            emptyMessage="No payment records"
          />
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            data={vendorSales.slice(0, 10)}
            columns={salesColumns}
            emptyMessage="No sales recorded"
          />
        </CardContent>
      </Card>
    </div>
  );
}