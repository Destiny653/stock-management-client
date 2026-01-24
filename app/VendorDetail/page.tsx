'use client';

import { Suspense } from 'react';
import Layout from '@/Layout';
import VendorDetail from '@/views/VendorDetail';
import { Loader2 } from 'lucide-react';

function VendorDetailContent() {
    return (
        <Layout currentPageName="VendorManagement">
            <VendorDetail />
        </Layout>
    );
}

export default function VendorDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        }>
            <VendorDetailContent />
        </Suspense>
    );
}
