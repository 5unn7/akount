'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EntitiesList } from './EntitiesList';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { cn } from '@/lib/utils';
import type { Entity } from '@/lib/api/entities';

interface EntitiesSectionProps {
    entities: Entity[];
}

export function EntitiesSection({ entities }: EntitiesSectionProps) {
    const [isOpen, setIsOpen] = useState(true);

    // Keyboard shortcut: E to toggle
    useKeyboardShortcuts([
        {
            key: 'e',
            description: 'Toggle Entity Matrix',
            handler: () => setIsOpen(prev => !prev),
        },
    ]);

    return (
        <div className="glass rounded-sm p-5">
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
                <CollapsibleTrigger className="w-full group">
                    <SectionHeader
                        title="Entities"
                        meta={`${entities.length} entit${entities.length === 1 ? 'y' : 'ies'}`}
                        actions={
                            <ChevronDown
                                className={cn(
                                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                                    isOpen && 'transform rotate-180'
                                )}
                            />
                        }
                    />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3">
                    <EntitiesList entities={entities} />
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
