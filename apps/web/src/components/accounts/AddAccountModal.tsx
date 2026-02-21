'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, Upload, PenLine, ArrowLeft, LayoutDashboard } from 'lucide-react';
import type { Entity } from '@/lib/api/entities';
import type { BankConnectionResult } from '@/lib/api/accounts';
import { AccountFormSheet } from './AccountFormSheet';

// Lazy-load FlinksConnect — heavy iframe, no SSR benefit
const FlinksConnect = dynamic(
    () => import('@/components/banking/FlinksConnect').then(m => ({ default: m.FlinksConnect })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center py-12">
                <Skeleton className="w-full h-[500px] rounded-lg" />
            </div>
        ),
    },
);

interface AddAccountModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entities: Entity[];
}

type ModalView = 'choose' | 'connect' | 'success';

const OPTIONS = [
    {
        id: 'connect' as const,
        icon: Landmark,
        label: 'Connect Bank',
        description: 'Securely link your bank for automatic sync',
        emphasis: 'solid' as const,
    },
    {
        id: 'import' as const,
        icon: Upload,
        label: 'Import Statement',
        description: 'Upload a CSV or PDF bank statement',
        emphasis: 'dim' as const,
    },
    {
        id: 'manual' as const,
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
    const [view, setView] = useState<ModalView>('choose');
    const [connectionResult, setConnectionResult] = useState<BankConnectionResult | null>(null);

    function handleOption(id: string) {
        if (id === 'connect') {
            setView('connect');
        } else if (id === 'import') {
            onOpenChange(false);
            router.push('/banking/imports');
        } else if (id === 'manual') {
            onOpenChange(false);
            setFormOpen(true);
        }
    }

    function handleClose(isOpen: boolean) {
        if (!isOpen) {
            // Reset view when closing
            setTimeout(() => setView('choose'), 200);
            setConnectionResult(null);
        }
        onOpenChange(isOpen);
    }

    // Use the first entity as default for Flinks connection
    const defaultEntityId = entities[0]?.id ?? '';

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className={`glass ${view === 'connect' ? 'sm:max-w-lg' : 'sm:max-w-md'}`}>
                    {view === 'choose' && (
                        <>
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
                        </>
                    )}

                    {view === 'connect' && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setView('choose')}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <DialogTitle className="font-heading font-normal text-lg">
                                        Connect Bank
                                    </DialogTitle>
                                </div>
                                <DialogDescription className="text-muted-foreground">
                                    Select your bank and sign in securely.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-2">
                                <FlinksConnect
                                    entityId={defaultEntityId}
                                    onSuccess={(result) => {
                                        setConnectionResult(result);
                                        setView('success');
                                    }}
                                    onCancel={() => setView('choose')}
                                    onError={() => {
                                        // Error is shown inline in FlinksConnect
                                    }}
                                />
                            </div>
                        </>
                    )}

                    {view === 'success' && connectionResult && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="font-heading font-normal text-lg">
                                    Bank Connected!
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Your accounts are ready. Transactions have been imported.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-4">
                                <FlinksConnect
                                    entityId={defaultEntityId}
                                    onSuccess={() => {}}
                                />
                            </div>

                            <div className="flex flex-col gap-2 mt-4">
                                <Button
                                    className="gap-1.5 bg-primary hover:bg-ak-pri-hover text-black font-medium"
                                    onClick={() => {
                                        handleClose(false);
                                        router.push('/overview');
                                    }}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Go to Dashboard
                                </Button>
                                <Button
                                    variant="outline"
                                    className="gap-1.5 border-ak-border-2 hover:bg-ak-bg-3"
                                    onClick={() => handleClose(false)}
                                >
                                    Done
                                </Button>
                            </div>
                        </>
                    )}
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
