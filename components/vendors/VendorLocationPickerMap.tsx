'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Crosshair, Loader2 } from "lucide-react";

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 4.0511, // Douala, Cameroon default
    lng: 9.7679
};

interface VendorLocationPickerMapProps {
    latitude?: number;
    longitude?: number;
    onLocationChange: (lat: number, lng: number) => void;
    onAddressChange?: (address: { address: string; city: string; country: string }) => void;
    label?: string;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function VendorLocationPickerMap({
    latitude,
    longitude,
    onLocationChange,
    onAddressChange,
    label
}: VendorLocationPickerMapProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [position, setPosition] = useState<google.maps.LatLngLiteral>(
        latitude && longitude ? { lat: latitude, lng: longitude } : defaultCenter
    );
    const [searchResult, setSearchResult] = useState<google.maps.places.Autocomplete | null>(null);
    const [address, setAddress] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    // Sync position if props change
    useEffect(() => {
        if (latitude && longitude) {
            setPosition({ lat: latitude, lng: longitude });
        }
    }, [latitude, longitude]);

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setPosition(newPos);
            onLocationChange(newPos.lat, newPos.lng);
            reverseGeocode(newPos);
        }
    }, [onLocationChange]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
        setSearchResult(autocomplete);
    };

    const onPlaceChanged = () => {
        if (searchResult !== null) {
            const place = searchResult.getPlace();
            if (place.geometry && place.geometry.location) {
                const newPos = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                setPosition(newPos);
                onLocationChange(newPos.lat, newPos.lng);
                map?.panTo(newPos);
                map?.setZoom(15);

                if (onAddressChange) {
                    onAddressChange({
                        address: place.formatted_address || '',
                        city: getAddressComponent(place, 'locality') || getAddressComponent(place, 'administrative_area_level_1') || '',
                        country: getAddressComponent(place, 'country') || ''
                    });
                }
            }
        }
    };

    const getAddressComponent = (place: google.maps.places.PlaceResult, type: string) => {
        return place.address_components?.find(c => c.types.includes(type))?.long_name;
    };

    const reverseGeocode = (pos: google.maps.LatLngLiteral) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                if (onAddressChange) {
                    const place = results[0];
                    onAddressChange({
                        address: place.formatted_address || '',
                        city: getAddressComponent(place, 'locality') || getAddressComponent(place, 'administrative_area_level_1') || '',
                        country: getAddressComponent(place, 'country') || ''
                    });
                }
            }
        });
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPos);
                onLocationChange(newPos.lat, newPos.lng);
                map?.panTo(newPos);
                map?.setZoom(15);
                reverseGeocode(newPos);
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

    if (!isLoaded) {
        return (
            <div className="h-48 rounded-xl border border-slate-200 flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Loading Google Maps...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{label || "Store Location"}</Label>

            {/* Search Bar - Autocomplete */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <Autocomplete
                        onLoad={onAutocompleteLoad}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <Input
                            placeholder="Search for an address..."
                            className="pl-10"
                        />
                    </Autocomplete>
                </div>
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

            {/* Map */}
            <div className="h-48 rounded-xl overflow-hidden border border-slate-200">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={position}
                    zoom={13}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={onMapClick}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                    }}
                >
                    <Marker position={position} />
                </GoogleMap>
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
