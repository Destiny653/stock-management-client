import React, { useState, useMemo } from 'react';
import { base44, Warehouse, Supplier, Location, Vendor } from "@/api/base44Client";
import LocationPicker from "@/components/vendors/VendorLocationPicker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Truck,
  Users,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Save,
  MapPin,
  Mail,
  Phone,
  AlertTriangle,
  UserPlus,
  Shield,
  Key,
  Store,
  Map,
  Eye,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";

function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
  }
}



export default function Settings() {
  const { t } = useSafeLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("warehouses");

  // Warehouses
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    location_id: '',
    manager: '',
    status: 'active' as Warehouse['status'],
    // Address fields for the sub-location
    address: '',
    city: '',
    country: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Suppliers
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    payment_terms: 'Net 30' as Supplier['payment_terms'],
    lead_time_days: 7,
    status: 'active' as Supplier['status'],
    location_id: '',
    user_id: '',
    // Address fields for the sub-location
    address: '',
    city: '',
    country: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'warehouse' | 'supplier' | 'user' | 'vendor' } | null>(null);

  // Vendors
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [vendorTabMode, setVendorTabMode] = useState<'list' | 'map'>('list');
  const [vendorForm, setVendorForm] = useState({
    store_name: '',
    location_id: '',
    status: 'pending' as Vendor['status'],
    subscription_plan: 'basic',
    monthly_fee: 0,
    commission_rate: 0,
    join_date: new Date().toISOString().split('T')[0],
    last_payment_date: '',
    next_payment_due: '',
    payment_status: 'pending' as Vendor['payment_status'],
    logo_url: '',
    notes: '',
    user_id: '',
    // For location creation if needed
    address: '',
    city: '',
    country: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Users
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    full_name: '',
    phone: '',
    department: '',
    job_title: '',
    bio: '',
    avatar: '',
    role: 'staff',
    user_type: 'staff',
    permissions: [] as string[],
    warehouse_access: [] as string[],
    password: '',
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

  const { data: warehouses = [], isLoading: loadingWarehouses } = useQuery({
    queryKey: ['warehouses', currentUser?.organization_id],
    queryFn: () => base44.entities.Warehouse.list({
      organization_id: isSuperAdmin ? undefined : currentUser?.organization_id
    }),
  });

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers', currentUser?.organization_id],
    queryFn: () => base44.entities.Supplier.list({
      organization_id: isSuperAdmin ? undefined : currentUser?.organization_id
    }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', currentUser?.organization_id],
    queryFn: () => base44.entities.User.list({
      organization_id: isSuperAdmin ? undefined : currentUser?.organization_id
    }),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ['vendors', currentUser?.organization_id],
    queryFn: () => base44.entities.Vendor.list({
      organization_id: isSuperAdmin ? undefined : currentUser?.organization_id
    }),
  });

  // Create a map for location names
  const locationMap = useMemo(() => {
    return locations.reduce((acc, loc) => {
      acc[loc.id] = loc;
      return acc;
    }, {} as Record<string, Location>);
  }, [locations]);

  const userMap = useMemo(() => {
    return users.reduce((acc, u) => {
      acc[u.id] = u;
      return acc;
    }, {} as Record<string, any>);
  }, [users]);

  const user = currentUser; // Use the one fetched with isSuperAdmin logic above

  // Warehouse mutations
  const createWarehouseMutation = useMutation({
    mutationFn: (data: Partial<Warehouse>) => base44.entities.Warehouse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setWarehouseDialogOpen(false);
      resetWarehouseForm();
      toast.success("Warehouse created");
    },
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Warehouse> }) => base44.entities.Warehouse.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setWarehouseDialogOpen(false);
      resetWarehouseForm();
      toast.success("Warehouse updated");
    },
  });

  const deleteWarehouseMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Warehouse.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success("Warehouse deleted");
    },
  });

  // Supplier mutations
  const createSupplierMutation = useMutation({
    mutationFn: (data: Partial<Supplier>) => base44.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setSupplierDialogOpen(false);
      resetSupplierForm();
      toast.success("Supplier created");
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) => base44.entities.Supplier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setSupplierDialogOpen(false);
      resetSupplierForm();
      toast.success("Supplier updated");
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Supplier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success("Supplier deleted");
    },
  });

  // User mutations
  const createUserMutation = useMutation({
    mutationFn: (data: any) => base44.entities.User.create({
      ...data,
      organization_id: currentUser?.organization_id,
      status: 'active'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserDialogOpen(false);
      resetUserForm();
      toast.success("User created");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create user");
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserDialogOpen(false);
      resetUserForm();
      toast.success("User updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update user");
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => base44.entities.User.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User deleted");
    },
  });

  const resetWarehouseForm = () => {
    setWarehouseForm({
      name: '',
      code: '',
      location_id: '',
      manager: '',
      status: 'active',
      address: '',
      city: '',
      country: '',
      latitude: null,
      longitude: null
    });
    setEditingWarehouse(null);
  };

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      payment_terms: 'Net 30' as Supplier['payment_terms'],
      lead_time_days: 7,
      status: 'active',
      location_id: '',
      user_id: '',
      address: '',
      city: '',
      country: '',
      latitude: null,
      longitude: null
    });
    setEditingSupplier(null);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    const loc = warehouse.location_id ? locationMap[warehouse.location_id] : null;
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      name: warehouse.name || '',
      code: warehouse.code || '',
      location_id: warehouse.location_id || '',
      manager: warehouse.manager || '',
      status: warehouse.status || 'active',
      address: loc?.address || '',
      city: loc?.city || '',
      country: loc?.country || '',
      latitude: loc?.latitude || null,
      longitude: loc?.longitude || null,
    });
    setWarehouseDialogOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    const loc = supplier.location_id ? locationMap[supplier.location_id] : null;
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      payment_terms: supplier.payment_terms || 'Net 30',
      lead_time_days: supplier.lead_time_days || 7,
      status: supplier.status || 'active',
      location_id: supplier.location_id || '',
      user_id: supplier.user_id || '',
      address: loc?.address || '',
      city: loc?.city || '',
      country: loc?.country || '',
      latitude: loc?.latitude || null,
      longitude: loc?.longitude || null,
    });
    setSupplierDialogOpen(true);
  };

  const resetUserForm = () => {
    setUserForm({
      email: '',
      username: '',
      first_name: '',
      last_name: '',
      full_name: '',
      phone: '',
      department: '',
      job_title: '',
      bio: '',
      avatar: '',
      role: 'staff',
      user_type: 'staff',
      permissions: [],
      warehouse_access: [],
      password: '',
    });
    setEditingUserId(null);
  };

  const handleEditUser = (u: any) => {
    setEditingUserId(u.id);
    setUserForm({
      email: u.email || '',
      username: u.username || '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      full_name: u.full_name || '',
      phone: u.phone || '',
      department: u.department || '',
      job_title: u.job_title || '',
      bio: u.bio || '',
      avatar: u.avatar || '',
      role: u.role || 'staff',
      user_type: u.user_type || 'staff',
      permissions: u.permissions || [],
      warehouse_access: u.warehouse_access || [],
      password: '', // Don't pre-fill password
    });
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    setItemToDelete({ id, type: 'user' });
    setDeleteConfirmOpen(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.email || !userForm.username || (!editingUserId && !userForm.password)) {
      toast.error("Please fill in email, username and password");
      return;
    }

    // Ensure full_name is set if first/last are present
    const full_name = userForm.full_name || `${userForm.first_name} ${userForm.last_name}`.trim();
    const data = { ...userForm, full_name };

    if (editingUserId) {
      await updateUserMutation.mutateAsync({ id: editingUserId, data });
    } else {
      await createUserMutation.mutateAsync(data);
    }
  };

  const handleSaveWarehouse = async () => {
    if (!warehouseForm.name || !warehouseForm.code) {
      toast.error("Name and code are required");
      return;
    }

    try {
      let locationId = warehouseForm.location_id;

      // Create/Update location
      if (warehouseForm.address || warehouseForm.latitude) {
        const locationData = {
          name: `${warehouseForm.name} Location`,
          address: warehouseForm.address,
          city: warehouseForm.city,
          country: warehouseForm.country,
          latitude: warehouseForm.latitude as number,
          longitude: warehouseForm.longitude as number,
        };

        if (locationId) {
          await base44.entities.Location.update(locationId, locationData);
        } else {
          const loc = await base44.entities.Location.create(locationData);
          locationId = loc.id;
        }
      }

      const data = {
        name: warehouseForm.name,
        code: warehouseForm.code,
        location_id: locationId,
        manager: warehouseForm.manager,
        status: warehouseForm.status,
        organization_id: (isSuperAdmin ? undefined : currentUser?.organization_id) ?? undefined
      };

      if (editingWarehouse) {
        await updateWarehouseMutation.mutateAsync({ id: editingWarehouse.id, data });
      } else {
        await createWarehouseMutation.mutateAsync(data);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error saving warehouse");
    }
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name) {
      toast.error("Business name is required");
      return;
    }

    try {
      let locationId = supplierForm.location_id;

      // Create/Update location
      if (supplierForm.address || supplierForm.latitude) {
        const locationData = {
          name: `${supplierForm.name} Office`,
          address: supplierForm.address,
          city: supplierForm.city,
          country: supplierForm.country,
          latitude: supplierForm.latitude as number,
          longitude: supplierForm.longitude as number,
        };

        if (locationId) {
          await base44.entities.Location.update(locationId, locationData);
        } else {
          const loc = await base44.entities.Location.create(locationData);
          locationId = loc.id;
        }
      }

      const data: Partial<Supplier> = {
        name: supplierForm.name,
        payment_terms: supplierForm.payment_terms,
        lead_time_days: supplierForm.lead_time_days,
        status: supplierForm.status,
        location_id: locationId,
        user_id: supplierForm.user_id || undefined,
        organization_id: (isSuperAdmin ? undefined : currentUser?.organization_id) ?? undefined
      };

      if (editingSupplier) {
        await updateSupplierMutation.mutateAsync({ id: editingSupplier.id, data });
      } else {
        await createSupplierMutation.mutateAsync(data);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error saving supplier");
    }
  };

  const handleDeleteWarehouse = (id: string) => {
    setItemToDelete({ id, type: 'warehouse' });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteSupplier = (id: string) => {
    setItemToDelete({ id, type: 'supplier' });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'warehouse') {
        await deleteWarehouseMutation.mutateAsync(itemToDelete.id);
      } else if (itemToDelete.type === 'supplier') {
        await deleteSupplierMutation.mutateAsync(itemToDelete.id);
      } else if (itemToDelete.type === 'user') {
        await deleteUserMutation.mutateAsync(itemToDelete.id);
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('settings')}</h1>
        <p className="text-slate-500 mt-1">{t('warehousesAndLocations')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="warehouses" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" /> {t('warehouses')}
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" /> {t('suppliers')}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> {t('users')}
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> {t('account')}
          </TabsTrigger>
        </TabsList>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('warehousesAndLocations')}</h2>
              <p className="text-sm text-slate-500">{t('warehousesAndLocations')}</p>
            </div>
            <Dialog open={warehouseDialogOpen} onOpenChange={(open) => { setWarehouseDialogOpen(open); if (!open) resetWarehouseForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" /> {t('addWarehouse')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingWarehouse ? t('edit') : t('addWarehouse')}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto pr-2 -mr-2">
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('warehouseName')} *</Label>
                        <Input value={warehouseForm.name} onChange={(e) => setWarehouseForm(p => ({ ...p, name: e.target.value }))} placeholder={t('warehouseName')} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('warehouseCode')} *</Label>
                        <Input value={warehouseForm.code} onChange={(e) => setWarehouseForm(p => ({ ...p, code: e.target.value }))} placeholder="WH-001" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('city')}</Label>
                        <Input value={warehouseForm.city} onChange={(e) => setWarehouseForm(p => ({ ...p, city: e.target.value }))} placeholder={t('city')} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('manager')}</Label>
                        <Input value={warehouseForm.manager} onChange={(e) => setWarehouseForm(p => ({ ...p, manager: e.target.value }))} placeholder={t('manager')} />
                      </div>
                    </div>

                    <LocationPicker
                      latitude={warehouseForm.latitude || undefined}
                      longitude={warehouseForm.longitude || undefined}
                      onLocationChange={(lat, lng) => setWarehouseForm(p => ({ ...p, latitude: lat, longitude: lng }))}
                      onAddressChange={(data) => setWarehouseForm(p => ({
                        ...p,
                        address: data.address || p.address,
                        city: data.city || p.city,
                        country: data.country || p.country
                      }))}
                    />

                    <div className="space-y-2">
                      <Label>{t('status')}</Label>
                      <Select value={warehouseForm.status} onValueChange={(v: any) => setWarehouseForm(p => ({ ...p, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t('active')}</SelectItem>
                          <SelectItem value="inactive">{t('inactive')}</SelectItem>
                          <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setWarehouseDialogOpen(false); resetWarehouseForm(); }}>{t('cancel')}</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveWarehouse}>
                    <Save className="h-4 w-4 mr-2" /> {t('save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-600/10 hover:bg-emerald-600/10 text-slate-700">
                  <TableHead>{t('warehouseName')}</TableHead>
                  <TableHead>{t('warehouseCode')}</TableHead>
                  <TableHead>{t('location')}</TableHead>
                  <TableHead>{t('manager')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingWarehouses ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : warehouses.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">{t('noData')}</TableCell></TableRow>
                ) : (
                  warehouses.map((w: Warehouse) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell className="font-mono text-sm">{w.code}</TableCell>
                      <TableCell>{w.location_id ? locationMap[w.location_id]?.city : '-'}</TableCell>
                      <TableCell>{w.manager || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          w.status === 'active' && "bg-emerald-50 text-emerald-700",
                          w.status === 'inactive' && "bg-slate-50 text-slate-600",
                          w.status === 'maintenance' && "bg-amber-50 text-amber-700"
                        )}>
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditWarehouse(w)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleDeleteWarehouse(w.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('suppliers')}</h2>
              <p className="text-sm text-slate-500">{t('suppliers')}</p>
            </div>
            <Dialog open={supplierDialogOpen} onOpenChange={(open) => { setSupplierDialogOpen(open); if (!open) resetSupplierForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" /> {t('add')} {t('supplier')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingSupplier ? t('edit') : t('add')} {t('supplier')}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto pr-2 -mr-2">
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t('businessName')} *</Label>
                      <Input value={supplierForm.name} onChange={(e) => setSupplierForm(p => ({ ...p, name: e.target.value }))} placeholder={t('businessName')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>Linked Contact Person</Label>
                        <Select value={supplierForm.user_id || "none"} onValueChange={(v) => setSupplierForm(p => ({ ...p, user_id: v === "none" ? "" : v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Link to user" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No User Account</SelectItem>
                            {users.map((u: any) => (
                              <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 col-span-2">
                        <Label>{t('paymentTerms')}</Label>
                        <Select value={supplierForm.payment_terms} onValueChange={(v: any) => setSupplierForm(p => ({ ...p, payment_terms: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Net 15">Net 15</SelectItem>
                            <SelectItem value="Net 30">Net 30</SelectItem>
                            <SelectItem value="Net 45">Net 45</SelectItem>
                            <SelectItem value="Net 60">Net 60</SelectItem>
                            <SelectItem value="COD">COD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <LocationPicker
                      latitude={supplierForm.latitude || undefined}
                      longitude={supplierForm.longitude || undefined}
                      onLocationChange={(lat, lng) => setSupplierForm(p => ({ ...p, latitude: lat, longitude: lng }))}
                      onAddressChange={(data) => setSupplierForm(p => ({
                        ...p,
                        address: data.address || p.address,
                        city: data.city || p.city,
                        country: data.country || p.country
                      }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('leadTime')}</Label>
                        <Input type="number" value={supplierForm.lead_time_days} onChange={(e) => setSupplierForm(p => ({ ...p, lead_time_days: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('status')}</Label>
                        <Select value={supplierForm.status} onValueChange={(v: any) => setSupplierForm(p => ({ ...p, status: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{t('active')}</SelectItem>
                            <SelectItem value="inactive">{t('inactive')}</SelectItem>
                            <SelectItem value="blocked">{t('blocked')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setSupplierDialogOpen(false); resetSupplierForm(); }}>{t('cancel')}</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveSupplier}>
                    <Save className="h-4 w-4 mr-2" /> {t('save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingSuppliers ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500">{t('noData')}</div>
            ) : (
              suppliers.map((s: Supplier) => (
                <Card key={s.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{s.name}</h4>
                        <p className="text-sm text-slate-500">{userMap[s.user_id!]?.full_name || 'No contact person'}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        s.status === 'active' && "bg-emerald-50 text-emerald-700",
                        s.status === 'inactive' && "bg-slate-50 text-slate-600",
                        s.status === 'blocked' && "bg-rose-50 text-rose-700"
                      )}>
                        {s.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4" /> {userMap[s.user_id!]?.email || 'No email linked'}
                      </div>
                      {userMap[s.user_id!]?.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="h-4 w-4" /> {userMap[s.user_id!]?.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-xs">{s.payment_terms} • {s.lead_time_days} days lead time</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditSupplier(s)}>
                        <Edit2 className="h-4 w-4 mr-1" /> {t('edit')}
                      </Button>
                      <Button variant="outline" size="sm" className="text-rose-600" onClick={() => handleDeleteSupplier(s.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('userManagement')}</h2>
              <p className="text-sm text-slate-500">{t('manageOrganizationUsers')}</p>
            </div>
            <Dialog open={userDialogOpen} onOpenChange={(open) => { setUserDialogOpen(open); if (!open) resetUserForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <UserPlus className="h-4 w-4 mr-2" /> {t('addUser')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingUserId ? t('editUser') : t('registerUser')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('email')} *</Label>
                      <Input type="email" value={userForm.email} onChange={(e) => setUserForm(p => ({ ...p, email: e.target.value }))} placeholder="user@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('username')} *</Label>
                      <Input value={userForm.username} onChange={(e) => setUserForm(p => ({ ...p, username: e.target.value }))} placeholder="username" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('firstName')}</Label>
                      <Input value={userForm.first_name} onChange={(e) => setUserForm(p => ({ ...p, first_name: e.target.value }))} placeholder="First Name" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('lastName')}</Label>
                      <Input value={userForm.last_name} onChange={(e) => setUserForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Last Name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('role')}</Label>
                      <Select value={userForm.role} onValueChange={(v: any) => setUserForm(p => ({ ...p, role: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('userType')}</Label>
                      <Select value={userForm.user_type} onValueChange={(v: any) => setUserForm(p => ({ ...p, user_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="vendor">Vendor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('phone')}</Label>
                      <Input value={userForm.phone} onChange={(e) => setUserForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1234567890" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('department')}</Label>
                      <Input value={userForm.department} onChange={(e) => setUserForm(p => ({ ...p, department: e.target.value }))} placeholder="Sales / Logistics" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('jobTitle')}</Label>
                    <Input value={userForm.job_title} onChange={(e) => setUserForm(p => ({ ...p, job_title: e.target.value }))} placeholder="Senior Manager" />
                  </div>

                  {!editingUserId && (
                    <div className="space-y-2">
                      <Label>{t('password')} *</Label>
                      <div className="relative">
                        <Input type="password" value={userForm.password} onChange={(e) => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                        <Key className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t('bio')}</Label>
                    <Input value={userForm.bio} onChange={(e) => setUserForm(p => ({ ...p, bio: e.target.value }))} placeholder="A short bio..." />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('warehouseAccess')}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {warehouses.map((wh: Warehouse) => (
                        <div key={wh.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            checked={userForm.warehouse_access.includes(wh.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setUserForm(p => ({
                                ...p,
                                warehouse_access: checked
                                  ? [...p.warehouse_access, wh.id]
                                  : p.warehouse_access.filter(id => id !== wh.id)
                              }));
                            }}
                          />
                          <span className="text-sm text-slate-700">{wh.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setUserDialogOpen(false); resetUserForm(); }}>{t('cancel')}</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveUser} disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                    {(createUserMutation.isPending || updateUserMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {t('save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className=''>
            <Table>
              <TableHeader>
                <TableRow className="bg-emerald-600/10 hover:bg-emerald-600/10 text-slate-700">
                  <TableHead>{t('user')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead>{t('department')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">{t('noData')}</TableCell>
                  </TableRow>
                ) : (
                  users.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                            {u.full_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{u.full_name || u.username}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{u.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          u.status === 'active' && "bg-emerald-50 text-emerald-700",
                          u.status === 'pending' && "bg-amber-50 text-amber-700",
                          u.status === 'suspended' && "bg-rose-50 text-rose-700"
                        )}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" onClick={() => handleEditUser(u)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => handleDeleteUser(u.id)} disabled={u.id === user?.id}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card className='p-6'>
            <CardHeader>
              <CardTitle>{t('account')}</CardTitle>
              <CardDescription>{t('personalInformation')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{user?.full_name || 'User'}</h3>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                  <Badge variant="outline" className="mt-1">{user?.role || 'user'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <DialogTitle className="text-xl">
              Delete {itemToDelete?.type === 'warehouse' ? 'Warehouse' : itemToDelete?.type === 'supplier' ? 'Supplier' : 'User'}?
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone and may affect inventory records.
            </p>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteWarehouseMutation.isPending || deleteSupplierMutation.isPending}>
              {(deleteWarehouseMutation.isPending || deleteSupplierMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}