import { Suspense } from "react";
import type { Metadata } from "next";
import { TransactionsList } from "@/components/transactions/TransactionsList";
import { Card, CardContent } from "@/components/ui/card";

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
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        Transactions
                    </h2>
                    <p className="text-muted-foreground">
                        View, filter, and manage all your transactions
                    </p>
                </div>
            </div>

            <Suspense
                key={`${params.accountId}-${params.startDate}-${params.endDate}`}
                fallback={<TransactionsListSkeleton />}
            >
                <TransactionsList filters={params} />
            </Suspense>
        </div>
    );
}

/**
 * Loading skeleton for transactions list
 */
function TransactionsListSkeleton() {
    return (
        <div className="space-y-4">
            {/* Filters skeleton */}
            <Card>
                <CardContent className="pt-6">
                    <div className="h-20 bg-muted animate-pulse rounded" />
                </CardContent>
            </Card>

            {/* Table skeleton */}
            <div className="rounded-md border">
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                        <div key={i} className="flex gap-4">
                            <div className="h-12 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-12 flex-1 bg-muted animate-pulse rounded" />
                            <div className="h-12 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-12 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-12 w-28 bg-muted animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
