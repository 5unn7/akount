import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Users | Akount",
    description: "Manage user access and permissions",
};

export default function UsersPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Users</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Manage team members and their access levels.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide user invitation,
                        role assignment, and permission management with RBAC.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
