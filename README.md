# Inventory Management System

A comprehensive inventory management system built with Next.js, React, and TypeScript.

## Project Structure

```
├── Layout.tsx                         # Root layout with navigation and language support
│
├── entities/                          # JSON schemas for data entities
│   ├── Alert.json                     # Alert/notification entity schema
│   ├── Organization.json              # Organization entity schema
│   ├── Product.json                   # Product entity schema
│   ├── PurchaseOrder.json             # Purchase order entity schema
│   ├── Sale.json                      # Sales transaction entity schema
│   ├── StockMovement.json             # Stock movement tracking schema
│   ├── Supplier.json                  # Supplier entity schema
│   ├── User.json                      # User entity schema
│   ├── Vendor.json                    # Vendor entity schema (organization-scoped)
│   ├── VendorPayment.json             # Vendor payment entity schema
│   └── Warehouse.json                 # Warehouse/location entity schema
│
├── pages/                             # Application pages
│   ├── Alerts.tsx                     # Alerts management page
│   ├── CreatePurchaseOrder.tsx        # Create new purchase order
│   ├── Dashboard.tsx                  # Main dashboard with KPIs
│   ├── DirectSales.tsx                # Direct sales management
│   ├── Inventory.tsx                  # Inventory listing and management
│   ├── OrganizationMembers.tsx        # Organization team members
│   ├── Organizations.tsx              # Organizations management
│   ├── ProductDetail.tsx              # Product detail view
│   ├── Profile.tsx                    # User profile page
│   ├── PurchaseOrderDetail.tsx        # Purchase order details
│   ├── PurchaseOrders.tsx             # Purchase orders listing
│   ├── Reports.tsx                    # Reports and analytics
│   ├── Settings.tsx                   # Application settings
│   ├── StoreLocations.tsx             # Warehouse/store locations
│   ├── Suppliers.tsx                  # Suppliers management
│   ├── VendorDashboard.tsx            # Vendor-specific dashboard
│   ├── VendorDetail.tsx               # Vendor details
│   ├── VendorManagement.tsx           # Vendor management
│   └── VendorPayments.tsx             # Vendor payments
│
└── components/                        # Reusable components
    ├── dashboard/                     # Dashboard components
    │   ├── ActivityTimeline.tsx       # Recent activity timeline
    │   ├── CategoryDistribution.tsx   # Category distribution chart
    │   ├── InventoryChart.tsx         # Inventory trends chart
    │   ├── KPICard.tsx                # KPI card component
    │   ├── LowStockAlert.tsx          # Low stock alerts widget
    │   └── QuickActions.tsx           # Quick action buttons
    │
    ├── hooks/                         # Custom React hooks
    │   └── useEntities.ts             # Entity management hook
    │
    ├── i18n/                          # Internationalization
    │   └── LanguageContext.tsx        # Language context and provider
    │
    ├── inventory/                     # Inventory components
    │   ├── BulkActions.tsx            # Bulk action toolbar
    │   ├── InventoryFilters.tsx       # Inventory filtering component
    │   └── InventoryTable.tsx         # Inventory table display
    │
    ├── po/                            # Purchase Order components
    │   ├── POItemsTable.tsx           # PO items table
    │   └── POStatusBadge.tsx          # PO status badge
    │
    ├── ui/                            # UI components
    │   ├── AlertBanner.tsx            # Alert banner component
    │   ├── EmptyState.tsx             # Empty state placeholder
    │   └── LanguageSelector.tsx       # Language selector dropdown
    │
    └── vendors/                       # Vendor components
        └── VendorLocationPicker.tsx   # Vendor location picker
```

## Features

### Core Features
- **Dashboard**: Real-time KPIs, charts, and analytics
- **Inventory Management**: Product tracking, stock levels, and alerts
- **Purchase Orders**: Create and manage purchase orders
- **Sales**: Direct sales and transaction management
- **Vendors**: Multi-location vendor management
- **Suppliers**: Supplier information and relationships
- **Warehouses**: Multiple location support
- **Alerts**: Low stock and expiration alerts
- **Reports**: Comprehensive reporting system
- **Organizations**: Multi-tenant organization management
- **Users**: Role-based access control and team management

### Technical Features
- **TypeScript**: Full type safety across the entire codebase
- **Multi-tenant Architecture**: Organization-scoped data isolation
- **Role-based Access Control**: Granular permissions (admin, manager, vendor, user)
- **Subscription Management**: Multiple plan tiers with usage limits
- **Multi-language Support**: English and French (extensible)
- **Custom Hooks**: Reusable entity management
- **Responsive Design**: Works on all device sizes
- **Component-based Architecture**: Modular and maintainable
- **JSON Schema Validation**: Entity data validation

## Entity Schemas

All entities follow JSON Schema Draft-07 standard and include:

1. **Alert**: Inventory alerts (low stock, expiring products, etc.)
2. **Organization**: Multi-tenant organization management with subscription plans
3. **Product**: Product information and pricing
4. **PurchaseOrder**: Purchase order management
5. **Sale**: Sales transactions
6. **StockMovement**: Inventory movement tracking
7. **Supplier**: Supplier management
8. **User**: User accounts with roles and permissions
9. **Vendor**: Vendor with multi-location support (organization-scoped)
10. **VendorPayment**: Vendor payment tracking
11. **Warehouse**: Warehouse/location management

## Components

### Dashboard Components
- **KPICard**: Display key performance indicators
- **InventoryChart**: Visualize inventory trends
- **CategoryDistribution**: Show category breakdown
- **LowStockAlert**: Display low stock warnings
- **ActivityTimeline**: Recent system activities
- **QuickActions**: Quick access buttons

### UI Components
- **AlertBanner**: Display notifications
- **EmptyState**: Empty data placeholder
- **LanguageSelector**: Switch between languages

### Feature Components
- **InventoryTable**: Product listing table
- **InventoryFilters**: Filter inventory data
- **BulkActions**: Perform bulk operations
- **POItemsTable**: Purchase order items
- **POStatusBadge**: PO status indicator
- **VendorLocationPicker**: Select vendor locations

## Custom Hooks

### useEntities
Manages CRUD operations for any entity type:
```javascript
const {
  entities,
  loading,
  error,
  fetchEntities,
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity
} = useEntities('products', '/api/products');
```

## Internationalization

The application supports multiple languages through the `LanguageContext`:
- English (en)
- French (fr)

Add new languages by extending the translations object in `LanguageContext.jsx`.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Next Steps

1. Set up API endpoints to match entity schemas
2. Connect components to real data sources
3. Implement authentication and authorization
4. Add more language translations
5. Customize styling and branding
6. Add data validation and error handling
7. Implement real-time updates
8. Add export/import functionality

## License

MIT
