'use client';

import { GlowCard } from '@/components/ui/glow-card';
import { CardContent } from '@/components/ui/card';

export function SolutionSection() {
  const solutions = [
    {
      title: 'Real-time consolidation',
      description:
        'Every transaction, every currency, every entity in one place. Updated instantly.',
      gradient: 'from-ak-green/10 via-ak-green/5 to-transparent',
    },
    {
      title: 'AI categorization',
      description:
        'Machine learning learns your business patterns and auto-categorizes 95% of transactions.',
      gradient: 'from-ak-purple/10 via-ak-purple/5 to-transparent',
    },
    {
      title: 'Audit-ready compliance',
      description:
        'Double-entry bookkeeping, source document preservation, immutable audit trails.',
      gradient: 'from-ak-blue/10 via-ak-blue/5 to-transparent',
    },
  ];

  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-[#09090F] via-ak-bg-4 to-[#09090F]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-5xl font-normal text-foreground mb-4">
            Built for <span className="text-primary">global operations</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three pillars that eliminate the chaos and give you complete financial clarity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <GlowCard
              key={index}
              variant="glass"
              className="relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300"
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${solution.gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}
              ></div>

              <CardContent className="relative z-10 p-8">
                <h3 className="text-2xl font-semibold text-foreground mb-4">{solution.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{solution.description}</p>
              </CardContent>
            </GlowCard>
          ))}
        </div>

        {/* Additional context */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
            Akount automatically handles exchange rates, categorizes transactions with 99.98% accuracy,
            and maintains complete audit trails for tax compliance. No manual data entry required.
          </p>
        </div>
      </div>
    </section>
  );
}
