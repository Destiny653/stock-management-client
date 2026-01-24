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

export interface LocationMarker {
    id: string;
    latitude?: number;
    longitude?: number;
    store_name?: string; // For vendors
    name?: string; // For organization or contact name
    address?: string;
    city?: string;
    country?: string;
    total_sales?: number;
    status?: string;
    total_orders?: number;
    type?: 'organization' | 'vendor';
}

interface OrganizationMapProps {
    locations: LocationMarker[];
    center: [number, number];
    zoom: number;
    onMarkerClick?: (location: LocationMarker) => void;
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

export default function OrganizationMap({ locations, center, zoom, onMarkerClick }: OrganizationMapProps) {
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
            {locations.map(location => (
                (location.latitude && location.longitude) ? (
                    <Marker
                        key={location.id}
                        position={[location.latitude, location.longitude]}
                        eventHandlers={{
                            click: () => onMarkerClick && onMarkerClick(location)
                        }}
                    >
                        <Popup>
                            <div className="p-2 min-w-48">
                                <div className="flex items-center gap-2 mb-2">
                                    {location.type === 'organization' && (
                                        <Badge className="bg-emerald-600 hover:bg-emerald-700">HQ</Badge>
                                    )}
                                    {location.type === 'vendor' && (
                                        <Badge variant="outline">Vendor</Badge>
                                    )}
                                </div>
                                <h3 className="font-semibold">{location.store_name || location.name}</h3>
                                {location.type === 'vendor' && location.name && (
                                    <p className="text-sm text-slate-600">{location.name}</p>
                                )}
                                <p className="text-sm text-slate-500">{location.address}</p>
                                <p className="text-sm text-slate-500">{location.city}, {location.country}</p>

                                {location.type === 'vendor' && (
                                    <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                                        <span>Sales: ${(location.total_sales || 0).toLocaleString()}</span>
                                        <Badge className={statusColors[location.status || 'active'] || statusColors.active} variant="outline">{location.status}</Badge>
                                    </div>
                                )}
                                {location.type === 'organization' && location.status && (
                                    <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                                        <Badge className={statusColors[location.status] || statusColors.active} variant="outline">{location.status}</Badge>
                                    </div>
                                )}

                                {onMarkerClick && location.type === 'vendor' && (
                                    <Button
                                        size="sm"
                                        className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700"
                                        onClick={() => onMarkerClick(location)}
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
