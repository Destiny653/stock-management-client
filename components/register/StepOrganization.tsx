'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface StepOrganizationProps {
    onNext: (data: any) => void;
    onBack: () => void;
    initialData?: any;
}

export default function StepOrganization({ onNext, onBack, initialData }: StepOrganizationProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        code: initialData?.code || '',
        phone: initialData?.phone || '',
        website: initialData?.website || ''
    });

    const handleNext = () => {
        if (!formData.name || !formData.code) {
            toast.error("Please fill in required fields");
            return;
        }
        onNext(formData);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Organization Details
                </h2>
                <p className="text-sm text-slate-500">
                    Tell us about your business.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                        id="orgName"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Acme Corp"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="orgCode">Organization Code *</Label>
                    <Input
                        id="orgCode"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="ACME"
                        maxLength={10}
                    />
                    <p className="text-xs text-slate-500">Unique identifier for your organization (e.g., shorter name)</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="orgPhone">Phone (Optional)</Label>
                    <Input
                        id="orgPhone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234 567 890"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="orgWebsite">Website (Optional)</Label>
                    <Input
                        id="orgWebsite"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://acme.com"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
