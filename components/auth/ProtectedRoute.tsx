'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Package } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'vendor' | 'manager' | 'staff' | 'owner' | 'viewer')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            const isPublicRoute = window.location.pathname === '/' ||
                window.location.pathname === '/register' ||
                window.location.pathname === '/login';

            if (!isAuthenticated && !isPublicRoute) {
                router.push('/login');
            } else if (allowedRoles && user && !allowedRoles.includes(user.user_type)) {
                // Redirect to appropriate dashboard if user doesn't have access
                if (user.user_type === 'vendor') {
                    router.push('/VendorDashboard');
                } else {
                    router.push('/Dashboard');
                }
            }
        }
    }, [isAuthenticated, isLoading, user, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#004030] via-slate-800 to-[#004030]">
                <div className="text-center">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                        <Package className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                        <p className="text-slate-300 font-medium">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.user_type)) {
        return null;
    }

    return <>{children}</>;
}
