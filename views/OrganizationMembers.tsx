import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/data-table";
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
    AlertTriangle,
    Calendar,
    CreditCard
} from "lucide-react";
import { OrganizationPayment, Organization } from "@/api/base44Client";
import { format, subDays, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";
import dynamic from 'next/dynamic';

import type { LocationMarker } from '@/components/organizations/OrganizationMap';

const OrganizationMap = dynamic(
    () => import('@/components/organizations/OrganizationMap'),
    {
        ssr: false,
        loading: () => (
            <div className="h-full w-full flex items-center justify-center bg-muted/30 min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }
);

// Payment status colors
const paymentStatusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    completed: "bg-primary/10 text-primary",
    failed: "bg-destructive/10 text-destructive",
    refunded: "bg-primary/10 text-primary",
    cancelled: "bg-muted text-muted-foreground"
};

const subscriptionPlanPricing: Record<string, { monthly: number; yearly: number; maxVendors: number; maxUsers: number }> = {
    starter: { monthly: 29, yearly: 290, maxVendors: 10, maxUsers: 5 },
    business: { monthly: 79, yearly: 790, maxVendors: 50, maxUsers: 20 },
    enterprise: { monthly: 199, yearly: 1990, maxVendors: 999, maxUsers: 100 }
};

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
    }
}

const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary",
    inactive: "bg-muted text-muted-foreground",
    pending: "bg-amber-100 text-amber-700",
    suspended: "bg-destructive/10 text-destructive"
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
        role: 'user',
        user_type: 'business-staff',
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

    // Payment & Subscription State
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

    const [datasetSubscriptionForm, setSubscriptionForm] = useState<{
        subscription_plan: string;
        billing_cycle: 'monthly' | 'yearly';
        status: 'active' | 'inactive' | 'suspended' | 'pending';
        trial_ends_at: string;
        max_vendors: number;
        max_users: number;
    }>({
        subscription_plan: 'starter',
        billing_cycle: 'monthly',
        status: 'active',
        trial_ends_at: '',
        max_vendors: 10,
        max_users: 5
    });

    const [paymentForm, setPaymentForm] = useState<{
        amount: string;
        currency: string;
        payment_method: 'bank_transfer' | 'card' | 'mobile_money' | 'paypal' | 'stripe' | 'other';
        payment_type: 'subscription' | 'addon' | 'upgrade' | 'renewal';
        billing_period: 'monthly' | 'yearly';
        status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
        reference_number: string;
        invoice_number: string;
        payment_date: string;
        notes: string;
    }>({
        amount: '',
        currency: 'USD',
        payment_method: 'bank_transfer',
        payment_type: 'subscription',
        billing_period: 'monthly',
        status: 'pending',
        reference_number: '',
        invoice_number: '',
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });

    const roleColors: Record<string, string> = {
        admin: "bg-primary/10 text-primary border-primary/20",
        manager: "bg-primary/10 text-primary border-primary/20",
        vendor: "bg-purple-100 text-purple-700 border-purple-200",
        user: "bg-muted text-muted-foreground border-border",
    };

    const typeColors: Record<string, string> = {
        'platform-staff': "bg-primary/5 text-primary border-primary/10",
        'business-staff': "bg-primary/10 text-primary border-primary/20",
    };

    const queryClient = useQueryClient(); // Renamed from mutationClient for consistency

    const { data: currentUser } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => base44.auth.me(),
    });

    const isSuperAdmin = currentUser?.user_type === 'platform-staff';
    const isManagerOrAdmin = useMemo(() => {
        if (!currentUser) return false;
        return isSuperAdmin ||
            ['manager'].includes(currentUser.role) ||
            currentUser.user_type === 'platform-staff';
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

    const { data: payments = [] } = useQuery({
        queryKey: ['organizationPayments', orgId],
        queryFn: () => base44.entities.OrganizationPayment.list({ organization_id: orgId }),
        enabled: !!orgId || isSuperAdmin,
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

    const vendorMap = useMemo(() => {
        const map: Record<string, any> = {};
        vendors.forEach((v: any) => {
            if (v.user_id) map[v.user_id] = v;
        });
        return map;
    }, [vendors]);

    // Filter by organization
    const orgVendors = useMemo(() => {
        const vendorUsers = users.filter(u => u.organization_id === orgId && u.role === 'vendor');

        // Merge user data with vendor profile data
        let result = vendorUsers.map(u => {
            const profile = vendorMap[u.id];
            return {
                ...u,
                ...profile,
                id: profile?.id || u.id,
                user_id: u.id,
                // Fallback store name if profile is missing
                store_name: profile?.store_name || u.full_name || u.username || 'New Vendor'
            };
        });

        // Also include any vendors that don't have a linked user yet (safety)
        const linkedUserIds = new Set(vendorUsers.map(u => u.id));
        vendors.forEach(v => {
            if (v.organization_id === orgId && (!v.user_id || !linkedUserIds.has(v.user_id))) {
                result.push({
                    ...v,
                    role: 'vendor'
                });
            }
        });

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(v => {
                const userName = v.full_name || userMap[v.user_id!]?.full_name || '';
                const userEmail = v.email || userMap[v.user_id!]?.email || '';
                return v.store_name?.toLowerCase().includes(search) ||
                    userEmail.toLowerCase().includes(search) ||
                    userName.toLowerCase().includes(search);
            });
        }
        return result;
    }, [users, vendors, orgId, searchTerm, vendorMap, userMap]);

    const orgUsers = useMemo(() => {
        let result = users.filter(u => u.organization_id === orgId && u.role !== 'vendor');
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
                    user_type: 'business-staff' as any // Default to business-staff for org members
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
                    role: 'vendor',
                    user_type: 'business-staff',
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
                role: 'user',
                user_type: 'business-staff',
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
                return base44.entities.User.update(id, {
                    ...data,
                    username: data.email,
                });
            } else {
                // Determine if we have a vendor profile or just a user for this vendor
                const profile = vendorMap[id] || vendors.find(v => v.id === id);
                let vendorRecord;

                if (profile) {
                    vendorRecord = await base44.entities.Vendor.update(profile.id, {
                        store_name: data.store_name,
                        location_id: data.location_id === 'no_location' ? null : (data.location_id || profile.location_id),
                        commission_rate: data.commission_rate || 0,
                    });
                } else {
                    // Create profile if missing
                    vendorRecord = await base44.entities.Vendor.create({
                        organization_id: (orgId || currentUser?.organization_id) ?? undefined,
                        user_id: id,
                        store_name: data.store_name,
                        location_id: data.location_id === 'no_location' ? null : (data.location_id || undefined),
                        commission_rate: data.commission_rate || 0,
                        status: 'active'
                    });
                }

                // Update linked user's contact info
                const userId = profile?.user_id || id;
                await base44.entities.User.update(userId, {
                    full_name: data.full_name,
                    email: data.email,
                    phone: data.phone,
                    role: 'vendor' // Ensure role is still vendor 
                });

                return vendorRecord;
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
                role: 'user',
                user_type: 'business-staff',
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
                role: member.role || 'user',
                user_type: member.user_type || 'business-staff',
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
                role: 'user',
                user_type: 'business-staff',
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

    // Payment Mutations
    const createPaymentMutation = useMutation({
        mutationFn: (data: Partial<OrganizationPayment>) => base44.entities.OrganizationPayment.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizationPayments'] });
            setIsPaymentDialogOpen(false);
            resetPaymentForm();
            toast.success("Payment recorded successfully");
        }
    });

    const updatePaymentMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<OrganizationPayment> }) =>
            base44.entities.OrganizationPayment.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizationPayments'] });
            toast.success("Payment updated successfully");
        }
    });

    // Subscription Mutation
    const updateOrganizationMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Organization> }) =>
            base44.entities.Organization.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization'] });
            setIsSubscriptionDialogOpen(false);
            toast.success("Subscription updated successfully");
        }
    });

    const resetPaymentForm = () => {
        setPaymentForm({
            amount: '',
            currency: 'USD',
            payment_method: 'bank_transfer',
            payment_type: 'subscription',
            billing_period: 'monthly',
            status: 'pending',
            reference_number: '',
            invoice_number: '',
            payment_date: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
    };

    const handleCreatePayment = () => {
        if (!orgId || !paymentForm.amount) return;

        const invoiceNumber = paymentForm.invoice_number || `INV-${Date.now().toString().slice(-8)}`;

        createPaymentMutation.mutate({
            ...paymentForm,
            organization_id: orgId,
            amount: parseFloat(paymentForm.amount),
            invoice_number: invoiceNumber,
            created_at: new Date().toISOString()
        });
    };

    const handleConfirmPayment = (payment: OrganizationPayment) => {
        updatePaymentMutation.mutate({
            id: payment.id,
            data: {
                status: 'completed',
                payment_date: new Date().toISOString()
            }
        });
    };

    const handleRejectPayment = (payment: OrganizationPayment) => {
        updatePaymentMutation.mutate({
            id: payment.id,
            data: {
                status: 'cancelled'
            }
        });
    };

    const handleEditSubscription = () => {
        if (!organization) return;
        setSubscriptionForm({
            subscription_plan: organization.subscription_plan || 'starter',
            billing_cycle: organization.billing_cycle || 'monthly',
            status: organization.status,
            trial_ends_at: organization.trial_ends_at || '',
            max_vendors: organization.max_vendors || subscriptionPlanPricing[organization.subscription_plan || 'starter']?.maxVendors || 10,
            max_users: organization.max_users || subscriptionPlanPricing[organization.subscription_plan || 'starter']?.maxUsers || 5
        });
        setIsSubscriptionDialogOpen(true);
    };

    const handleSaveSubscription = () => {
        if (!organization) return;

        updateOrganizationMutation.mutate({
            id: organization.id,
            data: {
                subscription_plan: datasetSubscriptionForm.subscription_plan,
                billing_cycle: datasetSubscriptionForm.billing_cycle,
                status: datasetSubscriptionForm.status as any,
                trial_ends_at: datasetSubscriptionForm.trial_ends_at || undefined,
                max_vendors: datasetSubscriptionForm.max_vendors,
                max_users: datasetSubscriptionForm.max_users
            }
        });
    };

    // Filter payments
    const filteredPayments = useMemo(() => {
        return payments.filter((payment: any) => {
            const matchesSearch = !paymentSearch ||
                payment.reference_number?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
                payment.invoice_number?.toLowerCase().includes(paymentSearch.toLowerCase());
            const matchesStatus = paymentStatusFilter === 'all' || payment.status === paymentStatusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [payments, paymentSearch, paymentStatusFilter]);

    // Subscription Stats
    const subscriptionStats = useMemo(() => {
        if (!organization) return null;

        const completedPayments = payments.filter((p: any) => p.status === 'completed');
        const lastPayment = completedPayments.length > 0
            ? completedPayments.sort((a: any, b: any) =>
                new Date(b.payment_date || b.created_at).getTime() - new Date(a.payment_date || a.created_at).getTime()
            )[0]
            : null;

        let nextBillingDate: Date | null = null;
        if (lastPayment && lastPayment.payment_date) {
            const lastDate = new Date(lastPayment.payment_date);
            const billingCycle = organization.billing_cycle || 'monthly';
            if (billingCycle === 'yearly') {
                nextBillingDate = new Date(lastDate.setFullYear(lastDate.getFullYear() + 1));
            } else {
                nextBillingDate = new Date(lastDate.setMonth(lastDate.getMonth() + 1));
            }
        }

        const planPrices = subscriptionPlanPricing[organization.subscription_plan || 'starter'] || subscriptionPlanPricing.starter;
        const billingAmount = organization.billing_cycle === 'yearly' ? planPrices.yearly : planPrices.monthly;

        return {
            lastPayment,
            nextBillingDate,
            billingAmount,
            totalPaid: completedPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
        };
    }, [organization, payments]);

    const vendorColumns: Column<any>[] = [
        {
            header: 'Vendor',
            cell: (vendor) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {vendor.store_name?.charAt(0) || 'V'}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{vendor.store_name}</p>
                        <p className="text-sm text-muted-foreground">{userMap[vendor.user_id!]?.full_name || 'No contact'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Contact',
            cell: (vendor) => (
                <div className="text-sm">
                    <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {userMap[vendor.user_id!]?.email || 'No email linked'}</div>
                    {userMap[vendor.user_id!]?.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {userMap[vendor.user_id!]?.phone}</div>}
                </div>
            )
        },
        {
            header: 'Location',
            cell: (vendor) => (
                vendor.location_id && locationMap[vendor.location_id] ? (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {locationMap[vendor.location_id].city}, {locationMap[vendor.location_id].country}
                    </div>
                ) : '-'
            )
        },
        {
            header: 'Status',
            cell: (vendor) => <Badge className={statusColors[vendor.status]}>{vendor.status}</Badge>
        },
        {
            header: 'Sales',
            className: 'font-medium',
            cell: (vendor) => `$${(vendor.total_sales || 0).toLocaleString()}`
        },
        {
            header: '',
            className: 'w-12',
            cell: (vendor) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleViewDetails(vendor, 'vendor'); }}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    {isManagerOrAdmin && (
                        <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => handleEditMember(e, vendor, 'vendor')}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDeleteMember(e, vendor.id, 'vendor')}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const userColumns: Column<any>[] = [
        {
            header: 'User',
            cell: (user) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {user.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.job_title || 'Staff'}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Email',
            className: 'text-muted-foreground',
            cell: (user) => user.email
        },
        {
            header: 'Role',
            cell: (user) => (
                <Badge variant="outline" className={cn("capitalize font-semibold", roleColors[user.role] || "bg-muted text-muted-foreground border-border")}>
                    {user.role || 'user'}
                </Badge>
            )
        },
        {
            header: 'Type',
            cell: (user) => (
                <div className={cn("text-xs font-medium px-2 py-1 rounded-md border inline-block capitalize", typeColors[user.user_type] || "bg-muted/50 text-muted-foreground border-border")}>
                    {user.user_type || 'business-staff'}
                </div>
            )
        },
        {
            header: 'Joined',
            className: 'text-muted-foreground',
            cell: (user) => (user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-')
        },
        {
            header: '',
            className: 'w-12',
            cell: (user) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleViewDetails(user, 'user'); }}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    {isManagerOrAdmin && (
                        <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => handleEditMember(e, user, 'user')}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDeleteMember(e, user.id, 'user')}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )
        }
    ];

    const billingColumns: Column<any>[] = [
        {
            header: 'Invoice',
            cell: (payment) => (
                <>
                    <div className="font-mono text-sm font-medium">{payment.invoice_number}</div>
                    <div className="text-xs text-muted-foreground">{payment.payment_type}</div>
                </>
            )
        },
        {
            header: 'Amount',
            className: 'font-medium',
            cell: (payment) => `${payment.currency === 'USD' ? '$' : payment.currency} ${payment.amount.toLocaleString()}`
        },
        {
            header: 'Date',
            cell: (payment) => (
                payment.payment_date
                    ? format(new Date(payment.payment_date), 'MMM d, yyyy')
                    : format(new Date(payment.created_at), 'MMM d, yyyy')
            )
        },
        {
            header: 'Method',
            className: 'capitalize',
            cell: (payment) => payment.payment_method.replace('_', ' ')
        },
        {
            header: 'Status',
            cell: (payment) => (
                <Badge className={cn(paymentStatusColors[payment.status], "capitalize")}>
                    {payment.status}
                </Badge>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            cell: (payment) => (
                <div className="flex justify-end gap-2">
                    {isSuperAdmin && payment.status === 'pending' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleConfirmPayment(payment)}
                                className="text-primary hover:text-primary-foreground hover:bg-primary h-8 px-2"
                            >
                                Confirm
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectPayment(payment)}
                                className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-8 px-2"
                            >
                                Reject
                            </Button>
                        </>
                    )}
                    {payment.status === 'completed' && (
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground">
                            Download
                        </Button>
                    )}
                </div>
            )
        }
    ];

    const deleteMemberMutation = useMutation({
        mutationFn: async ({ id, type }: { id: string, type: 'user' | 'vendor' }) => {
            if (type === 'user') {
                return base44.entities.User.delete(id);
            } else {
                const profile = vendorMap[id] || vendors.find(v => v.id === id);
                if (profile) {
                    await base44.entities.Vendor.delete(profile.id);
                }
                const userId = profile?.user_id || id;
                if (userId) {
                    try {
                        await base44.entities.User.delete(userId);
                    } catch (e) {
                        console.warn("Failed to delete user linked to vendor", e);
                    }
                }
                return { success: true };
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
    const mapMarkers = useMemo(() => {
        const markers: LocationMarker[] = [];

        // Add Organization Location
        if (organization && organization.location_id && locationMap[organization.location_id]) {
            const loc = locationMap[organization.location_id];
            if (loc.latitude && loc.longitude) {
                markers.push({
                    id: 'org-' + organization.id,
                    name: organization.name,
                    type: 'organization',
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    address: loc.address,
                    city: loc.city,
                    country: loc.country,
                    status: organization.status
                });
            }
        }

        // Add Vendor Locations
        orgVendors.forEach(v => {
            const loc = v.location_id ? locationMap[v.location_id] : null;
            if (loc && loc.latitude && loc.longitude) {
                markers.push({
                    id: v.id,
                    store_name: v.store_name,
                    name: v.user_id && userMap[v.user_id] ? userMap[v.user_id].full_name : undefined,
                    type: 'vendor',
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    address: loc.address,
                    city: loc.city,
                    country: loc.country,
                    total_sales: v.total_sales,
                    status: v.status
                });
            }
        });

        return markers;
    }, [organization, orgVendors, locationMap, userMap]);

    // Calculate map center
    const mapCenter: [number, number] = mapMarkers.length > 0
        ? [
            mapMarkers.reduce((sum, v) => sum + (v.latitude || 0), 0) / mapMarkers.length,
            mapMarkers.reduce((sum, v) => sum + (v.longitude || 0), 0) / mapMarkers.length
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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                        <div className="h-12 w-12 rounded-md bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-xl">
                            {organization?.name?.charAt(0) || 'O'}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{organization?.name || 'Organization'}</h1>
                            <p className="text-slate-500">
                                {organization?.code}
                                {organization?.location_id && locationMap[organization.location_id] ?
                                    ` • ${locationMap[organization.location_id].city}, ${locationMap[organization.location_id].country}` : ''}
                            </p>
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
                                    full_name: '', email: '', password: '', phone: '', role: 'user',
                                    user_type: 'business-staff', department: '', job_title: '', store_name: '',
                                    location_id: '', commission_rate: 0,
                                });
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90">
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
                                                    <Select value={memberForm.role} onValueChange={v => setMemberForm(p => ({ ...p, role: v }))}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                            <SelectItem value="manager">Manager</SelectItem>
                                                            <SelectItem value="vendor">Vendor</SelectItem>
                                                            <SelectItem value="user">User</SelectItem>
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
                                    <Button className="bg-primary hover:bg-primary/90" onClick={handleAddMember} disabled={createMemberMutation.isPending || updateMemberMutation.isPending}>
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
                        <div className="h-10 w-10 rounded-md bg-violet-100 flex items-center justify-center">
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
                        <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
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
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900">{mapMarkers.length - (organization?.location_id ? 1 : 0)} (+1 HQ)</p>
                            <p className="text-sm text-slate-500">Locations on Map</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 py-12 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-amber-100 flex items-center justify-center">
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
                    <TabsList className="bg-muted">
                        <TabsTrigger value="vendors" className="flex items-center gap-2">
                            <Store className="h-4 w-4" /> Vendors ({orgVendors.length})
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Users ({orgUsers.length})
                        </TabsTrigger>
                        <TabsTrigger value="map" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Map View
                        </TabsTrigger>
                        <TabsTrigger value="subscription" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Subscription
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
                        <DataTable
                            data={orgVendors}
                            columns={vendorColumns}
                            emptyMessage="No vendors in this organization"
                            onRowClick={(vendor) => handleViewDetails(vendor, 'vendor')}
                        />
                    </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="mt-6">
                    <div className="bg-white overflow-hidden">
                        <DataTable
                            data={orgUsers}
                            columns={userColumns}
                            emptyMessage="No users in this organization"
                            onRowClick={(user) => handleViewDetails(user, 'user')}
                        />
                    </div>
                </TabsContent>

                {/* Map Tab */}
                <TabsContent value="map" className="mt-6">
                    <Card className="overflow-hidden">
                        <div className="h-[500px]">
                            {mapMarkers.length > 0 ? (
                                <OrganizationMap
                                    locations={mapMarkers}
                                    center={mapCenter}
                                    zoom={mapMarkers.length > 0 ? 12 : 3}
                                    onMarkerClick={(marker) => marker.type === 'vendor' ? handleViewDetails(marker, 'vendor') : null}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full bg-muted/30">
                                    <MapPin className="h-12 w-12 text-slate-300 mb-3" />
                                    <p className="text-slate-600">No locations found</p>
                                    <p className="text-sm text-slate-500">Add location data to organization or vendors to see them on the map</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>

                {/* Subscription Tab */}
                <TabsContent value="subscription" className="mt-6 space-y-6">
                    {/* Subscription Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Current Plan
                                </CardTitle>
                                <Badge className={cn(
                                    "capitalize",
                                    organization?.subscription_plan === 'enterprise' && "bg-violet-100 text-violet-700",
                                    organization?.subscription_plan === 'business' && "bg-blue-100 text-blue-700",
                                    (!organization?.subscription_plan || organization?.subscription_plan === 'starter') && "bg-muted text-muted-foreground"
                                )}>
                                    {organization?.subscription_plan || 'starter'}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-3xl font-bold text-slate-900">
                                            ${subscriptionStats?.billingAmount}
                                        </span>
                                        <span className="text-sm text-slate-500 capitalize">
                                            /{organization?.billing_cycle || 'monthly'}
                                        </span>
                                    </div>

                                    <div className="space-y-2 pt-4 border-t">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Status</span>
                                            <Badge variant="outline" className={statusColors[organization?.status || 'active']}>
                                                {organization?.status}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Next Billing</span>
                                            <span className="font-medium">
                                                {subscriptionStats?.nextBillingDate
                                                    ? format(subscriptionStats.nextBillingDate, 'MMM d, yyyy')
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Total Paid</span>
                                            <span className="font-medium text-primary">
                                                ${subscriptionStats?.totalPaid.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={handleEditSubscription}
                                            disabled={!isSuperAdmin}
                                        >
                                            <Edit2 className="h-4 w-4 mr-2" />
                                            {isSuperAdmin ? 'Edit Subscription' : 'Contact Admin to Change Plan'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">Usage Limits</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Vendors</span>
                                        <span className="font-medium">
                                            {orgVendors.length} / {organization?.max_vendors || 10}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-violet-500 rounded-full"
                                            style={{ width: `${Math.min((orgVendors.length / (organization?.max_vendors || 10)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Users</span>
                                        <span className="font-medium">
                                            {orgUsers.length} / {organization?.max_users || 5}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${Math.min((orgUsers.length / (organization?.max_users || 5)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground">
                                    <p>Need more capacity? Upgrade your plan to increase limits for vendors, users, and storage.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment History Table */}
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-slate-400" />
                                Billing History
                            </CardTitle>
                            <div className="flex gap-2">
                                {isSuperAdmin && (
                                    <Button
                                        onClick={() => {
                                            if (organization) {
                                                setPaymentForm(prev => ({
                                                    ...prev,
                                                    organization_id: organization.id,
                                                    amount: subscriptionStats?.billingAmount.toString() || '',
                                                    payment_type: 'subscription'
                                                }));
                                                setIsPaymentDialogOpen(true);
                                            }
                                        }}
                                        className="bg-primary hover:bg-primary/90"
                                        size="sm"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Record Payment
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <DataTable
                                data={filteredPayments}
                                columns={billingColumns}
                                emptyMessage="No payment history found"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>


                {/* Subscription Tab */}
                <TabsContent value="subscription" className="mt-6">
                    <Card className="bg-white border-slate-200">
                        <CardHeader className="pb-4 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-medium text-slate-900 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" /> Subscription & Billing
                                </CardTitle>
                                <Button variant="outline" size="sm">Manage Plan</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Current Plan Info */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Current Subscription</h3>
                                        <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-md border border-primary/10">
                                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white">
                                                <div className="font-bold text-primary text-xl uppercase">
                                                    {organization?.subscription_plan?.charAt(0) || 'S'}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-lg text-slate-900 capitalize">{organization?.subscription_plan || 'Starter'} Plan</h3>
                                                    <Badge className="bg-primary text-white border-none capitalize">
                                                        {organization?.status || 'Active'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                                                    <span>Billed {organization?.billing_cycle || 'Monthly'}</span>
                                                    <span>•</span>
                                                    <span>Next billing date: {organization?.created_at ? format(new Date(new Date(organization.created_at).setMonth(new Date(organization.created_at).getMonth() + 1)), 'MMM dd, yyyy') : '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-muted/30 rounded-md border border-border">
                                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Start Date</p>
                                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {organization?.created_at ? format(new Date(organization.created_at), 'MMM dd, yyyy') : '-'}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-md border border-border">
                                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Renewal Date</p>
                                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                {organization?.created_at
                                                    ? format(new Date(new Date(organization.created_at).setFullYear(new Date(organization.created_at).getFullYear() + 1)), 'MMM dd, yyyy')
                                                    : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Details / Payment Method Placeholder */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Payment Method</h3>

                                    <div className="p-6 border border-slate-200 rounded-md bg-white border-dashed flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <CreditCard className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">No payment method on file</p>
                                            <p className="text-sm text-slate-500 mt-1">Add a payment method to ensure uninterrupted service.</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="mt-2">
                                            Add Payment Method
                                        </Button>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <h4 className="text-sm font-medium text-slate-900 mb-3">Billing History</h4>
                                        <div className="text-sm text-slate-500 italic">No previous invoices found.</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
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
                                    "h-16 w-16 rounded-md flex items-center justify-center text-white font-bold text-2xl",
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
                                            locations={[{
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
                                            <div className="text-center p-3 bg-muted/30 rounded-md">
                                                <p className="text-2xl font-bold text-slate-900">
                                                    ${(selectedMember.total_sales || 0).toLocaleString()}
                                                </p>
                                                <p className="text-sm text-slate-500">Total Sales</p>
                                            </div>
                                            <div className="text-center p-3 bg-muted/30 rounded-md">
                                                <p className="text-2xl font-bold text-slate-900">
                                                    {selectedMember.total_orders || 0}
                                                </p>
                                                <p className="text-sm text-slate-500">Orders</p>
                                            </div>
                                            <div className="text-center p-3 bg-muted/30 rounded-md col-span-2">
                                                <p className="text-2xl font-bold text-primary">
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
                                            <span className="capitalize">{selectedMember.user_type || 'business-staff'}</span>
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
                                        <Button className="w-full bg-primary hover:bg-primary/90">
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
