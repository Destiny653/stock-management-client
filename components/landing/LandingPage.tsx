'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Package,
    BarChart3,
    Store,
    Users,
    Shield,
    Globe,
    Zap,
    Check,
    ArrowRight,
    Menu,
    X,
    ChevronRight,
    Play,
    Loader2,
    Building2,
    Mail,
    Lock,
    User,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    Clock,
    Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Animation variants
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const fadeInLeft = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const fadeInRight = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

// Subscription plans data
const plans = [
    {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for small businesses',
        priceMonthly: 29,
        priceYearly: 290,
        features: [
            'Up to 5 vendors',
            'Up to 3 users',
            'Up to 100 products',
            '1 location',
            'Basic reports',
            'Email support'
        ],
        isPopular: false
    },
    {
        id: 'business',
        name: 'Business',
        description: 'Best for growing companies',
        priceMonthly: 79,
        priceYearly: 790,
        features: [
            'Up to 25 vendors',
            'Up to 10 users',
            'Up to 1,000 products',
            '5 locations',
            'Advanced reports',
            'Priority support',
            'API access'
        ],
        isPopular: true
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations',
        priceMonthly: 199,
        priceYearly: 1990,
        features: [
            'Unlimited vendors',
            'Unlimited users',
            'Unlimited products',
            'Unlimited locations',
            'Custom reports',
            'Dedicated support',
            'Custom integrations',
            'SLA guarantee'
        ],
        isPopular: false
    }
];

// Features data with enhanced icons
const features = [
    {
        icon: Package,
        title: 'Real-time Inventory',
        description: 'Track stock levels instantly with live updates and smart low-stock alerts.',
        gradient: 'from-emerald-500 to-teal-500'
    },
    {
        icon: Store,
        title: 'Multi-Vendor Hub',
        description: 'Manage multiple vendors, track sales, and automate commission payouts.',
        gradient: 'from-violet-500 to-purple-500'
    },
    {
        icon: BarChart3,
        title: 'Smart Analytics',
        description: 'AI-powered insights and beautiful dashboards for data-driven decisions.',
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Blazing fast performance with real-time sync across all your devices.',
        gradient: 'from-amber-500 to-orange-500'
    },
    {
        icon: Globe,
        title: 'Multi-Location',
        description: 'Seamlessly manage inventory across warehouses and store locations.',
        gradient: 'from-emerald-500 to-green-500'
    },
    {
        icon: Shield,
        title: 'Enterprise Security',
        description: 'Bank-level encryption with role-based access control.',
        gradient: 'from-rose-500 to-pink-500'
    }
];

// Stats with enhanced styling
const stats = [
    { value: '10K+', label: 'Active Users', icon: Users },
    { value: '500+', label: 'Organizations', icon: Building2 },
    { value: '1M+', label: 'Products Tracked', icon: Package },
    { value: '99.9%', label: 'Uptime', icon: TrendingUp }
];

// Testimonials
const testimonials = [
    {
        quote: "StockFlow transformed our inventory management. We've reduced stockouts by 80% and increased efficiency dramatically.",
        author: "Sarah Chen",
        role: "Operations Director",
        company: "TechRetail Co."
    },
    {
        quote: "The multi-vendor feature is a game-changer. Managing 50+ vendors is now effortless.",
        author: "Michael Okonkwo",
        role: "Supply Chain Manager",
        company: "AfriMart"
    },
    {
        quote: "Best investment we've made. ROI was visible within the first month of deployment.",
        author: "Emma Williams",
        role: "CEO",
        company: "Boutique Collective"
    }
];

export default function LandingPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [registerOpen, setRegisterOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    // Registration form state
    const [formData, setFormData] = useState({
        organizationName: '',
        organizationCode: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const handleOpenRegister = (planId?: string) => {
        if (planId) setSelectedPlan(planId);
        setRegisterOpen(true);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (!formData.agreeTerms) {
            toast.error('Please agree to the terms and conditions');
            return;
        }

        setSubmitting(true);

        try {
            await apiClient.post('/auth/register-organization', {
                organization: {
                    name: formData.organizationName,
                    code: formData.organizationCode.toUpperCase(),
                    subscription_plan: selectedPlan || 'starter',
                    status: 'pending'
                },
                user: {
                    full_name: formData.fullName,
                    email: formData.email,
                    username: formData.email,
                    password: formData.password,
                    role: 'admin',
                    user_type: 'admin'
                }
            });

            setRegistrationSuccess(true);
            toast.success('Registration successful!');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#004030]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#004030]/95 backdrop-blur-md border-b border-emerald-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">StockFlow</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-emerald-100/80 hover:text-white transition-colors">Features</a>
                            <a href="#pricing" className="text-sm font-medium text-emerald-100/80 hover:text-white transition-colors">Pricing</a>
                            <a href="#testimonials" className="text-sm font-medium text-emerald-100/80 hover:text-white transition-colors">Testimonials</a>
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            {isAuthenticated ? (
                                <Link href="/Dashboard">
                                    <Button className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
                                        Go to Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" className="text-emerald-100 hover:text-white hover:bg-white/10">
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => handleOpenRegister()}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
                                    >
                                        Start Free Trial
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-emerald-100 hover:text-white"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="md:hidden py-4 border-t border-emerald-800/50"
                        >
                            <div className="flex flex-col gap-3">
                                <a href="#features" className="text-sm font-medium text-emerald-100 hover:text-white py-2">Features</a>
                                <a href="#pricing" className="text-sm font-medium text-emerald-100 hover:text-white py-2">Pricing</a>
                                <a href="#testimonials" className="text-sm font-medium text-emerald-100 hover:text-white py-2">Testimonials</a>
                                <div className="flex gap-2 pt-2">
                                    <Link href="/login" className="flex-1">
                                        <Button variant="outline" className="w-full border-emerald-600 text-emerald-100 hover:bg-emerald-800">Sign In</Button>
                                    </Link>
                                    <Button onClick={() => handleOpenRegister()} className="flex-1 bg-emerald-500 hover:bg-emerald-400">
                                        Start Free
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </nav>

            {/* Hero Section - Immersive Full-Screen */}
            <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-to-br from-[#004030] via-[#003025] to-[#002018]">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-3xl" />
                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="text-center lg:text-left"
                        >
                            <motion.div variants={fadeInUp}>
                                <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 px-4 py-1.5">
                                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                                    Now with AI-powered insights
                                </Badge>
                            </motion.div>

                            <motion.h1
                                variants={fadeInUp}
                                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight"
                            >
                                Inventory Management
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                                    Reimagined
                                </span>
                            </motion.h1>

                            <motion.p
                                variants={fadeInUp}
                                className="mt-6 text-lg sm:text-xl text-emerald-100/70 max-w-xl mx-auto lg:mx-0"
                            >
                                The all-in-one platform that empowers businesses to track inventory, manage vendors, and drive growth with real-time insights.
                            </motion.p>

                            <motion.div
                                variants={fadeInUp}
                                className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                            >
                                <Button
                                    size="lg"
                                    onClick={() => handleOpenRegister()}
                                    className="h-14 px-8 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-emerald-500/50"
                                >
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 px-8 text-lg border-emerald-500/50 text-emerald-100 hover:bg-emerald-500/10 hover:border-emerald-400"
                                >
                                    <Play className="mr-2 h-5 w-5" />
                                    Watch Demo
                                </Button>
                            </motion.div>

                            {/* Trust Indicators */}
                            <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center lg:justify-start gap-6">
                                <div className="flex -space-x-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-[#004030] flex items-center justify-center text-white text-xs font-medium">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-left">
                                    <p className="text-emerald-100 font-semibold">Join 10K+ businesses</p>
                                    <p className="text-emerald-100/60 text-sm">already using StockFlow</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right - Dashboard Preview */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="relative"
                        >
                            <div className="relative">
                                {/* Glow Effect */}
                                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />

                                {/* Dashboard Image */}
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/20">
                                    <img
                                        src="/images/landing/dashboard-hero.png"
                                        alt="StockFlow Dashboard"
                                        className="w-full h-auto"
                                    />
                                    {/* Overlay gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#004030]/50 to-transparent pointer-events-none" />
                                </div>

                                {/* Floating Stats Cards */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl border border-slate-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">+147%</p>
                                            <p className="text-xs text-slate-500">Efficiency Increase</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                    className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-xl border border-slate-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900">-80%</p>
                                            <p className="text-xs text-slate-500">Time Saved</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <div className="flex flex-col items-center gap-2 text-emerald-300/60">
                        <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="h-10 w-6 rounded-full border-2 border-emerald-300/30 flex items-start justify-center p-1"
                        >
                            <div className="h-2 w-1 bg-emerald-400 rounded-full" />
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-slate-50 border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="text-center group"
                            >
                                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white shadow-lg shadow-slate-200/50 mb-4 group-hover:shadow-emerald-500/20 group-hover:scale-110 transition-all">
                                    <stat.icon className="h-6 w-6 text-emerald-600" />
                                </div>
                                <p className="text-3xl sm:text-4xl font-bold text-slate-900">{stat.value}</p>
                                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">Features</Badge>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
                            Everything you need to
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                                manage inventory
                            </span>
                        </h2>
                        <p className="mt-4 text-lg text-slate-600">
                            Powerful features built for modern businesses. Start simple, scale infinitely.
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="group p-8 rounded-2xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10"
                            >
                                <div className={cn(
                                    "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform",
                                    feature.gradient
                                )}>
                                    <feature.icon className="h-7 w-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Team Section with Image */}
            <section className="py-24 bg-gradient-to-br from-slate-50 to-emerald-50/30 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Image */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInLeft}
                            className="relative order-2 lg:order-1"
                        >
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                <img
                                    src="/images/landing/team-warehouse.png"
                                    alt="Team collaboration"
                                    className="w-full h-[500px] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#004030]/60 to-transparent" />
                            </div>
                            {/* Decorative elements */}
                            <div className="absolute -top-8 -left-8 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-50" />
                            <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-teal-200 rounded-full blur-3xl opacity-50" />
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInRight}
                            className="order-1 lg:order-2"
                        >
                            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">Collaboration</Badge>
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                                Empower your entire
                                <br />
                                <span className="text-emerald-600">workforce</span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-8">
                                From the warehouse floor to the executive suite, StockFlow provides the tools your team needs to collaborate efficiently and keep inventory moving.
                            </p>

                            <div className="space-y-4">
                                {[
                                    'Real-time synchronization across all devices',
                                    'Role-based access for secure team collaboration',
                                    'Mobile-first design for warehouse operations',
                                    'Complete audit logs for accountability'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                            <Check className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <span className="text-slate-700">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                size="lg"
                                className="mt-8 bg-[#004030] hover:bg-[#003025] text-white"
                                onClick={() => handleOpenRegister()}
                            >
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <Badge className="mb-4 bg-violet-100 text-violet-700 border-violet-200">Testimonials</Badge>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                            Loved by businesses worldwide
                        </h2>
                        <p className="mt-4 text-lg text-slate-600">
                            See what our customers have to say about StockFlow
                        </p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {testimonials.map((testimonial, index) => (
                            <motion.div
                                key={index}
                                variants={fadeInUp}
                                className="p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Award key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-slate-700 italic mb-6 leading-relaxed">
                                    "{testimonial.quote}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                                        {testimonial.author.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{testimonial.author}</p>
                                        <p className="text-sm text-slate-500">{testimonial.role}, {testimonial.company}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center max-w-3xl mx-auto mb-12"
                    >
                        <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">Pricing</Badge>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                            Simple, transparent pricing
                        </h2>
                        <p className="mt-4 text-lg text-slate-600">
                            Start free, upgrade when you're ready
                        </p>

                        {/* Billing Toggle */}
                        <div className="mt-8 inline-flex items-center gap-4 p-1.5 bg-white rounded-full shadow-sm border border-slate-200">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={cn(
                                    "px-6 py-2.5 rounded-full text-sm font-medium transition-all",
                                    billingCycle === 'monthly' ? "bg-[#004030] text-white shadow-md" : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={cn(
                                    "px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                                    billingCycle === 'yearly' ? "bg-[#004030] text-white shadow-md" : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                Yearly
                                <Badge className="bg-emerald-100 text-emerald-700 text-xs">Save 20%</Badge>
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {plans.map((plan) => (
                            <motion.div
                                key={plan.id}
                                variants={scaleIn}
                                className={cn(
                                    "relative p-8 rounded-3xl border-2 bg-white transition-all duration-300",
                                    plan.isPopular
                                        ? "border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-105"
                                        : "border-slate-200 hover:border-emerald-300 hover:shadow-xl"
                                )}
                            >
                                {plan.isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-4 py-1 shadow-lg">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                    <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                                </div>

                                <div className="text-center mb-8">
                                    <span className="text-5xl font-bold text-slate-900">
                                        ${billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly}
                                    </span>
                                    <span className="text-slate-500">
                                        {billingCycle === 'monthly' ? '/month' : '/year'}
                                    </span>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                            <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => handleOpenRegister(plan.id)}
                                    className={cn(
                                        "w-full h-12 font-semibold",
                                        plan.isPopular
                                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                                    )}
                                >
                                    Get Started
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-br from-[#004030] via-[#003025] to-[#002018] relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl" />
                </div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="relative z-10 max-w-4xl mx-auto text-center px-4"
                >
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                        Ready to transform your
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                            inventory management?
                        </span>
                    </h2>
                    <p className="mt-6 text-lg text-emerald-100/70 max-w-2xl mx-auto">
                        Join thousands of businesses already using StockFlow to streamline their operations and boost efficiency.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={() => handleOpenRegister()}
                            className="h-14 px-10 text-lg bg-white text-[#004030] hover:bg-emerald-50 font-semibold shadow-xl hover:scale-105 transition-all"
                        >
                            Start Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Link href="/login">
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 px-10 text-lg border-emerald-400/50 text-emerald-100 hover:bg-emerald-500/10"
                            >
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-16 bg-[#004030]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">StockFlow</span>
                            </div>
                            <p className="text-sm text-emerald-200/60">
                                The modern inventory management platform for growing businesses.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-emerald-200/60">
                                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-emerald-200/60">
                                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-emerald-200/60">
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-emerald-800/50 text-center">
                        <p className="text-sm text-emerald-200/50">
                            © {new Date().getFullYear()} StockFlow. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Registration Modal */}
            <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {registrationSuccess ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                    </div>
                                    <span className="text-xl">Registration Successful!</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                                        <Package className="h-6 w-6 text-white" />
                                    </div>
                                    <span>Start your free trial</span>
                                </div>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {registrationSuccess ? (
                        <div className="text-center py-6">
                            <p className="text-slate-600 mb-4">
                                Your organization is pending approval. We'll notify you by email once your account is approved.
                            </p>
                            <Button onClick={() => setRegisterOpen(false)} className="bg-emerald-600 hover:bg-emerald-700">
                                Got it
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="orgName">Organization Name</Label>
                                <Input
                                    id="orgName"
                                    placeholder="Your Company Name"
                                    value={formData.organizationName}
                                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="orgCode">Organization Code</Label>
                                <Input
                                    id="orgCode"
                                    placeholder="ACME"
                                    value={formData.organizationCode}
                                    onChange={(e) => setFormData({ ...formData, organizationCode: e.target.value.toUpperCase() })}
                                    maxLength={10}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Your Name</Label>
                                <Input
                                    id="fullName"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="terms"
                                    checked={formData.agreeTerms}
                                    onCheckedChange={(checked) => setFormData({ ...formData, agreeTerms: checked as boolean })}
                                />
                                <label htmlFor="terms" className="text-sm text-slate-600">
                                    I agree to the Terms of Service and Privacy Policy
                                </label>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </Button>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
