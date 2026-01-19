import React, { useState } from 'react';
import Link from "next/link";
import dynamic from 'next/dynamic';
import { createPageUrl } from "@/utils";
import { base44, type Vendor } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Store,
  Search,
  Phone,
  Mail,
  Eye,
  Loader2,
  List,
  Map
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";

// Dynamically import the map component with SSR disabled
const StoreMapDynamic = dynamic(
  () => import('@/components/vendors/StoreMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading map...</p>
        </div>
      </div>
    ),
  }
);

function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return {
      t: (key: string, _params?: Record<string, string | number>) => key,
      language: 'en' as const,
      setLanguage: () => { }
    };
  }
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  suspended: "bg-rose-100 text-rose-700"
};

export default function StoreLocations() {
  const { t } = useSafeLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("map");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => base44.entities.Vendor.list(),
  });

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => base44.entities.Location.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const isLoading = loadingVendors || loadingLocations;

  const locationMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    locations.forEach((loc: any) => {
      map[loc.id] = loc;
    });
    return map;
  }, [locations]);

  const userMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    users.forEach((u: any) => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // Filter vendors with location data
  const vendorsWithLocation = React.useMemo(() => {
    return (vendors as Vendor[]).map(v => {
      const loc = v.location_id ? locationMap[v.location_id] : null;
      return {
        ...v,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        address: loc?.address,
        city: loc?.city,
        country: loc?.country
      };
    }).filter((v): v is Vendor & { latitude: number; longitude: number } =>
      typeof v.latitude === 'number' && typeof v.longitude === 'number'
    );
  }, [vendors, locationMap]);

  const filteredVendors = React.useMemo(() => {
    return (vendors as Vendor[]).map(v => {
      const loc = v.location_id ? locationMap[v.location_id] : null;
      return {
        ...v,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        address: loc?.address,
        city: loc?.city,
        country: loc?.country
      };
    }).filter(v => {
      const matchesSearch = !searchTerm ||
        v.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.city?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vendors, searchTerm, statusFilter, locationMap]);

  // Calculate map center
  const mapCenter: [number, number] = vendorsWithLocation.length > 0
    ? [
      vendorsWithLocation.reduce((sum, v) => sum + v.latitude, 0) / vendorsWithLocation.length,
      vendorsWithLocation.reduce((sum, v) => sum + v.longitude, 0) / vendorsWithLocation.length
    ]
    : [0, 0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={createPageUrl("VendorManagement")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('storeLocations')}</h1>
            <p className="text-slate-500 mt-1">{vendorsWithLocation.length} {t('storesOnMap')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            className={viewMode === 'map' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            <Map className="h-4 w-4 mr-2" />
            {t('mapView')}
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            <List className="h-4 w-4 mr-2" />
            {t('listView')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-slate-50">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatus')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="inactive">{t('inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="h-[600px]">
                {vendorsWithLocation.length > 0 ? (
                  <StoreMapDynamic
                    vendors={vendorsWithLocation.filter(v => {
                      const matchesSearch = !searchTerm ||
                        v.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.city?.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })}
                    center={mapCenter}
                    onVendorSelect={setSelectedVendor}
                    t={t as (key: string, params?: Record<string, string | number>) => string}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-slate-50">
                    <MapPin className="h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-600">{t('noLocationData')}</p>
                    <p className="text-sm text-slate-500">{t('addLocationHint')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Store List Sidebar */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredVendors.map(vendor => (
              <Card
                key={vendor.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedVendor?.id === vendor.id && "ring-2 ring-teal-500"
                )}
                onClick={() => setSelectedVendor(vendor)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                        {vendor.store_name?.charAt(0) || 'V'}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{vendor.store_name}</h3>
                        <p className="text-sm text-slate-500">{vendor.city}, {vendor.country}</p>
                      </div>
                    </div>
                    <Badge className={statusColors[vendor.status]}>{vendor.status}</Badge>
                  </div>
                  {vendor.address && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                      {vendor.address}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Link href={createPageUrl(`VendorDetail?id=${vendor.id}`)} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        {t('viewDetails')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredVendors.length === 0 && (
              <div className="text-center py-8">
                <Store className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">{t('noResults')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // List View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map(vendor => (
            <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                      {vendor.store_name?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{vendor.store_name}</h3>
                      <p className="text-sm text-slate-500">{userMap[vendor.user_id!]?.full_name || 'No contact'}</p>
                    </div>
                  </div>
                  <Badge className={statusColors[vendor.status]}>{vendor.status}</Badge>
                </div>

                <div className="space-y-2 mb-4">
                  {vendor.address && (
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                      <span>{vendor.address}, {vendor.city}, {vendor.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-slate-400" />
                    {vendor.email}
                  </div>
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {vendor.phone}
                    </div>
                  )}
                </div>

                {vendor.latitude && vendor.longitude && (
                  <p className="text-xs text-slate-400 mb-3">
                    📍 {vendor.latitude.toFixed(4)}, {vendor.longitude.toFixed(4)}
                  </p>
                )}

                <Link href={createPageUrl(`VendorDetail?id=${vendor.id}`)}>
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    {t('viewDetails')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}