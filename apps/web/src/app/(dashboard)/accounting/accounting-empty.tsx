'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, ListTree, BookOpen, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export function AccountingEmptyState() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-2 mb-8">
                    <h1 className="text-3xl font-heading">Set Up Your Books</h1>
                    <p className="text-muted-foreground font-heading italic">
                        Get started with professional accounting in 3 easy steps
                    </p>
                </div>

                {/* Setup Steps */}
                <div className="space-y-4">
                    {/* Step 1: Seed COA */}
                    <Card className="glass border-ak-border-2 p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full glass-2 flex items-center justify-center border border-ak-border-2">
                                <span className="text-sm font-semibold text-primary">
                                    1
                                </span>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <ListTree className="h-5 w-5 text-ak-green" />
                                    <h3 className="text-lg font-heading">
                                        Set Up Chart of Accounts
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Start with a standard Canadian chart of accounts, pre-configured
                                    with common business account types (Assets, Liabilities, Equity,
                                    Revenue, Expenses).
                                </p>
                                <Button
                                    asChild
                                    size="sm"
                                    className="gap-2 bg-primary hover:bg-ak-pri-hover text-black font-medium"
                                >
                                    <Link href="/accounting/chart-of-accounts">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Seed Default COA
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Step 2: Configure Fiscal Year */}
                    <Card className="glass border-ak-border-2 p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full glass-2 flex items-center justify-center border border-ak-border-2">
                                <span className="text-sm font-semibold text-primary">
                                    2
                                </span>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-ak-blue" />
                                    <h3 className="text-lg font-heading">
                                        Set Fiscal Year
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Define your fiscal year start date and create 12 monthly periods.
                                    This structure enables period-based reporting and fiscal period
                                    locking.
                                </p>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Link href="/accounting/fiscal-periods">
                                        Create Fiscal Year
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Step 3: Optional - Configure Tax Rates */}
                    <Card className="glass border-ak-border-2 p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full glass-2 flex items-center justify-center border border-ak-border-2">
                                <span className="text-sm font-semibold text-muted-foreground">
                                    3
                                </span>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-ak-purple" />
                                    <h3 className="text-lg font-heading">
                                        Configure Tax Rates
                                        <span className="text-xs text-muted-foreground ml-2">
                                            (Optional)
                                        </span>
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Set up GST/HST/PST/QST rates for your jurisdiction. Canadian
                                    presets available (13% HST-ON, 5% GST, 9.975% QST, etc.).
                                </p>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Link href="/accounting/tax-rates">
                                        Configure Tax Rates
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-muted-foreground">
                        Need help? Check out our{' '}
                        <Link
                            href="/help/accounting"
                            className="text-primary hover:underline"
                        >
                            Accounting Guide
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
