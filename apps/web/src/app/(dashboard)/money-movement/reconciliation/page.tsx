import type { Metadata } from "next";
import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Reconciliation | Akount",
    description: "Reconcile bank statements with your records",
};

export default function ReconciliationPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Reconciliation</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Match bank transactions with your records for accurate bookkeeping.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide automated matching,
                        discrepancy detection, and reconciliation workflows.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
