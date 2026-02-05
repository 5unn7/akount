import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
    title: "Journal Entries | Akount",
    description: "Create and manage journal entries",
};

export default function JournalEntriesPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-heading">Journal Entries</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Coming Soon
                    </CardTitle>
                    <CardDescription>
                        Create double-entry journal entries for your accounts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This feature is under development. It will provide journal entry creation
                        with multi-line support, reversing entries, and audit trails.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
