import type { Metadata } from 'next';
import { listGLAccounts } from '@/lib/api/accounting';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { JournalEntryForm } from '../journal-entry-form';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
    title: 'New Journal Entry | Akount',
    description: 'Create a new manual journal entry',
};

export default async function NewJournalEntryPage() {
    try {
        const [{ entityId: rawEntityId }, entities] = await Promise.all([
            getEntitySelection(),
            listEntities(),
        ]);

        if (entities.length === 0) {
            return (
                <div className="flex-1 space-y-4 p-8 pt-6">
                    <Card className="glass rounded-[14px]">
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">
                                No entities found. Create a business entity first.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        // Force entity selection for accounting — fall back to first entity
        const entityId = validateEntityId(rawEntityId, entities) || entities[0].id;
        const accounts = await listGLAccounts({
            entityId,
            isActive: true,
        });

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight font-heading">
                        New Journal Entry
                    </h2>
                    <p className="text-muted-foreground">
                        Create a manual double-entry journal entry
                    </p>
                </div>

                <JournalEntryForm
                    glAccounts={accounts}
                    entityId={entityId}
                />
            </div>
        );
    } catch (error) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-destructive mb-2">Failed to load form data</p>
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : 'Unknown error occurred'}
                    </p>
                </div>
            </div>
        );
    }
}
