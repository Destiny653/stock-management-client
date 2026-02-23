'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from '@/lib/api-client';
import { SubscriptionPlan } from '@/api/base44Client';

interface StepSubscriptionProps {
    onNext: (plan: SubscriptionPlan, interval: 'monthly' | 'yearly') => void;
    initialData?: { plan: SubscriptionPlan | null; interval: 'monthly' | 'yearly' };
}

export default function StepSubscription({ onNext, initialData }: StepSubscriptionProps) {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(initialData?.plan || null);
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(initialData?.interval || 'monthly');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await apiClient.get('/subscription-plans/');
                const fetchedPlans = response.data;
                setPlans(fetchedPlans);

                // Set default selection to first plan or match initialData
                if (fetchedPlans.length > 0) {
                    if (initialData?.plan) {
                        const matched = fetchedPlans.find((p: SubscriptionPlan) =>
                            p.code === initialData.plan?.code || p._id === initialData.plan?._id || p.id === initialData.plan?.id
                        );
                        setSelectedPlan(matched || fetchedPlans[0]);
                    } else {
                        // Default to 'starter' plan or first available
                        const starterPlan = fetchedPlans.find((p: SubscriptionPlan) => p.code === 'starter');
                        setSelectedPlan(starterPlan || fetchedPlans[0]);
                    }
                }
            } catch (err: any) {
                console.error("Failed to fetch subscription plans:", err);
                setError("Failed to load subscription plans. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlans();
    }, [initialData]);

    const handleContinue = () => {
        if (selectedPlan) {
            onNext(selectedPlan, billingInterval);
        }
    };

    const formatPrice = (plan: SubscriptionPlan) => {
        if (billingInterval === 'yearly') {
            return `$${plan.price_yearly}/yr`;
        }
        return `$${plan.price_monthly}/mo`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading subscription plans...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-destructive">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertCircle className="h-8 w-8 text-primary/70" />
                <p className="text-muted-foreground">No subscription plans available at the moment.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Choose your plan</h2>
                <p className="text-sm text-muted-foreground">Select the plan that best fits your needs.</p>

                <div className="flex items-center justify-center mt-4 gap-4">
                    <span className={cn("text-sm font-medium transition-colors", billingInterval === 'monthly' ? "text-foreground" : "text-muted-foreground")}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setBillingInterval(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                        className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2", billingInterval === 'yearly' ? 'bg-primary' : 'bg-input')}
                    >
                        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1')} />
                    </button>
                    <span className={cn("text-sm font-medium transition-colors", billingInterval === 'yearly' ? "text-foreground" : "text-muted-foreground")}>
                        Yearly <span className="text-primary text-xs ml-1 font-bold">(Save ~20%)</span>
                    </span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan) => {
                    const isPopular = plan.code === 'business'; // Or determine via logic
                    const isSelected = selectedPlan?.code === plan.code;

                    return (
                        <div
                            key={plan._id || plan.id || plan.code}
                            className={cn(
                                "relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ease-in-out",
                                isSelected
                                    ? "border-primary bg-primary/10 shadow-xl scale-105 ring-2 ring-primary/20 z-10"
                                    : "border-border bg-card hover:border-primary/50 hover:shadow-md opacity-80 hover:opacity-100 scale-100"
                            )}
                            onClick={() => setSelectedPlan(plan)}
                        >
                            {isSelected && (
                                <div className="absolute -top-3 -right-3 h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-lg z-10 animate-in fade-in zoom-in duration-200">
                                    <CheckCircle className="h-5 w-5 text-primary-foreground fill-primary" />
                                </div>
                            )}
                            {isPopular && !isSelected && (
                                <Badge className="absolute -top-3 right-4 bg-primary hover:bg-primary/90 shadow-sm">Most Popular</Badge>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className={cn("font-bold text-lg", isSelected ? "text-primary" : "text-foreground")}>
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {plan.description || `Up to ${plan.max_vendors} vendors, ${plan.max_users} users`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={cn("text-xl font-bold block", isSelected ? "text-primary" : "text-foreground")}>
                                        {formatPrice(plan)}
                                    </span>
                                    {billingInterval === 'monthly' && plan.price_yearly > 0 && (
                                        <span className="text-xs text-muted-foreground line-through opacity-70">
                                            ${Math.round(plan.price_yearly / 12 * 1.2)}/mo
                                        </span>
                                    )}
                                    {billingInterval === 'yearly' && plan.price_monthly > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            ${Math.round(plan.price_yearly / 12)}/mo
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto pt-4 border-t border-border/50">
                                <ul className="flex flex-col gap-2">
                                    {plan.features.slice(0, 4).map((feature, i) => (
                                        <li key={i} className="flex items-start text-sm text-muted-foreground">
                                            <div className={cn("mr-2 mt-0.5 rounded-full p-0.5", isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                    {plan.features.length === 0 && (
                                        <>
                                            <li className="flex items-start text-sm text-muted-foreground">
                                                <div className={cn("mr-2 mt-0.5 rounded-full p-0.5", isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <span>Up to {plan.max_vendors} vendors</span>
                                            </li>
                                            <li className="flex items-start text-sm text-muted-foreground">
                                                <div className={cn("mr-2 mt-0.5 rounded-full p-0.5", isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                                                    <Check className="h-3 w-3" />
                                                </div>
                                                <span>Up to {plan.max_users} users</span>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Button
                onClick={handleContinue}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={!selectedPlan}
            >
                Continue with {selectedPlan?.name || 'Selected Plan'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}
