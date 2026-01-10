import React, { useState, useMemo } from 'react';
import { base44, Warehouse, Supplier, Location } from "@/api/base44Client";
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
  Phone
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
    contact_name: '',
    email: '',
    phone: '',
    payment_terms: 'Net 30',
    lead_time_days: 7,
    status: 'active' as Supplier['status'],
    location_id: '',
    // Address fields for the sub-location
    address: '',
    city: '',
    country: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const { data: warehouses = [], isLoading: loadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => base44.entities.Warehouse.list(),
  });

  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  // Create a map for location names
  const locationMap = useMemo(() => {
    return locations.reduce((acc, loc) => {
      acc[loc.id] = loc;
      return acc;
    }, {} as Record<string, Location>);
  }, [locations]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

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
      contact_name: '',
      email: '',
      phone: '',
      payment_terms: 'Net 30',
      lead_time_days: 7,
      status: 'active',
      location_id: '',
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
      contact_name: supplier.contact_name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      payment_terms: supplier.payment_terms || 'Net 30',
      lead_time_days: supplier.lead_time_days || 7,
      status: supplier.status || 'active',
      location_id: supplier.location_id || '',
      address: loc?.address || '',
      city: loc?.city || '',
      country: loc?.country || '',
      latitude: loc?.latitude || null,
      longitude: loc?.longitude || null,
    });
    setSupplierDialogOpen(true);
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
        status: warehouseForm.status
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
    if (!supplierForm.name || !supplierForm.email) {
      toast.error("Name and email are required");
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

      const data = {
        name: supplierForm.name,
        contact_name: supplierForm.contact_name,
        email: supplierForm.email,
        phone: supplierForm.phone,
        payment_terms: supplierForm.payment_terms,
        lead_time_days: supplierForm.lead_time_days,
        status: supplierForm.status,
        location_id: locationId
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

  const handleDeleteWarehouse = async (id: string) => {
    if (confirm("Delete this warehouse?")) {
      await deleteWarehouseMutation.mutateAsync(id);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm("Delete this supplier?")) {
      await deleteSupplierMutation.mutateAsync(id);
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
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> {t('account')}
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
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" /> {t('addWarehouse')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingWarehouse ? t('edit') : t('addWarehouse')}</DialogTitle>
                </DialogHeader>
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
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setWarehouseDialogOpen(false); resetWarehouseForm(); }}>{t('cancel')}</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSaveWarehouse}>
                    <Save className="h-4 w-4 mr-2" /> {t('save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
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
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" /> {t('add')} {t('supplier')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingSupplier ? t('edit') : t('add')} {t('supplier')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>{t('businessName')} *</Label>
                    <Input value={supplierForm.name} onChange={(e) => setSupplierForm(p => ({ ...p, name: e.target.value }))} placeholder={t('businessName')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('contactName')}</Label>
                      <Input value={supplierForm.contact_name} onChange={(e) => setSupplierForm(p => ({ ...p, contact_name: e.target.value }))} placeholder={t('contactName')} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('email')} *</Label>
                      <Input type="email" value={supplierForm.email} onChange={(e) => setSupplierForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@acme.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('phone')}</Label>
                      <Input value={supplierForm.phone} onChange={(e) => setSupplierForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 234 567 890" />
                    </div>
                    <div className="space-y-2">
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
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setSupplierDialogOpen(false); resetSupplierForm(); }}>{t('cancel')}</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSaveSupplier}>
                    <Save className="h-4 w-4 mr-2" /> {t('save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingSuppliers ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
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
                        <p className="text-sm text-slate-500">{s.contact_name || 'No contact'}</p>
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
                        <Mail className="h-4 w-4" /> {s.email}
                      </div>
                      {s.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="h-4 w-4" /> {s.phone}
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

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('account')}</CardTitle>
              <CardDescription>{t('personalInformation')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
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
    </div>
  );
}