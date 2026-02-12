import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountsList } from "@/components/accounts/AccountsList";
import { AccountsPageHeader } from "@/components/accounts/AccountsPageHeader";
import { listEntities } from "@/lib/api/entities";
import type { AccountType } from "@/lib/api/accounts";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Accounts | Akount",
    description: "Manage your bank accounts, credit cards, investments, and loans",
};

interface AccountsPageProps {
    searchParams: Promise<{ type?: string }>;
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
    const params = await searchParams;
    const typeFilter = params.type as AccountType | undefined;
    const entities = await listEntities();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <AccountsPageHeader entities={entities} />

            <Suspense key={typeFilter ?? 'all'} fallback={<AccountsListSkeleton />}>
                <AccountsList type={typeFilter} entities={entities} />
            </Suspense>
        </div>
    );
}

/**
 * Loading skeleton for accounts list
 */
function AccountsListSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                            <div className="h-8 w-28 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
