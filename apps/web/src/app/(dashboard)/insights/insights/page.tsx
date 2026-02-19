import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Insights | Akount",
    description: "AI-powered financial insights and recommendations",
};

export default function InsightsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Insights</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Get AI-powered financial insights and recommendations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide automated insights,
                        anomaly detection, and actionable recommendations for your finances.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
