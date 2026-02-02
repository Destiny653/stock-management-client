'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const containerStyle = {
    width: '100%',
    height: '100%'
};

const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary border-primary/20",
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

export default function OrganizationMap({ locations, center, zoom, onMarkerClick }: OrganizationMapProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    });

    const [selectedMarker, setSelectedMarker] = useState<LocationMarker | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const mapCenter = useMemo(() => ({
        lat: center[0],
        lng: center[1]
    }), [center]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    if (!isLoaded) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Loading Google Maps...</p>
                </div>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={zoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            {locations.map(location => (
                (location.latitude && location.longitude) ? (
                    <Marker
                        key={location.id}
                        position={{ lat: location.latitude, lng: location.longitude }}
                        onClick={() => setSelectedMarker(location)}
                    />
                ) : null
            ))}

            {selectedMarker && selectedMarker.latitude && selectedMarker.longitude && (
                <InfoWindow
                    position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
                    onCloseClick={() => setSelectedMarker(null)}
                >
                    <div className="p-2 min-w-48 text-foreground">
                        <div className="flex items-center gap-2 mb-2">
                            {selectedMarker.type === 'organization' && (
                                <Badge className="bg-primary hover:bg-primary/90">HQ</Badge>
                            )}
                            {selectedMarker.type === 'vendor' && (
                                <Badge variant="outline">Vendor</Badge>
                            )}
                        </div>
                        <h3 className="font-semibold">{selectedMarker.store_name || selectedMarker.name}</h3>
                        {selectedMarker.type === 'vendor' && selectedMarker.name && (
                            <p className="text-sm text-slate-600">{selectedMarker.name}</p>
                        )}
                        <p className="text-sm text-slate-500">{selectedMarker.address}</p>
                        <p className="text-sm text-slate-500">{selectedMarker.city}, {selectedMarker.country}</p>

                        {selectedMarker.type === 'vendor' && (
                            <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                                <span>Sales: ${(selectedMarker.total_sales || 0).toLocaleString()}</span>
                                <Badge className={statusColors[selectedMarker.status || 'active'] || statusColors.active} variant="outline">{selectedMarker.status}</Badge>
                            </div>
                        )}
                        {selectedMarker.type === 'organization' && selectedMarker.status && (
                            <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                                <Badge className={statusColors[selectedMarker.status] || statusColors.active} variant="outline">{selectedMarker.status}</Badge>
                            </div>
                        )}

                        {onMarkerClick && selectedMarker.type === 'vendor' && (
                            <Button
                                size="sm"
                                className="mt-2 w-full bg-primary hover:bg-primary/90"
                                onClick={() => onMarkerClick(selectedMarker)}
                            >
                                View Details
                            </Button>
                        )}
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}
