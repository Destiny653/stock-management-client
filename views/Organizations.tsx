import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
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
    Loader2,
    Save,
    Globe,
    Mail,
    Phone
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";
import LocationPicker from "@/components/vendors/VendorLocationPicker";

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
    }
}

const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    suspended: "bg-rose-100 text-rose-700"
};

export default function Organizations() {
    const { t } = useSafeLanguage();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
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
        max_users: 5
    });

    const { data: organizations = [], isLoading } = useQuery({
        queryKey: ['organizations'],
        queryFn: () => base44.entities.Organization.list(),
        initialData: [],
    });

    const { data: vendors = [] } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => base44.entities.Vendor.list(),
        initialData: [],
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
        initialData: [],
    });

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
            max_users: 5
        });
        setEditingOrg(null);
    };

    const handleEdit = (org: any) => {
        setEditingOrg(org);
        setFormData({
            name: org.name || '',
            code: org.code || '',
            description: org.description || '',
            address: org.address || '',
            city: org.city || '',
            country: org.country || '',
            latitude: org.latitude || null,
            longitude: org.longitude || null,
            phone: org.phone || '',
            email: org.email || '',
            website: org.website || '',
            status: org.status || 'active',
            subscription_plan: org.subscription_plan || 'starter',
            max_vendors: org.max_vendors || 10,
            max_users: org.max_users || 5
        });
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.code) {
            toast.error("Name and code are required");
            return;
        }

        try {
            // 1. Create/Update Location first if we have address info
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

            // 2. Prepare organization data
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
                max_users: formData.max_users
            };

            if (editingOrg) {
                await updateOrgMutation.mutateAsync({ id: editingOrg.id, data: orgData });
                toast.success("Organization updated successfully");
            } else {
                await createOrgMutation.mutateAsync(orgData);
                toast.success("Organization created successfully");
            }

            setDialogOpen(false);
            resetForm();
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(error.response?.data?.detail || "Error saving organization");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this organization? This will not delete associated vendors or users.")) {
            try {
                await deleteOrgMutation.mutateAsync(id);
                toast.success("Organization deleted");
            } catch (error: any) {
                toast.error(error.response?.data?.detail || "Error deleting organization");
            }
        }
    };

    // Get counts per organization
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
            result = result.filter(o =>
                o.name?.toLowerCase().includes(search) ||
                o.code?.toLowerCase().includes(search) ||
                o.city?.toLowerCase().includes(search)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(o => o.status === statusFilter);
        }

        return result;
    }, [organizations, searchTerm, statusFilter]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('organizations') || 'Organizations'}</h1>
                    <p className="text-slate-500 mt-1">Manage organizations and their members</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{editingOrg ? 'Edit Organization' : 'Add New Organization'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Acme Corporation"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Code *</Label>
                                    <Input
                                        value={formData.code}
                                        onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        placeholder="ACME"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                        value={formData.city}
                                        onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Input
                                        value={formData.country}
                                        onChange={(e) => setFormData(p => ({ ...p, country: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Location Map */}
                            <LocationPicker
                                latitude={formData.latitude || undefined}
                                longitude={formData.longitude || undefined}
                                onLocationChange={(lat, lng) => setFormData(p => ({ ...p, latitude: lat, longitude: lng }))}
                                onAddressChange={(data) => setFormData(p => ({
                                    ...p,
                                    address: data.address || p.address,
                                    city: data.city || p.city,
                                    country: data.country || p.country
                                }))}
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
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
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
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Max Vendors</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.max_vendors}
                                        onChange={(e) => setFormData(p => ({ ...p, max_vendors: parseInt(e.target.value) || 10 }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Users</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.max_users}
                                        onChange={(e) => setFormData(p => ({ ...p, max_users: parseInt(e.target.value) || 5 }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSubmit}>
                                <Save className="h-4 w-4 mr-2" /> Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{organizations.length}</p>
                            <p className="text-sm text-slate-500">Total Organizations</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
                            <Store className="h-6 w-6 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{vendors.length}</p>
                            <p className="text-sm text-slate-500">Total Vendors</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                            <p className="text-sm text-slate-500">Total Users</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search organizations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-50"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-slate-50">
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
            </div>

            {/* Table */}
            <Card>
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead>Organization</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Vendors</TableHead>
                                <TableHead>Users</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-24"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                        <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                        No organizations found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrgs.map(org => (
                                    <TableRow key={org.id} className="hover:bg-slate-50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                                                    {org.name?.charAt(0) || 'O'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{org.name}</p>
                                                    <p className="text-sm text-slate-500 font-mono">{org.code}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {org.city ? `${org.city}, ${org.country}` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {org.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {org.email}</div>}
                                                {org.phone && <div className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3" /> {org.phone}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{org.subscription_plan}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={createPageUrl(`OrganizationMembers?id=${org.id}&tab=vendors`)} className="text-teal-600 hover:underline font-medium">
                                                {orgStats[org.id]?.vendorCount || 0} / {org.max_vendors}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={createPageUrl(`OrganizationMembers?id=${org.id}&tab=users`)} className="text-teal-600 hover:underline font-medium">
                                                {orgStats[org.id]?.userCount || 0} / {org.max_users}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[org.status]}>{org.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Link href={createPageUrl(`OrganizationMembers?id=${org.id}`)}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(org)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600" onClick={() => handleDelete(org.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
