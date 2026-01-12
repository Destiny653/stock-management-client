// Base44 API Client - Local Storage Implementation
// This client provides CRUD operations using localStorage for data persistence

// Type definitions based on entity schemas
export interface Location {
    id: string;
    name: string;
    address: string;
    city: string;
    state?: string;
    postal_code?: string;
    country: string;
    latitude?: number;
    longitude?: number;
    created_at?: string;
    updated_at?: string;
}

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
    organization_id: string;
    created_at: string;
    // For frontend compatibility
    created_date?: string;
}

export interface ProductVariant {
    sku: string;
    attributes: Record<string, string>;
    unit_price: number;
    cost_price: number;
    stock: number;
    barcode?: string;
    weight?: number;
    dimensions?: string;
}

export interface Product {
    id: string;
    name: string;
    category: string;
    description?: string;
    reorder_point?: number;
    reorder_quantity?: number;
    location_id?: string;
    supplier_id?: string;
    supplier_name?: string;
    status: 'active' | 'low_stock' | 'out_of_stock' | 'discontinued';
    image_url?: string;
    expiry_date?: string;
    last_restocked?: string;
    variants: ProductVariant[];
    organization_id: string;
    created_at: string;
    updated_at: string;
    // For compatibility with old code
    location?: string;
    created_date?: string;
}

export interface Supplier {
    id: string;
    organization_id: string;
    name: string;
    contact_name?: string;
    email: string;
    phone?: string;
    location_id?: string;
    payment_terms: 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | 'COD';
    lead_time_days?: number;
    rating?: number;
    status: 'active' | 'inactive' | 'blocked';
    notes?: string;
    created_at: string;
    // For compatibility
    address?: string;
}

export interface Warehouse {
    id: string;
    organization_id: string;
    name: string;
    code?: string;
    location_id?: string;
    manager?: string;
    capacity?: number;
    status: 'active' | 'inactive' | 'maintenance';
    created_at: string;
    // For compatibility
    address?: string;
    city?: string;
    location?: string;
}

export interface PurchaseOrder {
    id: string;
    organization_id: string;
    po_number: string;
    supplier_id: string;
    supplier_name: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'received' | 'cancelled' | 'partially_received';
    items: Array<{
        product_id: string;
        product_name: string;
        sku?: string;
        quantity_ordered: number;
        quantity_received: number;
        unit_cost: number;
        total: number;
    }>;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    expected_date?: string;
    received_date?: string;
    warehouse?: string;
    approved_by?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    // For frontend compatibility
    created_date: string;
}

export interface Sale {
    id: string;
    organization_id: string;
    sale_number: string;
    items: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number; total?: number; sku?: string }>;
    total_amount?: number;
    total?: number;
    payment_method: 'cash' | 'card' | 'mobile' | 'credit' | 'transfer' | 'other';
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    vendor_id?: string;
    vendor_email?: string;
    notes?: string;
    status: 'completed' | 'refunded' | 'cancelled';
    created_at: string;
}

export interface Order {
    id: string;
    organization_id: string;
    order_number: string;
    client_name: string;
    items: Array<{
        product_id: string;
        product_name: string;
        sku?: string;
        quantity: number;
        unit_price: number;
        total?: number;
    }>;
    total: number;
    status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
    created_at: string;
}

export interface StockMovement {
    id: string;
    organization_id: string;
    product_id: string;
    product_name: string;
    type: 'in' | 'out' | 'adjustment' | 'transfer';
    quantity: number;
    reason?: string;
    reference_id?: string;
    warehouse_id?: string;
    performed_by?: string;
    sku?: string;
    created_at: string;
}

export interface Vendor {
    id: string;
    organization_id: string;
    name: string;
    email: string;
    phone?: string;
    store_name: string;
    owner_name?: string;
    location_id?: string;
    status: 'active' | 'inactive' | 'pending' | 'suspended';
    subscription_plan?: string;
    monthly_fee?: number;
    commission_rate?: number;
    payment_status?: 'paid' | 'pending' | 'overdue' | 'grace_period';
    notes?: string;
    balance: number;
    total_sales: number;
    total_orders?: number;
    created_at: string;
    // For compatibility
    address?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}

export interface VendorPayment {
    id: string;
    organization_id: string;
    vendor_id: string;
    amount: number;
    status: 'pending' | 'completed' | 'cancelled' | 'confirmed' | 'failed';
    created_at: string;
}

export interface User {
    id: string;
    organization_id?: string | null;
    email: string;
    username: string;
    full_name?: string;
    role: 'owner' | 'admin' | 'manager' | 'staff' | 'viewer';
    user_type: 'admin' | 'vendor' | 'manager' | 'staff';
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    created_at: string;
}

export interface Organization {
    id: string;
    name: string;
    code: string;
    description?: string;
    location_id?: string;
    status: 'active' | 'inactive' | 'suspended';
    subscription_plan?: string;
    created_at: string;
}

import { apiClient } from '@/lib/api-client';

// Entity methods factory
interface EntityMethods<T> {
    list: (params?: Record<string, any>) => Promise<T[]>;
    get: (id: string, params?: Record<string, any>) => Promise<T>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: string, data: Partial<T>) => Promise<T>;
    delete: (id: string, params?: Record<string, any>) => Promise<void>;
    search?: (q: string, params?: Record<string, any>) => Promise<T[]>;
}

const getEntityEndpoint = (entityName: string): string => {
    const endpoints: Record<string, string> = {
        'Alert': 'alerts/',
        'Organization': 'organizations/',
        'Product': 'products/',
        'PurchaseOrder': 'purchase-orders/',
        'Sale': 'sales/',
        'StockMovement': 'stock-movements/',
        'Supplier': 'suppliers/',
        'User': 'users/',
        'Vendor': 'vendors/',
        'VendorPayment': 'vendor-payments/',
        'Warehouse': 'warehouses/',
        'Location': 'locations/'
    };
    return endpoints[entityName] || `${entityName.toLowerCase()}s/`;
};

const createEntityMethods = <T extends { id: string }>(entityName: string): EntityMethods<T> => {
    const endpoint = getEntityEndpoint(entityName);

    const getOrgId = () => {
        if (typeof window === 'undefined') return null;
        const userJson = localStorage.getItem('base44_currentUser');
        if (!userJson) return null;
        const user = JSON.parse(userJson);
        return user.organization_id;
    };

    return {
        list: async (params = {}) => {
            const orgId = getOrgId();
            const combinedParams = {
                ...params,
                ...(orgId && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
            };
            const response = await apiClient.get<T[]>(endpoint, { params: combinedParams });
            return response.data;
        },
        get: async (id, params = {}) => {
            const orgId = getOrgId();
            const combinedParams = {
                ...params,
                ...(orgId && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
            };
            const response = await apiClient.get<T>(`${endpoint}${id}`, { params: combinedParams });
            return response.data;
        },
        create: async (data) => {
            const orgId = getOrgId();
            const payload = {
                ...data,
                ...(orgId && !(data as any).organization_id && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
            };
            const response = await apiClient.post<T>(endpoint, payload);
            return response.data;
        },
        update: async (id, data) => {
            const orgId = getOrgId();
            const response = await apiClient.put<T>(`${endpoint}${id}`, data, {
                params: {
                    ...(orgId && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
                }
            });
            return response.data;
        },
        delete: async (id, params = {}) => {
            const orgId = getOrgId();
            const combinedParams = {
                ...params,
                ...(orgId && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
            };
            await apiClient.delete(`${endpoint}${id}`, { params: combinedParams });
        }
    };
};

// Auth methods
const authMethods = {
    me: async (): Promise<User | null> => {
        try {
            const response = await apiClient.get<User>('auth/me');
            localStorage.setItem('base44_currentUser', JSON.stringify(response.data));
            return response.data;
        } catch (error) {
            console.error('Failed to fetch current user', error);
            return null;
        }
    },

    logout: async () => {
        localStorage.removeItem('base44_access_token');
        localStorage.removeItem('base44_currentUser');
        window.location.href = '/login';
    },

    login: async (username: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('grant_type', 'password');

        const response = await apiClient.post('auth/login/access-token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token } = response.data;
        localStorage.setItem('base44_access_token', access_token);

        // Fetch and return the user profile
        const user = await authMethods.me();
        return user as User;
    },

    updateMe: async (data: Partial<User>): Promise<User> => {
        const response = await apiClient.put<User>('auth/me', data);
        localStorage.setItem('base44_currentUser', JSON.stringify(response.data));
        return response.data;
    },
};

// Main base44 client object
export const base44 = {
    entities: {
        Alert: {
            ...createEntityMethods<Alert>('Alert'),
            markAllRead: async (organizationId: string) => {
                const response = await apiClient.post('alerts/mark-all-read', null, {
                    params: { organization_id: organizationId }
                });
                return response.data;
            },
            getUnreadCount: async (organizationId: string) => {
                const response = await apiClient.get<{ unread_count: number }>('alerts/unread/count', {
                    params: { organization_id: organizationId }
                });
                return response.data;
            }
        },
        Organization: createEntityMethods<Organization>('Organization'),
        Product: createEntityMethods<Product>('Product'),
        PurchaseOrder: {
            ...createEntityMethods<PurchaseOrder>('PurchaseOrder'),
            approve: async (id: string, organizationId: string) => {
                const response = await apiClient.post<PurchaseOrder>(`purchase-orders/${id}/approve`, null, {
                    params: { organization_id: organizationId }
                });
                return response.data;
            },
            receive: async (id: string, organizationId: string) => {
                const response = await apiClient.post<PurchaseOrder>(`purchase-orders/${id}/receive`, null, {
                    params: { organization_id: organizationId }
                });
                return response.data;
            }
        },
        Sale: createEntityMethods<Sale>('Sale'),
        StockMovement: createEntityMethods<StockMovement>('StockMovement'),
        Supplier: createEntityMethods<Supplier>('Supplier'),
        User: createEntityMethods<User>('User'),
        Vendor: createEntityMethods<Vendor>('Vendor'),
        VendorPayment: createEntityMethods<VendorPayment>('VendorPayment'),
        Warehouse: createEntityMethods<Warehouse>('Warehouse'),
        Location: createEntityMethods<Location>('Location'),
    },
    auth: authMethods,
    search: {
        general: async (q: string, organizationId?: string) => {
            const response = await apiClient.get('search/', {
                params: { q, organization_id: organizationId }
            });
            return response.data;
        }
    },
    integrations: {
        Core: {
            UploadFile: async ({ file }: { file: File }): Promise<{ file_url: string }> => {
                const formData = new FormData();
                formData.append('file', file);
                const response = await apiClient.post('products/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return { file_url: response.data.url };
            }
        }
    }
};

export default base44;
