import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { base44, Organization, Location, User } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Search,
    Building2,
    Users,
    Store,
    Eye,
    Edit2,
    Trash2,
    Save,
    Mail,
    Phone,
    LayoutGrid,
    List,
    Loader2Icon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";
import LocationPicker from "@/components/vendors/VendorLocationPicker";

// Reusable components
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
    }
}

export default function Organizations() {
    const { t } = useSafeLanguage();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        address: '',
        city: '',
        country: '',
        latitude: null as number | null,
        longitude: null as number | null,
        phone: '',
        email: '',
        website: '',
        status: 'active',
        subscription_plan: 'starter',
        max_vendors: 10,
        max_users: 5,
        owner_id: '' as string
    });

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const { data: organizations = [], isLoading: loadingOrgs } = useQuery<Organization[]>({
        queryKey: ['organizations'],
        queryFn: () => base44.entities.Organization.list(),
    });

    const { data: locations = [] } = useQuery<Location[]>({
        queryKey: ['locations'],
        queryFn: () => base44.entities.Location.list(),
    });

    const { data: vendors = [] } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => base44.entities.Vendor.list(),
        initialData: [],
    });

    const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
    });

    const isLoading = loadingOrgs || loadingUsers;

    const createOrgMutation = useMutation({
        mutationFn: (data: any) => base44.entities.Organization.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast.success("Organization created");
            setDialogOpen(false);
            resetForm();
        },
    });

    const updateOrgMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => base44.entities.Organization.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast.success("Organization updated");
            setDialogOpen(false);
            resetForm();
        },
    });

    const deleteOrgMutation = useMutation({
        mutationFn: (id: string) => base44.entities.Organization.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast.success("Organization deleted");
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            description: '',
            address: '',
            city: '',
            country: '',
            latitude: null,
            longitude: null,
            phone: '',
            email: '',
            website: '',
            status: 'active',
            subscription_plan: 'starter',
            max_vendors: 10,
            max_users: 5,
            owner_id: ''
        });
        setEditingOrg(null);
    };

    const handleEdit = (org: any) => {
        const loc = locations.find(l => l.id === org.location_id);
        setEditingOrg(org);
        setFormData({
            name: org.name || '',
            code: org.code || '',
            description: org.description || '',
            address: loc?.address || '',
            city: loc?.city || '',
            country: loc?.country || '',
            latitude: loc?.latitude || null,
            longitude: loc?.longitude || null,
            phone: org.phone || '',
            email: org.email || '',
            website: org.website || '',
            status: org.status || 'active',
            subscription_plan: org.subscription_plan || 'starter',
            max_vendors: org.max_vendors || 10,
            max_users: org.max_users || 5,
            owner_id: org.owner_id || ''
        });
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.code) {
            toast.error("Name and code are required");
            return;
        }

        try {
            let locationId = editingOrg?.location_id || null;
            if (formData.address || formData.latitude) {
                const locationData = {
                    name: `${formData.name} HQ`,
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
            const orgData = {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                location_id: locationId,
                phone: formData.phone,
                email: formData.email,
                website: formData.website,
                status: formData.status as any,
                subscription_plan: formData.subscription_plan as any,
                max_vendors: formData.max_vendors,
                max_users: formData.max_users,
                owner_id: formData.owner_id || undefined
            };
            if (editingOrg) {
                await updateOrgMutation.mutateAsync({ id: editingOrg.id, data: orgData });
            } else {
                await createOrgMutation.mutateAsync(orgData);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Error saving organization");
        }
    };

    const handleDelete = (id: string) => {
        setItemToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteOrgMutation.mutateAsync(itemToDelete);
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const orgStats = useMemo(() => {
        const stats: Record<string, { vendorCount: number; userCount: number }> = {};
        organizations.forEach(org => {
            stats[org.id] = {
                vendorCount: vendors.filter(v => v.organization_id === org.id).length,
                userCount: users.filter(u => u.organization_id === org.id).length
            };
        });
        return stats;
    }, [organizations, vendors, users]);

    const filteredOrgs = useMemo(() => {
        let result = [...organizations];
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(o => {
                const loc = locations.find(l => l.id === o.location_id);
                return (
                    o.name?.toLowerCase().includes(search) ||
                    o.code?.toLowerCase().includes(search) ||
                    loc?.city?.toLowerCase().includes(search)
                );
            });
        }
        if (statusFilter !== "all") {
            result = result.filter(o => o.status === statusFilter);
        }
        return result;
    }, [organizations, searchTerm, statusFilter, locations]);

    const columns: Column<Organization>[] = [
        {
            header: 'Organization',
            cell: (org) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold shadow-emerald-500/20 shadow-md text-xs uppercase">
                        {org.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                        <Link href={createPageUrl(`OrganizationMembers?id=${org.id}`)} className="font-bold text-slate-900 hover:text-emerald-600 hover:underline block">
                            {org.name}
                        </Link>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tight">{org.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Location',
            cell: (org) => {
                const loc = locations.find(l => l.id === org.location_id);
                return loc?.city ? `${loc.city}, ${loc.country}` : '-';
            }
        },
        {
            header: 'Contact',
            cell: (org) => (
                <div className="text-[11px] leading-tight flex flex-col gap-0.5">
                    {org.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {org.email}</div>}
                    {org.phone && <div className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3 text-slate-400" /> {org.phone}</div>}
                </div>
            )
        },
        {
            header: 'Plan',
            cell: (org) => <Badge variant="outline" className="text-[10px] uppercase font-bold bg-slate-50 text-slate-600 border-slate-100">{org.subscription_plan}</Badge>
        },
        {
            header: 'Vendors',
            cell: (org) => (
                <Link href={createPageUrl(`OrganizationMembers?id=${org.id}&tab=vendors`)} className="text-slate-600 hover:text-emerald-600 font-bold">
                    {orgStats[org.id]?.vendorCount || 0} <span className="text-slate-400 font-normal">/ {org.max_vendors}</span>
                </Link>
            )
        },
        {
            header: 'Users',
            cell: (org) => (
                <Link href={createPageUrl(`OrganizationMembers?id=${org.id}&tab=users`)} className="text-slate-600 hover:text-emerald-600 font-bold">
                    {orgStats[org.id]?.userCount || 0} <span className="text-slate-400 font-normal">/ {org.max_users}</span>
                </Link>
            )
        },
        {
            header: 'Status',
            cell: (org) => <StatusBadge status={org.status} />
        },
        {
            header: '',
            className: 'w-24 text-right',
            cell: (org) => (
                <div className="flex justify-end items-center gap-1">
                    <Link href={createPageUrl(`OrganizationMembers?id=${org.id}`)}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleEdit(org)}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => handleDelete(org.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader title={t('organizations') || 'Organizations'} subtitle="Manage organizations and their members">
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>{editingOrg ? 'Edit Organization' : 'Add New Organization'}</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Acme Corporation" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Code *</Label>
                                    <Input value={formData.code} onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="ACME" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} rows={2} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                                <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
                            </div>
                            <div className="space-y-2"><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} /></div>
                            <LocationPicker
                                latitude={formData.latitude || undefined}
                                longitude={formData.longitude || undefined}
                                onLocationChange={(lat, lng) => setFormData(p => ({ ...p, latitude: lat, longitude: lng }))}
                                onAddressChange={(data) => setFormData(p => ({ ...p, address: data.address || p.address, city: data.city || p.city, country: data.country || p.country }))}
                                label="Headquarters Location"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Assign Owner</Label>
                                    <Select value={formData.owner_id || 'none'} onValueChange={(v) => setFormData(p => ({ ...p, owner_id: v === 'none' ? '' : v }))}>
                                        <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No owner assigned</SelectItem>
                                            {users.filter(u => u.user_type === 'admin' || u.role === 'admin').map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Plan</Label>
                                    <Select value={formData.subscription_plan} onValueChange={(v) => setFormData(p => ({ ...p, subscription_plan: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="starter">Starter</SelectItem>
                                            <SelectItem value="business">Business</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Max Vendors</Label><Input type="number" min={1} value={formData.max_vendors} onChange={(e) => setFormData(p => ({ ...p, max_vendors: parseInt(e.target.value) || 10 }))} /></div>
                            </div>
                            <div className="space-y-2"><Label>Max Users</Label><Input type="number" min={1} value={formData.max_users} onChange={(e) => setFormData(p => ({ ...p, max_users: parseInt(e.target.value) || 5 }))} /></div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit} disabled={createOrgMutation.isPending || updateOrgMutation.isPending}>
                                {(createOrgMutation.isPending || updateOrgMutation.isPending) ? <Loader2Icon className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageHeader>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard title="Total Organizations" value={organizations.length} icon={Building2} variant="success" />
                <StatsCard title="Total Vendors" value={vendors.length} icon={Store} variant="primary" />
                <StatsCard title="Total Users" value={users.length} icon={Users} />
            </div>

            {/* Filters & View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-1 gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search organizations..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 bg-white border-slate-200" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[160px] h-11 bg-white border-slate-200 font-medium">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 h-11">
                    <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={cn("rounded-md px-3 h-9", viewMode === 'list' ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}>
                        <List className="h-4 w-4 mr-2" /> List
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setViewMode('grid')} className={cn("rounded-md px-3 h-9", viewMode === 'grid' ? "bg-slate-100 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}>
                        <LayoutGrid className="h-4 w-4 mr-2" /> Grid
                    </Button>
                </div>
            </div>

            {/* Content Rendering */}
            <div className="min-h-[400px]">
                {viewMode === 'list' ? (
                    <DataTable data={filteredOrgs} columns={columns} isLoading={isLoading} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredOrgs.map(org => {
                            const loc = locations.find(l => l.id === org.location_id);
                            return (
                                <Card key={org.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden bg-white">
                                    <div className="h-1.5 w-full bg-emerald-500/10 group-hover:bg-emerald-500 transition-colors" />
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 p-5 pb-2">
                                        <div className="h-12 w-12 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-emerald-500/20 shadow-md uppercase">
                                            {org.name?.charAt(0) || 'O'}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleEdit(org)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => handleDelete(org.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-5 pt-4 space-y-4">
                                        <div>
                                            <Link href={createPageUrl(`OrganizationMembers?id=${org.id}`)} className="font-bold text-lg text-slate-900 hover:text-emerald-600 hover:underline block truncate">
                                                {org.name}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Badge variant="outline" className="font-mono text-[10px] uppercase border-slate-100 text-slate-400">{org.code}</Badge>
                                                <StatusBadge status={org.status} />
                                            </div>
                                        </div>
                                        <div className="space-y-2.5 text-[13px] text-slate-600">
                                            {loc?.city && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-400 shrink-0" /> <span className="truncate">{loc.city}, {loc.country}</span></div>}
                                            {org.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400 shrink-0" /> <span className="truncate">{org.email}</span></div>}
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center">
                                                    <span className="font-bold text-slate-900">{orgStats[org.id]?.vendorCount || 0}</span>
                                                    <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Vendors</span>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg p-2 flex flex-col items-center">
                                                    <span className="font-bold text-slate-900">{orgStats[org.id]?.userCount || 0}</span>
                                                    <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Users</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-2">
                                            <Link href={createPageUrl(`OrganizationMembers?id=${org.id}`)} className="w-full">
                                                <Button variant="outline" className="w-full h-10 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 font-semibold text-xs uppercase tracking-wide">View Full Details</Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Delete Organization?"
                description="Are you sure you want to delete this organization? This will not delete associated vendors or users, but they will lose access to this organization's data."
                onConfirm={confirmDelete}
                confirmText="Delete Organization"
                isLoading={deleteOrgMutation.isPending}
            />
        </div>
    );
}
