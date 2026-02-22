'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { createCalendarAction } from './actions';

interface FiscalPeriodsEmptyProps {
    entityId?: string;
}

const START_MONTH_OPTIONS = [
    { value: 1, label: 'January (Calendar Year)' },
    { value: 4, label: 'April (Q2 Start)' },
    { value: 7, label: 'July (Q3 Start)' },
    { value: 10, label: 'October (Q4 Start)' },
];

export function FiscalPeriodsEmpty({ entityId }: FiscalPeriodsEmptyProps) {
    const router = useRouter();
    const [startMonth, setStartMonth] = useState(1);
    const [isCreating, setIsCreating] = useState(false);
    const currentYear = new Date().getFullYear();

    async function handleCreate() {
        if (!entityId) {
            toast.error('Please select a business entity first');
            return;
        }

        setIsCreating(true);
        try {
            await createCalendarAction({
                entityId,
                year: currentYear,
                startMonth,
            });
            toast.success(`Created fiscal year ${currentYear} with 12 monthly periods`);
            router.refresh();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to create fiscal year'
            );
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className="flex flex-col items-center py-12 space-y-8">
            {/* Icon + message */}
            <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <h3 className="text-lg font-heading font-medium">No fiscal year set</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Set up your fiscal year to track accounting periods, lock completed months,
                    and manage year-end closing.
                </p>
            </div>

            {/* Setup form */}
            <div className="glass rounded-xl p-6 w-full max-w-md space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Fiscal Year Start Month</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                        {START_MONTH_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setStartMonth(opt.value)}
                                className={`rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                                    startMonth === opt.value
                                        ? 'glass-3 border border-primary/30 text-primary'
                                        : 'glass-2 border border-transparent hover:border-ak-border-2'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="glass-2 rounded-lg p-3 text-xs text-muted-foreground">
                    <p>
                        This will create <span className="font-medium text-foreground">12 monthly periods</span> for fiscal year{' '}
                        <span className="font-mono font-medium text-foreground">{currentYear}</span>,
                        starting from{' '}
                        <span className="font-medium text-foreground">
                            {new Date(currentYear, startMonth - 1).toLocaleString('en-CA', { month: 'long' })}
                        </span>.
                        All periods will be <span className="text-ak-green font-medium">OPEN</span> for posting.
                    </p>
                </div>

                <Button
                    onClick={handleCreate}
                    disabled={isCreating || !entityId}
                    className="w-full gap-2"
                >
                    <Sparkles className="h-4 w-4" />
                    {isCreating ? 'Creating...' : `Create Fiscal Year ${currentYear}`}
                </Button>
            </div>
        </div>
    );
}
