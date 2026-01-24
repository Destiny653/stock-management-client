'use client';

import { Suspense } from 'react';
import Layout from '@/Layout';
import OwnerDashboard from '@/views/OwnerDashboard';
import { Loader2 } from 'lucide-react';

function OwnerDashboardContent() {
    return (
        <Layout currentPageName="OwnerDashboard">
            <OwnerDashboard />
        </Layout>
    );
}

export default function OwnerDashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        }>
            <OwnerDashboardContent />
        </Suspense>
    );
}
