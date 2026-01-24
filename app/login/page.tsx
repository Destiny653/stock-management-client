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
            if (user.user_type === 'vendor') {
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#004030] via-[#003025] to-[#004030]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    <p className="text-slate-300">Loading...</p>
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#004030] via-[#003025] to-[#004030]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    <p className="text-slate-300">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#004030] via-[#003025] to-[#004030] p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500 rounded-full blur-3xl opacity-30" />
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
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
                        <h2 className="text-4xl font-bold text-white leading-tight">
                            Manage your inventory<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                                with confidence
                            </span>
                        </h2>
                        <p className="mt-4 text-lg text-slate-300 max-w-md">
                            Streamline your operations, track stock in real-time, and make data-driven decisions with our powerful inventory management system.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Role-Based Access</p>
                                <p className="text-sm text-slate-400">Admin and vendor dashboards</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <Store className="h-5 w-5 text-blue-400" />
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
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">StockFlow</h1>
                        </div>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-200">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                            <p className="text-slate-500 mt-1">Sign in to your account to continue</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                                <p className="text-sm text-rose-600">{error}</p>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-slate-700 font-medium">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-700 font-medium">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 pr-12"
                                        disabled={isSubmitting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/30 transition-all duration-200"
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
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-slate-500">Quick demo access</span>
                            </div>
                        </div>

                        {/* Demo Login Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('admin')}
                                disabled={isSubmitting}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <Shield className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-slate-900 group-hover:text-emerald-700">Admin</p>
                                    <p className="text-xs text-slate-500">Destiny / fokundem653@</p>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleDemoLogin('vendor')}
                                disabled={isSubmitting}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Store className="h-5 w-5 text-white" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-slate-900 group-hover:text-blue-700">Vendor</p>
                                    <p className="text-xs text-slate-500">Employee / employee123</p>
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
