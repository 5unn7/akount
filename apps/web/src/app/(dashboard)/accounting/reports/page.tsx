import type { Metadata } from "next";
import Link from "next/link";
import {
    BarChart3,
    FileText,
    TrendingUp,
    DollarSign,
    Scale,
    BookOpen,
    Users,
    Receipt,
    ArrowRight,
} from "lucide-react";
import { getEntitySelection, validateEntityId } from "@/lib/entity-cookies";
import { listEntities } from "@/lib/api/entities";
import { getProfitLossReport, getBalanceSheetReport } from "@/lib/api/reports";
import { formatCurrency } from "@/lib/utils/currency";

export const metadata: Metadata = {
    title: "Financial Reports | Akount",
    description: "Generate financial statements and management reports",
};

// ---- Date preset helpers (computed at render time in Server Component) ----

function getDatePresets() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const today = now.toISOString().split('T')[0];

    // Last month
    const lmStart = new Date(year, month - 1, 1);
    const lmEnd = new Date(year, month, 0); // day 0 of current month = last day of prev month

    // This quarter
    const qStartMonth = Math.floor(month / 3) * 3;
    const tqStart = new Date(year, qStartMonth, 1);

    // YTD
    const ytdStart = new Date(year, 0, 1);

    const fmt = (d: Date) => d.toISOString().split('T')[0];

    return {
        lastMonth: { startDate: fmt(lmStart), endDate: fmt(lmEnd) },
        thisQuarter: { startDate: fmt(tqStart), endDate: today },
        ytd: { startDate: fmt(ytdStart), endDate: today },
        asOfToday: { asOfDate: today },
        asOfLastMonth: { asOfDate: fmt(lmEnd) },
    };
}

interface QuickLink {
    label: string;
    params: string;
}

function periodLinks(presets: ReturnType<typeof getDatePresets>): QuickLink[] {
    return [
        { label: 'Last Month', params: `startDate=${presets.lastMonth.startDate}&endDate=${presets.lastMonth.endDate}` },
        { label: 'This Quarter', params: `startDate=${presets.thisQuarter.startDate}&endDate=${presets.thisQuarter.endDate}` },
        { label: 'YTD', params: `startDate=${presets.ytd.startDate}&endDate=${presets.ytd.endDate}` },
    ];
}

function pointInTimeLinks(presets: ReturnType<typeof getDatePresets>): QuickLink[] {
    return [
        { label: 'Today', params: `asOfDate=${presets.asOfToday.asOfDate}` },
        { label: 'Last Month End', params: `asOfDate=${presets.asOfLastMonth.asOfDate}` },
    ];
}

// ---- Report definitions ----

interface ReportDef {
    title: string;
    description: string;
    icon: typeof TrendingUp;
    href: string;
    color: string;
    dimBg: string;
    quickLinkType: 'period' | 'point-in-time' | 'none';
}

const reports: ReportDef[] = [
    {
        title: "Profit & Loss",
        description: "Income statement showing revenue, expenses, and net income over a period",
        icon: TrendingUp,
        href: "/accounting/reports/profit-loss",
        color: "text-finance-income",
        dimBg: "bg-ak-green-dim",
        quickLinkType: "period",
    },
    {
        title: "Balance Sheet",
        description: "Financial position snapshot showing assets, liabilities, and equity",
        icon: Scale,
        href: "/accounting/reports/balance-sheet",
        color: "text-ak-blue",
        dimBg: "bg-ak-blue-dim",
        quickLinkType: "point-in-time",
    },
    {
        title: "Cash Flow",
        description: "Operating, investing, and financing activity cash movements",
        icon: DollarSign,
        href: "/accounting/reports/cash-flow",
        color: "text-primary",
        dimBg: "bg-ak-pri-dim",
        quickLinkType: "period",
    },
    {
        title: "Trial Balance",
        description: "General ledger account balances to verify double-entry accuracy",
        icon: BookOpen,
        href: "/accounting/reports/trial-balance",
        color: "text-ak-purple",
        dimBg: "bg-ak-purple-dim",
        quickLinkType: "point-in-time",
    },
    {
        title: "General Ledger",
        description: "Detailed transaction history for a specific GL account",
        icon: FileText,
        href: "/accounting/reports/general-ledger",
        color: "text-ak-teal",
        dimBg: "bg-ak-teal-dim",
        quickLinkType: "none",
    },
    {
        title: "Spending by Category",
        description: "Expense breakdown by GL account with percentages",
        icon: Receipt,
        href: "/accounting/reports/spending",
        color: "text-finance-expense",
        dimBg: "bg-ak-red-dim",
        quickLinkType: "period",
    },
    {
        title: "Revenue by Client",
        description: "Income analysis grouped by client with invoice counts",
        icon: Users,
        href: "/accounting/reports/revenue",
        color: "text-finance-income",
        dimBg: "bg-ak-green-dim",
        quickLinkType: "period",
    },
];

// ---- Stat preview fetch helpers ----

interface ReportStats {
    netIncome: number | null; // cents
    totalRevenue: number | null;
    totalExpenses: number | null;
    totalAssets: number | null;
    totalLiabilities: number | null;
}

async function fetchReportStats(entityId: string): Promise<ReportStats> {
    const now = new Date();
    const startOfYear = `${now.getFullYear()}-01-01T00:00:00.000Z`;
    const today = now.toISOString();

    const [plResult, bsResult] = await Promise.allSettled([
        getProfitLossReport({
            entityId,
            startDate: startOfYear,
            endDate: today,
        }),
        getBalanceSheetReport({
            entityId,
            asOfDate: today,
        }),
    ]);

    const pl = plResult.status === 'fulfilled' ? plResult.value : null;
    const bs = bsResult.status === 'fulfilled' ? bsResult.value : null;

    return {
        netIncome: pl?.netIncome ?? null,
        totalRevenue: pl?.revenue.total ?? null,
        totalExpenses: pl?.expenses.total ?? null,
        totalAssets: bs?.totalAssets ?? null,
        totalLiabilities: bs?.liabilities.total ?? null,
    };
}

// ---- Page Component ----

export default async function ReportsHomePage() {
    const [{ entityId: rawEntityId }, allEntities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, allEntities);

    // Compute quick-generate date presets
    const presets = getDatePresets();

    // Fetch stats if entity is selected
    const stats: ReportStats = entityId
        ? await fetchReportStats(entityId)
        : { netIncome: null, totalRevenue: null, totalExpenses: null, totalAssets: null, totalLiabilities: null };

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

            {/* Stat previews — only shown when entity is selected and data is available */}
            {entityId && (stats.netIncome !== null || stats.totalAssets !== null) && (
                <div className="grid gap-4 md:grid-cols-3">
                    {stats.netIncome !== null && (
                        <Link
                            href="/accounting/reports/profit-loss"
                            className="glass rounded-xl p-5 transition-all hover:border-ak-border-2 hover:-translate-y-px group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        YTD Net Income
                                    </p>
                                    <p className={`text-2xl font-mono font-semibold ${
                                        stats.netIncome >= 0 ? 'text-ak-green' : 'text-ak-red'
                                    }`}>
                                        {formatCurrency(stats.netIncome)}
                                    </p>
                                </div>
                                <div className="rounded-lg p-2.5 bg-ak-green-dim text-finance-income">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                View Profit &amp; Loss
                                <ArrowRight className="h-3 w-3" />
                            </div>
                        </Link>
                    )}
                    {stats.totalAssets !== null && (
                        <Link
                            href="/accounting/reports/balance-sheet"
                            className="glass rounded-xl p-5 transition-all hover:border-ak-border-2 hover:-translate-y-px group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Total Assets
                                    </p>
                                    <p className="text-2xl font-mono font-semibold text-ak-blue">
                                        {formatCurrency(stats.totalAssets)}
                                    </p>
                                </div>
                                <div className="rounded-lg p-2.5 bg-ak-blue-dim text-ak-blue">
                                    <Scale className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                                View Balance Sheet
                                <ArrowRight className="h-3 w-3" />
                            </div>
                        </Link>
                    )}
                    {stats.totalRevenue !== null && stats.totalExpenses !== null && (
                        <div className="glass rounded-xl p-5">
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                    YTD Revenue vs Expenses
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Revenue</p>
                                        <p className="text-lg font-mono font-semibold text-ak-green">
                                            {formatCurrency(stats.totalRevenue)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Expenses</p>
                                        <p className="text-lg font-mono font-semibold text-ak-red">
                                            {formatCurrency(stats.totalExpenses)}
                                        </p>
                                    </div>
                                </div>
                                {/* Ratio bar */}
                                <div className="h-2 rounded-full bg-ak-bg-3 overflow-hidden flex">
                                    {stats.totalRevenue + stats.totalExpenses > 0 && (() => {
                                        const absRevenue = Math.abs(stats.totalRevenue);
                                        const absExpenses = Math.abs(stats.totalExpenses);
                                        const total = absRevenue + absExpenses;
                                        const revPct = total > 0 ? Math.min(100, Math.max(0, (absRevenue / total) * 100)) : 50;
                                        const expPct = total > 0 ? Math.min(100, Math.max(0, (absExpenses / total) * 100)) : 50;
                                        return (
                                            <>
                                                <div
                                                    className="h-full bg-ak-green transition-all"
                                                    style={{ width: `${revPct}%` }}
                                                />
                                                <div
                                                    className="h-full bg-ak-red transition-all"
                                                    style={{ width: `${expPct}%` }}
                                                />
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Reports Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((report) => {
                    const Icon = report.icon;
                    const quickLinks = report.quickLinkType === 'period'
                        ? periodLinks(presets)
                        : report.quickLinkType === 'point-in-time'
                            ? pointInTimeLinks(presets)
                            : [];
                    return (
                        <div key={report.href} className="group glass rounded-xl p-6 transition-all hover:border-ak-border-2 hover:-translate-y-px">
                            <Link href={report.href}>
                                <div className="flex items-start gap-4">
                                    <div className={`rounded-lg p-2.5 ${report.dimBg} ${report.color}`}>
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
                                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
                                </div>
                            </Link>
                            {quickLinks.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-ak-border flex items-center gap-2 flex-wrap">
                                    <span className="text-micro text-muted-foreground uppercase tracking-wider">Quick:</span>
                                    {quickLinks.map((ql) => (
                                        <Link
                                            key={ql.label}
                                            href={`${report.href}?${ql.params}`}
                                            className="text-xs px-2.5 py-1 rounded-md bg-ak-bg-3 hover:bg-ak-bg-4 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {ql.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
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
                            <li>All reports support multi-entity consolidation (same currency required)</li>
                            <li>Use date range filters to compare periods</li>
                            <li>Export reports to PDF or CSV for offline analysis</li>
                            <li>Trial Balance verifies your double-entry bookkeeping accuracy</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
