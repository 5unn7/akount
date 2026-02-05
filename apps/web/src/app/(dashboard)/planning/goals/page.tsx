import type { Metadata } from "next";
import { Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Goals | Akount",
    description: "Set and track financial goals",
};

export default function GoalsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Goals</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Set financial goals and track your progress.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide goal setting,
                        milestone tracking, and progress visualization.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
