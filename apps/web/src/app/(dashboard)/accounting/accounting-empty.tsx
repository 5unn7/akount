'use client';

import { GlowCard } from '@/components/ui/glow-card';
import { Button } from '@/components/ui/button';
import {
    ListTree,
    BookOpen,
    BarChart3,
    Package,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const SETUP_STEPS = [
    {
        title: 'Chart of Accounts',
        description: 'Seed your financial foundation',
        icon: ListTree,
        color: 'text-ak-green',
        dimBg: 'bg-ak-green-dim',
        glowColor: 'rgba(52, 211, 153, 0.04)',
        href: '/accounting/chart-of-accounts',
        cta: 'Set Up',
        primary: true,
    },
    {
        title: 'Fiscal Year',
        description: '12 monthly reporting periods',
        icon: BookOpen,
        color: 'text-ak-blue',
        dimBg: 'bg-ak-blue-dim',
        glowColor: 'rgba(96, 165, 250, 0.04)',
        href: '/accounting/fiscal-periods',
        cta: 'Create',
        primary: false,
    },
    {
        title: 'Tax Rates',
        description: 'GST, HST, PST presets',
        icon: BarChart3,
        color: 'text-ak-purple',
        dimBg: 'bg-ak-purple-dim',
        glowColor: 'rgba(167, 139, 250, 0.04)',
        href: '/accounting/tax-rates',
        cta: 'Configure',
        primary: false,
    },
    {
        title: 'Fixed Assets',
        description: 'Equipment & depreciation',
        icon: Package,
        color: 'text-ak-teal',
        dimBg: 'bg-ak-teal-dim',
        glowColor: 'rgba(45, 212, 191, 0.04)',
        href: '/accounting/assets',
        cta: 'Add',
        primary: false,
    },
] as const;

/**
 * Setup action cards shown at the top of the accounting overview
 * for new users who haven't configured their books yet.
 */
export function AccountingSetupCards() {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-ak-pri-dim flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="absolute -inset-2 rounded-full bg-ak-pri-glow blur-xl glow-animate pointer-events-none" />
                </div>
                <div>
                    <h2 className="text-lg font-heading font-normal">
                        Set Up Your Books
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Complete these steps to unlock your accounting dashboard
                    </p>
                </div>
            </div>

            {/* 4-card grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {SETUP_STEPS.map((step) => {
                    const Icon = step.icon;
                    return (
                        <GlowCard
                            key={step.title}
                            variant="glass"
                            glowColor={step.glowColor}
                            className="p-5 hover:-translate-y-px hover:border-ak-border-2 transition-all"
                        >
                            <div className="space-y-3">
                                <div
                                    className={`h-10 w-10 rounded-lg ${step.dimBg} flex items-center justify-center`}
                                >
                                    <Icon
                                        className={`h-5 w-5 ${step.color}`}
                                    />
                                </div>
                                <div>
                                    <h3 className="font-heading font-normal text-sm">
                                        {step.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {step.description}
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    size="sm"
                                    className={
                                        step.primary
                                            ? 'gap-1.5 bg-primary hover:bg-ak-pri-hover text-black font-medium w-full'
                                            : 'gap-1.5 w-full'
                                    }
                                    variant={
                                        step.primary ? 'default' : 'outline'
                                    }
                                >
                                    <Link href={step.href}>
                                        {step.cta}
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </GlowCard>
                    );
                })}
            </div>
        </div>
    );
}
