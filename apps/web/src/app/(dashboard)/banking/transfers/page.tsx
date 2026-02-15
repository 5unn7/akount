import type { Metadata } from "next";
import { ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Transfers | Akount",
    description: "Manage transfers between your accounts",
};

export default function TransfersPage() {
    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Transfers</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Record and track transfers between your accounts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will support inter-account transfers,
                        multi-currency conversions, and automatic journal entry creation.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
