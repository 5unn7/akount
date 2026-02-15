import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Settings | Akount",
    description: "Configure your account and preferences",
};

export default function SettingsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Settings</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Configure account preferences and system defaults.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide account settings,
                        notification preferences, default currencies, and display options.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
