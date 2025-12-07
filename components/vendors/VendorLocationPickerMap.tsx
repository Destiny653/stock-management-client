'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Crosshair, Loader2 } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface LocationMarkerProps {
    position: { lat: number; lng: number } | null;
    setPosition: (position: { lat: number; lng: number }) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps) {
    const map = useMapEvents({
        click(e: L.LeafletMouseEvent) {
            setPosition(e.latlng);
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position ? <Marker position={position} icon={customIcon} /> : null;
}

interface MapControllerProps {
    center: [number, number] | null;
}

function MapController({ center }: MapControllerProps) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);

    return null;
}

interface VendorLocationPickerMapProps {
    latitude?: number;
    longitude?: number;
    onLocationChange: (lat: number, lng: number) => void;
    onAddressChange?: (address: { address: string; city: string; country: string }) => void;
    label?: string;
}

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        country?: string;
    };
}

export default function VendorLocationPickerMap({
    latitude,
    longitude,
    onLocationChange,
    onAddressChange,
    label
}: VendorLocationPickerMapProps) {
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
        latitude && longitude ? { lat: latitude, lng: longitude } : null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [mapCenter, setMapCenter] = useState<[number, number]>(
        latitude && longitude ? [latitude, longitude] : [20, 0]
    );

    useEffect(() => {
        if (position) {
            onLocationChange(position.lat, position.lng);
        }
    }, [position, onLocationChange]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchResults([]);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result: NominatimResult) => {
        const newPosition = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setPosition(newPosition);
        setMapCenter([newPosition.lat, newPosition.lng]);
        setSearchResults([]);
        setSearchQuery(result.display_name.split(',')[0]);

        // Parse address components
        if (onAddressChange) {
            onAddressChange({
                address: result.display_name,
                city: result.address?.city || result.address?.town || result.address?.village || '',
                country: result.address?.country || ''
            });
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const newPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPosition);
                setMapCenter([newPosition.lat, newPosition.lng]);

                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition.lat}&lon=${newPosition.lng}`
                    );
                    const data = await response.json();
                    if (data && onAddressChange) {
                        onAddressChange({
                            address: data.display_name,
                            city: data.address?.city || data.address?.town || data.address?.village || '',
                            country: data.address?.country || ''
                        });
                    }
                } catch (error) {
                    console.error('Reverse geocode error:', error);
                }

                setIsLocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                setIsLocating(false);
                alert('Unable to get your location. Please select manually on the map.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handlePositionChange = (newPosition: { lat: number; lng: number }) => {
        setPosition(newPosition);

        // Reverse geocode
        fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newPosition.lat}&lon=${newPosition.lng}`
        )
            .then(res => res.json())
            .then(data => {
                if (data && onAddressChange) {
                    onAddressChange({
                        address: data.display_name,
                        city: data.address?.city || data.address?.town || data.address?.village || '',
                        country: data.address?.country || ''
                    });
                }
            })
            .catch(console.error);
    };

    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium">{label || "Store Location"}</Label>

            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search for an address..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                    />
                </div>
                <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    title="Use my current location"
                >
                    {isLocating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Crosshair className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((result, index) => (
                        <button
                            key={index}
                            type="button"
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 border-b last:border-b-0 flex items-start gap-2"
                            onClick={() => handleSelectResult(result)}
                        >
                            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{result.display_name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Map */}
            <div className="h-64 rounded-xl overflow-hidden border border-slate-200">
                <MapContainer
                    center={mapCenter}
                    zoom={position ? 13 : 2}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker position={position} setPosition={handlePositionChange} />
                    <MapController center={position ? [position.lat, position.lng] : null} />
                </MapContainer>
            </div>

            {/* Coordinates Display */}
            {position && (
                <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    <span>
                        Lat: <strong>{position.lat.toFixed(6)}</strong>,
                        Lng: <strong>{position.lng.toFixed(6)}</strong>
                    </span>
                </div>
            )}

            <p className="text-xs text-slate-500">
                Click on the map to select location, use search, or click the crosshair to use your current location.
            </p>
        </div>
    );
}
