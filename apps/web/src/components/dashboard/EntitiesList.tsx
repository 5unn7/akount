import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User } from 'lucide-react';
import type { Entity } from '@/lib/api/entities';

interface EntitiesListProps {
    entities: Entity[];
}

export function EntitiesList({ entities }: EntitiesListProps): React.ReactElement {
    if (entities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Your Entities</CardTitle>
                    <CardDescription>No entities found</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        You don't have any entities yet. Contact support to set up your first entity.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Entities</CardTitle>
                <CardDescription>
                    Manage your business and personal entities
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {entities.map((entity) => (
                        <div
                            key={entity.id}
                            className="flex items-center gap-4 rounded-lg border p-4 hover:bg-accent transition-colors"
                        >
                            <div className="flex-shrink-0">
                                {entity.type === 'BUSINESS' ? (
                                    <Building2 className="h-8 w-8 text-blue-500" />
                                ) : (
                                    <User className="h-8 w-8 text-green-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none mb-1">
                                    {entity.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {entity.type} • {entity.currency}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
