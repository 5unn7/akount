'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { GlowCard } from '@/components/ui/glow-card';
import { CardContent } from '@/components/ui/card';
import { Landmark, Upload, PenLine } from 'lucide-react';
import type { Entity } from '@/lib/api/entities';
import { AccountFormSheet } from './AccountFormSheet';

interface AddAccountModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entities: Entity[];
}

const OPTIONS = [
    {
        id: 'connect',
        icon: Landmark,
        label: 'Connect Bank',
        description: 'Securely link your bank for automatic sync',
        emphasis: 'solid' as const,
    },
    {
        id: 'import',
        icon: Upload,
        label: 'Import Statement',
        description: 'Upload a CSV or PDF bank statement',
        emphasis: 'dim' as const,
    },
    {
        id: 'manual',
        icon: PenLine,
        label: 'Add Manually',
        description: 'Enter account details by hand',
        emphasis: 'ghost' as const,
    },
] as const;

const emphasisStyles = {
    solid: 'border-primary/20 hover:border-primary/40',
    dim: 'border-ak-border-2 hover:border-primary/20',
    ghost: 'border-ak-border hover:border-ak-border-2',
};

const iconStyles = {
    solid: 'bg-primary/15 text-primary',
    dim: 'bg-ak-pri-dim text-ak-pri-text',
    ghost: 'glass-2 text-muted-foreground',
};

export function AddAccountModal({ open, onOpenChange, entities }: AddAccountModalProps) {
    const router = useRouter();
    const [formOpen, setFormOpen] = useState(false);

    function handleOption(id: string) {
        onOpenChange(false);

        if (id === 'connect') {
            // Sprint 2: Flinks Connect — for now, fall through to manual
            setFormOpen(true);
        } else if (id === 'import') {
            router.push('/banking/imports');
        } else if (id === 'manual') {
            setFormOpen(true);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="glass sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading font-normal text-lg">
                            Add Account
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Choose how you&apos;d like to add your account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 mt-2">
                        {OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            return (
                                <GlowCard
                                    key={opt.id}
                                    variant="glass"
                                    className={`cursor-pointer transition-all hover:-translate-y-px ${emphasisStyles[opt.emphasis]}`}
                                    onClick={() => handleOption(opt.id)}
                                >
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div
                                            className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${iconStyles[opt.emphasis]}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{opt.label}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {opt.description}
                                            </p>
                                        </div>
                                    </CardContent>
                                </GlowCard>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <AccountFormSheet
                key="add-modal-create"
                open={formOpen}
                onOpenChange={setFormOpen}
                entities={entities}
            />
        </>
    );
}
