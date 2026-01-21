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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  suspended: "bg-rose-100 text-rose-700"
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-rose-100 text-rose-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700"
};

// Types imported from base44Client

export default function VendorDetail() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const vendorId = searchParams?.get('id') ?? null;
  const [salesPeriod, setSalesPeriod] = useState('monthly');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_type: 'subscription',
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: ''
  });

  const { data: vendorData, isLoading: loadingVendor } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: () => base44.entities.Vendor.filter({ id: vendorId }),
    enabled: !!vendorId,
  });

  const vendor = (vendorData as Vendor[])?.[0];

  const { data: payments = [] } = useQuery<VendorPayment[]>({
    queryKey: ['vendorPayments', vendorId],
    queryFn: () => base44.entities.VendorPayment.filter({ vendor_id: vendorId }),
    enabled: !!vendorId,
  });

  const { data: allSales = [] } = useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: linkedUser } = useQuery({
    queryKey: ['user', vendor?.user_id],
    queryFn: () => base44.entities.User.get(vendor!.user_id!),
    enabled: !!vendor?.user_id,
  });

  const { data: location } = useQuery({
    queryKey: ['location', vendor?.location_id],
    queryFn: () => base44.entities.Location.get(vendor!.location_id!),
    enabled: !!vendor?.location_id,
  });

  // Filter sales for this vendor
  const vendorSales = useMemo(() => {
    if (!vendor) return [];
    return (allSales as Sale[]).filter(s => s.vendor_id === vendor.id);
  }, [allSales, vendor]);

  // Calculate sales by period
  const salesStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dailySales = vendorSales.filter(s => {
      const saleDate = new Date(s.created_at);
      return saleDate >= today;
    });

    const weekStart = startOfWeek(now);
    const weeklySales = vendorSales.filter(s => {
      const saleDate = new Date(s.created_at);
      return saleDate >= weekStart;
    });

    const monthStart = startOfMonth(now);
    const monthlySales = vendorSales.filter(s => {
      const saleDate = new Date(s.created_at);
      return saleDate >= monthStart;
    });

    const yearStart = startOfYear(now);
    const yearlySales = vendorSales.filter(s => {
      const saleDate = new Date(s.created_at);
      return saleDate >= yearStart;
    });

    return {
      daily: {
        total: dailySales.reduce((sum, s) => sum + (s.total || 0), 0),
        count: dailySales.length
      },
      weekly: {
        total: weeklySales.reduce((sum, s) => sum + (s.total || 0), 0),
        count: weeklySales.length
      },
      monthly: {
        total: monthlySales.reduce((sum, s) => sum + (s.total || 0), 0),
        count: monthlySales.length
      },
      yearly: {
        total: yearlySales.reduce((sum, s) => sum + (s.total || 0), 0),
        count: yearlySales.length
      },
      all: {
        total: vendorSales.reduce((sum, s) => sum + (s.total || 0), 0),
        count: vendorSales.length
      }
    };
  }, [vendorSales]);

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

  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => base44.entities.VendorPayment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorPayments', vendorId] });
      toast.success("Payment recorded");
      setIsPaymentDialogOpen(false);
      setPaymentForm({
        amount: 0,
        payment_type: 'subscription',
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: ''
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: any }) => base44.entities.VendorPayment.update(paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorPayments', vendorId] });
      toast.success("Payment confirmed");
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: (data: any) => base44.entities.Vendor.update(vendorId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', vendorId] });
      toast.success("Vendor updated");
    },
  });

  const handleRecordPayment = async () => {
    if (!paymentForm.amount) {
      toast.error("Please enter an amount");
      return;
    }

    await createPaymentMutation.mutateAsync({
      vendor_id: vendorId,
      vendor_name: vendor.store_name,
      ...paymentForm,
      status: 'pending',
      period_start: startOfMonth(new Date()).toISOString().split('T')[0],
      period_end: endOfMonth(new Date()).toISOString().split('T')[0]
    });
  };

  const handleConfirmPayment = async (payment: VendorPayment) => {
    await confirmPaymentMutation.mutateAsync({
      paymentId: payment.id,
      data: {
        status: 'confirmed',
        confirmed_by: user?.email,
        confirmed_date: new Date().toISOString()
      }
    });

    // Update vendor payment status
    await updateVendorMutation.mutateAsync({
      payment_status: 'paid',
      last_payment_date: new Date().toISOString().split('T')[0]
    });
  };

  if (loadingVendor) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Vendor not found</p>
        <Link href={createPageUrl("VendorManagement")}>
          <Button className="mt-4">Back to Vendors</Button>
        </Link>
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
            <div className="h-14 w-14 rounded-xl bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
              {vendor.store_name?.charAt(0) || 'V'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{vendor.store_name}</h1>
              <p className="text-slate-500">{linkedUser?.full_name || 'No contact'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn("text-sm px-3 py-1", statusColors[vendor.status])}>
            {vendor.status}
          </Badge>
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                    <Select value={paymentForm.payment_type} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, payment_type: v }))}>
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
                    <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, payment_method: v }))}>
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
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleRecordPayment}>
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
        <Card className={cn("cursor-pointer transition-all", salesPeriod === 'daily' && "ring-2 ring-teal-500")} onClick={() => setSalesPeriod('daily')}>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-slate-500">Today</p>
            <p className="text-2xl font-bold text-slate-900">${salesStats.daily.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.daily.count} orders</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", salesPeriod === 'weekly' && "ring-2 ring-teal-500")} onClick={() => setSalesPeriod('weekly')}>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-slate-500">This Week</p>
            <p className="text-2xl font-bold text-slate-900">${salesStats.weekly.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.weekly.count} orders</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", salesPeriod === 'monthly' && "ring-2 ring-teal-500")} onClick={() => setSalesPeriod('monthly')}>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-slate-500">This Month</p>
            <p className="text-2xl font-bold text-teal-600">${salesStats.monthly.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.monthly.count} orders</p>
          </CardContent>
        </Card>
        <Card className={cn("cursor-pointer transition-all", salesPeriod === 'yearly' && "ring-2 ring-teal-500")} onClick={() => setSalesPeriod('yearly')}>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-slate-500">This Year</p>
            <p className="text-2xl font-bold text-slate-900">${salesStats.yearly.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.yearly.count} orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 py-12">
            <p className="text-sm text-slate-500">All Time</p>
            <p className="text-2xl font-bold text-slate-900">${salesStats.all.total.toLocaleString()}</p>
            <p className="text-xs text-slate-500">{salesStats.all.count} orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-400" />
              Sales Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="sales" stroke="#14b8a6" fill="url(#salesGradient)" strokeWidth={2} />
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
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-sm">{linkedUser?.email || 'No email linked'}</span>
            </div>
            {linkedUser?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-sm">{linkedUser.phone}</span>
              </div>
            )}
            {vendor.location_id && location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <span className="text-sm">{location.address}, {location.city}, {location.country}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm">Joined {vendor.join_date ? format(new Date(vendor.join_date), 'MMM d, yyyy') : 'N/A'}</span>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Subscription</span>
                <Badge variant="outline" className="capitalize">{vendor.subscription_plan}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Monthly Fee</span>
                <span className="font-medium">${vendor.monthly_fee || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Commission</span>
                <span className="font-medium">{vendor.commission_rate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Payment Status</span>
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
            <CreditCard className="h-5 w-5 text-slate-400" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No payment records</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600/10 hover:bg-teal-600/10 text-slate-700">
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payments as VendorPayment[]).map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="capitalize">{payment.payment_type}</TableCell>
                    <TableCell className="font-medium">${payment.amount}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method?.replace('_', ' ')}</TableCell>
                    <TableCell>{payment.reference_number || '-'}</TableCell>
                    <TableCell>
                      <Badge className={paymentStatusColors[payment.status]}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {payment.status === 'pending' && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleConfirmPayment(payment)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                      )}
                      {payment.status === 'confirmed' && (
                        <span className="text-sm text-slate-500">
                          by {payment.confirmed_by}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-400" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendorSales.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No sales recorded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600/10 hover:bg-teal-600/10 text-slate-700">
                  <TableHead>Sale #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(vendorSales as Sale[]).slice(0, 10).map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.sale_number}</TableCell>
                    <TableCell>{format(new Date(sale.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell>{sale.items?.length || 0} items</TableCell>
                    <TableCell className="font-medium">${sale.total?.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{sale.payment_method}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}