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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
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
    DollarSign
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

import { useSearchParams } from "next/navigation";

export default function OrganizationMembers() {
    const { t } = useSafeLanguage();
    const searchParams = useSearchParams();

    const orgId = searchParams?.get('id');
    const initialTab = searchParams?.get('tab') || 'vendors';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

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
        queryKey: ['vendors'],
        queryFn: () => base44.entities.Vendor.list(),
        initialData: [],
    });

    const { data: users = [] } = useQuery({
        queryKey: ['users'],
        queryFn: () => base44.entities.User.list(),
        initialData: [],
    });

    // Filter by organization
    const orgVendors = useMemo(() => {
        let result = vendors.filter(v => v.organization_id === orgId);
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(v =>
                v.name?.toLowerCase().includes(search) ||
                v.store_name?.toLowerCase().includes(search) ||
                v.email?.toLowerCase().includes(search)
            );
        }
        return result;
    }, [vendors, orgId, searchTerm]);

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

    // Vendors with location for map
    const vendorsWithLocation = orgVendors.filter(v => v.latitude && v.longitude);

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
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl">
                            {organization.name?.charAt(0) || 'O'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{organization.name}</h1>
                            <p className="text-slate-500">{organization.code} • {organization.city}, {organization.country}</p>
                        </div>
                    </div>
                </div>
                <Badge className={cn("text-sm px-3 py-1", statusColors[organization.status])}>
                    {organization.status}
                </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
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
                    <CardContent className="p-4 flex items-center gap-3">
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
                    <CardContent className="p-4 flex items-center gap-3">
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
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">
                                ${orgVendors.reduce((sum, v) => sum + (v.total_sales || 0), 0).toLocaleString()}
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
                            className="pl-10 bg-slate-50"
                        />
                    </div>
                </div>

                {/* Vendors Tab */}
                <TabsContent value="vendors" className="mt-6">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
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
                                                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-semibold">
                                                        {vendor.store_name?.charAt(0) || 'V'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{vendor.store_name}</p>
                                                        <p className="text-sm text-slate-500">{vendor.name}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {vendor.email}</div>
                                                    {vendor.phone && <div className="flex items-center gap-1 text-slate-500"><Phone className="h-3 w-3" /> {vendor.phone}</div>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {vendor.city ? (
                                                    <div className="flex items-center gap-1 text-slate-600">
                                                        <MapPin className="h-3 w-3" /> {vendor.city}, {vendor.country}
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="mt-6">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/50">
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
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
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
                                                <Badge variant="outline">{user.role || 'user'}</Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{user.user_type || 'staff'}</TableCell>
                                            <TableCell className="text-slate-500">
                                                {user.created_date ? format(new Date(user.created_date), 'MMM d, yyyy') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
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
                                        ? "bg-gradient-to-br from-violet-500 to-violet-600"
                                        : "bg-gradient-to-br from-blue-500 to-blue-600 rounded-full"
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
                                        {selectedMember.type === 'vendor' ? selectedMember.name : selectedMember.email}
                                    </p>
                                    <Badge className={statusColors[selectedMember.status || 'active']} >
                                        {selectedMember.status || 'active'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-medium text-slate-500">Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span>{selectedMember.email}</span>
                                    </div>
                                    {selectedMember.phone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-slate-400" />
                                            <span>{selectedMember.phone}</span>
                                        </div>
                                    )}
                                    {(selectedMember.city || selectedMember.store_address) && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                                            <span>
                                                {selectedMember.store_address && `${selectedMember.store_address}, `}
                                                {selectedMember.city}, {selectedMember.country}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Map for vendors with location */}
                            {selectedMember.type === 'vendor' && selectedMember.latitude && selectedMember.longitude && (
                                <Card className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium text-slate-500">Location</CardTitle>
                                    </CardHeader>
                                    <div className="h-48">
                                        <OrganizationMap
                                            vendors={[selectedMember]}
                                            center={[selectedMember.latitude, selectedMember.longitude]}
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
                            <div className="flex gap-3">
                                {selectedMember.type === 'vendor' && (
                                    <Link href={createPageUrl(`VendorDetail?id=${selectedMember.id}`)} className="flex-1">
                                        <Button className="w-full bg-teal-600 hover:bg-teal-700">
                                            <Eye className="h-4 w-4 mr-2" /> Full Details
                                        </Button>
                                    </Link>
                                )}
                                <Button variant="outline" onClick={() => setDetailsOpen(false)} className={selectedMember.type !== 'vendor' ? 'flex-1' : ''}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
