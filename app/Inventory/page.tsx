'use client';

import Layout from '@/Layout';
import Inventory from '@/views/Inventory';

export default function InventoryPage() {
    return (
        <Layout currentPageName="Inventory">
            <Inventory />
        </Layout>
    );
}
