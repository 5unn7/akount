import type { Metadata } from "next";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Insights History | Akount",
    description: "View history of AI recommendations and actions",
};

export default function AIHistoryPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">History</h2>
                    <Badge variant="outline" className="text-xs glass text-muted-foreground border-ak-border">
                        Coming Soon
                    </Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Review past AI recommendations and their outcomes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide a history of
                        AI-generated insights, recommendations, and their effectiveness.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
