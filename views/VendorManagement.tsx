import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { base44, type Vendor, type Sale } from "@/api/base44Client";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import VendorLocationPicker from "@/components/vendors/VendorLocationPicker";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Store,
  Users,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Grid3X3,
  List,
  Filter,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";
import { useAuth } from '@/contexts/AuthContext';

function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
  }
}

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  inactive: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  suspended: "bg-rose-100 text-rose-700"
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-primary/10 text-primary",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-rose-100 text-rose-700",
  grace_period: "bg-orange-100 text-orange-700"
};



interface VendorFormData {
  store_name: string;  // Trading/Display name for the vendor's store
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  subscription_plan: string;
  monthly_fee: number;
  commission_rate: number;
  notes: string;
  organization_id?: string;
  location_id?: string;
  user_id?: string;
  name: string;
  // Address fields for the sub-location
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface Organization {
  id: string;
  name: string;
  code: string;
}




export default function VendorManagement() {
  const { t } = useSafeLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    store_name: '',
    address: '',
    city: '',
    country: '',
    latitude: undefined,
    longitude: undefined,
    status: 'pending',
    subscription_plan: 'basic',
    monthly_fee: 0,
    commission_rate: 5,
    notes: '',
    organization_id: '',
    location_id: '',
    user_id: '',
    name: ''
  });

  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.user_type === 'platform-staff';

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
    enabled: isSuperAdmin, // Only superadmins can see all organizations
  });

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors', currentUser?.organization_id],
    queryFn: () => base44.entities.Vendor.list({
      organization_id: isSuperAdmin ? undefined : currentUser?.organization_id
    }),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', currentUser?.organization_id],
    queryFn: () => base44.entities.User.list({
      organization_id: isSuperAdmin ? undefined : currentUser?.organization_id
    }),
  });

  // Create a map for location display
  const locationMap = useMemo(() => {
    return locations.reduce((acc, loc) => {
      acc[loc.id] = loc;
      return acc;
    }, {} as Record<string, any>);
  }, [locations]);

  const userMap = useMemo(() => {
    return users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {} as Record<string, any>);
  }, [users]);

  const vendorMap = useMemo(() => {
    const map: Record<string, any> = {};
    vendors.forEach((v: any) => {
      if (v.user_id) map[v.user_id] = v;
    });
    return map;
  }, [vendors]);

  const orgVendors = useMemo(() => {
    const vendorUsers = users.filter(u => u.role === 'vendor');

    const result = vendorUsers.map(u => {
      const profile = vendorMap[u.id];
      return {
        ...u,
        ...profile,
        id: profile?.id || u.id,
        user_id: u.id,
        is_user_only: !profile,
        store_name: profile?.store_name || u.full_name || u.username || 'New Vendor',
        name: profile?.name || u.full_name || u.username
      };
    });

    // Also include any vendors that don't have a linked user yet (safety)
    vendors.forEach((v: any) => {
      if (!v.user_id || !userMap[v.user_id]) {
        const exists = result.some(ov => ov.id === v.id);
        if (!exists) {
          result.push({
            ...v,
            id: v.id,
            store_name: v.store_name || v.name || 'External Vendor',
            name: v.name || 'External Vendor',
            status: v.status || 'active'
          } as any);
        }
      }
    });

    return result;
  }, [users, vendors, vendorMap, userMap]);

  const createVendorMutation = useMutation({
    mutationFn: (data: any) => base44.entities.Vendor.create({
      ...data,
      join_date: new Date().toISOString().split('T')[0],
      total_sales: 0,
      total_orders: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success("Vendor created successfully");
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => base44.entities.Vendor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success("Vendor updated successfully");
      setEditingVendor(null);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      store_name: '',
      address: '',
      city: '',
      country: '',
      latitude: undefined,
      longitude: undefined,
      status: 'pending',
      subscription_plan: 'basic',
      monthly_fee: 0,
      commission_rate: 5,
      notes: '',
      organization_id: '',
      location_id: '',
      user_id: '',
      name: ''
    });
  };

  const handleEdit = (vendor: Vendor) => {
    const loc = vendor.location_id ? locationMap[vendor.location_id] : null;
    setEditingVendor(vendor);
    setFormData({
      store_name: vendor.store_name || '',
      address: loc?.address || '',
      city: loc?.city || '',
      country: loc?.country || '',
      latitude: loc?.latitude,
      longitude: loc?.longitude,
      status: (vendor.status as any) || 'pending',
      subscription_plan: vendor.subscription_plan || 'basic',
      monthly_fee: vendor.monthly_fee || 0,
      commission_rate: vendor.commission_rate || 5,
      notes: vendor.notes || '',
      organization_id: vendor.organization_id || '',
      location_id: vendor.location_id || '',
      user_id: vendor.user_id || '',
      name: vendor.name || ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.store_name) {
      toast.error("Please fill in the store name");
      return;
    }

    try {
      let locationId = formData.location_id;

      // 1. Create/Update Location first if we have address info
      if (formData.address || formData.latitude) {
        const locationData = {
          name: `${formData.store_name} Store`,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          latitude: formData.latitude as number,
          longitude: formData.longitude as number,
        };

        if (locationId) {
          await base44.entities.Location.update(locationId, locationData);
        } else {
          const loc = await base44.entities.Location.create(locationData);
          locationId = loc.id;
        }
      }

      // 2. Destructure to remove location fields from vendor data
      const {
        address,
        city,
        country,
        latitude,
        longitude,
        ...rest
      } = formData;

      const vendorData = {
        ...rest,
        organization_id: (isSuperAdmin ? rest.organization_id : currentUser?.organization_id) ?? undefined,
        location_id: locationId,
        user_id: rest.user_id || null
      };

      if (editingVendor) {
        await updateVendorMutation.mutateAsync({
          id: editingVendor.id,
          data: { ...vendorData, organization_id: editingVendor.organization_id } // Don't allow org change on edit
        });
      } else {
        await createVendorMutation.mutateAsync(vendorData);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error saving vendor");
    }
  };

  const handleStatusChange = async (vendorId: string, newStatus: string) => {
    await updateVendorMutation.mutateAsync({ id: vendorId, data: { status: newStatus } });
  };

  // Calculate vendor stats from sales
  const vendorStats = useMemo(() => {
    const stats: Record<string, { totalSales: number; totalOrders: number }> = {};
    (sales as Sale[]).forEach(sale => {
      const vendorId = sale.vendor_id;
      if (!vendorId) return;
      if (!stats[vendorId]) {
        stats[vendorId] = { totalSales: 0, totalOrders: 0 };
      }
      stats[vendorId].totalSales += sale.total || 0;
      stats[vendorId].totalOrders += 1;
    });
    return stats;
  }, [sales]);

  const filteredVendors = useMemo(() => {
    let result = [...orgVendors];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(v => {
        const loc = v.location_id ? locationMap[v.location_id] : null;
        return v.name?.toLowerCase().includes(search) ||
          v.store_name?.toLowerCase().includes(search) ||
          v.email?.toLowerCase().includes(search) ||
          v.full_name?.toLowerCase().includes(search) ||
          loc?.city?.toLowerCase().includes(search);
      });
    }

    if (statusFilter !== "all") {
      result = result.filter(v => v.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      result = result.filter(v => v.payment_status === paymentFilter);
    }

    return result;
  }, [orgVendors, searchTerm, statusFilter, paymentFilter, locationMap]);

  const vendorListColumns: Column<any>[] = [
    {
      header: 'Vendor',
      cell: (vendor) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold">
            {vendor.store_name?.charAt(0) || 'V'}
          </div>
          <div>
            <Link
              href={createPageUrl(`VendorDetail?userId=${vendor.user_id}`)}
              className="font-medium text-slate-900 hover:text-primary hover:underline"
            >
              {vendor.store_name}
            </Link>
            <p className="text-sm text-slate-500">{userMap[vendor.user_id!]?.full_name || 'No contact'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Contact',
      cell: (vendor) => (
        <>
          <p className="text-sm">{userMap[vendor.user_id!]?.email || 'No email'}</p>
          <p className="text-sm text-slate-500">{userMap[vendor.user_id!]?.phone || ''}</p>
        </>
      )
    },
    {
      header: 'Location',
      className: 'text-slate-600',
      cell: (vendor) => (
        vendor.location_id && locationMap[vendor.location_id]
          ? `${locationMap[vendor.location_id].city}, ${locationMap[vendor.location_id].country}`
          : '-'
      )
    },
    {
      header: 'Status',
      cell: (vendor) => <Badge className={statusColors[vendor.status]}>{vendor.status}</Badge>
    },
    {
      header: 'Payment',
      cell: (vendor) => (
        <Badge className={paymentStatusColors[vendor.payment_status || 'pending']}>
          {vendor.payment_status || 'pending'}
        </Badge>
      )
    },
    {
      header: 'Sales',
      className: 'font-medium',
      cell: (vendor) => {
        const stats = vendorStats[vendor.id] || { totalSales: 0, totalOrders: 0 };
        return `$${(stats.totalSales || vendor.total_sales || 0).toLocaleString()}`;
      }
    },
    {
      header: '',
      className: 'w-12',
      cell: (vendor) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={createPageUrl(`VendorDetail?userId=${vendor.user_id}`)}>
                <Eye className="h-4 w-4 mr-2" /> {vendor.is_user_only ? 'Complete Profile' : 'View'}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(vendor)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // Stats
  const stats = {
    total: orgVendors.length,
    active: orgVendors.filter(v => v.status === 'active').length,
    pending: orgVendors.filter(v => v.status === 'pending').length,
    overdue: orgVendors.filter(v => v.payment_status === 'overdue').length,
  };





  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('vendorManagement')}</h1>
          <p className="text-slate-500 mt-1">{t('manageVendorsSubscriptions')}</p>
        </div>
        <div className="flex gap-3">
          <Link href={createPageUrl("StoreLocations")}>
            <Button variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              {t('viewMap')}
            </Button>
          </Link>
          <Dialog open={isAddDialogOpen || editingVendor !== null} onOpenChange={(open) => {
            if (!open) { setEditingVendor(null); resetForm(); }
            setIsAddDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                {t('addVendor')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingVendor ? t('editVendor') : t('addVendor')}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
                {isSuperAdmin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>Organization</Label>
                      <Select value={formData.organization_id || "none"} onValueChange={(v) => setFormData(prev => ({ ...prev, organization_id: v === "none" ? "" : v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Organization</SelectItem>
                          {organizations.map(org => (
                            <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Linked User Account</Label>
                      <Select value={formData.user_id || "none"} onValueChange={(v) => setFormData(prev => ({ ...prev, user_id: v === "none" ? "" : v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Link to user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No User Account</SelectItem>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name || u.username} ({u.email})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500">Linking allows the vendor to log in</p>
                    </div>
                  </div>
                )}

                {!isSuperAdmin && (
                  <div className="flex flex-col gap-2">
                    <Label>Linked User Account</Label>
                    <Select value={formData.user_id || "none"} onValueChange={(v) => setFormData(prev => ({ ...prev, user_id: v === "none" ? "" : v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Link to user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No User Account</SelectItem>
                        {users.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name || u.username} ({u.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-500">Only team members from your organization are listed</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2 col-span-2">
                    <Label>{t('businessNameRequired')}</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('businessName')}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>{t('storeNameRequired')}</Label>
                  <Input
                    value={formData.store_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                    placeholder={t('storeName')}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>{t('storeAddress')}</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder={t('storeAddress')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>{t('city')}</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder={t('city')}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t('country')}</Label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder={t('country')}
                    />
                  </div>
                </div>

                {/* Location Picker with Map */}
                <VendorLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={(lat: number, lng: number) => setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                  }))}
                  onAddressChange={(addressData: { address?: string; city?: string; country?: string }) => setFormData(prev => ({
                    ...prev,
                    address: addressData.address?.split(',').slice(0, 2).join(',') || prev.address,
                    city: addressData.city || prev.city,
                    country: addressData.country || prev.country
                  }))}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>{t('status')}</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('pending')}</SelectItem>
                        <SelectItem value="active">{t('active')}</SelectItem>
                        <SelectItem value="inactive">{t('inactive')}</SelectItem>
                        <SelectItem value="suspended">{t('suspended')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t('subscriptionPlan')}</Label>
                    <Select value={formData.subscription_plan} onValueChange={(v) => setFormData(prev => ({ ...prev, subscription_plan: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">{t('basic')}</SelectItem>
                        <SelectItem value="standard">{t('standard')}</SelectItem>
                        <SelectItem value="premium">{t('premium')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>{t('monthlyFee')} ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.monthly_fee}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthly_fee: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>{t('commissionRate')} (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>{t('notes')}</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('notes')}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setEditingVendor(null); setIsAddDialogOpen(false); resetForm(); }}>
                    {t('cancel')}
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={handleSubmit}
                    disabled={createVendorMutation.isPending || updateVendorMutation.isPending}
                  >
                    {(createVendorMutation.isPending || updateVendorMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingVendor ? t('updateVendor') : t('addVendor')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className='p-10'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('totalVendors')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='p-10'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('active')}</p>
                <p className="text-2xl font-bold text-primary">{stats.active}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='p-10'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('pendingApprovalShort')}</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='p-10'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('paymentOverdue')}</p>
                <p className="text-2xl font-bold text-rose-600">{stats.overdue}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('searchVendors')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-sm py-5 max-w-[60%] bg-white border-slate-200 focus:bg-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white rounded-sm py-5">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="inactive">{t('inactive')}</SelectItem>
              <SelectItem value="suspended">{t('suspended')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-40 bg-white rounded-sm py-5">
              <SelectValue placeholder={t('paymentStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allPayments')}</SelectItem>
              <SelectItem value="paid">{t('paid')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="overdue">{t('overdue')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Vendors Display */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map(vendor => {
            const stats = vendorStats[vendor.id] || { totalSales: 0, totalOrders: 0 };
            return (
              <Card key={vendor.id} className=" transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-lg">
                        {vendor.store_name?.charAt(0) || 'V'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{vendor.store_name}</h3>
                        <p className="text-sm text-slate-500">{userMap[vendor.user_id!]?.full_name || 'No contact'}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={createPageUrl(`VendorDetail?userId=${vendor.user_id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> {vendor.is_user_only ? t('completeProfile') || 'Complete Profile' : t('viewDetails')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(vendor)}>
                          <Edit className="h-4 w-4 mr-2" /> {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {vendor.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(vendor.id, 'active')}>
                            <CheckCircle className="h-4 w-4 mr-2" /> {t('activate')}
                          </DropdownMenuItem>
                        )}
                        {vendor.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(vendor.id, 'suspended')} className="text-rose-600">
                            <XCircle className="h-4 w-4 mr-2" /> {t('suspend')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {userMap[vendor.user_id!]?.email || 'No email linked'}
                    </div>
                    {userMap[vendor.user_id!]?.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {userMap[vendor.user_id!]?.phone}
                      </div>
                    )}
                    {vendor.location_id && locationMap[vendor.location_id] && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {locationMap[vendor.location_id].city}, {locationMap[vendor.location_id].country}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <Badge className={statusColors[vendor.status]}>
                      {vendor.status}
                    </Badge>
                    <Badge className={paymentStatusColors[vendor.payment_status || 'pending']}>
                      {vendor.payment_status || 'pending'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">${(stats.totalSales || vendor.total_sales || 0).toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{t('totalSales')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">{stats.totalOrders || vendor.total_orders || 0}</p>
                      <p className="text-xs text-slate-500">{t('orders')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredVendors.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Store className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">{t('noVendorsFound')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white overflow-hidden">
          <DataTable
            data={filteredVendors}
            columns={vendorListColumns}
            emptyMessage={t('noVendorsFound')}
          />
        </div>
      )}
    </div>
  );
}