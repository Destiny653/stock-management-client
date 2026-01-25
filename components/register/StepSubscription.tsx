'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepSubscriptionProps {
    onNext: (data: any) => void;
    initialData?: string;
}

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for small businesses',
        price: '$29/mo',
        features: ['Up to 5 vendors', 'Up to 3 users', 'Up to 100 products', 'Basic reports']
    },
    {
        id: 'business',
        name: 'Business',
        description: 'Best for growing companies',
        price: '$79/mo',
        features: ['Up to 25 vendors', 'Up to 10 users', 'Up to 1,000 products', 'Advanced reports', 'API access'],
        isPopular: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations',
        price: '$199/mo',
        features: ['Unlimited vendors', 'Unlimited users', 'Unlimited products', 'Custom reports', 'Dedicated support']
    }
];

export default function StepSubscription({ onNext, initialData }: StepSubscriptionProps) {
    const [selectedPlan, setSelectedPlan] = useState(initialData || 'starter');

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">Choose your plan</h2>
                <p className="text-sm text-slate-500">Select the plan that best fits your needs.</p>
            </div>

            <div className="grid gap-4">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={cn(
                            "relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-emerald-200",
                            selectedPlan === plan.id ? "border-emerald-600 bg-emerald-50/30" : "border-slate-200"
                        )}
                        onClick={() => setSelectedPlan(plan.id)}
                    >
                        {plan.isPopular && (
                            <Badge className="absolute -top-3 right-4 bg-emerald-500 hover:bg-emerald-600">Most Popular</Badge>
                        )}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-bold text-slate-900">{plan.name}</h3>
                                <p className="text-sm text-slate-500">{plan.description}</p>
                            </div>
                            <span className="text-lg font-bold text-slate-900">{plan.price}</span>
                        </div>
                        <ul className="space-y-1 mt-2">
                            {plan.features.slice(0, 3).map((feature, i) => (
                                <li key={i} className="flex items-center text-xs text-slate-600">
                                    <Check className="h-3 w-3 text-emerald-500 mr-2" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <Button onClick={() => onNext(selectedPlan)} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Continue with {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}
