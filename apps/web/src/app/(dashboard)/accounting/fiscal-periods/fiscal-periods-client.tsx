'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FiscalCalendar, FiscalPeriod, FiscalPeriodStatus } from '@/lib/api/accounting';
import { formatDate } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Lock,
    Unlock,
    CheckCircle2,
    Circle,
    Plus,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    lockPeriodAction,
    closePeriodAction,
    reopenPeriodAction,
    createCalendarAction,
} from './actions';

interface FiscalPeriodsClientProps {
    initialCalendars: FiscalCalendar[];
    entityId?: string;
}

const STATUS_CONFIG: Record<FiscalPeriodStatus, {
    label: string;
    color: string;
    dotClass: string;
    icon: typeof Circle;
}> = {
    OPEN: {
        label: 'Open',
        color: 'text-ak-green',
        dotClass: 'bg-ak-green',
        icon: Circle,
    },
    LOCKED: {
        label: 'Locked',
        color: 'text-primary',
        dotClass: 'bg-primary',
        icon: Lock,
    },
    CLOSED: {
        label: 'Closed',
        color: 'text-muted-foreground',
        dotClass: 'bg-muted-foreground',
        icon: CheckCircle2,
    },
};

export function FiscalPeriodsClient({
    initialCalendars,
    entityId,
}: FiscalPeriodsClientProps) {
    const router = useRouter();
    const [calendars, setCalendars] = useState<FiscalCalendar[]>(initialCalendars);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string>(
        calendars[0]?.id ?? ''
    );
    const [loadingPeriodId, setLoadingPeriodId] = useState<string | null>(null);
    const [isCreatingYear, setIsCreatingYear] = useState(false);

    const selectedCalendar = calendars.find((c) => c.id === selectedCalendarId);
    const periods = selectedCalendar?.periods ?? [];

    // Current period: first OPEN period by date
    const now = new Date();
    const currentPeriod = periods.find(
        (p) =>
            p.status === 'OPEN' &&
            new Date(p.startDate) <= now &&
            new Date(p.endDate) >= now
    );

    // Stats
    const openCount = periods.filter((p) => p.status === 'OPEN').length;
    const lockedCount = periods.filter((p) => p.status === 'LOCKED').length;
    const closedCount = periods.filter((p) => p.status === 'CLOSED').length;

    async function handlePeriodAction(
        periodId: string,
        action: 'lock' | 'close' | 'reopen'
    ) {
        setLoadingPeriodId(periodId);
        try {
            const actions = { lock: lockPeriodAction, close: closePeriodAction, reopen: reopenPeriodAction };
            await actions[action](periodId);
            toast.success(
                `Period ${action === 'lock' ? 'locked' : action === 'close' ? 'closed' : 'reopened'} successfully`
            );
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : `Failed to ${action} period`);
        } finally {
            setLoadingPeriodId(null);
        }
    }

    async function handleCreateNextYear() {
        if (!entityId || !selectedCalendar) return;
        setIsCreatingYear(true);
        try {
            const startMonth = new Date(selectedCalendar.startDate).getUTCMonth() + 1;
            await createCalendarAction({
                entityId,
                year: selectedCalendar.year + 1,
                startMonth,
            });
            toast.success(`Created fiscal year ${selectedCalendar.year + 1}`);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create next year');
        } finally {
            setIsCreatingYear(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Year selector + stats */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    {calendars.map((cal) => (
                        <Button
                            key={cal.id}
                            variant={cal.id === selectedCalendarId ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCalendarId(cal.id)}
                            className="font-mono"
                        >
                            FY {cal.year}
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCreateNextYear}
                        disabled={isCreatingYear}
                        className="gap-1"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Next Year
                    </Button>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-ak-green" />
                        <span className="text-xs text-muted-foreground">{openCount} Open</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-xs text-muted-foreground">{lockedCount} Locked</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{closedCount} Closed</span>
                    </div>
                </div>
            </div>

            {/* Current period snapshot */}
            {currentPeriod && (
                <div className="glass rounded-xl p-5 border border-ak-green/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-ak-green-dim flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-ak-green" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Current Period</p>
                            <p className="text-xs text-muted-foreground">
                                Period {currentPeriod.periodNumber} of 12
                            </p>
                        </div>
                        <Badge className="ml-auto bg-ak-green-dim text-ak-green border-ak-green/20">
                            {currentPeriod.name}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                            {formatDate(currentPeriod.startDate)} — {formatDate(currentPeriod.endDate)}
                        </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-ak-bg-3 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-ak-green transition-all"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        ((now.getTime() - new Date(currentPeriod.startDate).getTime()) /
                                            (new Date(currentPeriod.endDate).getTime() -
                                                new Date(currentPeriod.startDate).getTime())) *
                                            100
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Period timeline — vertical, colored dots */}
            <div className="space-y-1">
                {periods.map((period, idx) => {
                    const config = STATUS_CONFIG[period.status];
                    const isCurrent = currentPeriod?.id === period.id;
                    const isLoading = loadingPeriodId === period.id;
                    const StatusIcon = config.icon;

                    return (
                        <div
                            key={period.id}
                            className={`flex items-center gap-4 rounded-lg px-4 py-3 transition-all ${
                                isCurrent
                                    ? 'glass-2 border border-ak-green/20'
                                    : 'hover:glass-2'
                            }`}
                        >
                            {/* Timeline dot + connector */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-3 h-3 rounded-full shrink-0 ${config.dotClass} ${
                                        isCurrent ? 'ring-2 ring-ak-green/30 ring-offset-1 ring-offset-background' : ''
                                    }`}
                                />
                                {idx < periods.length - 1 && (
                                    <div className="w-px h-6 bg-ak-border mt-1" />
                                )}
                            </div>

                            {/* Period info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{period.name}</span>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${config.color} border-current/20`}
                                    >
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {config.label}
                                    </Badge>
                                    {isCurrent && (
                                        <Badge className="text-xs bg-ak-green-dim text-ak-green border-ak-green/20">
                                            Current
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatDate(period.startDate)} — {formatDate(period.endDate)}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {period.status === 'OPEN' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePeriodAction(period.id, 'lock')}
                                        disabled={isLoading}
                                        className="h-7 text-xs gap-1"
                                    >
                                        <Lock className="h-3 w-3" />
                                        Lock
                                    </Button>
                                )}
                                {period.status === 'LOCKED' && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePeriodAction(period.id, 'close')}
                                            disabled={isLoading}
                                            className="h-7 text-xs gap-1"
                                        >
                                            <CheckCircle2 className="h-3 w-3" />
                                            Close
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePeriodAction(period.id, 'reopen')}
                                            disabled={isLoading}
                                            className="h-7 text-xs gap-1 text-muted-foreground"
                                        >
                                            <Unlock className="h-3 w-3" />
                                            Reopen
                                        </Button>
                                    </>
                                )}
                                {period.status === 'CLOSED' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePeriodAction(period.id, 'reopen')}
                                        disabled={isLoading}
                                        className="h-7 text-xs gap-1 text-muted-foreground"
                                    >
                                        <AlertTriangle className="h-3 w-3" />
                                        Reopen
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
