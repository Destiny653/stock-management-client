'use client';

import { Suspense } from 'react';
import Layout from '@/Layout';
import ProductDetail from '@/views/ProductDetail';
import { Loader2 } from 'lucide-react';

function ProductDetailContent() {
    return (
        <Layout currentPageName="Inventory">
            <ProductDetail />
        </Layout>
    );
}

export default function ProductDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ProductDetailContent />
        </Suspense>
    );
}
