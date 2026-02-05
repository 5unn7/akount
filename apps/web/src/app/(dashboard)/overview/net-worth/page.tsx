import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Net Worth | Akount",
    description: "Track your net worth across all entities and accounts",
};

export default function NetWorthPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Net Worth</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Track your net worth across all entities, with historical trends and projections.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide consolidated net worth
                        tracking with multi-currency support and historical analysis.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
