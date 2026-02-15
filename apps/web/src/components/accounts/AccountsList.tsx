import { listAccounts, type AccountType } from "@/lib/api/accounts";
import type { Entity } from "@/lib/api/entities";
import { AccountsListClient } from "./AccountsListClient";

interface AccountsListProps {
    type?: AccountType;
    entities: Entity[];
}

/**
 * Accounts list - Server Component
 * Fetches and displays all user accounts with pagination support
 */
export async function AccountsList({ type, entities }: AccountsListProps): Promise<React.ReactElement> {
    try {
        const { accounts, hasMore } = await listAccounts({ isActive: true, type });

        if (accounts.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-2">No accounts found</p>
                    <p className="text-sm text-muted-foreground">
                        {type
                            ? `No ${type.toLowerCase().replace('_', ' ')} accounts. Try a different filter or add one.`
                            : 'Connect your bank accounts to get started'}
                    </p>
                </div>
            );
        }

        return (
            <AccountsListClient
                accounts={accounts}
                hasMore={hasMore}
                entities={entities}
            />
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
