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
    user_id?: string;
    name: string;
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
    vendor_name?: string;
    vendor_email?: string;
    subtotal?: number;
    tax?: number;
    discount?: number;
    notes?: string;
    status: 'completed' | 'refunded' | 'cancelled';
    created_at: string;
}

export interface Order {
    id: string;
    organization_id: string;
    order_number: string;
    client_name: string;
    client_email?: string;
    client_phone?: string;
    shipping_address?: string;
    notes?: string;
    items: Array<{
        product_id: string;
        product_name: string;
        sku?: string;
        quantity: number;
        unit_price: number;
        total?: number;
        availability_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order';
        specifications?: {
            size?: string;
            color?: string;
            other_details?: string;
        };
    }>;
    subtotal?: number;
    discount?: number;
    tax?: number;
    shipping?: number;
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
    user_id?: string;  // Linked user account (stores contact info: name, email, phone)
    store_name: string;  // Trading/Display name for the vendor's store
    location_id?: string;
    status: 'active' | 'inactive' | 'pending' | 'suspended';
    subscription_plan?: string;
    monthly_fee?: number;
    commission_rate?: number;
    join_date?: string;
    last_payment_date?: string;
    next_payment_due?: string;
    payment_status?: 'paid' | 'pending' | 'overdue' | 'grace_period';
    total_sales: number;
    total_orders: number;
    logo_url?: string;
    notes?: string;
    balance: number;
    created_at: string;
    // For compatibility and flattened access
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    country?: string;
}

export interface VendorPayment {
    id: string;
    organization_id: string;
    vendor_id: string;
    vendor_name?: string;
    amount: number;
    payment_type?: 'subscription' | 'commission' | 'other';
    payment_method?: 'bank_transfer' | 'cash' | 'card' | 'mobile_money' | 'other';
    reference_number?: string;
    status: 'pending' | 'completed' | 'cancelled' | 'confirmed' | 'failed';
    confirmed_by?: string;
    confirmed_date?: string;
    notes?: string;
    created_at: string;
}

export interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    push: boolean;
    low_stock_alerts: boolean;
    order_updates: boolean;
    weekly_reports: boolean;
}

export interface UserPreferences {
    language: string;
    timezone: string;
    notifications: NotificationPreferences;
    dark_mode: boolean;
    compact_view: boolean;
}

export interface User {
    id: string;
    organization_id?: string | null;
    email: string;
    username: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    phone?: string;
    role: 'admin' | 'manager' | 'vendor' | 'user';
    user_type: 'platform-staff' | 'business-staff';
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    created_at: string;
    // Extended profile fields
    department?: string;
    job_title?: string;
    bio?: string;
    avatar?: string;
    avatar_url?: string; // For compatibility
    preferences?: UserPreferences;
    timezone?: string; // Root level for easy access if needed
    permissions?: string[];
    warehouse_access?: string[];
}

export interface SubscriptionPlan {
    id: string;
    _id?: string;  // MongoDB ObjectId
    name: string;
    code: string;
    description?: string;
    price_monthly: number;
    price_yearly: number;
    currency: string;
    max_vendors: number;
    max_users: number;
    max_products: number;
    max_locations: number;
    features: string[];
    is_popular?: boolean;
    is_active: boolean;
    created_at: string;
}

export interface OrganizationPayment {
    id: string;
    organization_id: string;
    subscription_plan_id?: string;
    amount: number;
    currency: string;
    payment_method: 'bank_transfer' | 'card' | 'mobile_money' | 'paypal' | 'stripe' | 'other';
    payment_type: 'subscription' | 'addon' | 'upgrade' | 'renewal';
    billing_period?: 'monthly' | 'yearly';
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
    reference_number?: string;
    invoice_number?: string;
    payment_date?: string;
    next_billing_date?: string;
    notes?: string;
    created_at: string;
}

export interface Organization {
    id: string;
    name: string;
    code: string;
    description?: string;
    owner_id?: string; // The user who owns/manages this organization
    location_id?: string;
    phone?: string;
    email?: string;
    website?: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    subscription_plan?: string;
    subscription_plan_id?: string;
    billing_cycle?: 'monthly' | 'yearly';
    trial_ends_at?: string;
    max_vendors?: number;
    max_users?: number;
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
    filter: (params: Record<string, any>) => Promise<T[]>;
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
        'Location': 'locations/',
        'SubscriptionPlan': 'subscription-plans/',
        'OrganizationPayment': 'organization-payments/',
        'Order': 'orders/'
    };
    return endpoints[entityName] || `${entityName.toLowerCase()}s/`;
};

const cleanPayload = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    if (data instanceof Date) return data;

    const clean: any = Array.isArray(data) ? [] : {};
    for (const key in data) {
        const val = data[key];
        // Skip empty strings and undefined values
        if (val === '' || val === undefined) continue;

        if (val !== null && typeof val === 'object' && !(val instanceof File)) {
            clean[key] = cleanPayload(val);
        } else {
            clean[key] = val;
        }
    }
    return clean;
};

const createEntityMethods = <T extends { id: string }>(entityName: string): EntityMethods<T> => {
    const endpoint = getEntityEndpoint(entityName);

    const getUserInfo = () => {
        if (typeof window === 'undefined') return null;
        const userJson = localStorage.getItem('base44_currentUser');
        if (!userJson) return null;
        return JSON.parse(userJson);
    };

    return {
        list: async (params = {}) => {
            const user = getUserInfo();
            const orgId = user?.organization_id;
            const isPlatformStaff = user?.user_type === 'platform-staff';

            const combinedParams = {
                ...params,
                // auto-inject orgId ONLY if:
                // 1. User has an orgId
                // 2. User is NOT platform-staff
                // 3. It's not the Organization/Location entity
                // 4. organization_id wasn't already manually provided in params
                ...(orgId && !isPlatformStaff && !params.organization_id && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
            };
            const response = await apiClient.get<T[]>(endpoint, { params: combinedParams });
            return response.data;
        },
        get: async (id, params = {}) => {
            const user = getUserInfo();
            const orgId = user?.organization_id;
            const isPlatformStaff = user?.user_type === 'platform-staff';

            const combinedParams = {
                ...params,
                ...(orgId && !isPlatformStaff && !params.organization_id && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
            };
            const response = await apiClient.get<T>(`${endpoint}${id}`, { params: combinedParams });
            return response.data;
        },
        create: async (data) => {
            const user = getUserInfo();
            const orgId = user?.organization_id;
            const isPlatformStaff = user?.user_type === 'platform-staff';

            const payload = {
                ...cleanPayload(data),
                ...(orgId && !isPlatformStaff && !(data as any).organization_id && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
            };
            const response = await apiClient.post<T>(endpoint, payload);
            return response.data;
        },
        update: async (id, data) => {
            const user = getUserInfo();
            const orgId = user?.organization_id;
            const isPlatformStaff = user?.user_type === 'platform-staff';

            const response = await apiClient.put<T>(`${endpoint}${id}`, cleanPayload(data), {
                params: {
                    ...(orgId && !isPlatformStaff && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
                }
            });
            return response.data;
        },
        delete: async (id, params = {}) => {
            const user = getUserInfo();
            const orgId = user?.organization_id;
            const isPlatformStaff = user?.user_type === 'platform-staff';

            const combinedParams = {
                ...params,
                ...(orgId && !isPlatformStaff && !params.organization_id && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
            };
            await apiClient.delete(`${endpoint}${id}`, { params: combinedParams });
        },
        filter: async (params) => {
            const user = getUserInfo();
            const orgId = user?.organization_id;
            const isPlatformStaff = user?.user_type === 'platform-staff';

            const combinedParams = {
                ...params,
                ...(orgId && !isPlatformStaff && !params.organization_id && entityName !== 'Organization' && entityName !== 'Location' ? { organization_id: orgId } : {})
            };
            const response = await apiClient.get<T[]>(endpoint, { params: combinedParams });
            return response.data;
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
        } catch (error: any) {
            // Silence 401 errors as they just mean not logged in
            if (error?.response?.status !== 401) {
                console.error('Failed to fetch current user', error);
            }
            return null;
        }
    },

    logout: async () => {
        try {
            await apiClient.post('auth/logout');
        } catch (e) {
            console.error('Logout failed', e);
        }
        localStorage.removeItem('base44_currentUser');
        localStorage.removeItem('base44_access_token');
        localStorage.removeItem('base44_refresh_token');
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

        // Save tokens to localStorage
        const { access_token, refresh_token } = response.data;
        localStorage.setItem('base44_access_token', access_token);
        localStorage.setItem('base44_refresh_token', refresh_token);

        // Cookies are set by backend automatically
        // Fetch and return the user profile
        const user = await authMethods.me();
        return user as User;
    },

    updateMe: async (data: Partial<User>): Promise<User> => {
        const response = await apiClient.put<User>('auth/me', data);
        localStorage.setItem('base44_currentUser', JSON.stringify(response.data));
        return response.data;
    },

    getOrganizationId: (): string | null => {
        if (typeof window === 'undefined') return null;
        const userJson = localStorage.getItem('base44_currentUser');
        if (!userJson) return null;
        const user = JSON.parse(userJson);
        return user.organization_id;
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
        Order: createEntityMethods<Order>('Order'),
        Sale: createEntityMethods<Sale>('Sale'),
        StockMovement: createEntityMethods<StockMovement>('StockMovement'),
        Supplier: createEntityMethods<Supplier>('Supplier'),
        User: createEntityMethods<User>('User'),
        Vendor: {
            ...createEntityMethods<Vendor>('Vendor'),
            getByUserId: async (userId: string, params: Record<string, any> = {}): Promise<Vendor> => {
                const response = await apiClient.get<Vendor>(`vendors/by-user/${userId}`, { params });
                return response.data;
            }
        },
        VendorPayment: createEntityMethods<VendorPayment>('VendorPayment'),
        Warehouse: createEntityMethods<Warehouse>('Warehouse'),
        Location: createEntityMethods<Location>('Location'),
        SubscriptionPlan: createEntityMethods<SubscriptionPlan>('SubscriptionPlan'),
        OrganizationPayment: createEntityMethods<OrganizationPayment>('OrganizationPayment'),
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
