'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VendorLocationPicker from "@/components/vendors/VendorLocationPicker";
import { ArrowRight, MapPin } from "lucide-react";
import { toast } from "sonner";

interface StepLocationProps {
    onNext: (data: any) => void;
    initialData?: any;
}

export default function StepLocation({ onNext, initialData }: StepLocationProps) {
    const [locationData, setLocationData] = useState({
        latitude: initialData?.latitude || null,
        longitude: initialData?.longitude || null,
        address: initialData?.address || '',
        city: initialData?.city || '',
        country: initialData?.country || ''
    });

    const handleNext = () => {
        if (!locationData.latitude || !locationData.longitude) {
            toast.error("Please select a location on the map");
            return;
        }
        if (!locationData.address || !locationData.city || !locationData.country) {
            toast.error("Please fill in all address fields");
            return;
        }
        onNext(locationData);
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
                    <Label>Address</Label>
                    <Input
                        value={locationData.address}
                        onChange={(e) => setLocationData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Main St"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                            value={locationData.city}
                            onChange={(e) => setLocationData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="City"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Country</Label>
                        <Input
                            value={locationData.country}
                            onChange={(e) => setLocationData(prev => ({ ...prev, country: e.target.value }))}
                            placeholder="Country"
                        />
                    </div>
                </div>
            </div>

            <Button onClick={handleNext} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Confirm Location <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}
