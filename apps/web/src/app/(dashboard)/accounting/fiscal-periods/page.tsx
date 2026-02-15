import type { Metadata } from "next";
import { Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Fiscal Periods | Akount",
    description: "Manage your fiscal year and accounting periods",
};

export default function FiscalPeriodsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Fiscal Periods</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Configure your fiscal year and manage period closing.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide fiscal calendar
                        management, period locking, and year-end closing workflows.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
