import type { Metadata } from "next";
import { UserCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Accountant Services | Akount",
    description: "Connect with professional accountants",
};

export default function AccountantServicesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Accountant Services</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Connect with professional accountants for expert advice.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide access to CPA-certified
                        accountants for tax planning, audits, and financial advice.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
