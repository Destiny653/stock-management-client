import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, SlidersHorizontal, Columns } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const categories = [
    "Electronics", "Clothing", "Food & Beverage", "Home & Garden",
    "Sports", "Beauty", "Office Supplies", "Other"
];

const statuses = [
    { value: "active", label: "In Stock" },
    { value: "low_stock", label: "Low Stock" },
    { value: "out_of_stock", label: "Out of Stock" },
    { value: "discontinued", label: "Discontinued" }
];

const defaultColumns = [
    { id: "image", label: "Image", default: true },
    { id: "name", label: "Product Name", default: true },
    { id: "sku", label: "SKU", default: true },
    { id: "category", label: "Category", default: true },
    { id: "quantity", label: "Quantity", default: true },
    { id: "price", label: "Price", default: true },
    { id: "status", label: "Status", default: true },
    { id: "location", label: "Location", default: true },
    { id: "supplier", label: "Supplier", default: false },
    { id: "reorder_point", label: "Reorder Point", default: false },
];

interface InventoryFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    filters: {
        category?: string;
        status?: string;
        supplier?: string;
        location?: string;
    };
    onFilterChange: (filters: any) => void;
    visibleColumns: string[];
    onColumnsChange: (columns: string[]) => void;
    suppliers?: any[];
    locations?: any[];
}

export default function InventoryFilters({
    searchTerm,
    onSearchChange,
    filters,
    onFilterChange,
    visibleColumns,
    onColumnsChange,
    suppliers = [],
    locations = []
}: InventoryFiltersProps) {
    const activeFilterCount = Object.values(filters).filter((v: any) => v && v !== "all").length;

    const clearFilters = () => {
        onFilterChange({
            category: "all",
            status: "all",
            supplier: "all",
            location: "all"
        });
    };

    return (
        <div>
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search products by name, SKU, or barcode..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 rounded-sm py-5 max-w-[60%] bg-white border-slate-200 focus:bg-white"
                    />
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-2">
                    <Select
                        value={filters.category || "all"}
                        onValueChange={(value) => onFilterChange({ ...filters, category: value })}
                    >
                        <SelectTrigger className="w-40 bg-white rounded-sm py-5">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat: string) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.status || "all"}
                        onValueChange={(value) => onFilterChange({ ...filters, status: value })}
                    >
                        <SelectTrigger className="w-36 bg-white rounded-sm py-5">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {statuses.map((s: any) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {suppliers.length > 0 && (
                        <Select
                            value={filters.supplier || "all"}
                            onValueChange={(value) => onFilterChange({ ...filters, supplier: value })}
                        >
                            <SelectTrigger className="w-40 bg-white rounded-sm py-5">
                                <SelectValue placeholder="Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Suppliers</SelectItem>
                                {suppliers.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {locations.length > 0 && (
                        <Select
                            value={filters.location || "all"}
                            onValueChange={(value) => onFilterChange({ ...filters, location: value })}
                        >
                            <SelectTrigger className="w-40 bg-white rounded-sm py-5">
                                <SelectValue placeholder="Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {locations.map((l: any) => (
                                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Column Chooser */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="bg-white rounded-sm py-5">
                                <Columns className="h-4 w-4 mr-2" />
                                Columns
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="end">
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium text-slate-900 mb-3">Show Columns</p>
                                {defaultColumns.map((col: any) => (
                                    <label key={col.id} className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={visibleColumns.includes(col.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    onColumnsChange([...visibleColumns, col.id]);
                                                } else {
                                                    onColumnsChange(visibleColumns.filter((c: string) => c !== col.id));
                                                }
                                            }}
                                        />
                                        <span className="text-sm text-slate-600">{col.label}</span>
                                    </label>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Clear Filters */}
                    {activeFilterCount > 0 && (
                        <Button variant="ghost" onClick={clearFilters} className="text-slate-600">
                            <X className="h-4 w-4 mr-1" />
                            Clear ({activeFilterCount})
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}