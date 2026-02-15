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

    const defaultBody = `Your cash reserves grew <strong>6.8% this month</strong>, driven by a <strong>$12,400 client payment</strong> from Maple Corp. Software subscriptions rose <strong>$340</strong> — consider consolidating overlapping tools. <strong>AR collection</strong> is healthy at 94%.`;

    return (
        <div
            className="rounded-xl p-5 border border-l-2 border-ak-purple"
            style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(167,139,250,0.06))',
                borderColor: 'rgba(245,158,11,0.08)',
            }}
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.05em] font-semibold text-primary">
                    AI Advisor
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                    {briefDate}
                </span>
            </div>
            <p
                className="text-sm font-heading italic text-foreground/90 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: body || defaultBody }}
            />
        </div>
    );
}
