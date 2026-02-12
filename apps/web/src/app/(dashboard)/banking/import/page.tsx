import type { Metadata } from "next";
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { listAccounts } from '@/lib/api/accounts';
import { ImportUploadForm } from '@/components/import/ImportUploadForm';

export const metadata: Metadata = {
    title: "Import Transactions | Akount",
    description: "Upload bank statements to automatically import transactions",
};

export default async function ImportPage() {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');

    // Fetch accounts for the dropdown
    let accounts: Array<{
        id: string;
        name: string;
        type: string;
        currency: string;
        entity: { id: string; name: string };
    }> = [];

    try {
        const result = await listAccounts({ isActive: true });
        accounts = result.accounts.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            currency: a.currency,
            entity: a.entity,
        }));
    } catch {
        // Accounts will be empty, form will show upload without account selection
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Import Transactions</h2>
                    <p className="text-muted-foreground">
                        Upload bank statements to automatically import transactions
                    </p>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1">
                <ImportUploadForm accounts={accounts} />
            </div>
        </div>
    );
}
