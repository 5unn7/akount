import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { TransactionsList } from "@/components/transactions/TransactionsList";

export const metadata: Metadata = {
    title: "Transactions | Akount",
    description: "View and manage all your transactions",
};

interface TransactionsPageProps {
    searchParams: Promise<{
        accountId?: string;
        startDate?: string;
        endDate?: string;
    }>;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
    const params = await searchParams;

    return (
        <div className="flex-1 space-y-5">
            <div className="fi fi1">
                <PageHeader
                    title="Transactions"
                    subtitle="View, filter, and manage all your transactions"
                    actions={
                        <Button
                            size="sm"
                            className="h-8 gap-1.5 rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
                            asChild
                        >
                            <Link href="/banking/imports">
                                <Upload className="h-3.5 w-3.5" />
                                Import
                            </Link>
                        </Button>
                    }
                />
            </div>

            <div className="fi fi2">
                <Suspense
                    key={`${params.accountId}-${params.startDate}-${params.endDate}`}
                    fallback={<TransactionsListSkeleton />}
                >
                    <TransactionsList filters={params} />
                </Suspense>
            </div>
        </div>
    );
}

function TransactionsListSkeleton() {
    return (
        <div className="space-y-4">
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass rounded-lg px-4 py-3.5">
                        <div className="h-3 w-16 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                    </div>
                ))}
            </div>

            {/* Filters skeleton */}
            <div className="glass rounded-[14px] p-4">
                <div className="h-8 w-full max-w-xs bg-muted animate-pulse rounded-lg" />
            </div>

            {/* Table skeleton */}
            <div className="glass rounded-[14px] overflow-hidden">
                <div className="divide-y divide-ak-border">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex items-center gap-4 px-4 py-3">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                            </div>
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
