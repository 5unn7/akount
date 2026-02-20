import { TrendingUp, Lightbulb, Calculator, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCard {
    type: 'financial' | 'learning' | 'tax';
    title: string;
    body: string;
    meta?: string;
}

interface InsightCardsProps {
    insights?: InsightCard[];
}

const cardConfig = {
    financial: {
        icon: TrendingUp,
        label: 'Financial Insight',
        accentColor: 'bg-ak-green',
        dotColor: 'bg-ak-green',
        iconColor: 'text-ak-green',
    },
    learning: {
        icon: Lightbulb,
        label: 'Did You Know?',
        accentColor: 'bg-ak-blue',
        dotColor: 'bg-ak-blue',
        iconColor: 'text-ak-blue',
    },
    tax: {
        icon: Calculator,
        label: 'Tax Tip',
        accentColor: 'bg-primary',
        dotColor: 'bg-primary',
        iconColor: 'text-primary',
    },
} as const;

function InsightCardItem({ insight }: { insight: InsightCard }) {
    const config = cardConfig[insight.type];
    const Icon = config.icon;

    return (
        <div className="glass rounded-xl overflow-hidden">
            <div className={cn('h-0.5', config.accentColor)} />
            <div className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-2.5">
                    <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse', config.dotColor)} />
                    <Icon className={cn('h-3.5 w-3.5', config.iconColor)} />
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.05em] font-semibold text-muted-foreground">
                        {config.label}
                    </span>
                </div>
                <p className="text-xs sm:text-sm font-heading italic text-foreground/90 leading-relaxed">
                    {insight.body}
                </p>
                {insight.meta && (
                    <p className="text-[10px] font-mono text-muted-foreground mt-1.5 sm:mt-2">
                        {insight.meta}
                    </p>
                )}
            </div>
        </div>
    );
}

function InsightPlaceholder() {
    return (
        <div className="glass rounded-xl p-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <Sparkles className="h-8 w-8 text-ak-purple/40" />
                <p className="text-sm font-heading italic text-foreground/70 leading-relaxed">
                    Add transactions and invoices to unlock AI-powered insights about your finances.
                </p>
            </div>
        </div>
    );
}

export function InsightCards({ insights }: InsightCardsProps) {
    if (!insights || insights.length === 0) {
        return <InsightPlaceholder />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.map((insight, i) => (
                <InsightCardItem key={`${insight.type}-${i}`} insight={insight} />
            ))}
        </div>
    );
}
