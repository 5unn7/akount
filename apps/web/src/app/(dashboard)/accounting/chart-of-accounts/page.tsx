import type { Metadata } from "next";
import { ListTree } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Chart of Accounts | Akount",
    description: "Manage your chart of accounts",
};

export default function ChartOfAccountsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Chart of Accounts</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListTree className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Configure your general ledger account structure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide account management,
                        hierarchical organization, and Canadian GAAP compliance templates.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
