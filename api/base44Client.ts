// Base44 API Client - Local Storage Implementation
// This client provides CRUD operations using localStorage for data persistence

// Type definitions based on entity schemas
export interface Alert {
    id: string;
    type: 'low_stock' | 'out_of_stock' | 'expiring' | 'pending_approval' | 'po_received' | 'system';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    product_id?: string;
    po_id?: string;
    is_read: boolean;
    is_dismissed: boolean;
    action_url?: string;
    created_date: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    description?: string;
    unit_price: number;
    cost_price?: number;
    quantity: number;
    reorder_point?: number;
    reorder_quantity?: number;
    location?: string;
    supplier_id?: string;
    supplier_name?: string;
    status: 'active' | 'low_stock' | 'out_of_stock' | 'discontinued';
    image_url?: string;
    barcode?: string;
    weight?: number;
    dimensions?: string;
    expiry_date?: string;
    last_restocked?: string;
    created_date: string;
}

export interface Supplier {
    id: string;
    name: string;
    contact_name?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    payment_terms: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'COD';
    lead_time_days?: number;
    rating?: number;
    status: 'active' | 'inactive' | 'blocked';
    notes?: string;
    created_date: string;
}

export interface Warehouse {
    id: string;
    name: string;
    code?: string;
    address?: string;
    city?: string;
    manager?: string;
    location: string;
    capacity?: number;
    status: 'active' | 'inactive' | 'maintenance';
    created_date: string;
}

export interface PurchaseOrder {
    id: string;
    po_number: string;
    supplier_id: string;
    supplier_name: string;
    status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled' | 'pending_approval' | 'partially_received';
    items: Array<{ product_id: string; product_name: string; quantity: number; quantity_ordered?: number; quantity_received?: number; unit_price: number; sku?: string }>;
    total_amount: number;
    subtotal?: number;
    tax?: number;
    shipping?: number;
    total?: number;
    expected_date?: string;
    received_date?: string;
    warehouse?: string;
    approved_by?: string;
    notes?: string;
    created_date: string;
}

export interface Sale {
    id: string;
    sale_number: string;
    items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number; total?: number; sku?: string }>;
    total_amount?: number; // Deprecated in favor of total
    total?: number;
    subtotal?: number;
    tax?: number;
    discount?: number;
    payment_method: 'cash' | 'card' | 'mobile' | 'credit' | 'transfer' | 'other';
    customer_name?: string; // Deprecated in favor of client_name
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    vendor_name?: string;
    vendor_email?: string;
    notes?: string;
    created_by?: string;
    created_date: string;
}

export interface StockMovement {
    id: string;
    product_id: string;
    product_name: string;
    type: 'in' | 'out' | 'adjustment' | 'transfer';
    quantity: number;
    reason?: string;
    reference_id?: string;
    warehouse_id?: string;
    created_by?: string;
    performed_by?: string;
    created_date: string;
}

export interface Vendor {
    id: string;
    name: string;
    contact_name?: string;
    owner_name?: string;
    email: string;
    phone?: string;
    address?: string;
    balance: number;
    status: 'active' | 'inactive' | 'pending' | 'suspended';
    store_name?: string;
    store_address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    subscription_plan?: string;
    monthly_fee?: number;
    commission_rate?: number;
    notes?: string;
    organization_id?: string | null;
    payment_status?: string;
    total_sales?: number;
    total_orders?: number;
    join_date?: string;
    created_date: string;
}

export interface VendorPayment {
    id: string;
    vendor_id: string;
    vendor_name?: string;
    amount: number;
    payment_type?: 'subscription' | 'commission' | 'other';
    payment_method?: 'cash' | 'bank_transfer' | 'check' | 'card' | 'mobile_money';
    reference?: string;
    reference_number?: string;
    notes?: string;
    status: 'pending' | 'completed' | 'cancelled' | 'confirmed' | 'failed';
    period_start?: string;
    period_end?: string;
    confirmed_by?: string;
    confirmed_date?: string;
    created_date: string;
}

export interface User {
    id: string;
    name: string;
    full_name?: string;
    email: string;
    role: 'admin' | 'manager' | 'staff' | 'owner' | 'viewer';
    user_type?: 'admin' | 'manager' | 'vendor' | 'staff';
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    phone?: string;
    department?: string;
    job_title?: string;
    bio?: string;
    timezone?: string;
    avatar_url?: string;
    email_notifications?: boolean;
    push_notifications?: boolean;
    low_stock_alerts?: boolean;
    order_updates?: boolean;
    weekly_reports?: boolean;
    dark_mode?: boolean;
    compact_view?: boolean;
    created_date: string;
}

export interface Organization {
    id: string;
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    email?: string;
    currency: string;
    created_date: string;
}

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Local storage helper
const getStorageKey = (entityName: string) => `base44_${entityName.toLowerCase()}`;

const getFromStorage = <T>(entityName: string): T[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(getStorageKey(entityName));
    return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(entityName: string, data: T[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getStorageKey(entityName), JSON.stringify(data));
};

// Initialize with sample data if empty
const initializeSampleData = () => {
    if (typeof window === 'undefined') return;

    // Sample Alerts
    if (getFromStorage<Alert>('Alert').length === 0) {
        const alerts: Alert[] = [
            {
                id: generateId(),
                type: 'low_stock',
                priority: 'high',
                title: 'Low Stock Alert',
                message: 'Wireless Mouse is running low on stock (5 units remaining)',
                is_read: false,
                is_dismissed: false,
                action_url: '/inventory',
                created_date: new Date().toISOString(),
            },
            {
                id: generateId(),
                type: 'expiring',
                priority: 'medium',
                title: 'Product Expiring Soon',
                message: 'Organic Coffee Beans will expire in 7 days',
                is_read: false,
                is_dismissed: false,
                created_date: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                id: generateId(),
                type: 'pending_approval',
                priority: 'medium',
                title: 'Purchase Order Pending',
                message: 'PO-2024-001 from Tech Supplies Inc. requires approval',
                is_read: true,
                is_dismissed: false,
                action_url: '/purchase-orders',
                created_date: new Date(Date.now() - 172800000).toISOString(),
            },
        ];
        saveToStorage('Alert', alerts);
    }

    // Sample Products
    if (getFromStorage<Product>('Product').length === 0) {
        const products: Product[] = [
            {
                id: generateId(),
                name: 'Wireless Mouse',
                sku: 'ELEC-001',
                category: 'Electronics',
                description: 'Ergonomic wireless mouse with USB receiver',
                unit_price: 29.99,
                cost_price: 15.00,
                quantity: 5,
                reorder_point: 10,
                status: 'low_stock',
                created_date: new Date().toISOString(),
            },
            {
                id: generateId(),
                name: 'USB-C Hub',
                sku: 'ELEC-002',
                category: 'Electronics',
                description: '7-in-1 USB-C Hub with HDMI and card reader',
                unit_price: 49.99,
                cost_price: 25.00,
                quantity: 45,
                reorder_point: 15,
                status: 'active',
                created_date: new Date().toISOString(),
            },
            {
                id: generateId(),
                name: 'Organic Coffee Beans',
                sku: 'FOOD-001',
                category: 'Food & Beverage',
                description: 'Premium organic arabica coffee beans - 1kg',
                unit_price: 24.99,
                cost_price: 12.00,
                quantity: 30,
                reorder_point: 20,
                status: 'active',
                expiry_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                created_date: new Date().toISOString(),
            },
        ];
        saveToStorage('Product', products);
    }

    // Sample Suppliers
    if (getFromStorage<Supplier>('Supplier').length === 0) {
        const suppliers: Supplier[] = [
            {
                id: generateId(),
                name: 'Tech Supplies Inc.',
                contact_name: 'John Smith',
                email: 'john@techsupplies.com',
                phone: '+1-555-0100',
                address: '123 Tech Street',
                city: 'San Francisco',
                country: 'USA',
                payment_terms: 'Net 30',
                lead_time_days: 7,
                rating: 4.5,
                status: 'active',
                created_date: new Date().toISOString(),
            },
            {
                id: generateId(),
                name: 'Global Foods Ltd',
                contact_name: 'Maria Garcia',
                email: 'maria@globalfoods.com',
                phone: '+1-555-0200',
                address: '456 Food Avenue',
                city: 'Chicago',
                country: 'USA',
                payment_terms: 'Net 15',
                lead_time_days: 3,
                rating: 4.8,
                status: 'active',
                created_date: new Date().toISOString(),
            },
        ];
        saveToStorage('Supplier', suppliers);
    }

    // Sample Warehouses
    if (getFromStorage<Warehouse>('Warehouse').length === 0) {
        const warehouses: Warehouse[] = [
            { id: generateId(), name: 'Main Warehouse', location: 'Building A', capacity: 1000, status: 'active', created_date: new Date().toISOString() },
            { id: generateId(), name: 'Secondary Storage', location: 'Building B', capacity: 500, status: 'active', created_date: new Date().toISOString() },
        ];
        saveToStorage('Warehouse', warehouses);
    }
};

// Entity methods factory
interface EntityMethods<T> {
    list: (orderBy?: string, limit?: number) => Promise<T[]>;
    filter: (filters: Record<string, any>) => Promise<T[]>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: string | number, data: Partial<T>) => Promise<T>;
    delete: (id: string | number) => Promise<void>;
}

const createEntityMethods = <T extends { id: string; created_date?: string }>(entityName: string): EntityMethods<T> => ({
    list: async (orderBy?: string, limit?: number) => {
        initializeSampleData();
        let data = getFromStorage<T>(entityName);

        // Sort if orderBy is provided
        if (orderBy) {
            const desc = orderBy.startsWith('-');
            const field = desc ? orderBy.slice(1) : orderBy;
            data = data.sort((a: any, b: any) => {
                if (desc) return a[field] > b[field] ? -1 : 1;
                return a[field] > b[field] ? 1 : -1;
            });
        }

        // Limit results
        if (limit && limit > 0) {
            data = data.slice(0, limit);
        }

        return data;
    },

    filter: async (filters: Record<string, any>) => {
        initializeSampleData();
        const data = getFromStorage<T>(entityName);
        return data.filter((item: any) => {
            return Object.entries(filters).every(([key, value]) => item[key] === value);
        });
    },

    create: async (data: Partial<T>) => {
        initializeSampleData();
        const items = getFromStorage<T>(entityName);
        const newItem = {
            ...data,
            id: generateId(),
            created_date: new Date().toISOString(),
        } as T;
        items.push(newItem);
        saveToStorage(entityName, items);
        return newItem;
    },

    update: async (id: string | number, data: Partial<T>) => {
        initializeSampleData();
        const items = getFromStorage<T>(entityName);
        const index = items.findIndex((item: any) => item.id === id);
        if (index === -1) throw new Error(`${entityName} not found`);
        items[index] = { ...items[index], ...data };
        saveToStorage(entityName, items);
        return items[index];
    },

    delete: async (id: string | number) => {
        initializeSampleData();
        const items = getFromStorage<T>(entityName);
        const filtered = items.filter((item: any) => item.id !== id);
        saveToStorage(entityName, filtered);
    },
});

// Auth methods
const authMethods = {
    me: async (): Promise<User | null> => {
        if (typeof window === 'undefined') return null;
        const userJson = localStorage.getItem('base44_currentUser');
        if (userJson) return JSON.parse(userJson);

        // Return a default demo user
        const demoUser: User = {
            id: 'demo-user',
            name: 'Demo User',
            email: 'demo@inventory.app',
            role: 'admin',
            status: 'active',
            created_date: new Date().toISOString(),
        };
        localStorage.setItem('base44_currentUser', JSON.stringify(demoUser));
        return demoUser;
    },

    logout: async () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('base44_currentUser');
        window.location.href = '/login';
    },

    login: async (email: string, password: string) => {
        // Demo login - accepts any credentials
        const user: User = {
            id: generateId(),
            name: email.split('@')[0],
            email,
            role: 'admin',
            status: 'active',
            created_date: new Date().toISOString(),
        };
        localStorage.setItem('base44_currentUser', JSON.stringify(user));
        return user;
    },

    updateMe: async (data: Partial<User>): Promise<User> => {
        if (typeof window === 'undefined') throw new Error('Cannot update user on server');
        const userJson = localStorage.getItem('base44_currentUser');
        if (!userJson) throw new Error('Not logged in');

        const currentUser = JSON.parse(userJson);
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('base44_currentUser', JSON.stringify(updatedUser));

        // Also update in the main User list if it exists there
        const allUsers = getFromStorage<User>('User');
        const index = allUsers.findIndex(u => u.id === currentUser.id);
        if (index !== -1) {
            allUsers[index] = { ...allUsers[index], ...data };
            saveToStorage('User', allUsers);
        }

        return updatedUser;
    },
};

// Main base44 client object
export const base44 = {
    entities: {
        Alert: createEntityMethods<Alert>('Alert'),
        Organization: createEntityMethods<Organization>('Organization'),
        Product: createEntityMethods<Product>('Product'),
        PurchaseOrder: createEntityMethods<PurchaseOrder>('PurchaseOrder'),
        Sale: createEntityMethods<Sale>('Sale'),
        StockMovement: createEntityMethods<StockMovement>('StockMovement'),
        Supplier: createEntityMethods<Supplier>('Supplier'),
        User: createEntityMethods<User>('User'),
        Vendor: createEntityMethods<Vendor>('Vendor'),
        VendorPayment: createEntityMethods<VendorPayment>('VendorPayment'),
        Warehouse: createEntityMethods<Warehouse>('Warehouse'),
    },
    auth: authMethods,
    integrations: {
        Core: {
            UploadFile: async ({ file }: { file: File }): Promise<{ file_url: string }> => {
                // Mock upload - in a real app this would upload to a server
                // For local demo, we'll create a local object URL
                const file_url = URL.createObjectURL(file);
                return { file_url };
            }
        }
    }
};

export default base44;
