import React, { useState } from 'react';
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Truck,
  Calendar,
  Building2,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Send,
  Download
} from "lucide-react";
import { format } from "date-fns";
import POStatusBadge from "@/components/po/POStatusBadge";
import POItemsTable from "@/components/po/POItemsTable";
import { toast } from "sonner";

export default function PurchaseOrderDetail() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const poId = searchParams?.get('id');

  const { data: purchaseOrder, isLoading } = useQuery({
    queryKey: ['purchaseOrder', poId],
    queryFn: async () => {
      return base44.entities.PurchaseOrder.get(poId as string);
    },
    enabled: !!poId,
  });

  const updatePOMutation = useMutation({
    mutationFn: (data: any) => base44.entities.PurchaseOrder.update(poId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast.success("Purchase order updated");
    },
  });

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'approved') {
      await base44.entities.PurchaseOrder.approve(poId!, purchaseOrder!.organization_id);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      toast.success("Purchase order approved");
    } else if (newStatus === 'received') {
      await handleReceiveAll();
    } else {
      await updatePOMutation.mutateAsync({ status: newStatus });
    }
  };

  const handleReceiveAll = async () => {
    if (!purchaseOrder) return;

    try {
      await base44.entities.PurchaseOrder.receive(poId!, purchaseOrder.organization_id);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', poId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success("All items received and inventory updated");
    } catch (e) {
      toast.error("Failed to receive items");
    }
  };

  if (isLoading || !purchaseOrder) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={createPageUrl("PurchaseOrders")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{purchaseOrder.po_number}</h1>
              <POStatusBadge status={purchaseOrder.status} size="lg" />
            </div>
            <p className="text-slate-500 mt-1">Created {format(new Date(purchaseOrder.created_at), "MMM d, yyyy")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {purchaseOrder.status === 'draft' && (
            <Button onClick={() => handleStatusChange('pending_approval')}>
              <Send className="h-4 w-4 mr-2" /> Submit for Approval
            </Button>
          )}
          {purchaseOrder.status === 'pending_approval' && (
            <>
              <Button variant="outline" onClick={() => handleStatusChange('draft')}>
                Return to Draft
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => handleStatusChange('approved')}>
                <CheckCircle className="h-4 w-4 mr-2" /> Approve
              </Button>
            </>
          )}
          {purchaseOrder.status === 'approved' && (
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => handleStatusChange('ordered')}>
              <Truck className="h-4 w-4 mr-2" /> Mark as Ordered
            </Button>
          )}
          {purchaseOrder.status === 'ordered' && (
            <Button className="bg-primary hover:bg-primary/90" onClick={handleReceiveAll}>
              <Package className="h-4 w-4 mr-2" /> Receive All Items
            </Button>
          )}
          {!['cancelled', 'received'].includes(purchaseOrder.status) && (
            <Button variant="outline" className="text-rose-600" onClick={() => handleStatusChange('cancelled')}>
              <XCircle className="h-4 w-4 mr-2" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-slate-400" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <POItemsTable
                items={(purchaseOrder.items || []) as any}
                editable={false}
                showReceived={purchaseOrder.status === 'partially_received' || purchaseOrder.status === 'received'}
                onItemChange={() => { }}
                onRemoveItem={() => { }}
                onAddItem={() => { }}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          {purchaseOrder.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-400" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{purchaseOrder.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-400" />
                Supplier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-slate-900">{purchaseOrder.supplier_name}</p>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-slate-400" />
                Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Expected Date</span>
                <span className="font-medium">
                  {purchaseOrder.expected_date ? format(new Date(purchaseOrder.expected_date), "MMM d, yyyy") : '-'}
                </span>
              </div>
              {purchaseOrder.received_date && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Received Date</span>
                  <span className="font-medium">{format(new Date(purchaseOrder.received_date), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Destination</span>
                <span className="font-medium">{purchaseOrder.warehouse || '-'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span>${purchaseOrder.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax</span>
                <span>${purchaseOrder.tax?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Shipping</span>
                <span>${purchaseOrder.shipping?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">${purchaseOrder.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Info */}
          {purchaseOrder.approved_by && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-slate-600">Approved by</p>
                <p className="font-medium">{purchaseOrder.approved_by}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}