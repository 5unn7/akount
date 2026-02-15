import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Security | Akount",
    description: "Manage security settings and authentication",
};

export default function SecurityPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Security</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Configure security settings and authentication options.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide two-factor authentication,
                        session management, and security policy configuration.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
