"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SidebarProgressIndicator } from "@/components/layout/SidebarProgressIndicator";
import { navigationDomains, getNavigationForRole, type NavDomain } from "@/lib/navigation";
import type { Role } from "@akount/types";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role?: Role;
}

/**
 * Domain navigation group component.
 * Collapsible section showing domain items.
 * Financial Clarity: glass-2 active + amber left border, glass-1 hover
 */
function DomainGroup({
    domain,
    pathname,
    isExpanded,
    onToggle,
}: {
    domain: NavDomain;
    pathname: string;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const isActive = pathname.startsWith(`/${domain.id}`) ||
        domain.items.some((item) => pathname === item.href);

    return (
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <button
                    className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                            ? "bg-[rgba(255,255,255,0.04)] border-l-2 border-l-primary text-foreground"
                            : "text-muted-foreground hover:bg-[rgba(255,255,255,0.025)] hover:text-foreground"
                    )}
                >
                    <span className="flex items-center">
                        <domain.icon className="h-4 w-4 mr-2" />
                        {domain.label}
                    </span>
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-0.5 mt-1">
                {domain.items.map((item) => {
                    const isItemActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center px-3 py-1.5 rounded-md text-sm transition-colors",
                                isItemActive
                                    ? "bg-[rgba(255,255,255,0.04)] text-primary font-medium"
                                    : "text-muted-foreground hover:bg-[rgba(255,255,255,0.025)] hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                        </Link>
                    );
                })}
            </CollapsibleContent>
        </Collapsible>
    );
}

export function Sidebar({ className, role }: SidebarProps) {
    const pathname = usePathname();
    const domains = role ? getNavigationForRole(role) : navigationDomains;

    // Track which domains are expanded (default: domain containing current page)
    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        // Auto-expand the domain containing the current page
        for (const domain of domains) {
            if (domain.items.some((item) => pathname.startsWith(item.href))) {
                initial.add(domain.id);
            }
        }
        // Always expand overview by default
        initial.add("overview");
        return initial;
    });

    const toggleDomain = (domainId: string) => {
        setExpandedDomains((prev) => {
            const next = new Set(prev);
            if (next.has(domainId)) {
                next.delete(domainId);
            } else {
                next.add(domainId);
            }
            return next;
        });
    };

    return (
        <div className={cn("pb-12 h-full flex flex-col bg-[#0F0F17]", className)}>
            <ScrollArea className="flex-1">
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <h2 className="mb-4 px-4 text-lg font-normal tracking-tight font-heading text-primary">
                            Akount
                        </h2>
                        <nav className="space-y-1">
                            {domains.map((domain) => (
                                <DomainGroup
                                    key={domain.id}
                                    domain={domain}
                                    pathname={pathname}
                                    isExpanded={expandedDomains.has(domain.id)}
                                    onToggle={() => toggleDomain(domain.id)}
                                />
                            ))}
                        </nav>
                    </div>
                </div>
            </ScrollArea>

            {/* Onboarding progress indicator */}
            <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
                <SidebarProgressIndicator />
            </div>
        </div>
    );
}

export function MobileSidebar() {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-[#0F0F17] border-r border-[rgba(255,255,255,0.06)]">
                <Sidebar className="w-full" />
            </SheetContent>
        </Sheet>
    );
}
