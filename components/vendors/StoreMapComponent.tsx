'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createPageUrl } from "@/utils";
import type { Vendor } from '@/api/base44Client';
import { Loader2 } from "lucide-react";

const containerStyle = {
    width: '100%',
    height: '100%'
};

interface StoreMapComponentProps {
    vendors: (Vendor & { latitude: number; longitude: number; address?: string; city?: string; country?: string })[];
    center: [number, number];
    onVendorSelect: (vendor: Vendor) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const StoreMapComponent: React.FC<StoreMapComponentProps> = ({ vendors, center, onVendorSelect, t }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    });

    const [selectedVendor, setSelectedVendor] = useState<any>(null);
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
            zoom={4}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            {vendors.map(vendor => (
                <Marker
                    key={vendor.id}
                    position={{ lat: vendor.latitude, lng: vendor.longitude }}
                    onClick={() => {
                        setSelectedVendor(vendor);
                        onVendorSelect(vendor);
                    }}
                />
            ))}

            {selectedVendor && (
                <InfoWindow
                    position={{ lat: selectedVendor.latitude, lng: selectedVendor.longitude }}
                    onCloseClick={() => setSelectedVendor(null)}
                >
                    <div className="p-2 text-foreground">
                        <h3 className="font-semibold">{selectedVendor.store_name}</h3>
                        <p className="text-sm text-slate-500">{selectedVendor.address}</p>
                        <p className="text-sm text-slate-500">{selectedVendor.city}, {selectedVendor.country}</p>
                        <Link href={createPageUrl(`VendorDetail?id=${selectedVendor.id}`)}>
                            <Button size="sm" className="mt-2 w-full bg-primary hover:bg-primary/90">
                                {t('viewDetails')}
                            </Button>
                        </Link>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
};

export default StoreMapComponent;
