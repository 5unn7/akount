import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User } from 'lucide-react';
import type { Entity } from '@/lib/api/entities';
import { EntityFormSheet } from './EntityFormSheet';

interface EntitiesListProps {
    entities: Entity[];
}

const TYPE_LABELS: Record<string, string> = {
    PERSONAL: 'Personal',
    CORPORATION: 'Corporation',
    SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
    PARTNERSHIP: 'Partnership',
    LLC: 'LLC',
};

export function EntitiesList({ entities }: EntitiesListProps): React.ReactElement {
    if (entities.length === 0) {
        return (
            <Card variant="glass">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-heading font-normal">Your Entities</CardTitle>
                            <CardDescription>No entities yet</CardDescription>
                        </div>
                        <EntityFormSheet />
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Create your first entity to start managing your finances.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card variant="glass">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="font-heading font-normal">Your Entities</CardTitle>
                        <CardDescription>
                            Manage your business and personal entities
                        </CardDescription>
                    </div>
                    <EntityFormSheet />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {entities.map((entity) => (
                        <div
                            key={entity.id}
                            className="flex items-center gap-4 rounded-lg border border-[rgba(255,255,255,0.06)] p-4 hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                        >
                            <div className="flex-shrink-0">
                                {entity.type === 'PERSONAL' ? (
                                    <User className="h-8 w-8 text-[#34D399]" />
                                ) : (
                                    <Building2 className="h-8 w-8 text-[#60A5FA]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none mb-1">
                                    {entity.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {TYPE_LABELS[entity.type] || entity.type} &bull; <span className="font-mono">{entity.currency}</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
