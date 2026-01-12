import React, { useState, useMemo } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Truck,
  XCircle,
  Loader2,
  Filter,
  Download
} from "lucide-react";
import { format } from "date-fns";
import POStatusBadge from "@/components/po/POStatusBadge";
import { toast } from "sonner";
import { useLanguage } from "@/components/i18n/LanguageContext";
import Link from 'next/link';

function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
  }
}

export default function PurchaseOrders() {
  const { t } = useSafeLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders'],
    queryFn: () => base44.entities.PurchaseOrder.list(),
  });

  const updatePOMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Record<string, unknown> }) => base44.entities.PurchaseOrder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast.success("Purchase order updated");
    },
  });

  const filteredOrders = useMemo(() => {
    let result = [...purchaseOrders];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(po =>
        po.po_number?.toLowerCase().includes(search) ||
        po.supplier_name?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(po => po.status === statusFilter);
    }

    return result;
  }, [purchaseOrders, searchTerm, statusFilter]);

  const handleStatusChange = async (poId: string | number, newStatus: string) => {
    await updatePOMutation.mutateAsync({ id: poId, data: { status: newStatus } });
  };

  // Stats
  const stats = {
    draft: purchaseOrders.filter(p => p.status === 'draft').length,
    pending: purchaseOrders.filter(p => p.status === 'pending').length,
    ordered: purchaseOrders.filter(p => ['approved', 'ordered'].includes(p.status)).length,
    received: purchaseOrders.filter(p => p.status === 'received').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('purchaseOrders')}</h1>
          <p className="text-slate-500 mt-1">{t('allPurchaseOrders')}</p>
        </div>
        <Link href={createPageUrl("CreatePurchaseOrder")}>
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            {t('createNewPO')}
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("draft")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('draft')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.draft}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("pending")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('pendingApproval')}</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("ordered")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('ordered')}</p>
                <p className="text-2xl font-bold text-violet-600">{stats.ordered}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("received")}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{t('received')}</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.received}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
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
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-slate-50">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="draft">{t('draft')}</SelectItem>
              <SelectItem value="pending">{t('pendingApproval')}</SelectItem>
              <SelectItem value="approved">{t('approved')}</SelectItem>
              <SelectItem value="ordered">{t('ordered')}</SelectItem>
              <SelectItem value="partially_received">{t('partiallyReceived')}</SelectItem>
              <SelectItem value="received">{t('received')}</SelectItem>
              <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>{t('poNumber')}</TableHead>
                <TableHead>{t('supplier')}</TableHead>
                <TableHead>{t('items')}</TableHead>
                <TableHead>{t('total')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('expectedDate')}</TableHead>
                <TableHead>{t('created')}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48">
                    <div className="flex flex-col items-center justify-center text-center">
                      <FileText className="h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-slate-600 font-medium">{t('noResults')}</p>
                      <p className="text-sm text-slate-400 mt-1">{t('createNewPO')}</p>
                      <Link href={createPageUrl("CreatePurchaseOrder")} className="mt-4">
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                          <Plus className="h-4 w-4 mr-1" /> {t('createPO')}
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((po) => (
                  <TableRow key={po.id} className="hover:bg-slate-50">
                    <TableCell>
                      <Link
                        href={createPageUrl(`PurchaseOrderDetail?id=${po.id}`)}
                        className="font-medium text-slate-900 hover:text-teal-600"
                      >
                        {po.po_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-600">{po.supplier_name}</TableCell>
                    <TableCell>{po.items?.length || 0} {t('items')}</TableCell>
                    <TableCell className="font-medium">
                      ${((po as any).total ?? po.items?.reduce((sum, item) => {
                        // Handle different item structures
                        const itemTotal = (item as any).total ??
                          ((item as any).quantity ?? (item as any).quantity_ordered ?? 0) *
                          ((item as any).unit_price ?? (item as any).unit_cost ?? 0);
                        return sum + itemTotal;
                      }, 0) ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <POStatusBadge status={po.status} />
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {po.expected_date ? format(new Date(po.expected_date), "MMM d, yyyy") : '-'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {format(new Date(po.created_date), "MMM d")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={createPageUrl(`PurchaseOrderDetail?id=${po.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> {t('viewDetails')}
                            </Link>
                          </DropdownMenuItem>
                          {po.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(po.id, 'pending')}>
                              <CheckCircle className="h-4 w-4 mr-2" /> {t('submit')}
                            </DropdownMenuItem>
                          )}
                          {po.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(po.id, 'approved')}>
                              <CheckCircle className="h-4 w-4 mr-2" /> {t('approved')}
                            </DropdownMenuItem>
                          )}
                          {po.status === 'approved' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(po.id, 'ordered')}>
                              <Truck className="h-4 w-4 mr-2" /> {t('ordered')}
                            </DropdownMenuItem>
                          )}
                          {po.status === 'ordered' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(po.id, 'received')}>
                              <CheckCircle className="h-4 w-4 mr-2" /> {t('received')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {po.status !== 'cancelled' && po.status !== 'received' && (
                            <DropdownMenuItem
                              className="text-rose-600"
                              onClick={() => handleStatusChange(po.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4 mr-2" /> {t('cancel')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}