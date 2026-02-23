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
        email: initialData?.email || '',
        website: initialData?.website || '',
        description: initialData?.description || ''
    });

    const handleNext = () => {
        const name = formData.name.trim();
        const code = formData.code.trim().toUpperCase();
        const phone = formData.phone?.trim() || '';
        const email = formData.email?.trim().toLowerCase() || '';
        const website = formData.website?.trim() || '';
        const description = formData.description?.trim() || '';

        // Validate name
        if (!name) {
            toast.error("Please enter an organization name");
            return;
        }
        if (name.length < 3) {
            toast.error("Organization name must be at least 3 characters");
            return;
        }

        // Validate email if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                toast.error("Please enter a valid organization email address");
                return;
            }
        }

        // Validate code format (alphanumeric only, 3-10 chars)
        if (!code) {
            toast.error("Please enter an organization code");
            return;
        }
        const codeRegex = /^[A-Z0-9]{3,10}$/;
        if (!codeRegex.test(code)) {
            toast.error("Organization code must be 3-10 alphanumeric characters (letters and numbers only)");
            return;
        }

        // Validate phone format if provided
        if (phone) {
            const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
            if (!phoneRegex.test(phone)) {
                toast.error("Please enter a valid phone number");
                return;
            }
        }

        // Validate website URL if provided
        if (website) {
            const urlRegex = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-\.\/]*)?$/i;
            if (!urlRegex.test(website)) {
                toast.error("Please enter a valid website URL");
                return;
            }
        }

        onNext({
            name,
            code,
            phone: phone || null,
            email: email || null,
            website: website || null,
            description: description || null
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Organization Details
                </h2>
                <p className="text-sm text-slate-500">
                    Tell us about your business.
                </p>
            </div>

            <div className="flex flex-col gap-6 mt-8">
                <div className="flex flex-col gap-3">
                    <Label htmlFor="orgName" className="text-foreground font-semibold text-sm tracking-wide uppercase opacity-70">Organization Name *</Label>
                    <Input
                        id="orgName"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Acme Corp"
                        className="input-minimal h-10"
                    />
                </div>
                <div className="flex flex-col gap-3">
                    <Label htmlFor="orgCode" className="text-foreground font-semibold text-sm tracking-wide uppercase opacity-70">Organization Code *</Label>
                    <Input
                        id="orgCode"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="ACME"
                        className="input-minimal h-10"
                        maxLength={10}
                    />
                    <p className="text-xs text-slate-500 font-medium">Unique identifier for your organization (e.g., shorter name)</p>
                </div>
                <div className="flex flex-col gap-3">
                    <Label htmlFor="orgPhone" className="text-foreground font-semibold text-sm tracking-wide uppercase opacity-70">Phone (Optional)</Label>
                    <Input
                        id="orgPhone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234 567 890"
                        className="input-minimal h-10"
                    />
                </div>
                <div className="flex flex-col gap-3">
                    <Label htmlFor="orgEmail" className="text-foreground font-semibold text-sm tracking-wide uppercase opacity-70">Organization Email (Optional)</Label>
                    <Input
                        id="orgEmail"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contact@acme.com"
                        className="input-minimal h-10"
                    />
                </div>
                <div className="flex flex-col gap-3">
                    <Label htmlFor="orgWebsite" className="text-foreground font-semibold text-sm tracking-wide uppercase opacity-70">Website (Optional)</Label>
                    <Input
                        id="orgWebsite"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://acme.com"
                        className="input-minimal h-10"
                    />
                </div>
                <div className="flex flex-col gap-3">
                    <Label htmlFor="orgDescription" className="text-foreground font-semibold text-sm tracking-wide uppercase opacity-70">Description (Optional)</Label>
                    <Input
                        id="orgDescription"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What does your company do?"
                        className="input-minimal h-10"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleNext} className="flex-1 bg-primary hover:bg-primary/90">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
