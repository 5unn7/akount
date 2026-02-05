import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Policy Alerts | Akount",
    description: "AI-powered policy compliance alerts",
};

export default function PolicyAlertsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Policy Alerts</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Automated alerts for policy violations and compliance issues.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will monitor spending policies,
                        flag unusual transactions, and ensure compliance with your rules.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
