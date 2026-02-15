import type { Metadata } from "next";
import { Plug } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Integrations | Akount",
    description: "Connect external services and apps",
};

export default function IntegrationsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Integrations</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plug className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Connect banks, payment processors, and other services.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide integrations with
                        Canadian banks, Stripe, PayPal, and other financial services.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
