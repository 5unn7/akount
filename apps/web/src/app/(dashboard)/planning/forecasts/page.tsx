import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Forecasts | Akount",
    description: "Financial forecasting and projections",
};

export default function ForecastsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Forecasts</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Create financial forecasts and scenario analysis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide AI-powered forecasting,
                        scenario modeling, and cash flow projections.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
