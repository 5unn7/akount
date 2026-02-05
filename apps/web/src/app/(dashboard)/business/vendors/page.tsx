import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Vendors | Akount",
    description: "Manage your vendors and suppliers",
};

export default function VendorsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Vendors</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Manage your vendor database and supplier relationships.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide vendor management,
                        payment tracking, and purchase history.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
