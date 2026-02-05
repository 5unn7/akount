import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Payments | Akount",
    description: "Track incoming and outgoing payments",
};

export default function PaymentsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Payments</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Track payments received and payments made.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide payment recording,
                        invoice/bill allocation, and payment history.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
