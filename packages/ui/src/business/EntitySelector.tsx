'use client';

import { useEffect, useState } from 'react';
import { cn } from '../utils';

interface EntitySelectorProps {
    /** Selected entity ID */
    value: string;
    /** Called when selection changes */
    onChange: (entityId: string) => void;
    /** Optional placeholder text */
    placeholder?: string;
    /** Whether to auto-fetch entities on mount */
    autoFetch?: boolean;
    /** Optional API function to fetch entities */
    onFetchEntities?: () => Promise<Array<{ id: string; name: string }>>;
    /** Disabled state */
    disabled?: boolean;
    /** Pre-populated entity options */
    entities?: Array<{ id: string; name: string }>;
    /** Additional classes */
    className?: string;
}

/**
 * EntitySelector component for report filters.
 * Uses a native select element styled to match the design system.
 *
 * @example
 * ```tsx
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
    className,
}: EntitySelectorProps) {
    const [entities, setEntities] = useState<Array<{ id: string; name: string }>>(preloadedEntities);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!autoFetch || !onFetchEntities || preloadedEntities.length > 0) {
            return;
        }

        const fetchEntities = async () => {
            setIsLoading(true);
            try {
                const data = await onFetchEntities();
                setEntities(data);
            } catch {
                // Silently fail — entities list stays empty
            } finally {
                setIsLoading(false);
            }
        };

        fetchEntities();
    }, [autoFetch, onFetchEntities, preloadedEntities.length]);

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || isLoading}
            className={cn(
                'flex h-9 w-full items-center justify-between rounded-md border border-ak-border bg-transparent px-3 py-2 text-sm',
                'focus:outline-none focus:ring-1 focus:ring-primary',
                'disabled:cursor-not-allowed disabled:opacity-50',
                '[&>option]:bg-ak-bg-2',
                className,
            )}
        >
            {!value && <option value="">{placeholder}</option>}
            {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                    {entity.name}
                </option>
            ))}
        </select>
    );
}
