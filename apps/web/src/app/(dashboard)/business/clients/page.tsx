import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Clients | Akount",
    description: "Manage your clients and customer relationships",
};

export default function ClientsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Clients</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Manage your client database and track customer relationships.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide client management,
                        contact information, payment terms, and relationship history.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
