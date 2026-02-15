import type { Metadata } from "next";
import { FileStack } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Bookkeeping Services | Akount",
    description: "Professional bookkeeping assistance",
};

export default function BookkeepingServicesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Bookkeeping Services</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileStack className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Get professional bookkeeping assistance.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will connect you with bookkeeping
                        professionals for transaction categorization, reconciliation, and reporting.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
