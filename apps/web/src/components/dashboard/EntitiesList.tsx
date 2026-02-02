'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Loader2, AlertCircle } from 'lucide-react';

type Entity = {
    id: string;
    name: string;
    type: string;
    currency: string;
};

type EntitiesResponse = {
    entities: Entity[];
};

export function EntitiesList() {
    const { getToken } = useAuth();
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEntities() {
            try {
                setLoading(true);
                setError(null);

                // Get authentication token from Clerk
                const token = await getToken();

                if (!token) {
                    throw new Error('Not authenticated');
                }

                // Fetch entities from API
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const response = await fetch(`${apiUrl}/api/entities`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Authentication failed. Please sign in again.');
                    }
                    if (response.status === 404) {
                        throw new Error('No tenant found. Please contact support.');
                    }
                    throw new Error(`Failed to fetch entities: ${response.statusText}`);
                }

                const data: EntitiesResponse = await response.json();
                setEntities(data.entities);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load entities';
                setError(errorMessage);
                console.error('Error fetching entities:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchEntities();
    }, [getToken]);

    // Loading state
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Your Entities</CardTitle>
                    <CardDescription>Loading your entities...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Your Entities</CardTitle>
                    <CardDescription>Failed to load entities</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Empty state
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

    // Success state - display entities
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
