'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from '@/lib/api-client';
import { SubscriptionPlan } from '@/api/base44Client';

interface StepSubscriptionProps {
    onNext: (plan: SubscriptionPlan) => void;
    initialData?: SubscriptionPlan | null;
}

export default function StepSubscription({ onNext, initialData }: StepSubscriptionProps) {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(initialData || null);
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
                    if (initialData) {
                        const matched = fetchedPlans.find((p: SubscriptionPlan) =>
                            p.code === initialData.code || p._id === initialData._id || p.id === initialData.id
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
            onNext(selectedPlan);
        }
    };

    const formatPrice = (price: number) => {
        return `$${price}/mo`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-slate-500">Loading subscription plans...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-red-600">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <p className="text-slate-600">No subscription plans available at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Choose your plan</h2>
                <p className="text-sm text-slate-500">Select the plan that best fits your needs.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan) => {
                    const isPopular = plan.code === 'business';
                    const isSelected = selectedPlan && (selectedPlan._id === plan._id || selectedPlan.id === plan.id || selectedPlan.code === plan.code);

                    return (
                        <div
                            key={plan._id || plan.id || plan.code}
                            className={cn(
                                "relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-emerald-200",
                                isSelected ? "border-emerald-600 bg-emerald-50/30" : "border-slate-200"
                            )}
                            onClick={() => setSelectedPlan(plan)}
                        >
                            {isPopular && (
                                <Badge className="absolute -top-3 right-4 bg-emerald-500 hover:bg-emerald-600">Most Popular</Badge>
                            )}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-slate-900">{plan.name}</h3>
                                    <p className="text-sm text-slate-500">{plan.description || `Up to ${plan.max_vendors} vendors, ${plan.max_users} users`}</p>
                                </div>
                                <span className="text-lg font-bold text-slate-900">{formatPrice(plan.price_monthly)}</span>
                            </div>
                            <ul className="space-y-1 mt-2">
                                {plan.features.slice(0, 4).map((feature, i) => (
                                    <li key={i} className="flex items-center text-xs text-slate-600">
                                        <Check className="h-3 w-3 text-emerald-500 mr-2" />
                                        {feature}
                                    </li>
                                ))}
                                {plan.features.length === 0 && (
                                    <>
                                        <li className="flex items-center text-xs text-slate-600">
                                            <Check className="h-3 w-3 text-emerald-500 mr-2" />
                                            Up to {plan.max_vendors} vendors
                                        </li>
                                        <li className="flex items-center text-xs text-slate-600">
                                            <Check className="h-3 w-3 text-emerald-500 mr-2" />
                                            Up to {plan.max_users} users
                                        </li>
                                        <li className="flex items-center text-xs text-slate-600">
                                            <Check className="h-3 w-3 text-emerald-500 mr-2" />
                                            Up to {plan.max_products} products
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    );
                })}
            </div>

            <Button
                onClick={handleContinue}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!selectedPlan}
            >
                Continue with {selectedPlan?.name || 'Selected Plan'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}
