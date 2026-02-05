import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Transactions | Akount",
    description: "View and manage all your transactions",
};

export default function TransactionsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Transactions</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        View, filter, and categorize all your transactions in one place.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide a unified view of all
                        transactions with advanced filtering, bulk categorization, and search.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
