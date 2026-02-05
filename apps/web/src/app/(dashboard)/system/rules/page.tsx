import type { Metadata } from "next";
import { Workflow } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Rules | Akount",
    description: "Configure automation rules",
};

export default function RulesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Rules</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Workflow className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Create automation rules for transaction categorization.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide rule-based automation
                        for categorizing transactions, applying tags, and flagging items.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
