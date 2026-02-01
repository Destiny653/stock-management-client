'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Package } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'manager' | 'vendor' | 'user')[];
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
            } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                // Redirect to appropriate dashboard if user doesn't have access
                if (user.role === 'vendor') {
                    router.push('/VendorDashboard');
                } else {
                    router.push('/Dashboard');
                }
            }
        }
    }, [isAuthenticated, isLoading, user, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="h-16 w-16 rounded-md bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                        <Package className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}
