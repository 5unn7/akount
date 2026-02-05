import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Bills | Akount",
    description: "Track and pay your bills",
};

export default function BillsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Bills</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Track vendor bills and manage accounts payable.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide bill entry,
                        payment scheduling, and expense tracking.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
