'use client';

import Layout from '@/Layout';
import CreatePurchaseOrder from '@/views/CreatePurchaseOrder';
import { Suspense } from 'react';

export default function CreatePurchaseOrderPage() {
    return (
        <Layout currentPageName="CreatePurchaseOrder">
            <Suspense fallback={<div>Loading...</div>}>
                <CreatePurchaseOrder />
            </Suspense>
        </Layout>
    );
}
