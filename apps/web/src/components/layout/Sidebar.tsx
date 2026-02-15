"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { ChevronDown, ChevronRight, Menu, LogOut, ChevronLeft, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SidebarProgressIndicator } from "@/components/onboarding/SidebarProgressIndicator";
import { navigationDomains, getNavigationForRole, type NavDomain } from "@/lib/navigation";
import type { Role } from "@akount/types";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: Role;
}

/** Find which domain owns the current pathname */
function getActiveDomainId(domains: NavDomain[], pathname: string): string | undefined {
    return domains.find(d =>
        pathname.startsWith(`/${d.id}`) || d.items.some(i => pathname.startsWith(i.href))
    )?.id;
}

/* ── User profile card ── */
function UserProfileCard({ collapsed }: { collapsed?: boolean }) {
    const { user } = useUser();
    const { signOut } = useClerk();
    if (!user) return null;

    const initials = [user.firstName?.[0], user.lastName?.[0]]
        .filter(Boolean)
        .join('')
        .toUpperCase() || '?';
    const displayName = user.fullName || user.primaryEmailAddress?.emailAddress || 'User';

    if (collapsed) {
        return (
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold" title={displayName}>
                    {initials}
                </div>
                <button
                    onClick={() => signOut({ redirectUrl: '/' })}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Sign out"
                    title="Sign out"
                >
                    <LogOut className="h-3.5 w-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-1">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                {initials}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Free Plan</p>
            </div>
            <button
                onClick={() => signOut({ redirectUrl: '/' })}
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Sign out"
                title="Sign out"
            >
                <LogOut className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

/* ── Domain group with collapsible sub-menu ── */
function DomainGroup({
    domain,
    pathname,
    isExpanded,
    onToggle,
    collapsed,
}: {
    domain: NavDomain;
    pathname: string;
    isExpanded: boolean;
    onToggle: () => void;
    collapsed?: boolean;
}) {
    const isActive = pathname.startsWith(`/${domain.id}`) ||
        domain.items.some((item) => pathname === item.href);

    // If collapsed, show just the icon
    if (collapsed) {
        const firstHref = domain.items[0]?.href || `/${domain.id}`;
        return (
            <div className="relative group">
                <Link
                    href={firstHref}
                    className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-lg transition-colors",
                        isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-ak-bg-3"
                    )}
                    aria-label={domain.label}
                >
                    <domain.icon className="h-5 w-5" />
                </Link>
                {/* Tooltip */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-popover border border-ak-border-2 rounded-lg text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-lg shadow-black/20 z-[90]">
                    {domain.label}
                </div>
            </div>
        );
    }

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <button
                    aria-label={`${domain.label} navigation`}
                    aria-expanded={isExpanded}
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-ak-bg-3"
                    )}
                >
                    <span className="flex items-center min-w-0 gap-2.5">
                        <domain.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{domain.label}</span>
                    </span>
                    {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-7 space-y-0.5 mt-1">
                {domain.items.map((item) => {
                    const isItemActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                                isItemActive
                                    ? "text-primary font-medium bg-primary/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-ak-bg-3"
                            )}
                        >
                            <item.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </CollapsibleContent>
        </Collapsible>
    );
}

/* ═══════════════════════════════════════════════════════════
   Desktop Sidebar — Simple, collapsible, with sub-menus
   ═══════════════════════════════════════════════════════════ */
export function Sidebar({ className, role }: SidebarProps) {
    const pathname = usePathname();
    const domains = role ? getNavigationForRole(role) : navigationDomains;
    const activeDomainId = getActiveDomainId(domains, pathname);

    // Track which domains are expanded (auto-expand active domain)
    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        if (activeDomainId) initial.add(activeDomainId);
        else initial.add("overview");
        return initial;
    });

    // Track sidebar collapse state
    const [collapsed, setCollapsed] = useState(false);

    const toggleDomain = (domainId: string) => {
        setExpandedDomains((prev) => {
            const next = new Set(prev);
            if (next.has(domainId)) next.delete(domainId);
            else next.add(domainId);
            return next;
        });
    };

    return (
        <div
            className={cn(
                "hidden md:flex fixed inset-y-0 left-0 z-[80] h-full flex-col transition-all duration-200",
                "bg-card glass-blur border-r border-ak-border",
                collapsed ? "w-16" : "w-64",
                className
            )}
        >
            <div className="flex-1 py-4 flex flex-col">
                {/* Logo + Collapse button */}
                <div className="px-3 mb-4 flex items-center justify-between">
                    {!collapsed && (
                        <Link href="/overview" className="text-lg font-heading text-primary font-semibold hover:opacity-80 transition-opacity">
                            Akount
                        </Link>
                    )}
                    {collapsed && (
                        <Link href="/overview" className="text-lg font-heading text-primary font-semibold hover:opacity-80 transition-opacity w-full text-center">
                            A
                        </Link>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn(
                            "shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-ak-bg-3 transition-colors",
                            collapsed && "mx-auto"
                        )}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? (
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronLeft className="h-3.5 w-3.5" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 px-3">
                    <nav className="space-y-0.5" aria-label="Main navigation">
                        {domains.map((domain, index) => (
                            <div key={domain.id}>
                                {index > 0 && !collapsed && (
                                    <div className="my-2 border-t border-ak-border" />
                                )}
                                <DomainGroup
                                    domain={domain}
                                    pathname={pathname}
                                    isExpanded={expandedDomains.has(domain.id)}
                                    onToggle={() => toggleDomain(domain.id)}
                                    collapsed={collapsed}
                                />
                            </div>
                        ))}
                    </nav>
                </ScrollArea>

                {/* Onboarding progress — hide when collapsed */}
                {!collapsed && (
                    <div className="px-3 py-3">
                        <SidebarProgressIndicator />
                    </div>
                )}
            </div>

            {/* Bottom: profile */}
            <div className="py-3 px-3 border-t border-ak-border">
                <UserProfileCard collapsed={collapsed} />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   Mobile Sidebar — Sheet drawer
   ═══════════════════════════════════════════════════════════ */
export function MobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-card border-r border-ak-border w-60">
                <MobileSidebarContent />
            </SheetContent>
        </Sheet>
    );
}

function MobileSidebarContent() {
    const pathname = usePathname();
    const domains = navigationDomains;
    const activeDomainId = getActiveDomainId(domains, pathname);

    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        if (activeDomainId) initial.add(activeDomainId);
        else initial.add("overview");
        return initial;
    });

    const toggleDomain = (domainId: string) => {
        setExpandedDomains((prev) => {
            const next = new Set(prev);
            if (next.has(domainId)) next.delete(domainId);
            else next.add(domainId);
            return next;
        });
    };

    return (
        <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
                <div className="py-4">
                    <div className="px-5 mb-5">
                        <h2 className="text-lg font-normal tracking-tight font-heading text-primary">
                            Akount
                        </h2>
                    </div>
                    <nav className="px-3 space-y-0.5" aria-label="Main navigation">
                        {domains.map((domain, index) => (
                            <div key={domain.id}>
                                {index > 0 && (
                                    <div className="my-2 mx-1 border-t border-ak-border" />
                                )}
                                <DomainGroup
                                    domain={domain}
                                    pathname={pathname}
                                    isExpanded={expandedDomains.has(domain.id)}
                                    onToggle={() => toggleDomain(domain.id)}
                                />
                            </div>
                        ))}
                    </nav>
                </div>
            </ScrollArea>
            <div className="space-y-3 px-4 py-3 border-t border-ak-border">
                <SidebarProgressIndicator />
                <UserProfileCard />
            </div>
        </div>
    );
}
