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
import { navigationDomains, type NavDomain } from "@/lib/navigation";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Domain navigation group component.
 * Collapsible section showing domain items.
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
                <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-between"
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
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
                {domain.items.map((item) => (
                    <Button
                        key={item.href}
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        asChild
                    >
                        <Link href={item.href}>
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                        </Link>
                    </Button>
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    // Track which domains are expanded (default: domain containing current page)
    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(() => {
        const initial = new Set<string>();
        // Auto-expand the domain containing the current page
        for (const domain of navigationDomains) {
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
        <div className={cn("pb-12 h-full glass flex flex-col", className)}>
            <ScrollArea className="flex-1">
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <h2 className="mb-4 px-4 text-lg font-bold tracking-tight font-heading">
                            Akount
                        </h2>
                        <nav className="space-y-1">
                            {navigationDomains.map((domain) => (
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
            <div className="px-4 py-3 border-t border-slate-200/10">
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
            <SheetContent side="left" className="p-0">
                <Sidebar className="w-full" />
            </SheetContent>
        </Sheet>
    );
}
