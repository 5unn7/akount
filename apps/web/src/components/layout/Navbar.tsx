'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSyncStatus } from '@/hooks/use-sync-status';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { MobileSidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { EntityFormSheet } from "@/components/dashboard/EntityFormSheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search, RefreshCw, HelpCircle, Bell,
    Building2, Check, Plus,
} from 'lucide-react';
import type { Entity } from '@/lib/api/entities';

/* ── Entity Selector ── */
const ENTITY_COLORS = ['hsl(var(--primary))', 'var(--ak-blue)', 'var(--ak-green)', 'var(--ak-purple)', 'var(--ak-teal)'];

function EntitySelector({ entities, selectedId, onSelect }: {
    entities: Entity[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    const selected = entities.find(e => e.id === selectedId) || entities[0];

    if (entities.length === 0) {
        return (
            <span className="text-xs text-muted-foreground px-2">No entities</span>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm glass hover:border-ak-border-2 transition-colors">
                    <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 bg-primary"
                    />
                    <span className="text-foreground font-medium hidden lg:inline max-w-[140px] truncate">
                        {selected?.name ?? 'Select entity'}
                    </span>
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground lg:hidden" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {entities.map((entity, i) => (
                    <DropdownMenuItem
                        key={entity.id}
                        onClick={() => onSelect(entity.id)}
                        className="flex items-center gap-2.5 py-2"
                    >
                        <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: ENTITY_COLORS[i % ENTITY_COLORS.length] }}
                        />
                        <div className="min-w-0">
                            <p className="text-foreground truncate">{entity.name}</p>
                            <p className="text-[10px] text-muted-foreground">{entity.type}</p>
                        </div>
                        {entity.id === selected?.id && (
                            <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <EntityFormSheet
                    trigger={
                        <button className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-sm cursor-default">
                            <Plus className="h-3.5 w-3.5 shrink-0" />
                            Add Entity
                        </button>
                    }
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/* ── Currency Selector ── */
function CurrencySelector({ currencies, selectedCode, onSelect }: {
    currencies: string[];
    selectedCode: string;
    onSelect: (code: string) => void;
}) {
    if (currencies.length === 0) return null;

    return (
        <Select value={selectedCode} onValueChange={onSelect}>
            <SelectTrigger className="h-auto w-auto gap-1.5 px-2 py-1.5 rounded-lg text-sm text-muted-foreground glass border-ak-border hover:border-ak-border-2 transition-colors [&>svg]:h-3 [&>svg]:w-3">
                <SelectValue>
                    <span className="font-mono text-xs font-medium">{selectedCode}</span>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {currencies.map((code) => (
                    <SelectItem key={code} value={code}>
                        {code}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

/* ═══════════════════════════════════════════════════════════
   Navbar — Entity | Currency | Breadcrumb  ···  Search  ···  Sync | Bell | Theme | Help
   ═══════════════════════════════════════════════════════════ */
interface NavbarProps {
    entities: Entity[];
}

export function Navbar({ entities }: NavbarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isSyncing, sync, getTimeSinceSync } = useSyncStatus();

    const currentEntityId = searchParams.get('entityId') || entities[0]?.id || null;
    const selectedEntity = entities.find(e => e.id === currentEntityId) || entities[0];
    const currentCurrency = searchParams.get('currency') || selectedEntity?.currency || 'CAD';

    // Derive unique currencies from entities
    const currencies = Array.from(new Set(entities.map(e => e.currency).filter(Boolean)));
    // Ensure current currency is in the list
    if (!currencies.includes(currentCurrency)) currencies.push(currentCurrency);

    const updateParam = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        router.push(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams]);

    const handleEntitySelect = useCallback((entityId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('entityId', entityId);
        // Reset currency to the selected entity's base currency
        const entity = entities.find(e => e.id === entityId);
        if (entity) params.set('currency', entity.currency);
        router.push(`?${params.toString()}`, { scroll: false });
    }, [router, searchParams, entities]);

    return (
        <div className="flex items-center px-4 md:px-6 min-h-14 py-3 glass-blur border-b border-ak-border">
            <MobileSidebar />

            {/* Left: Entity + Currency selectors */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
                <EntitySelector
                    entities={entities}
                    selectedId={currentEntityId}
                    onSelect={handleEntitySelect}
                />
                <CurrencySelector
                    currencies={currencies}
                    selectedCode={currentCurrency}
                    onSelect={(code) => updateParam('currency', code)}
                />
            </div>

            {/* Search bar — fills remaining space */}
            <div className="flex-1 min-w-0 px-2">
                <button
                    className="hidden md:flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground glass hover:border-ak-border-2 transition-colors"
                    aria-label="Open search"
                >
                    <Search className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left truncate">Search transactions, accounts, invoices...</span>
                    <kbd className="ml-auto text-[10px] font-mono bg-ak-bg-3 px-1.5 py-0.5 rounded shrink-0">
                        Cmd+K
                    </kbd>
                </button>
            </div>

            {/* Right: Actions — Sync, Notification, Theme, Help */}
            <div className="flex items-center gap-1 shrink-0">
                <TooltipProvider>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={sync}
                                disabled={isSyncing}
                                aria-label="Sync data"
                            >
                                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            <p>{isSyncing ? 'Syncing...' : `Synced ${getTimeSinceSync()}`}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Notifications">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                </Button>
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Help">
                    <HelpCircle className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
