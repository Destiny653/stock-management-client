'use client';

import Layout from '@/Layout';
import PurchaseOrders from '@/views/PurchaseOrders';

export default function PurchaseOrdersPage() {
    return (
        <Layout currentPageName="PurchaseOrders">
            <PurchaseOrders />
        </Layout>
    );
}
