import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataExportCard } from "./data-export-card";
import { AIPreferencesCard } from "./ai-preferences-card";

export const metadata: Metadata = {
    title: "Settings | Akount",
    description: "Configure your account and preferences",
};

export default function SettingsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Settings</h2>
                    <Badge variant="outline" className="text-xs glass text-muted-foreground border-ak-border">
                        Coming Soon
                    </Badge>
                </div>
            </div>

            <AIPreferencesCard />

            <DataExportCard />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        More Settings Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Account preferences, notification settings, default currencies, and display options.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Additional configuration options are under development.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
