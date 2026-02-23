'use client';

export function ProblemSection() {
  const problems = [
    {
      title: 'Multi-currency chaos',
      description:
        'Converting between USD, EUR, CAD manually? Losing money on stale exchange rates?',
    },
    {
      title: 'Scattered data',
      description:
        'Invoices in one app, bank accounts in another, spreadsheets everywhere?',
    },
    {
      title: 'Tax time panic',
      description:
        'Scrambling to find receipts and reconstruct transactions when deadlines hit?',
    },
  ];

  return (
    <section className="relative py-24 px-6 bg-[#09090F]">
      {/* Subtle SVG noise pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-5xl font-normal text-foreground mb-4">
            Running a global business shouldn't feel like{' '}
            <span className="text-ak-red">chaos</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most solopreneurs waste 12+ hours per month fighting their finances instead of growing
            their business.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="glass rounded-xl p-8 border border-ak-border hover:border-ak-border-2 transition-all duration-300"
            >
              <div className="mb-4">
                <div className="w-12 h-12 rounded-lg bg-ak-red-dim flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-ak-red"></div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-3">{problem.title}</h3>

              <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
