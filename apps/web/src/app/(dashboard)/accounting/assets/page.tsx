import type { Metadata } from "next";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Assets | Akount",
    description: "Track and depreciate your fixed assets",
};

export default function AssetsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Assets</h2>
                    <Badge variant="outline" className="text-xs glass text-muted-foreground border-ak-border">
                        Coming Soon
                    </Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Track fixed assets and calculate depreciation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide asset tracking,
                        multiple depreciation methods, and CRA compliance reporting.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
