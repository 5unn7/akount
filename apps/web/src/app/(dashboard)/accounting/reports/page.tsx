import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FileText, TrendingUp, DollarSign, Scale, BookOpen, Users, Receipt } from "lucide-react";

export const metadata: Metadata = {
    title: "Financial Reports | Akount",
    description: "Generate financial statements and management reports",
};

const reports = [
    {
        title: "Profit & Loss",
        description: "Income statement showing revenue, expenses, and net income over a period",
        icon: TrendingUp,
        href: "/accounting/reports/profit-loss",
        color: "text-finance-income",
    },
    {
        title: "Balance Sheet",
        description: "Financial position snapshot showing assets, liabilities, and equity",
        icon: Scale,
        href: "/accounting/reports/balance-sheet",
        color: "text-ak-blue",
    },
    {
        title: "Cash Flow",
        description: "Operating, investing, and financing activity cash movements",
        icon: DollarSign,
        href: "/accounting/reports/cash-flow",
        color: "text-primary",
    },
    {
        title: "Trial Balance",
        description: "General ledger account balances to verify double-entry accuracy",
        icon: BookOpen,
        href: "/accounting/reports/trial-balance",
        color: "text-ak-purple",
    },
    {
        title: "General Ledger",
        description: "Detailed transaction history for a specific GL account",
        icon: FileText,
        href: "/accounting/reports/general-ledger",
        color: "text-ak-teal",
    },
    {
        title: "Spending by Category",
        description: "Expense breakdown by GL account with percentages",
        icon: Receipt,
        href: "/accounting/reports/spending",
        color: "text-finance-expense",
    },
    {
        title: "Revenue by Client",
        description: "Income analysis grouped by client with invoice counts",
        icon: Users,
        href: "/accounting/reports/revenue",
        color: "text-finance-income",
    },
];

export default function ReportsHomePage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Financial Reports</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Generate comprehensive financial statements and management reports
                    </p>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => {
                    const Icon = report.icon;
                    return (
                        <Link
                            key={report.href}
                            href={report.href}
                            className="group glass rounded-xl p-6 transition-all hover:border-ak-border-2 hover:-translate-y-px"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`rounded-lg p-2.5 glass-2 ${report.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-medium font-heading group-hover:text-primary transition-colors">
                                        {report.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {report.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Help Text */}
            <div className="glass rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-2 flex-1">
                        <h4 className="font-medium">Report Tips</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• All reports support multi-entity consolidation (same currency required)</li>
                            <li>• Use date range filters to compare periods</li>
                            <li>• Export reports to PDF or CSV for offline analysis</li>
                            <li>• Trial Balance verifies your double-entry bookkeeping accuracy</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
