'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Sparkles,
    TrendingUp,
    Clock,
    Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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

// Features data with unified styling
const features = [
    {
        icon: Package,
        title: 'Real-time Inventory',
        description: 'Track stock levels instantly with live updates and smart low-stock alerts.',
    },
    {
        icon: Store,
        title: 'Multi-Vendor Hub',
        description: 'Manage multiple vendors, track sales, and automate commission payouts.',
    },
    {
        icon: BarChart3,
        title: 'Smart Analytics',
        description: 'AI-powered insights and beautiful dashboards for data-driven decisions.',
    },
    {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Blazing fast performance with real-time sync across all your devices.',
    },
    {
        icon: Globe,
        title: 'Multi-Location',
        description: 'Seamlessly manage inventory across warehouses and store locations.',
    },
    {
        icon: Shield,
        title: 'Enterprise Security',
        description: 'Bank-level encryption with role-based access control.',
    }
];

// Stats with unified styling
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
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const handleOpenRegister = (planId?: string) => {
        router.push('/register');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-primary relative overflow-hidden">
                {/* Visual Magic: Atmospheric Glows for Loader */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 flex flex-col items-center"
                >
                    {/* Pulsing Logo Icon */}
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="h-24 w-24 rounded-[32px] bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.2)] mb-8"
                    >
                        <Package className="h-12 w-12 text-primary" />
                    </motion.div>

                    {/* Brand Name & Animated Progress */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center">
                            <h1 className="text-white font-black text-3xl tracking-[0.2em] leading-none">STOCKFLOW</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="h-[1px] w-4 bg-white/40" />
                                <span className="text-white/60 font-bold text-[10px] tracking-[0.4em] uppercase">Inventory Redefined</span>
                                <span className="h-[1px] w-4 bg-white/40" />
                            </div>
                        </div>

                        {/* High-End Loading Line */}
                        <div className="w-56 h-[3px] bg-white/10 rounded-full overflow-hidden relative">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-white w-full"
                                animate={{
                                    x: ['-100%', '100%']
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: "circInOut"
                                }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Subtle Decorative Bottom Text */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
                    <p className="text-white/20 text-[10px] font-black tracking-[0.5em] uppercase">Initializing Secure Environment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-primary/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-all group-hover:scale-105 group-hover:rotate-3">
                                <Package className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="font-black text-foreground text-lg tracking-tighter leading-none">STOCKFLOW</h1>
                                <span className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">Inventory</span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-10">
                            <a href="#features" className="text-[13px] font-black uppercase tracking-widest text-foreground/60 hover:text-primary transition-colors">Features</a>
                            <a href="#pricing" className="text-[13px] font-black uppercase tracking-widest text-foreground/60 hover:text-primary transition-colors">Pricing</a>
                            <a href="#testimonials" className="text-[13px] font-black uppercase tracking-widest text-foreground/60 hover:text-primary transition-colors">Testimonials</a>
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center gap-4">
                            {isAuthenticated ? (
                                <Link href="/Dashboard">
                                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-xs h-11 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105">
                                        Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" className="text-sm font-bold text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-xl px-6 h-11">
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => handleOpenRegister()}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-widest text-xs h-11 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
                                    >
                                        Start Free
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
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
                            className="md:hidden py-4 border-t border-primary-foreground/20"
                        >
                            <div className="flex flex-col gap-3">
                                <a href="#features" className="text-sm font-medium text-primary-foreground hover:text-primary-foreground py-2">Features</a>
                                <a href="#pricing" className="text-sm font-medium text-primary-foreground hover:text-primary-foreground py-2">Pricing</a>
                                <a href="#testimonials" className="text-sm font-medium text-primary-foreground hover:text-primary-foreground py-2">Testimonials</a>
                                <div className="flex gap-2 pt-2">
                                    <Link href="/login" className="flex-1">
                                        <Button variant="outline" className="w-full border-primary-foreground text-sidebar hover:bg-primary-foreground/10">Sign In</Button>
                                    </Link>
                                    <Button onClick={() => handleOpenRegister()} className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                                        Start Free
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden bg-background">
                {/* Visual Magic: Atmospheric Glows (Softened for Light Mode) */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] -mr-96 -mt-96 pointer-events-none animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -ml-44 -mb-44 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(26,93,106,0.05),transparent_70%)] pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="text-center lg:text-left"
                        >
                            <motion.div variants={fadeInUp}>
                                <Badge className="mb-8 bg-primary/10 text-primary border-primary/20 px-5 py-2 rounded-full font-black uppercase tracking-widest text-[10px] backdrop-blur-sm">
                                    <Sparkles className="h-3.5 w-3.5 mr-2 animate-bounce" />
                                    AI-Powered Inventory 2.0
                                </Badge>
                            </motion.div>

                            <motion.h1
                                variants={fadeInUp}
                                className="text-5xl sm:text-6xl lg:text-7xl font-black text-foreground leading-[1.05] tracking-tighter"
                            >
                                Inventory
                                <br />
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary/60">
                                    Redefined.
                                </span>
                            </motion.h1>

                            <motion.p
                                variants={fadeInUp}
                                className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
                            >
                                The executive platform for modern merchants. Scalable, intelligent, and designed to give you total command over your operations.
                            </motion.p>

                            <motion.div
                                variants={fadeInUp}
                                className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5"
                            >
                                <Button
                                    size="lg"
                                    onClick={() => handleOpenRegister()}
                                    className="h-16 px-10 text-sm font-black uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    Start Exploring
                                    <ArrowRight className="ml-3 h-5 w-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-16 px-10 text-sm font-black uppercase tracking-widest border-border text-foreground hover:bg-primary/5 rounded-2xl transition-all backdrop-blur-sm shadow-sm"
                                >
                                    <Play className="mr-3 h-5 w-5 fill-primary text-primary" />
                                    Live Demo
                                </Button>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="mt-16 flex items-center justify-center lg:justify-start gap-8">
                                <div className="flex -space-x-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-12 w-12 rounded-2xl bg-white border-2 border-background overflow-hidden shadow-xl ring-2 ring-primary/10">
                                            <div className="w-full h-full bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center text-primary text-xs font-black">
                                                {String.fromCharCode(65 + i)}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="h-12 w-12 rounded-2xl bg-primary border-2 border-background flex items-center justify-center text-primary-foreground text-xs font-black shadow-xl ring-2 ring-primary/20">
                                        +
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-foreground text-sm font-black tracking-tight uppercase">Trusted by 500+ Leaders</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Sparkles key={i} className="h-3 w-3 text-primary fill-primary" />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Right - Dashboard Preview */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="relative group"
                        >
                            <div className="relative">
                                {/* Decorative elements behind image */}
                                <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-primary/0 rounded-[32px] blur-xl opacity-30 group-hover:opacity-60 transition duration-1000" />

                                {/* Dashboard Image Container */}
                                <div className="relative rounded-[32px] overflow-hidden border border-border shadow-2xl shadow-primary/10 bg-white aspect-video flex items-center justify-center group-hover:border-primary/20 transition-all duration-500">
                                    <img
                                        src="/images/landing/dashboard-hero.png"
                                        alt="StockFlow Premium Dashboard"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.querySelector('.placeholder-icon')?.classList.remove('hidden');
                                        }}
                                    />
                                    <div className="placeholder-icon hidden absolute inset-0 flex flex-col items-center justify-center bg-primary/5">
                                        <Package className="h-24 w-24 text-primary/20 animate-pulse" />
                                        <div className="mt-4 flex flex-col gap-2 items-center">
                                            <div className="h-2 w-32 bg-primary/20 rounded-full" />
                                            <div className="h-2 w-20 bg-primary/10 rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Classy Floating Cards (Refined for Light Mode) */}
                                <motion.div
                                    animate={{
                                        y: [0, -10, 0],
                                    }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -bottom-10 -left-10 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-border shadow-2xl shadow-primary/10 hidden sm:block"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 text-white">
                                            <TrendingUp className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-foreground tracking-tighter">147%</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Performance</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{
                                        y: [0, 10, 0],
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -top-8 -right-8 bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-border shadow-2xl shadow-primary/10 hidden sm:block"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-[#1a5d6a]/20 flex items-center justify-center shadow-lg shadow-primary/5">
                                            <Clock className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-3xl font-black text-foreground tracking-tighter">80%</p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Time Saved</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-muted/30 border-y border-border">
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
                                <div className="inline-flex items-center justify-center h-14 w-14 rounded-md bg-background mb-4 group-hover:scale-110 transition-all">
                                    <stat.icon className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Features</Badge>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                            Everything you need to
                            <br />
                            <span className="text-primary">
                                manage inventory
                            </span>
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
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
                                className="group p-8 rounded-md border border-border hover:border-primary bg-background hover:bg-muted/50 transition-all duration-300 "
                            >
                                <div className="h-14 w-14 rounded-md bg-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="h-7 w-7 text-primary-foreground" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-24 bg-muted/30 overflow-hidden">
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
                            <div className="relative rounded-md overflow-hidden">
                                <img
                                    src="/images/landing/team-warehouse.png"
                                    alt="Team collaboration"
                                    className="w-full h-[500px] object-cover"
                                />
                            </div>
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeInRight}
                            className="order-1 lg:order-2"
                        >
                            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Collaboration</Badge>
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                                Empower your entire
                                <br />
                                <span className="text-primary">workforce</span>
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                From the warehouse floor to the executive suite, StockFlow provides the tools your team needs to collaborate efficiently and keep inventory moving.
                            </p>

                            <div className="flex flex-col gap-4">
                                {[
                                    'Real-time synchronization across all devices',
                                    'Role-based access for secure team collaboration',
                                    'Mobile-first design for warehouse operations',
                                    'Complete audit logs for accountability'
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Check className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-muted-foreground">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <Button
                                size="lg"
                                className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90"
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
            <section id="testimonials" className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center max-w-3xl mx-auto mb-16"
                    >
                        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Testimonials</Badge>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                            Loved by businesses worldwide
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
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
                                className="p-8 rounded-md bg-muted/30 border border-border  transition-all duration-300"
                            >
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Award key={i} className="h-5 w-5 text-primary fill-primary" />
                                    ))}
                                </div>
                                <p className="text-muted-foreground italic mb-6 leading-relaxed">
                                    "{testimonial.quote}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                        {testimonial.author.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{testimonial.author}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="text-center max-w-3xl mx-auto mb-12"
                    >
                        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                            Simple, transparent pricing
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Start free, upgrade when you're ready
                        </p>

                        {/* Billing Toggle */}
                        <div className="mt-8 inline-flex items-center gap-4 p-1.5 bg-background rounded-full border border-border">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={cn(
                                    "px-6 py-2.5 rounded-full text-sm font-medium transition-all",
                                    billingCycle === 'monthly' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={cn(
                                    "px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                                    billingCycle === 'yearly' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Yearly
                                <Badge className="bg-primary/20 text-primary text-xs">Save 20%</Badge>
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
                                    "relative p-8 rounded-md border-2 bg-background transition-all duration-300",
                                    plan.isPopular
                                        ? "border-primary  scale-105"
                                        : "border-border hover:border-primary/50 "
                                )}
                            >
                                {plan.isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-primary-foreground border-0 px-4 py-1">
                                            Most Popular
                                        </Badge>
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                                </div>

                                <div className="text-center mb-8">
                                    <span className="text-5xl font-bold text-foreground">
                                        ${billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {billingCycle === 'monthly' ? '/month' : '/year'}
                                    </span>
                                </div>

                                <ul className="flex flex-col gap-3 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Check className="h-5 w-5 text-primary shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => handleOpenRegister(plan.id)}
                                    className={cn(
                                        "w-full h-12 font-semibold",
                                        plan.isPopular
                                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                            : "bg-muted text-foreground hover:bg-muted/80"
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
            <section className="py-24 bg-primary relative overflow-hidden">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="relative z-10 max-w-4xl mx-auto text-center px-4"
                >
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground">
                        Ready to transform your
                        <br />
                        <span className="text-primary-foreground/90">
                            inventory management?
                        </span>
                    </h2>
                    <p className="mt-6 text-lg text-primary-foreground/70 max-w-2xl mx-auto">
                        Join thousands of businesses already using StockFlow to streamline their operations and boost efficiency.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={() => handleOpenRegister()}
                            className="h-14 px-10 text-lg bg-background text-primary hover:bg-background/90 font-semibold hover:scale-105 transition-all"
                        >
                            Start Free Trial
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Link href="/login">
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 px-10 text-lg border-primary-foreground/50 text-primary hover:text-white hover:bg-primary-foreground/10"
                            >
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-20 bg-background border-t border-primary/10 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
                        <div className="col-span-2 lg:col-span-2">
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                                    <Package className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="font-black text-foreground text-lg tracking-tighter leading-none">STOCKFLOW</h1>
                                    <span className="text-[10px] font-bold text-primary/60 tracking-widest uppercase">Inventory</span>
                                </div>
                            </Link>
                            <p className="text-sm text-muted-foreground mt-6 max-w-sm leading-relaxed font-medium">
                                The executive inventory management platform built for modern organizations. Command your operations with precision.
                            </p>
                            <div className="flex gap-4 mt-6">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
                                        <div className="h-3.5 w-3.5 bg-primary/40 rounded-sm" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-primary mb-6">Product</h4>
                            <ul className="flex flex-col gap-4 text-sm font-bold text-muted-foreground">
                                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-primary mb-6">Company</h4>
                            <ul className="flex flex-col gap-4 text-sm font-bold text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-primary mb-6">Legal</h4>
                            <ul className="flex flex-col gap-4 text-sm font-bold text-muted-foreground">
                                <li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-primary/10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-xs font-bold text-primary/40 tracking-widest uppercase">
                            © {new Date().getFullYear()} STOCKFLOW. ALL RIGHTS RESERVED.
                        </p>
                        <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-primary/40">
                            <span className="cursor-pointer hover:text-primary">Status</span>
                            <span className="cursor-pointer hover:text-primary">System</span>
                        </div>
                    </div>
                </div>
            </footer >
        </div >
    );
}
