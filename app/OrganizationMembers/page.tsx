'use client';

import Layout from '@/Layout';
import OrganizationMembers from '@/views/OrganizationMembers';

import { Suspense } from 'react';

export default function OrganizationMembersPage() {
    return (
        <Layout currentPageName="Organizations">
            <Suspense fallback={
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }>
                <OrganizationMembers />
            </Suspense>
        </Layout>
    );
}
