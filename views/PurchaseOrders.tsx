import React, { useState, useMemo } from 'react';
import { createPageUrl } from "@/utils";
import { base44, PurchaseOrder } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Truck,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import POStatusBadge from "@/components/po/POStatusBadge";
import { toast } from "sonner";
import { useLanguage } from "@/components/i18n/LanguageContext";
import Link from 'next/link';
import POBulkActions from "@/components/po/POBulkActions";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { useAuth } from "@/contexts/AuthContext";

// New reusable components
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable, Column } from "@/components/ui/data-table";

function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return { t: (key: string) => key, language: 'en', setLanguage: () => { } };
  }
}

export default function PurchaseOrders() {
  const { t } = useSafeLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: purchaseOrders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchaseOrders'],
    queryFn: () => base44.entities.PurchaseOrder.list(),
  });

  const updatePOMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => base44.entities.PurchaseOrder.update(id, data),
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

  const handleStatusChange = async (poId: string | number, newStatus: PurchaseOrder['status']) => {
    try {
      if (newStatus === 'received') {
        const organizationId = user?.organization_id;
        if (!organizationId) {
          toast.error("Organization ID not found");
          return;
        }
        await base44.entities.PurchaseOrder.receive(poId as string, organizationId);
      } else {
        await updatePOMutation.mutateAsync({ id: poId as string, data: { status: newStatus } });
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast.success(t('statusUpdated') || "Status updated");
    } catch (e) {
      toast.error(t('failedToUpdate') || "Failed to update status");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} purchase orders?`)) return;
    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await base44.entities.PurchaseOrder.delete(id);
      }
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      toast.success("Purchase orders deleted");
    } catch (e) {
      toast.error("Failed to delete some purchase orders");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: PurchaseOrder['status']) => {
    const organizationId = user?.organization_id;
    if (newStatus === 'received' && !organizationId) {
      toast.error("Organization ID not found");
      return;
    }

    try {
      for (const id of selectedIds) {
        if (newStatus === 'received') {
          await base44.entities.PurchaseOrder.receive(id, organizationId!);
        } else {
          await base44.entities.PurchaseOrder.update(id, { status: newStatus });
        }
      }
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Updated ${selectedIds.length} purchase orders`);
    } catch (e) {
      toast.error("Failed to update some purchase orders");
    }
  };

  const handleBulkExport = (exportFormat: 'pdf' | 'csv') => {
    const headers = ['PO Number', 'Supplier', 'Status', 'Items', 'Total', 'Expected Date', 'Created'];
    const rows = filteredOrders
      .filter(po => selectedIds.includes(po.id))
      .map(po => {
        const total = (po as any).total ?? po.items?.reduce((sum: number, item: any) => {
          const itemTotal = (item as any).total ??
            ((item as any).quantity ?? (item as any).quantity_ordered ?? 0) *
            ((item as any).unit_price ?? (item as any).unit_cost ?? 0);
          return sum + itemTotal;
        }, 0) ?? 0;

        return [
          po.po_number,
          po.supplier_name,
          po.status,
          po.items?.length || 0,
          `$${total.toFixed(2)}`,
          po.expected_date ? format(new Date(po.expected_date), "MMM d, yyyy") : '-',
          format(new Date(po.created_at), "MMM d, yyyy")
        ];
      });

    const filename = `purchase_orders_export_${new Date().toISOString().split('T')[0]}`;
    if (exportFormat === 'csv') exportToCSV(headers, rows, filename);
    else exportToPDF(headers, rows, filename, "Purchase Orders Export");

    toast.success("Export downloaded");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredOrders.map(po => po.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  // Stats
  const stats = useMemo(() => ({
    draft: purchaseOrders.filter(p => p.status === 'draft').length,
    pending: purchaseOrders.filter(p => p.status === 'pending_approval').length,
    ordered: purchaseOrders.filter(p => ['approved', 'ordered'].includes(p.status)).length,
    received: purchaseOrders.filter(p => p.status === 'received').length,
  }), [purchaseOrders]);

  // Define Table Columns
  const columns: Column<PurchaseOrder>[] = [
    {
      header: (
        <div className="flex justify-center items-center w-full">
          <Checkbox
            checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
            onCheckedChange={(checked) => handleSelectAll(checked === true)}
          />
        </div>
      ),
      headerClassName: 'w-12 p-0 text-center',
      className: 'w-12 p-0 text-center',
      cell: (po: PurchaseOrder) => (
        <div className="flex justify-center items-center w-full" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.includes(po.id)}
            onCheckedChange={(checked) => handleSelectOne(po.id, checked === true)}
          />
        </div>
      )
    },
    {
      header: t('poNumber'),
      accessorKey: 'po_number',
      cell: (po) => (
        <Link
          href={createPageUrl(`PurchaseOrderDetail?id=${po.id}`)}
          className="font-medium text-slate-900 hover:text-primary"
        >
          {po.po_number}
        </Link>
      ),
      sortable: true
    },
    {
      header: t('supplier'),
      accessorKey: 'supplier_name',
      sortable: true
    },
    {
      header: t('items'),
      cell: (po) => `${po.items?.length || 0} ${t('items')}`
    },
    {
      header: t('total'),
      cell: (po) => {
        const total = (po as any).total ?? po.items?.reduce((sum, item) => {
          const itemTotal = (item as any).total ??
            ((item as any).quantity ?? (item as any).quantity_ordered ?? 0) *
            ((item as any).unit_price ?? (item as any).unit_cost ?? 0);
          return sum + itemTotal;
        }, 0) ?? 0;
        return `$${total.toFixed(2)}`;
      }
    },
    {
      header: t('status'),
      cell: (po) => <POStatusBadge status={po.status} />
    },
    {
      header: t('expectedDate'),
      cell: (po) => po.expected_date ? format(new Date(po.expected_date), "MMM d, yyyy") : '-'
    },
    {
      header: t('created'),
      cell: (po) => format(new Date(po.created_at), "MMM d")
    },
    {
      header: '',
      className: 'w-12 text-right',
      cell: (po) => (
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
              <DropdownMenuItem onClick={() => handleStatusChange(po.id, 'pending_approval')}>
                <CheckCircle className="h-4 w-4 mr-2" /> {t('submit')}
              </DropdownMenuItem>
            )}
            {po.status === 'pending_approval' && (
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
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('purchaseOrders')}
        subtitle={t('allPurchaseOrders')}
      >
        <Link href={createPageUrl("CreatePurchaseOrder")}>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            {t('createNewPO')}
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('draft')}
          value={stats.draft}
          icon={FileText}
          onClick={() => setStatusFilter("draft")}
        />
        <StatsCard
          title={t('pendingApproval')}
          value={stats.pending}
          icon={CheckCircle}
          variant="warning"
          onClick={() => setStatusFilter("pending_approval")}
        />
        <StatsCard
          title={t('ordered')}
          value={stats.ordered}
          icon={Truck}
          variant="primary"
          onClick={() => setStatusFilter("ordered")}
        />
        <StatsCard
          title={t('received')}
          value={stats.received}
          icon={CheckCircle}
          variant="success"
          onClick={() => setStatusFilter("received")}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-11 bg-white">
            <SelectValue placeholder={t('status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allStatus')}</SelectItem>
            <SelectItem value="draft">{t('draft')}</SelectItem>
            <SelectItem value="pending_approval">{t('pendingApproval')}</SelectItem>
            <SelectItem value="approved">{t('approved')}</SelectItem>
            <SelectItem value="ordered">{t('ordered')}</SelectItem>
            <SelectItem value="partially_received">{t('partiallyReceived')}</SelectItem>
            <SelectItem value="received">{t('received')}</SelectItem>
            <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reusable Data Table */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        isLoading={isLoading}
        emptyMessage={t('noResults')}
      />

      <POBulkActions
        selectedCount={selectedIds.length}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        onChangeStatus={handleBulkStatusChange}
      />
    </div>
  );
}