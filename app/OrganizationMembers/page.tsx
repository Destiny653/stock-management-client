'use client';

import Layout from '@/Layout';
import OrganizationMembers from '@/views/OrganizationMembers';

export default function OrganizationMembersPage() {
    return (
        <Layout currentPageName="Organizations">
            <OrganizationMembers />
        </Layout>
    );
}
