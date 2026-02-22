import type { Metadata } from "next";
import { Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Tax Rates | Akount",
    description: "Manage tax rates and GST/HST settings",
};

export default function TaxRatesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight font-heading">Tax Rates</h2>
                    <Badge variant="outline" className="text-xs glass text-muted-foreground border-ak-border">
                        Coming Soon
                    </Badge>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Configure tax rates for Canadian GST/HST and provincial taxes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide tax rate management,
                        compound tax support, and multi-jurisdiction handling.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
