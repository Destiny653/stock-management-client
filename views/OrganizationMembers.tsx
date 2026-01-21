import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Shield, UserPlus, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft,
    Search,
    Building2,
    Users,
    Store,
    Eye,
    MapPin,
    Phone,
    Mail,
    Loader2,
    DollarSign,
    AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";
import dynamic from 'next/dynamic';

const OrganizationMap = dynamic(
    () => import('@/components/organizations/OrganizationMap'),
    {
        ssr: false,
        loading: () => (
            <div className="h-full w-full flex items-center justify-center bg-slate-50 min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }
);

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
    pending: "bg-amber-100 text-amber-700",
    suspended: "bg-rose-100 text-rose-700"
};

import { useRouter, useSearchParams } from "next/navigation";

export default function OrganizationMembers() {
    const { t } = useSafeLanguage();
    const searchParams = useSearchParams();

    const orgId = searchParams?.get('id');
    const initialTab = searchParams?.get('tab') || 'vendors';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
    const [memberType, setMemberType] = useState<'user' | 'vendor'>('user');

    const [memberForm, setMemberForm] = useState({
        full_name: '',  // Used for contact person's name (stored on User)
        email: '',
        password: '',
        phone: '',
        role: 'staff',
        user_type: 'staff',
        department: '',
        job_title: '',
        // For vendors
        store_name: '',  // Trading/Display name for the vendor's store
        location_id: '',
        commission_rate: 0,
    });
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<{ id: string, type: 'user' | 'vendor' } | null>(null);

    const roleColors: Record<string, string> = {
        owner: "bg-violet-100 text-violet-700 border-violet-200",
        admin: "bg-blue-100 text-blue-700 border-blue-200",
        manager: "bg-emerald-100 text-emerald-700 border-emerald-200",
        staff: "bg-slate-100 text-slate-700 border-slate-200",
        viewer: "bg-amber-100 text-amber-700 border-amber-200",
    };

    const typeColors: Record<string, string> = {
        admin: "bg-blue-50 text-blue-600 border-blue-100",
        vendor: "bg-purple-50 text-purple-600 border-purple-100",
        manager: "bg-teal-50 text-teal-600 border-teal-100",
        staff: "bg-slate-50 text-slate-600 border-slate-100",
    };

    const queryClient = useQueryClient(); // Renamed from mutationClient for consistency

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const isSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';
    const isManagerOrAdmin = useMemo(() => {
        if (!currentUser) return false;
        return isSuperAdmin ||
            ['manager'].includes(currentUser.role) ||
            currentUser.user_type === 'admin' ||
            currentUser.user_type === 'manager';
    }, [currentUser, isSuperAdmin]);

    const { data: organization, isLoading: loadingOrg } = useQuery({
        queryKey: ['organization', orgId],
        queryFn: async () => {
            if (!orgId) return null;
            const orgs = await base44.entities.Organization.filter({ id: orgId });
            return orgs[0];
        },
        enabled: !!orgId,
    });

    const { data: vendors = [] } = useQuery({
        queryKey: ['vendors', orgId],
        queryFn: () => base44.entities.Vendor.list({ organization_id: orgId || undefined }),
        initialData: [],
        enabled: !!orgId || isSuperAdmin,
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users', orgId],
        queryFn: () => base44.entities.User.list({ organization_id: orgId || undefined }),
        enabled: !!orgId || isSuperAdmin,
    });

    const { data: locations = [] } = useQuery({
        queryKey: ['locations'],
        queryFn: () => base44.entities.Location.list(),
    });

    const locationMap = useMemo(() => {
        const map: Record<string, any> = {};
        locations.forEach((loc: any) => {
            map[loc.id] = loc;
        });
        return map;
    }, [locations]);

    const userMap = useMemo(() => {
        const map: Record<string, any> = {};
        users.forEach((u: any) => {
            map[u.id] = u;
        });
        return map;
    }, [users]);

    // Filter by organization
    const orgVendors = useMemo(() => {
        let result = vendors.filter(v => v.organization_id === orgId);
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(v => {
                const linkedUser = v.user_id ? userMap[v.user_id] : null;
                return v.store_name?.toLowerCase().includes(search) ||
                    linkedUser?.email?.toLowerCase().includes(search) ||
                    linkedUser?.full_name?.toLowerCase().includes(search);
            });
        }
        return result;
    }, [vendors, orgId, searchTerm, userMap]);

    const orgUsers = useMemo(() => {
        let result = users.filter(u => u.organization_id === orgId);
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(u =>
                u.full_name?.toLowerCase().includes(search) ||
                u.email?.toLowerCase().includes(search)
            );
        }
        return result;
    }, [users, orgId, searchTerm]);

    const createMemberMutation = useMutation({
        mutationFn: async (data: any) => {
            const organizationId = (orgId || currentUser?.organization_id) ?? undefined;

            if (memberType === 'user') {
                return base44.entities.User.create({
                    ...data,
                    organization_id: organizationId,
                    username: data.email,
                    status: 'active',
                    user_type: (data.role === 'viewer' ? 'staff' : data.role) as any // Map role to user_type appropriately
                });
            } else {
                // For vendors, create a User account first (stores contact info)
                const user = await base44.entities.User.create({
                    full_name: data.full_name, // Contact person's name
                    email: data.email,
                    password: data.password,
                    phone: data.phone,
                    organization_id: organizationId,
                    username: data.email,
                    role: 'staff',
                    user_type: 'vendor',
                    status: 'active'
                });

                // Then create the Vendor record linked to the user
                return base44.entities.Vendor.create({
                    store_name: data.store_name,
                    organization_id: organizationId,
                    user_id: user.id,
                    location_id: data.location_id || null,
                    commission_rate: data.commission_rate || 0,
                    status: 'active'
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setAddMemberDialogOpen(false);
            setMemberForm({
                full_name: '',
                email: '',
                password: '',
                phone: '',
                role: 'staff',
                user_type: 'staff',
                department: '',
                job_title: '',
                store_name: '',
                location_id: '',
                commission_rate: 0,
            });
            toast.success(`${memberType === 'user' ? 'User' : 'Vendor'} created successfully`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to create member");
        }
    });

    const updateMemberMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            if (memberType === 'user') {
                return base44.entities.User.update(id, data);
            } else {
                // Update vendor record
                const vendor = await base44.entities.Vendor.update(id, {
                    store_name: data.store_name,
                    location_id: data.location_id || null,
                    commission_rate: data.commission_rate || 0,
                });

                // Update linked user's contact info
                if (vendor.user_id) {
                    await base44.entities.User.update(vendor.user_id, {
                        full_name: data.full_name,
                        email: data.email,
                        phone: data.phone,
                    });
                }
                return vendor;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setAddMemberDialogOpen(false);
            setEditingMemberId(null);
            setMemberForm({
                full_name: '',
                email: '',
                password: '',
                phone: '',
                role: 'staff',
                user_type: 'staff',
                department: '',
                job_title: '',
                store_name: '',
                location_id: '',
                commission_rate: 0,
            });
            toast.success(`${memberType === 'user' ? 'User' : 'Vendor'} updated successfully`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to update member");
        }
    });

    const handleAddMember = async () => {
        if (!memberForm.email || (!editingMemberId && !memberForm.password)) {
            toast.error("Please fill in email and password");
            return;
        }

        if (memberType === 'vendor' && (!memberForm.full_name || !memberForm.store_name)) {
            toast.error("Please fill in contact name and store name");
            return;
        }

        if (editingMemberId) {
            updateMemberMutation.mutate({ id: editingMemberId, data: memberForm });
        } else {
            createMemberMutation.mutate(memberForm);
        }
    };

    const handleEditMember = (e: React.MouseEvent | undefined, member: any, type: 'user' | 'vendor') => {
        e?.stopPropagation();
        setMemberType(type);
        setEditingMemberId(member.id);
        if (type === 'user') {
            setMemberForm({
                full_name: member.full_name || '',
                email: member.email || '',
                password: '', // Don't pre-fill password
                phone: member.phone || '',
                role: member.role || 'staff',
                user_type: member.user_type || 'staff',
                department: member.department || '',
                job_title: member.job_title || '',
                store_name: '',
                location_id: '',
                commission_rate: 0,
            });
        } else {
            const linkedUser = member.user_id ? userMap[member.user_id] : null;
            setMemberForm({
                full_name: linkedUser?.full_name || '',  // Contact person's name from linked user
                email: linkedUser?.email || '',
                password: '',
                phone: linkedUser?.phone || '',
                role: 'staff',
                user_type: 'vendor',
                department: '',
                job_title: '',
                store_name: member.store_name || '',
                location_id: member.location_id || '',
                commission_rate: member.commission_rate || 0,
            });
        }
        setDetailsOpen(false); // Close details sheet if open
        setAddMemberDialogOpen(true);
    };

    const deleteMemberMutation = useMutation({
        mutationFn: async ({ id, type }: { id: string, type: 'user' | 'vendor' }) => {
            if (type === 'user') {
                return base44.entities.User.delete(id);
            } else {
                return base44.entities.Vendor.delete(id);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            toast.success("Member deleted successfully");
            setDeleteConfirmOpen(false);
            setMemberToDelete(null);
            setDetailsOpen(false); // Close details sheet if open
        },
        onError: () => {
            toast.error("Failed to delete member");
        }
    });

    const handleDeleteMember = (e: React.MouseEvent, id: string, type: 'user' | 'vendor') => {
        e.stopPropagation();
        setMemberToDelete({ id, type });
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (memberToDelete) {
            deleteMemberMutation.mutate(memberToDelete);
        }
    };

    // Vendors with location for map
    const vendorsWithLocation = useMemo(() => {
        return orgVendors.map(v => {
            const loc = v.location_id ? locationMap[v.location_id] : null;
            return {
                ...v,
                latitude: loc?.latitude,
                longitude: loc?.longitude,
                address: loc?.address,
                city: loc?.city,
                country: loc?.country
            };
        }).filter(v => v.latitude && v.longitude);
    }, [orgVendors, locationMap]);

    // Calculate map center
    const mapCenter: [number, number] = vendorsWithLocation.length > 0
        ? [
            vendorsWithLocation.reduce((sum, v) => sum + (v.latitude || 0), 0) / vendorsWithLocation.length,
            vendorsWithLocation.reduce((sum, v) => sum + (v.longitude || 0), 0) / vendorsWithLocation.length
        ]
        : [0, 0];

    const handleViewDetails = (member: any, type: string) => {
        setSelectedMember({ ...member, type });
        setDetailsOpen(true);
    };

    const router = useRouter();
    React.useEffect(() => {
        if (currentUser && !isSuperAdmin && orgId && orgId !== currentUser.organization_id) {
            toast.error("You don't have permission to access this organization");
            router.push('/Dashboard');
        }
    }, [currentUser, isSuperAdmin, orgId, router]);

    if (loadingOrg) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600">Organization not found</p>
                <Link href={createPageUrl("Organizations")}>
                    <Button className="mt-4">Back to Organizations</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={createPageUrl("Organizations")}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
                            {organization?.name?.charAt(0) || 'O'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{organization?.name || 'Organization'}</h1>
                            <p className="text-slate-500">{organization?.code} • {organization?.city}, {organization?.country}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isManagerOrAdmin && (
                        <Dialog open={addMemberDialogOpen} onOpenChange={(open) => {
                            setAddMemberDialogOpen(open);
                            if (!open) {
                                setEditingMemberId(null);
                                setMemberForm({
                                    full_name: '', email: '', password: '', phone: '', role: 'staff',
                                    user_type: 'staff', department: '', job_title: '', store_name: '',
                                    location_id: '', commission_rate: 0,
                                });
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-teal-600 hover:bg-teal-700">
                                    <UserPlus className="h-4 w-4 mr-2" /> Add Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>{editingMemberId ? 'Edit Member' : 'Add New Member'}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Member Type</Label>
                                        <Select value={memberType} onValueChange={(v: 'user' | 'vendor') => setMemberType(v)} disabled={!!editingMemberId}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">Internal User (Staff/Manager)</SelectItem>
                                                <SelectItem value="vendor">External Vendor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {memberType === 'user' ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Full Name</Label>
                                                <Input value={memberForm.full_name} onChange={e => setMemberForm(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input type="email" value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" />
                                            </div>
                                            {!editingMemberId && (
                                                <div className="space-y-2">
                                                    <Label>Password</Label>
                                                    <Input type="password" value={memberForm.password} onChange={e => setMemberForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Phone</Label>
                                                    <Input value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Role</Label>
                                                    <Select value={memberForm.role} onValueChange={v => setMemberForm(p => ({ ...p, role: v, user_type: v }))}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="staff">Staff</SelectItem>
                                                            <SelectItem value="manager">Manager</SelectItem>
                                                            <SelectItem value="viewer">Viewer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Job Title</Label>
                                                    <Input value={memberForm.job_title} onChange={e => setMemberForm(p => ({ ...p, job_title: e.target.value }))} placeholder="Sale Associate" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Department</Label>
                                                    <Input value={memberForm.department} onChange={e => setMemberForm(p => ({ ...p, department: e.target.value }))} placeholder="Sales" />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label>Store/Display Name *</Label>
                                                <Input value={memberForm.store_name} onChange={e => setMemberForm(p => ({ ...p, store_name: e.target.value }))} placeholder="Acme Store #12" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Contact Person Name *</Label>
                                                <Input value={memberForm.full_name} onChange={e => setMemberForm(p => ({ ...p, full_name: e.target.value }))} placeholder="John Doe" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Contact Email</Label>
                                                    <Input type="email" value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@acme.com" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Phone</Label>
                                                    <Input value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1..." />
                                                </div>
                                            </div>
                                            {!editingMemberId && (
                                                <div className="space-y-2">
                                                    <Label>Login Password</Label>
                                                    <Input type="password" value={memberForm.password} onChange={e => setMemberForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" />
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Location</Label>
                                                    <Select value={memberForm.location_id} onValueChange={v => setMemberForm(p => ({ ...p, location_id: v }))}>
                                                        <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="no_location">None</SelectItem>
                                                            {locations.map((loc: any) => (
                                                                <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.city})</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Commission Rate (%)</Label>
                                                    <Input type="number" value={memberForm.commission_rate} onChange={e => setMemberForm(p => ({ ...p, commission_rate: parseFloat(e.target.value) || 0 }))} />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
                                    <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleAddMember} disabled={createMemberMutation.isPending || updateMemberMutation.isPending}>
                                        {(createMemberMutation.isPending || updateMemberMutation.isPending) ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            editingMemberId ? <Edit2 className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        {editingMemberId ? 'Update Member' : 'Create Member'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                    {organization && (
                        <Badge className={cn("text-sm px-3 py-1", statusColors[organization.status])}>
                            {organization.status}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 py-12 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                            <Store className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">{orgVendors.length}</p>
                            <p className="text-sm text-slate-500">Vendors</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 py-12 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">{orgUsers.length}</p>
                            <p className="text-sm text-slate-500">Users</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 py-12 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">{vendorsWithLocation.length}</p>
                            <p className="text-sm text-slate-500">On Map</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 py-12 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">
                                ${(orgVendors.reduce((sum, v) => sum + (v.total_sales || 0), 0)).toLocaleString()}
                            </p>
                            <p className="text-sm text-slate-500">Total Sales</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <TabsList className="bg-slate-100">
                        <TabsTrigger value="vendors" className="flex items-center gap-2">
                            <Store className="h-4 w-4" /> Vendors ({orgVendors.length})
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Users ({orgUsers.length})
                        </TabsTrigger>
                        <TabsTrigger value="map" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Map View
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 rounded-sm py-5 bg-white border-slate-200"
                        />
                    </div>
                </div>

                {/* Vendors Tab */}
                <TabsContent value="vendors" className="mt-6">
                    <div className="bg-white overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-teal-600/10 hover:bg-teal-600/10 text-slate-700">
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Sales</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orgVendors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                            <Store className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                            No vendors in this organization
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orgVendors.map(vendor => (
                                        <TableRow key={vendor.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetails(vendor, 'vendor')}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                                                        {vendor.store_name?.charAt(0) || 'V'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{vendor.store_name}</p>
                                                        <p className="text-sm text-slate-500">{userMap[vendor.user_id!]?.full_name || 'No contact'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {userMap[vendor.user_id!]?.email || 'No email linked'}</div>
                                                    {userMap[vendor.user_id!]?.phone && <div className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3" /> {userMap[vendor.user_id!]?.phone}</div>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {vendor.location_id && locationMap[vendor.location_id] ? (
                                                    <div className="flex items-center gap-1 text-slate-600">
                                                        <MapPin className="h-3 w-3" /> {locationMap[vendor.location_id].city}, {locationMap[vendor.location_id].country}
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColors[vendor.status]}>{vendor.status}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                ${(vendor.total_sales || 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600" onClick={(e) => { e.stopPropagation(); handleViewDetails(vendor, 'vendor'); }}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {isManagerOrAdmin && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={(e) => handleEditMember(e, vendor, 'vendor')}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={(e) => handleDeleteMember(e, vendor.id, 'vendor')}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="mt-6">
                    <div className="bg-white overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-teal-600/10 hover:bg-teal-600/10 text-slate-700">
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orgUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                            <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                            No users in this organization
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orgUsers.map(user => (
                                        <TableRow key={user.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetails(user, 'user')}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                                                        {user.full_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{user.full_name}</p>
                                                        <p className="text-sm text-slate-500">{user.job_title || 'Staff'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("capitalize font-semibold", roleColors[user.role] || "bg-slate-100")}>
                                                    {user.role || 'user'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className={cn("text-xs font-medium px-2 py-1 rounded-md border inline-block capitalize", typeColors[user.user_type] || "bg-slate-50")}>
                                                    {user.user_type || 'staff'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500">
                                                {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-teal-600" onClick={(e) => { e.stopPropagation(); handleViewDetails(user, 'user'); }}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {isManagerOrAdmin && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={(e) => handleEditMember(e, user, 'user')}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            {user.id !== currentUser?.id && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={(e) => handleDeleteMember(e, user.id, 'user')}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* Map Tab */}
                <TabsContent value="map" className="mt-6">
                    <Card className="overflow-hidden">
                        <div className="h-[500px]">
                            {vendorsWithLocation.length > 0 ? (
                                <OrganizationMap
                                    vendors={vendorsWithLocation}
                                    center={mapCenter}
                                    zoom={4}
                                    onVendorClick={(vendor) => handleViewDetails(vendor, 'vendor')}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full bg-slate-50">
                                    <MapPin className="h-12 w-12 text-slate-300 mb-3" />
                                    <p className="text-slate-600">No vendors with location data</p>
                                    <p className="text-sm text-slate-500">Add latitude and longitude to vendors to see them on the map</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Details Sheet */}
            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {selectedMember?.type === 'vendor' ? 'Vendor Details' : 'User Details'}
                        </SheetTitle>
                    </SheetHeader>

                    {selectedMember && (
                        <div className="mt-6 space-y-6">
                            {/* Header */}
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl",
                                    selectedMember.type === 'vendor'
                                        ? "bg-linear-to-br from-violet-500 to-violet-600"
                                        : "bg-linear-to-br from-blue-500 to-blue-600 rounded-full"
                                )}>
                                    {selectedMember.type === 'vendor'
                                        ? selectedMember.store_name?.charAt(0)
                                        : selectedMember.full_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900">
                                        {selectedMember.type === 'vendor' ? selectedMember.store_name : selectedMember.full_name}
                                    </h3>
                                    <p className="text-slate-500">
                                        {selectedMember.type === 'vendor'
                                            ? (userMap[selectedMember.user_id!]?.email || selectedMember.name)
                                            : selectedMember.email}
                                    </p>
                                    <Badge className={statusColors[selectedMember.status || 'active']} >
                                        {selectedMember.status || 'active'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Contact Info */}
                            {selectedMember.type === 'vendor' && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-slate-500">Store Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                            <span>{userMap[selectedMember.user_id!]?.email || 'No email linked'}</span>
                                        </div>
                                        {userMap[selectedMember.user_id!]?.phone && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-4 w-4 text-slate-400" />
                                                <span>{userMap[selectedMember.user_id!]?.phone}</span>
                                            </div>
                                        )}
                                        {selectedMember.location_id && locationMap[selectedMember.location_id] && (
                                            <div className="flex items-start gap-3">
                                                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                                <span>
                                                    {locationMap[selectedMember.location_id].address}, {locationMap[selectedMember.location_id].city}, {locationMap[selectedMember.location_id].country}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Map for vendors with location */}
                            {selectedMember.type === 'vendor' && selectedMember.latitude && selectedMember.longitude && (
                                <Card className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-slate-500">Location</CardTitle>
                                    </CardHeader>
                                    <div className="h-48">
                                        <OrganizationMap
                                            vendors={[{
                                                ...selectedMember,
                                                latitude: locationMap[selectedMember.location_id]?.latitude,
                                                longitude: locationMap[selectedMember.location_id]?.longitude
                                            }]}
                                            center={[locationMap[selectedMember.location_id]?.latitude || 0, locationMap[selectedMember.location_id]?.longitude || 0]}
                                            zoom={14}
                                        />
                                    </div>
                                </Card>
                            )}

                            {/* Vendor Stats */}
                            {selectedMember.type === 'vendor' && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-slate-500">Performance</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                                <p className="text-2xl font-bold text-slate-900">
                                                    ${(selectedMember.total_sales || 0).toLocaleString()}
                                                </p>
                                                <p className="text-sm text-slate-500">Total Sales</p>
                                            </div>
                                            <div className="text-center p-3 bg-slate-50 rounded-lg">
                                                <p className="text-2xl font-bold text-slate-900">
                                                    {selectedMember.total_orders || 0}
                                                </p>
                                                <p className="text-sm text-slate-500">Orders</p>
                                            </div>
                                            <div className="text-center p-3 bg-slate-50 rounded-lg col-span-2">
                                                <p className="text-2xl font-bold text-teal-600">
                                                    {selectedMember.commission_rate || 0}%
                                                </p>
                                                <p className="text-sm text-slate-500">Commission Rate</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* User Info */}
                            {selectedMember.type === 'user' && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-slate-500">Account Info</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Role</span>
                                            <Badge variant="outline">{selectedMember.role || 'user'}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Type</span>
                                            <span className="capitalize">{selectedMember.user_type || 'staff'}</span>
                                        </div>
                                        {selectedMember.phone && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Phone</span>
                                                <span>{selectedMember.phone}</span>
                                            </div>
                                        )}
                                        {selectedMember.job_title && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Job Title</span>
                                                <span>{selectedMember.job_title}</span>
                                            </div>
                                        )}
                                        {selectedMember.department && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Department</span>
                                                <span>{selectedMember.department}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                {isManagerOrAdmin && (
                                    <>
                                        <Button variant="outline" className="flex-1" onClick={(e) => handleEditMember(undefined, selectedMember, selectedMember.type)}>
                                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                                        </Button>
                                        {(selectedMember.type === 'vendor' || selectedMember.id !== currentUser?.id) && (
                                            <Button variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100" onClick={(e) => { setDetailsOpen(false); handleDeleteMember(e, selectedMember.id, selectedMember.type); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </>
                                )}
                                {selectedMember.type === 'vendor' && (
                                    <Link href={createPageUrl(`VendorDetail?id=${selectedMember.id}`)} className="flex-1">
                                        <Button className="w-full bg-teal-600 hover:bg-teal-700">
                                            <Building2 className="h-4 w-4 mr-2" /> Manage
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader className="flex flex-col items-center text-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-rose-600" />
                        </div>
                        <DialogTitle className="text-xl">Delete {memberToDelete?.type === 'user' ? 'User' : 'Vendor'}?</DialogTitle>
                        <p className="text-sm text-slate-500">
                            Are you sure you want to remove this {memberToDelete?.type}? This action will permanently delete their account and associated profile data. This cannot be undone.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="grid grid-cols-2 gap-3 mt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleteMemberMutation.isPending}>
                            {deleteMemberMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
