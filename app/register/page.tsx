'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import { SubscriptionPlan } from '@/api/base44Client';
import StepSubscription from '@/components/register/StepSubscription';
import StepLocation from '@/components/register/StepLocation';
import StepOrganization from '@/components/register/StepOrganization';
import StepUser from '@/components/register/StepUser';
import { Package, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const { isAuthenticated, user, isLoading } = useAuth();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [registrationState, setRegistrationState] = useState({
        planId: '',
        locationId: '',
        organizationId: '',
        subscription_interval: 'monthly' as 'monthly' | 'yearly',
    });

    // Redirect if already authenticated
    React.useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            if (user.role === 'vendor') {
                router.push('/VendorDashboard');
            } else {
                router.push('/Dashboard');
            }
        }
    }, [isAuthenticated, user, isLoading, router]);


    const [data, setData] = useState({
        plan: null as SubscriptionPlan | null,
        location: null as any,
        organization: null as any,
        user: null as any
    });

    const handlePlanNext = (plan: SubscriptionPlan, interval: 'monthly' | 'yearly') => {
        const planId = plan._id || plan.id;
        setData(prev => ({ ...prev, plan }));
        setRegistrationState(prev => ({ ...prev, planId, subscription_interval: interval }));
        setStep(2);
    };

    const handleLocationNext = async (locationData: any) => {
        setIsSubmitting(true);
        setLoadingMessage("Saving location...");
        try {
            const response = await apiClient.post('/locations/', {
                name: locationData.name || "HQ",
                address: locationData.address,
                city: locationData.city,
                country: locationData.country,
                latitude: locationData.latitude,
                longitude: locationData.longitude
            });
            const locationId = response.data.id;
            setData(prev => ({ ...prev, location: locationData }));
            setRegistrationState(prev => ({ ...prev, locationId }));
            setStep(3);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to save location");
        } finally {
            setIsSubmitting(false);
            setLoadingMessage('');
        }
    };

    const handleOrganizationNext = async (orgData: any) => {
        setIsSubmitting(true);
        setLoadingMessage("Creating organization...");
        try {
            const response = await apiClient.post('/organizations/', {
                name: orgData.name,
                code: orgData.code,
                phone: orgData.phone,
                email: orgData.email,
                website: orgData.website,
                description: orgData.description,
                location_id: registrationState.locationId,
                subscription_plan_id: registrationState.planId,
                subscription_interval: registrationState.subscription_interval,
                status: 'active'
            });
            const organizationId = response.data.id;
            setData(prev => ({ ...prev, organization: orgData }));
            setRegistrationState(prev => ({ ...prev, organizationId }));
            setStep(4);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to create organization");
        } finally {
            setIsSubmitting(false);
            setLoadingMessage('');
        }
    };

    const handleFinalSubmit = async (userData: any) => {
        setIsSubmitting(true);
        setLoadingMessage("Creating admin account...");
        try {
            await apiClient.post('/auth/register', {
                full_name: userData.full_name,
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
                username: userData.username,
                password: userData.password,
                phone: userData.phone || null,
                department: userData.department,
                job_title: userData.job_title,
                organization_id: registrationState.organizationId,
                role: 'admin',
                user_type: 'business-staff'
            });
            toast.success("Registration successful! Please login.");
            router.push('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to create user");
        } finally {
            setIsSubmitting(false);
            setLoadingMessage('');
        }
    };

    const steps = [
        { number: 1, title: 'Plan' },
        { number: 2, title: 'Location' },
        { number: 3, title: 'Organization' },
        { number: 4, title: 'Account' }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
            {/* Loading Overlay */}
            <AnimatePresence>
                {isSubmitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
                    >
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                        <h3 className="text-xl font-semibold text-slate-800 animate-pulse">{loadingMessage}</h3>
                        <p className="text-sm text-slate-500 mt-2">Please do not close this window.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-linear-to-br from-primary/80 to-primary shadow-primary/30 mb-4">
                    <Package className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                <p className="text-slate-500 mt-1">Get started with StockFlow in 4 easy steps</p>
            </div>

            {/* Progress Steps */}
            <div className="w-full max-w-2xl mb-8 flex items-center justify-between px-4 sm:px-8">
                {steps.map((s, i) => (
                    <div key={s.number} className="flex flex-col items-center relative z-10 w-20">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${step >= s.number ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${step >= s.number ? 'text-primary' : 'text-slate-400'}`}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            <Card className="w-full max-w-3xl p-6 sm:p-8 bg-white shadow-slate-200/50">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StepSubscription
                                onNext={handlePlanNext}
                                initialData={{
                                    plan: data.plan,
                                    interval: registrationState.subscription_interval
                                }}
                            />
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StepLocation onNext={handleLocationNext} onBack={() => setStep(1)} initialData={data.location} />
                        </motion.div>
                    )}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StepOrganization
                                onNext={handleOrganizationNext}
                                onBack={() => setStep(2)}
                                initialData={data.organization}
                            />
                        </motion.div>
                    )}
                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StepUser
                                onSubmit={handleFinalSubmit}
                                onBack={() => setStep(3)}
                                isSubmitting={isSubmitting}
                                initialData={data.user}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </div>
    );
}
