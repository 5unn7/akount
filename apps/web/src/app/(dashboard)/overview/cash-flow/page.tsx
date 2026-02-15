import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Cash Flow | Akount",
    description: "Monitor your cash flow across all accounts",
};

export default function CashFlowPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Cash Flow</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Visualize your cash inflows and outflows with detailed analysis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide cash flow statements,
                        forecasting, and trend analysis across all your accounts.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
