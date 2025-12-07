'use client';

import Layout from '@/Layout';
import Orders from '@/views/Orders';

export default function OrdersPage() {
    return (
        <Layout currentPageName="Orders">
            <Orders />
        </Layout>
    );
}
