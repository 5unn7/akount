import { Sparkles } from 'lucide-react';

interface AIBriefProps {
    body?: string;
    date?: string;
}

export function AIBrief({ body, date }: AIBriefProps) {
    const briefDate = date || new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <div
            className="glass rounded-xl p-5 border-l-2 border-l-ak-purple"
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-ak-purple animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.05em] font-semibold text-ak-purple">
                    Insights
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                    {briefDate}
                </span>
            </div>
            {body ? (
                <p className="text-sm font-heading italic text-foreground/90 leading-relaxed">
                    {body}
                </p>
            ) : (
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                    <Sparkles className="h-5 w-5 text-ak-purple/40" />
                    <p className="text-sm font-heading italic text-foreground/70 leading-relaxed">
                        Add transactions and invoices to unlock AI-powered insights about your finances.
                    </p>
                </div>
            )}
        </div>
    );
}
