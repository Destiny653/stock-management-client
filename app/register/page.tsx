'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';
import StepSubscription from '@/components/register/StepSubscription';
import StepLocation from '@/components/register/StepLocation';
import StepOrganization from '@/components/register/StepOrganization';
import StepUser from '@/components/register/StepUser';
import { Package, Check } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState({
        plan: 'starter',
        location: null as any,
        organization: null as any,
        user: null as any
    });

    const handlePlanNext = (planId: string) => {
        setData(prev => ({ ...prev, plan: planId }));
        setStep(2);
    };

    const handleLocationNext = (locationData: any) => {
        setData(prev => ({ ...prev, location: locationData }));
        setStep(3);
    };

    const handleOrganizationNext = (orgData: any) => {
        setData(prev => ({ ...prev, organization: orgData }));
        setStep(4);
    };

    const handleFinalSubmit = async (userData: any) => {
        setIsSubmitting(true);
        const finalData = { ...data, user: userData };

        try {
            // Transform data for backend
            const payload = {
                location: {
                    name: `${finalData.organization.name} HQ`,
                    address: finalData.location.address,
                    city: finalData.location.city,
                    country: finalData.location.country,
                    latitude: finalData.location.latitude,
                    longitude: finalData.location.longitude,
                },
                organization: {
                    name: finalData.organization.name,
                    code: finalData.organization.code,
                    phone: finalData.organization.phone,
                    website: finalData.organization.website,
                    status: 'active',
                    subscription_plan: finalData.plan
                },
                user: {
                    full_name: userData.full_name,
                    email: userData.email,
                    username: userData.email, // using email as username
                    password: userData.password,
                    role: 'admin',
                    user_type: 'admin'
                }
            };

            await apiClient.post('/auth/register-organization', payload);
            toast.success("Registration successful! Please login.");
            router.push('/login');
        } catch (error: any) {
            console.error("Registration error:", error);
            toast.error(error.response?.data?.detail || "Registration failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { number: 1, title: 'Plan' },
        { number: 2, title: 'Location' },
        { number: 3, title: 'Organization' },
        { number: 4, title: 'Account' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30 mb-4">
                    <Package className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                <p className="text-slate-500 mt-1">Get started with StockFlow in 4 easy steps</p>
            </div>

            {/* Progress Steps */}
            <div className="w-full max-w-2xl mb-8 flex items-center justify-between px-4 sm:px-8">
                {steps.map((s, i) => (
                    <div key={s.number} className="flex flex-col items-center relative z-10 w-20">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${step >= s.number ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                            {step > s.number ? <Check className="h-4 w-4" /> : s.number}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${step >= s.number ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            <Card className="w-full max-w-3xl p-6 sm:p-8 bg-white shadow-xl shadow-slate-200/50">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <StepSubscription onNext={handlePlanNext} initialData={data.plan} />
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
                            <StepLocation onNext={handleLocationNext} initialData={data.location} />
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
