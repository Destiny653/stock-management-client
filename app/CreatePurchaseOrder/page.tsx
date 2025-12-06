'use client';

import Layout from '@/Layout';
import CreatePurchaseOrder from '@/views/CreatePurchaseOrder';

export default function CreatePurchaseOrderPage() {
    return (
        <Layout currentPageName="CreatePurchaseOrder">
            <CreatePurchaseOrder />
        </Layout>
    );
}
