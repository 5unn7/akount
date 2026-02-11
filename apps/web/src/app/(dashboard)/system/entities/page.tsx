import type { Metadata } from "next";
import { Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Entities | Akount",
    description: "Manage your business entities",
};

export default function EntitiesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-heading font-normal tracking-tight">Entities</h2>
            </div>

            <Card variant="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-heading font-normal">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Manage your business entities and legal structures.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide entity management for
                        corporations, sole proprietorships, and multi-jurisdiction setups.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
