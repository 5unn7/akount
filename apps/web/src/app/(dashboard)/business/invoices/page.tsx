import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Invoices | Akount",
    description: "Create and manage invoices for your clients",
};

export default function InvoicesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Invoices</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Create professional invoices and track payments.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide invoice creation,
                        PDF generation, payment tracking, and aging reports.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
