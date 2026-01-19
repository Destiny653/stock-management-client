import React, { useState, useMemo } from 'react';
import Link from "next/link";
import { createPageUrl } from "@/utils";
import { base44, Order, Product } from "@/api/base44Client";
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

const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-purple-100 text-purple-700",
    ready: "bg-teal-100 text-teal-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-rose-100 text-rose-700"
};

const paymentStatusColors: Record<string, string> = {
    unpaid: "bg-rose-100 text-rose-700",
    partial: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    refunded: "bg-slate-100 text-slate-600"
};

const availabilityColors: Record<string, string> = {
    in_stock: "bg-emerald-100 text-emerald-700",
    low_stock: "bg-amber-100 text-amber-700",
    out_of_stock: "bg-rose-100 text-rose-700",
    on_order: "bg-blue-100 text-blue-700"
};

export default function Orders() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const { data: orders = [], isLoading: loadingOrders } = useQuery<Order[]>({
        queryKey: ['orders'],
        queryFn: () => base44.entities.Order.list(),
    });

    const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: () => base44.entities.Product.list(),
    });

    const isLoading = loadingOrders || loadingProducts;

    const updateOrderMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Order> }) => base44.entities.Order.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            toast.success("Order updated");
        },
    });

    const filteredOrders = useMemo(() => {
        let result = [...orders];

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(o =>
                o.order_number?.toLowerCase().includes(search) ||
                o.client_name?.toLowerCase().includes(search) ||
                o.client_email?.toLowerCase().includes(search) ||
                o.client_phone?.includes(search)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter(o => o.status === statusFilter);
        }

        if (paymentFilter !== "all") {
            result = result.filter(o => o.payment_status === paymentFilter);
        }

        return result;
    }, [orders, searchTerm, statusFilter, paymentFilter]);

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
        unpaid: orders.filter(o => o.payment_status === 'unpaid').length,
    };

    const handleStatusChange = async (orderId: string, newStatus: any) => {
        await updateOrderMutation.mutateAsync({ id: orderId, data: { status: newStatus } });
    };

    const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: any) => {
        await updateOrderMutation.mutateAsync({ id: orderId, data: { payment_status: newPaymentStatus } });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Orders</h1>
                    <p className="text-slate-500 mt-1">Manage and process customer orders</p>
                </div>
                <Link href={createPageUrl("CreateOrder")}>
                    <Button className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Order
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Total Orders</p>
                                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                                <ShoppingCart className="h-5 w-5 text-teal-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Pending</p>
                                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Processing</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.processing}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Package className="h-5 w-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Unpaid</p>
                                <p className="text-2xl font-bold text-rose-600">{stats.unpaid}</p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-rose-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by order #, client name, email, or phone..."
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                        <SelectTrigger className="w-40 bg-slate-50">
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
            {isLoading ? (
                <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-slate-200">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead>Order #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map(order => (
                                <TableRow key={order.id} className="hover:bg-slate-50">
                                    <TableCell className="font-medium">{order.order_number}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-slate-900">{order.client_name}</p>
                                            <p className="text-sm text-slate-500">{order.client_email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>{order.items?.length || 0} items</TableCell>
                                    <TableCell className="font-medium">${order.total?.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[order.status]}>
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={paymentStatusColors[order.payment_status]}>
                                            {order.payment_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                                    <Eye className="h-4 w-4 mr-2" /> View Details
                                                </DropdownMenuItem>
                                                {order.status === 'pending' && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmed')}>
                                                        <CheckCircle className="h-4 w-4 mr-2" /> Confirm Order
                                                    </DropdownMenuItem>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'processing')}>
                                                        <Package className="h-4 w-4 mr-2" /> Start Processing
                                                    </DropdownMenuItem>
                                                )}
                                                {order.status === 'processing' && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'ready')}>
                                                        <CheckCircle className="h-4 w-4 mr-2" /> Mark Ready
                                                    </DropdownMenuItem>
                                                )}
                                                {order.payment_status === 'unpaid' && (
                                                    <DropdownMenuItem onClick={() => handlePaymentStatusChange(order.id, 'paid')}>
                                                        <DollarSign className="h-4 w-4 mr-2" /> Mark Paid
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredOrders.length === 0 && (
                        <div className="text-center py-12">
                            <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-600">No orders found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Order Details Dialog */}
            {selectedOrder && (
                <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Order Details - {selectedOrder.order_number}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6">
                            {/* Client Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                                <div>
                                    <Label className="text-xs text-slate-500">Client Name</Label>
                                    <p className="font-medium">{selectedOrder.client_name}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Email</Label>
                                    <p className="font-medium">{selectedOrder.client_email}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Phone</Label>
                                    <p className="font-medium">{selectedOrder.client_phone || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Order Date</Label>
                                    <p className="font-medium">{format(new Date(selectedOrder.created_at), 'MMM d, yyyy HH:mm')}</p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="font-semibold mb-3">Order Items</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium">{item.product_name}</p>
                                                    <p className="text-sm text-slate-500">SKU: {item.sku}</p>
                                                </div>
                                                <Badge className={availabilityColors[item.availability_status || 'in_stock']}>
                                                    {item.availability_status || 'in_stock'}
                                                </Badge>
                                            </div>
                                            {item.specifications && (
                                                <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                                                    <p className="text-slate-600">
                                                        {item.specifications.size && <span className="mr-3"><strong>Size:</strong> {item.specifications.size}</span>}
                                                        {item.specifications.color && <span className="mr-3"><strong>Color:</strong> {item.specifications.color}</span>}
                                                        {item.specifications.other_details && <span><strong>Details:</strong> {item.specifications.other_details}</span>}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex justify-between mt-2 text-sm">
                                                <span>Qty: {item.quantity} × ${item.unit_price?.toFixed(2)}</span>
                                                <span className="font-medium">${item.total?.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border-t pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Subtotal</span>
                                        <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                                    </div>
                                    {selectedOrder.discount && selectedOrder.discount > 0 && (
                                        <div className="flex justify-between text-emerald-600">
                                            <span>Discount</span>
                                            <span>-${selectedOrder.discount?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {selectedOrder.tax && selectedOrder.tax > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Tax</span>
                                            <span>${selectedOrder.tax?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {selectedOrder.shipping && selectedOrder.shipping > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Shipping</span>
                                            <span>${selectedOrder.shipping?.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                        <span>Total</span>
                                        <span>${selectedOrder.total?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            {(selectedOrder.shipping_address || selectedOrder.notes) && (
                                <div className="space-y-3">
                                    {selectedOrder.shipping_address && (
                                        <div>
                                            <Label className="text-xs text-slate-500">Shipping Address</Label>
                                            <p className="text-sm">{selectedOrder.shipping_address}</p>
                                        </div>
                                    )}
                                    {selectedOrder.notes && (
                                        <div>
                                            <Label className="text-xs text-slate-500">Notes</Label>
                                            <p className="text-sm">{selectedOrder.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
