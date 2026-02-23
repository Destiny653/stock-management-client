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
            <div className="min-h-screen flex items-center justify-center bg-primary">
                <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary-foreground/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-md bg-primary-foreground flex items-center justify-center transition-transform group-hover:scale-105">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-xl font-bold text-primary-foreground">StockFlow</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Features</a>
                            <a href="#pricing" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Pricing</a>
                            <a href="#testimonials" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Testimonials</a>
                        </div>

                        {/* CTA Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            {isAuthenticated ? (
                                <Link href="/Dashboard">
                                    <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold transition-all">
                                        Go to Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10">
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => handleOpenRegister()}
                                        className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold transition-all"
                                    >
                                        Start Free Trial
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 text-primary-foreground hover:text-primary-foreground"
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
                                        <Button variant="outline" className="w-full border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">Sign In</Button>
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
            <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-primary">
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
                                <Badge className="mb-6 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 px-4 py-1.5">
                                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                                    Now with AI-powered insights
                                </Badge>
                            </motion.div>

                            <motion.h1
                                variants={fadeInUp}
                                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight"
                            >
                                Inventory Management
                                <br />
                                <span className="text-primary-foreground/80">
                                    Reimagined
                                </span>
                            </motion.h1>

                            <motion.p
                                variants={fadeInUp}
                                className="mt-6 text-lg sm:text-xl text-primary-foreground/70 max-w-xl mx-auto lg:mx-0"
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
                                    className="h-14 px-8 text-lg bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold transition-all hover:scale-105"
                                >
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="h-14 px-8 text-lg border-primary-foreground/50 text-primary hover:text-white hover:bg-primary-foreground/10 hover:border-primary-foreground"
                                >
                                    <Play className="mr-2 h-5 w-5" />
                                    Watch Demo
                                </Button>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="mt-12 flex items-center justify-center lg:justify-start gap-6">
                                <div className="flex gap-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-10 w-10 rounded-full bg-primary-foreground border-2 border-primary flex items-center justify-center text-primary text-xs font-medium">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-left">
                                    <p className="text-primary-foreground font-semibold">Join 10K+ businesses</p>
                                    <p className="text-primary-foreground/60 text-sm">already using StockFlow</p>
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
                                {/* Dashboard Image */}
                                <div className="relative rounded-md overflow-hidden border border-primary-foreground/20">
                                    <img
                                        src="/images/landing/dashboard-hero.png"
                                        alt="StockFlow Dashboard"
                                        className="w-full h-auto"
                                    />
                                </div>

                                {/* Floating Stats Cards */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="absolute -bottom-6 -left-6 bg-background rounded-md p-4 border border-border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">+147%</p>
                                            <p className="text-xs text-muted-foreground">Efficiency Increase</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                    className="absolute -top-4 -right-4 bg-background rounded-md p-4 border border-border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">-80%</p>
                                            <p className="text-xs text-muted-foreground">Time Saved</p>
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
            <footer className="py-16 bg-primary border-t border-primary-foreground/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="h-10 w-10 rounded-md bg-primary-foreground flex items-center justify-center transition-transform group-hover:scale-105">
                                    <Package className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-xl font-bold text-primary-foreground">StockFlow</span>
                            </Link>
                            <p className="text-sm text-primary-foreground/70 mt-4">
                                The modern inventory management platform for growing businesses.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-primary-foreground mb-4">Product</h4>
                            <ul className="flex flex-col gap-2 text-sm text-primary-foreground/70">
                                <li><a href="#features" className="hover:text-primary-foreground transition-colors">Features</a></li>
                                <li><a href="#pricing" className="hover:text-primary-foreground transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-primary-foreground transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-primary-foreground transition-colors">API</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-primary-foreground mb-4">Company</h4>
                            <ul className="flex flex-col gap-2 text-sm text-primary-foreground/70">
                                <li><a href="#" className="hover:text-primary-foreground transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-primary-foreground transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-primary-foreground transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-primary-foreground transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-primary-foreground mb-4">Legal</h4>
                            <ul className="flex flex-col gap-2 text-sm text-primary-foreground/70">
                                <li><a href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-primary-foreground transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-primary-foreground/20 text-center">
                        <p className="text-sm text-primary-foreground/50">
                            © {new Date().getFullYear()} StockFlow. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
