'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VendorLocationPicker from "@/components/vendors/VendorLocationPicker";
import { ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";

interface StepLocationProps {
    onNext: (data: any) => void;
    onBack?: () => void;
    initialData?: any;
}

export default function StepLocation({ onNext, onBack, initialData }: StepLocationProps) {
    const [locationData, setLocationData] = useState({
        latitude: initialData?.latitude || null,
        longitude: initialData?.longitude || null,
        address: initialData?.address || '',
        city: initialData?.city || '',
        country: initialData?.country || ''
    });

    const handleNext = () => {
        // Validate coordinates
        if (!locationData.latitude || !locationData.longitude) {
            toast.error("Please select a location on the map");
            return;
        }

        // Trim and validate address
        const address = locationData.address.trim();
        const city = locationData.city.trim();
        const country = locationData.country.trim();

        if (!address) {
            toast.error("Please enter an address");
            return;
        }
        if (address.length < 5) {
            toast.error("Address must be at least 5 characters");
            return;
        }

        if (!city) {
            toast.error("Please enter a city");
            return;
        }
        if (city.length < 2) {
            toast.error("City name must be at least 2 characters");
            return;
        }

        if (!country) {
            toast.error("Please enter a country");
            return;
        }
        if (country.length < 2) {
            toast.error("Country name must be at least 2 characters");
            return;
        }

        // Pass validated and trimmed data
        onNext({
            ...locationData,
            address,
            city,
            country
        });
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    Select Location
                </h2>
                <p className="text-sm text-slate-500">
                    Verify your business location on the map.
                </p>
            </div>

            <div className="border rounded-xl overflow-hidden p-1">
                <VendorLocationPicker
                    latitude={locationData.latitude}
                    longitude={locationData.longitude}
                    onLocationChange={(lat, lng) => setLocationData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                    onAddressChange={(addr) => setLocationData(prev => ({
                        ...prev,
                        address: addr.address,
                        city: addr.city,
                        country: addr.country
                    }))}
                    label="Business Headquarters"
                />
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Address *</Label>
                    <Input
                        value={locationData.address}
                        onChange={(e) => setLocationData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Main St"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>City *</Label>
                        <Input
                            value={locationData.city}
                            onChange={(e) => setLocationData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="City"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Country *</Label>
                        <Input
                            value={locationData.country}
                            onChange={(e) => setLocationData(prev => ({ ...prev, country: e.target.value }))}
                            placeholder="Country"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                {onBack && (
                    <Button variant="outline" onClick={onBack} className="flex-1">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                )}
                <Button onClick={handleNext} className={`${onBack ? 'flex-1' : 'w-full'} bg-emerald-600 hover:bg-emerald-700`}>
                    Confirm Location <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
