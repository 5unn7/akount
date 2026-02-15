import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Reports | Akount",
    description: "Generate financial reports and statements",
};

export default function ReportsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Reports</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Generate comprehensive financial reports and statements.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide balance sheets,
                        income statements, cash flow reports, and custom report builder.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
