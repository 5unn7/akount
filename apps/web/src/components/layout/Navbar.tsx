'use client';

import dynamic from 'next/dynamic';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { useEntity } from '@/providers/entity-provider';
import { MobileSidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const EntityFormSheet = dynamic(
    () => import("@/components/dashboard/EntityFormSheet").then(m => m.EntityFormSheet),
    { ssr: false }
);
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
    Building2, Check, Plus, Globe,
} from 'lucide-react';
import type { Entity } from '@/lib/api/entities';

/* ── Entity Selector ── */
const ENTITY_COLORS = ['hsl(var(--primary))', 'var(--ak-blue)', 'var(--ak-green)', 'var(--ak-purple)', 'var(--ak-teal)'];

function EntitySelector({ entities, selectedId, onSelect, isPending }: {
    entities: Entity[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    isPending: boolean;
}) {
    const isAllEntities = selectedId === null;
    const selected = isAllEntities ? null : entities.find(e => e.id === selectedId);

    if (entities.length === 0) {
        return (
            <span className="text-xs text-muted-foreground px-2">No entities</span>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm glass hover:border-ak-border-2 transition-colors">
                    {isPending ? (
                        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-primary animate-pulse" />
                    ) : isAllEntities ? (
                        <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-primary" />
                    )}
                    <span className="text-foreground font-medium hidden lg:inline max-w-[140px] truncate">
                        {isAllEntities ? 'All Entities' : selected?.name ?? 'Select entity'}
                    </span>
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground lg:hidden" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                {/* All Entities option */}
                <DropdownMenuItem
                    onClick={() => onSelect(null)}
                    className="flex items-center gap-2.5 py-2"
                >
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                        <p className="text-foreground">All Entities</p>
                        <p className="text-micro text-muted-foreground">Consolidated view</p>
                    </div>
                    {isAllEntities && (
                        <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />
                    )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
                            <p className="text-micro text-muted-foreground">{entity.type}</p>
                        </div>
                        {entity.id === selectedId && (
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
    const { isSyncing, sync, getTimeSinceSync } = useSyncStatus();
    const { selectedEntityId, currency, setEntity, setCurrency, isPending } = useEntity();

    // Filter out archived entities for the switcher
    const activeEntities = entities.filter(e => e.status !== 'ARCHIVED');

    // Derive unique currencies from active entities
    const currencies = Array.from(new Set(activeEntities.map(e => e.functionalCurrency).filter(Boolean)));
    // Ensure current currency is in the list
    if (!currencies.includes(currency)) currencies.push(currency);

    return (
        <div className="flex items-center px-4 md:px-6 min-h-14 py-3 glass-blur border-b border-ak-border-2">
            <MobileSidebar />

            {/* Left: Entity + Currency selectors */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
                <EntitySelector
                    entities={activeEntities}
                    selectedId={selectedEntityId}
                    onSelect={setEntity}
                    isPending={isPending}
                />
                <CurrencySelector
                    currencies={currencies}
                    selectedCode={currency}
                    onSelect={setCurrency}
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
                    <kbd className="ml-auto text-micro font-mono bg-ak-bg-3 px-1.5 py-0.5 rounded shrink-0">
                        Cmd+K
                    </kbd>
                </button>
            </div>

            {/* Right: Actions — Status, Notification, Theme, Help */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Live status pill with refresh */}
                <button
                    onClick={sync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs glass hover:border-ak-border-2 transition-colors disabled:opacity-60"
                    aria-label="Sync data"
                >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSyncing ? 'bg-primary animate-pulse' : 'bg-ak-green'}`} />
                    <span className="hidden sm:inline text-muted-foreground whitespace-nowrap">
                        {isSyncing ? 'Syncing…' : getTimeSinceSync()}
                    </span>
                    <RefreshCw className={`h-3 w-3 text-muted-foreground ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
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
