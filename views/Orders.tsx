import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { base44, Order, Product } from "@/api/base44Client";
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
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
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Search,
    MoreHorizontal,
    Eye,
    Package,
    Clock,
    CheckCircle,
    Truck,
    XCircle,
    Loader2,
    ShoppingCart,
    DollarSign,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";

const statusColors: Record<string, string> = {
    pending: "bg-primary/10 text-primary dashed border border-primary/20",
    confirmed: "bg-primary/20 text-primary",
    processing: "bg-primary/30 text-primary font-medium",
    ready: "bg-primary text-primary-foreground",
    shipped: "bg-muted text-foreground border border-border",
    delivered: "bg-primary/20 text-primary border border-primary/20",
    cancelled: "bg-destructive/10 text-destructive"
};

const paymentStatusColors: Record<string, string> = {
    unpaid: "bg-destructive/10 text-destructive",
    partial: "bg-primary/10 text-primary dashed border",
    paid: "bg-primary/20 text-primary",
    refunded: "bg-muted text-muted-foreground"
};

const availabilityColors: Record<string, string> = {
    in_stock: "bg-primary/20 text-primary",
    low_stock: "bg-primary/10 text-primary border border-primary/20",
    out_of_stock: "bg-destructive/10 text-destructive",
    on_order: "bg-muted text-muted-foreground"
};

function useSafeLanguage() {
    try {
        return useLanguage();
    } catch (e) {
        return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
    }
}


export default function Orders() {
    const { t } = useSafeLanguage();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: () => base44.entities.Order.list(),
    });

    const updateOrderMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) => base44.entities.Order.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success("Order status updated");
        },
    });

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        await updateOrderMutation.mutateAsync({ id: orderId, data: { status: newStatus as any } });
    };

    const columns: Column<Order>[] = [
        {
            header: 'Order #',
            cell: (order) => <span className="font-medium text-foreground">{order.order_number}</span>
        },
        {
            header: 'Client',
            cell: (order) => (
                <div>
                    <p className="font-medium text-foreground">{order.client_name}</p>
                    <p className="text-sm text-muted-foreground">{order.client_email}</p>
                </div>
            )
        },
        // ... (Date, Items, Total columns remain similar but check text-slate)
        {
            header: 'Date',
            cell: (order) => <span className="text-foreground">{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
        },
        {
            header: 'Items',
            cell: (order) => <span className="text-muted-foreground">{`${order.items?.length || 0} items`}</span>
        },
        {
            header: 'Total',
            cell: (order) => <span className="font-medium text-primary">${order.total?.toFixed(2)}</span>
        },
        {
            header: 'Status',
            cell: (order) => (
                <Badge className={statusColors[order.status]}>
                    {order.status}
                </Badge>
            )
        },
        {
            header: 'Payment',
            cell: (order) => (
                <Badge className={paymentStatusColors[order.payment_status]}>
                    {order.payment_status}
                </Badge>
            )
        },
        {
            header: '',
            className: 'w-12',
            cell: (order) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    {/* ... (menu items same but check icons) */}
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        {order.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmed')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-primary" /> Confirm Order
                            </DropdownMenuItem>
                        )}
                        {/* ... items ... */}
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ];

    const filteredOrders = useMemo(() => {
        let result = [...orders];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(order =>
                order.order_number?.toLowerCase().includes(search) ||
                order.client_name?.toLowerCase().includes(search) ||
                order.client_email?.toLowerCase().includes(search)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(order => order.status === statusFilter);
        }

        if (paymentFilter !== "all") {
            result = result.filter(order => order.payment_status === paymentFilter);
        }

        return result;
    }, [orders, searchTerm, statusFilter, paymentFilter]);

    const stats = useMemo(() => ({
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        unpaid: orders.filter(o => o.payment_status === 'unpaid').length,
    }), [orders]);

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Client Orders</h1>
                    <p className="text-muted-foreground mt-1">Manage and process customer orders</p>
                </div>
                <Link href={createPageUrl("CreateOrder")}>
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Orders</p>
                                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold text-primary">{stats.pending}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Processing</p>
                                <p className="text-2xl font-bold text-foreground">{stats.processing}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 py-12">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Unpaid</p>
                                <p className="text-2xl font-bold text-destructive">{stats.unpaid}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-destructive" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div>
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by order #, client name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 rounded-sm py-5 max-w-[60%] bg-card border-border focus:bg-card"
                        />
                    </div>
                    {/* ... (Selects remain, update styles if needed) ... */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-card rounded-sm py-5 border-border">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-40 bg-card rounded-sm py-5 border-border">
                            <SelectValue placeholder="Payment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Payments</SelectItem>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders Table */}
            <Card>
                <CardContent className="p-0">
                    <DataTable
                        data={filteredOrders}
                        columns={columns}
                        isLoading={isLoading}
                        emptyMessage="No orders found"
                    />
                </CardContent>
            </Card>

            {/* Order Details Sheet */}
            <Sheet open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full">
                    <SheetHeader className="p-6 border-b shrink-0">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Order Details - {selectedOrder?.order_number}
                        </SheetTitle>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {selectedOrder && (
                            <>
                                {/* Client Info */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-md border border-border">
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Client Name</Label>
                                        <p className="font-semibold text-foreground">{selectedOrder.client_name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Email</Label>
                                        <p className="font-semibold text-foreground truncate">{selectedOrder.client_email}</p>
                                    </div>
                                    <div className="mt-2">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Phone</Label>
                                        <p className="font-medium text-foreground">{selectedOrder.client_phone || '-'}</p>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Order Date</Label>
                                        <p className="font-medium text-foreground">{format(new Date(selectedOrder.created_at), 'MMM d, yyyy HH:mm')}</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Order Items
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {selectedOrder.items?.map((item, idx) => (
                                            <div key={idx} className="border border-border rounded-lg p-4 bg-card/50 hover:bg-card transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-foreground">{item.product_name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</p>
                                                    </div>
                                                    <Badge className={cn("text-[10px] px-1.5 py-0", availabilityColors[item.availability_status || 'in_stock'])}>
                                                        {item.availability_status?.replace('_', ' ') || 'in stock'}
                                                    </Badge>
                                                </div>
                                                {item.specifications && (
                                                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                                        <p className="text-muted-foreground flex gap-4">
                                                            {item.specifications.size && <span><strong>Size:</strong> {item.specifications.size}</span>}
                                                            {item.specifications.color && <span><strong>Color:</strong> {item.specifications.color}</span>}
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex justify-between mt-3 text-sm">
                                                    <span className="text-muted-foreground">Qty: {item.quantity} × ${item.unit_price?.toFixed(2)}</span>
                                                    <span className="font-bold text-foreground">${item.total?.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
                                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Payment Summary
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="text-foreground">${selectedOrder.subtotal?.toFixed(2)}</span>
                                        </div>
                                        {selectedOrder.discount && selectedOrder.discount > 0 && (
                                            <div className="flex justify-between text-sm text-primary font-medium">
                                                <span>Discount</span>
                                                <span>-${selectedOrder.discount?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {selectedOrder.tax && selectedOrder.tax > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Tax</span>
                                                <span className="text-foreground">${selectedOrder.tax?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {selectedOrder.shipping && selectedOrder.shipping > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Shipping</span>
                                                <span className="text-foreground">${selectedOrder.shipping?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-lg font-black pt-3 border-t border-border text-primary uppercase">
                                            <span>Total Amount</span>
                                            <span>${selectedOrder.total?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                {(selectedOrder.shipping_address || selectedOrder.notes) && (
                                    <div className="space-y-4">
                                        {selectedOrder.shipping_address && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                                    <Truck className="h-3.5 w-3.5" />
                                                    Shipping Address
                                                </Label>
                                                <div className="text-sm text-foreground bg-white/50 p-4 rounded-lg border border-border leading-relaxed shadow-sm">
                                                    {selectedOrder.shipping_address}
                                                </div>
                                            </div>
                                        )}
                                        {selectedOrder.notes && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-1.5">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    Order Notes
                                                </Label>
                                                <div className="text-sm text-foreground bg-white/50 p-4 rounded-lg border border-border leading-relaxed shadow-sm italic">
                                                    "{selectedOrder.notes}"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <SheetFooter className="p-6 border-t shrink-0">
                        <Button className="w-full h-12 text-sm font-bold uppercase tracking-wider" onClick={() => setSelectedOrder(null)}>
                            Close Details
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
