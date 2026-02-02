'use client';

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, CheckCircle, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StepUserProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
    initialData?: any;
    isSubmitting: boolean;
}

export default function StepUser({ onSubmit, onBack, initialData, isSubmitting }: StepUserProps) {
    const [formData, setFormData] = useState({
        full_name: initialData?.full_name || '',
        first_name: initialData?.first_name || '',
        last_name: initialData?.last_name || '',
        email: initialData?.email || '',
        username: initialData?.username || '',
        phone: initialData?.phone || '',
        department: initialData?.department || '',
        job_title: initialData?.job_title || '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password strength calculation
    const passwordStrength = useMemo(() => {
        const password = formData.password;
        let score = 0;
        const checks = {
            length: password.length >= 4,
            number: /[0-9]/.test(password)
        };

        if (checks.length) score++;
        if (checks.number) score++;

        return { score, checks };
    }, [formData.password]);

    const getStrengthLabel = () => {
        if (formData.password.length === 0) return '';
        if (passwordStrength.score < 2) return 'Weak';
        return 'Good';
    };

    const getStrengthColor = () => {
        if (passwordStrength.score < 2) return 'bg-red-500';
        return 'bg-green-500';
    };

    const handleSubmit = () => {
        const fullName = formData.full_name.trim();
        const email = formData.email.trim().toLowerCase();
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;

        // Validate full name
        if (!fullName) {
            toast.error("Please enter your full name");
            return;
        }
        if (fullName.length < 2) {
            toast.error("Full name must be at least 2 characters");
            return;
        }

        // Validate email format
        if (!email) {
            toast.error("Please enter your email address");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        // Validate username
        if (!formData.username.trim()) {
            toast.error("Please enter a username");
            return;
        }
        if (formData.username.trim().length < 3) {
            toast.error("Username must be at least 3 characters");
            return;
        }

        // Validate password strength
        if (!password) {
            toast.error("Please enter a password");
            return;
        }
        if (password.length < 4) {
            toast.error("Password must be at least 4 characters long");
            return;
        }
        if (!passwordStrength.checks.number) {
            toast.error("Password must contain at least one number");
            return;
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        onSubmit({
            full_name: fullName,
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            email,
            username: formData.username.trim(),
            phone: formData.phone.trim(),
            department: formData.department.trim(),
            job_title: formData.job_title.trim(),
            password
        });
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Admin Account
                </h2>
                <p className="text-sm text-slate-500">
                    Create your administrator account.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                        id="fullName"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="John Doe"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            placeholder="John"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            placeholder="Doe"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="johndoe"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1234567890"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            placeholder="Engineering / Sales"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                            id="jobTitle"
                            value={formData.job_title}
                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            placeholder="Director / Manager"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            disabled={isSubmitting}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {/* Password strength indicator */}
                    {formData.password.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex gap-1">
                                {[1, 2].map((level) => (
                                    <div
                                        key={level}
                                        className={cn(
                                            "h-1 flex-1 rounded-full transition-colors",
                                            passwordStrength.score >= level ? getStrengthColor() : "bg-slate-200"
                                        )}
                                    />
                                ))}
                            </div>
                            <p className={cn(
                                "text-xs",
                                passwordStrength.score < 2 ? "text-red-600" : "text-green-600"
                            )}>
                                Password strength: {getStrengthLabel()}
                            </p>
                            <ul className="text-xs text-slate-500 space-y-0.5">
                                <li className={passwordStrength.checks.length ? "text-primary" : ""}>
                                    {passwordStrength.checks.length ? "✓" : "○"} At least 4 characters
                                </li>
                                <li className={passwordStrength.checks.number ? "text-primary" : ""}>
                                    {passwordStrength.checks.number ? "✓" : "○"} One number
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                            disabled={isSubmitting}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-red-600">Passwords do not match</p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length > 0 && (
                        <p className="text-xs text-primary">✓ Passwords match</p>
                    )}
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onBack} className="flex-1" disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Complete Registration
                </Button>
            </div>
        </div>
    );
}

