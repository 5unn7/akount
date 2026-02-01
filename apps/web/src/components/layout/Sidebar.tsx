"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    LayoutDashboard,
    CreditCard,
    PieChart,
    Settings,
    Menu,
    Wallet,
    Upload,
    Palette
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();

    const routes = [
        {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/dashboard",
            color: "text-sky-500",
        },
        {
            label: "Import",
            icon: Upload,
            href: "/import",
            color: "text-green-500",
        },
        {
            label: "Transactions",
            icon: CreditCard,
            href: "/transactions",
            color: "text-violet-500",
        },
        {
            label: "Analytics",
            icon: PieChart,
            href: "/analytics",
            color: "text-pink-700",
        },
        {
            label: "Accounts",
            icon: Wallet,
            href: "/accounts",
            color: "text-orange-700",
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/settings",
        },
        {
            label: "Design Demo",
            icon: Palette,
            href: "/demo",
            color: "text-purple-500",
        },
    ];

    return (
        <div className={cn("pb-12 h-full glass", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-bold tracking-tight font-heading">
                        Akount
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={pathname === route.href ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href={route.href}>
                                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
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
