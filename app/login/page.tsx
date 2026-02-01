'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Package,
    Eye,
    EyeOff,
    LogIn,
    AlertCircle,
    Shield,
    Store,
    Loader2
} from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            if (user.role === 'vendor') {
                router.push('/VendorDashboard');
            } else {
                router.push('/Dashboard');
            }
        }
    }, [isAuthenticated, user, isLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            setIsSubmitting(false);
            return;
        }

        const result = await login(username, password);

        if (result.success) {
            // Redirect will happen via useEffect
        } else {
            setError(result.error || 'Login failed');
        }

        setIsSubmitting(false);
    };

    const handleDemoLogin = async (type: 'admin' | 'vendor') => {
        setError('');
        setIsSubmitting(true);

        const credentials = type === 'admin'
            ? { username: 'Destiny', password: 'fokundem653@' }
            : { username: 'Employee', password: 'employee123' };

        setUsername(credentials.username);
        setPassword(credentials.password);

        const result = await login(credentials.username, credentials.password);

        if (!result.success) {
            setError(result.error || 'Login failed');
        }

        setIsSubmitting(false);
    };

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
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-sidebar p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-30" />
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-md bg-white/10 flex items-center justify-center shadow-white/5">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">StockFlow</h1>
                            <p className="text-sm text-slate-400">Inventory Management</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h2 className="text-4xl font-bold text-sidebar-foreground leading-tight">
                            Manage your inventory<br />
                            <span className="text-sidebar-foreground">
                                with confidence
                            </span>
                        </h2>
                        <p className="mt-4 text-lg text-sidebar-foreground/80 max-w-md">
                            Streamline your operations, track stock in real-time, and make data-driven decisions with our powerful inventory management system.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-white/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Role-Based Access</p>
                                <p className="text-sm text-slate-400">Admin and vendor dashboards</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-white/10 flex items-center justify-center">
                                <Store className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Multi-Store Support</p>
                                <p className="text-sm text-slate-400">Manage multiple locations</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-slate-500 text-sm">
                        © 2024 StockFlow. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-muted/30">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="h-12 w-12 rounded-md bg-primary flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">StockFlow</h1>
                        </div>
                    </div>

                    {/* Login Card */}
                    <div className="bg-card rounded-md shadow-muted/50 p-8 border border-border">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
                            <p className="text-muted-foreground mt-1">Sign in to your account to continue</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-foreground font-medium">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="h-12 rounded-md border-input bg-background focus:border-primary focus:ring-primary"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-foreground font-medium">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 rounded-md border-input bg-background focus:border-primary focus:ring-primary pr-12"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-primary/30 transition-all duration-200"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-5 w-5 mr-2" />
                                        Sign In
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-background text-muted-foreground">Quick demo access</span>
                            </div>
                        </div>

                        {/* Demo Login Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('admin')}
                                disabled={isSubmitting}
                                className="flex flex-col items-center gap-2 p-4 rounded-md border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-primary/30">
                                    <Shield className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-foreground group-hover:text-primary">Admin</p>
                                    <p className="text-xs text-muted-foreground">Destiny / fokundem653@</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDemoLogin('vendor')}
                                disabled={isSubmitting}
                                className="flex flex-col items-center gap-2 p-4 rounded-md border-2 border-border hover:border-secondary-foreground hover:bg-secondary transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="h-10 w-10 rounded-full bg-secondary-foreground flex items-center justify-center shadow-secondary-foreground/30">
                                    <Store className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-foreground group-hover:text-secondary-foreground">Vendor</p>
                                    <p className="text-xs text-muted-foreground">Employee / employee123</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Footer */}
                    <p className="lg:hidden text-center text-slate-500 text-sm mt-8">
                        © 2024 StockFlow. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
