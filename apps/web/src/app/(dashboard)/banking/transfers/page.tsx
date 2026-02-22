import type { Metadata } from 'next';
import { TransfersClient } from './transfers-client';
import { listAccounts } from '@/lib/api/accounts';
import { listTransfers } from '@/lib/api/transfers';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';

export const metadata: Metadata = {
  title: 'Transfers | Akount',
  description: 'Transfer money between your accounts',
};

export default async function TransfersPage() {
  const [{ entityId: rawEntityId }, allEntities] = await Promise.all([
    getEntitySelection(),
    listEntities(),
  ]);
  const entityId = validateEntityId(rawEntityId, allEntities) ?? allEntities[0]?.id;

  if (!entityId) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <p className="text-sm text-muted-foreground">No entity found</p>
      </div>
    );
  }

  // Fetch accounts and transfers
  const [accountsResult, transfersResult] = await Promise.all([
    listAccounts({ entityId, isActive: true }),
    listTransfers({ entityId, limit: 50 }),
  ]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <TransfersClient
        accounts={accountsResult.accounts}
        initialTransfers={transfersResult.transfers}
        entityId={entityId}
        hasMore={transfersResult.hasMore}
        nextCursor={transfersResult.nextCursor}
      />
    </div>
  );
}
