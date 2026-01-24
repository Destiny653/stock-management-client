'use client';

import { Suspense } from 'react';
import Layout from '@/Layout';
import PurchaseOrderDetail from '@/views/PurchaseOrderDetail';
import { Loader2 } from 'lucide-react';

function PurchaseOrderDetailContent() {
    return (
        <Layout currentPageName="PurchaseOrders">
            <PurchaseOrderDetail />
        </Layout>
    );
}

export default function PurchaseOrderDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        }>
            <PurchaseOrderDetailContent />
        </Suspense>
    );
}
