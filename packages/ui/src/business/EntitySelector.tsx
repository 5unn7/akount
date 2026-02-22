'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface EntitySelectorProps {
    /**
     * Selected entity ID
     */
    value: string;

    /**
     * Called when selection changes
     */
    onChange: (entityId: string) => void;

    /**
     * Optional placeholder text
     */
    placeholder?: string;

    /**
     * Whether to auto-fetch entities on mount
     */
    autoFetch?: boolean;

    /**
     * Optional API function to fetch entities (if not provided, caller must populate options)
     */
    onFetchEntities?: () => Promise<Array<{ id: string; name: string }>>;

    /**
     * Disabled state
     */
    disabled?: boolean;

    /**
     * Pre-populated entity options
     */
    entities?: Array<{ id: string; name: string }>;
}

/**
 * EntitySelector component for report filters.
 * Consolidates entity selection with optional API integration.
 *
 * @example
 * ```tsx
 * // With API integration
 * <EntitySelector
 *   value={entityId}
 *   onChange={setEntityId}
 *   onFetchEntities={listEntities}
 *   placeholder="Select Entity"
 * />
 *
 * // With pre-populated entities
 * <EntitySelector
 *   value={entityId}
 *   onChange={setEntityId}
 *   entities={[{ id: '1', name: 'Main Business' }]}
 * />
 * ```
 */
export function EntitySelector({
    value,
    onChange,
    placeholder = 'Select Entity',
    autoFetch = true,
    onFetchEntities,
    disabled = false,
    entities: preloadedEntities = [],
}: EntitySelectorProps) {
    const [entities, setEntities] = useState<Array<{ id: string; name: string }>>(preloadedEntities);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-fetch entities on mount if onFetchEntities provided
    useEffect(() => {
        if (!autoFetch || !onFetchEntities || preloadedEntities.length > 0) {
            return;
        }

        const fetchEntities = async () => {
            setIsLoading(true);
            try {
                const data = await onFetchEntities();
                setEntities(data);
            } catch (error) {
                console.error('Failed to fetch entities:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEntities();
    }, [autoFetch, onFetchEntities, preloadedEntities.length]);

    return (
        <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
            <SelectTrigger>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
