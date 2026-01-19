'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Fix for default marker icons in Leaflet
if (typeof window !== 'undefined') {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-slate-100 text-slate-600",
    pending: "bg-amber-100 text-amber-700",
    suspended: "bg-rose-100 text-rose-700"
};

interface Vendor {
    id: string;
    latitude?: number;
    longitude?: number;
    store_name?: string;
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    total_sales?: number;
    status: string;
    total_orders?: number;
}

interface OrganizationMapProps {
    vendors: Vendor[];
    center: [number, number];
    zoom: number;
    onVendorClick?: (vendor: Vendor) => void;
}

const MapUpdater: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
    const map = useMap();
    React.useEffect(() => {
        if (center[0] !== 0 || center[1] !== 0) {
            map.setView(center, zoom || map.getZoom());
        }
    }, [center, zoom, map]);
    return null;
};

export default function OrganizationMap({ vendors, center, zoom, onVendorClick }: OrganizationMapProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
        >
            <MapUpdater center={center} zoom={zoom} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {vendors.map(vendor => (
                (vendor.latitude && vendor.longitude) ? (
                    <Marker
                        key={vendor.id}
                        position={[vendor.latitude, vendor.longitude]}
                        eventHandlers={{
                            click: () => onVendorClick && onVendorClick(vendor)
                        }}
                    >
                        <Popup>
                            <div className="p-2 min-w-48">
                                <h3 className="font-semibold">{vendor.store_name}</h3>
                                <p className="text-sm text-slate-600">{vendor.name}</p>
                                <p className="text-sm text-slate-500">{vendor.address}</p>
                                <p className="text-sm text-slate-500">{vendor.city}, {vendor.country}</p>
                                <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                                    <span>Sales: ${(vendor.total_sales || 0).toLocaleString()}</span>
                                    <Badge className={statusColors[vendor.status] || statusColors.active} variant="outline">{vendor.status}</Badge>
                                </div>
                                {onVendorClick && (
                                    <Button
                                        size="sm"
                                        className="mt-2 w-full bg-teal-600 hover:bg-teal-700"
                                        onClick={() => onVendorClick(vendor)}
                                    >
                                        View Details
                                    </Button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ) : null
            ))}
        </MapContainer>
    );
}
