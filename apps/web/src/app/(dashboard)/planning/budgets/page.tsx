import type { Metadata } from "next";
import { PiggyBank } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Budgets | Akount",
    description: "Create and track budgets",
};

export default function BudgetsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Budgets</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PiggyBank className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Create budgets and track spending against targets.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide budget creation,
                        variance analysis, and budget vs. actual reporting.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
