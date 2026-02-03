import { listAccounts } from "@/lib/api/accounts";
import { AccountCard } from "./AccountCard";

/**
 * Accounts list - Server Component
 * Fetches and displays all user accounts
 */
export async function AccountsList() {
    try {
        const accounts = await listAccounts({ isActive: true });

        if (accounts.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-2">No accounts found</p>
                    <p className="text-sm text-muted-foreground">
                        Connect your bank accounts to get started
                    </p>
                </div>
            );
        }

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                ))}
            </div>
        );
    } catch (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-destructive mb-2">Failed to load accounts</p>
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
            </div>
        );
    }
}
