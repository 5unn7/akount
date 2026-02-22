import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Audit Log | Akount",
    description: "View activity and audit history",
};

export default function AuditLogPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Audit Log</h2>
                    <Badge variant="outline" className="text-xs glass text-muted-foreground border-ak-border">
                        Coming Soon
                    </Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Review all system activity and changes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide a complete audit trail
                        of all changes with who, what, when, and before/after values.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
