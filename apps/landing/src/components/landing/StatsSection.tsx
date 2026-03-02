'use client';

import { useEffect, useRef, useState } from 'react';

const stats = [
  { value: '1M+', label: 'Transactions processed' },
  { value: '99.98%', label: 'Categorization accuracy' },
  { value: '12 hours', label: 'Saved per month' },
  { value: '26', label: 'Currencies supported' },
];

export function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 px-6 bg-gradient-to-b from-[#09090F] via-ak-bg-4 to-[#09090F]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-5xl font-normal text-foreground mb-4">
            Trusted by solopreneurs <span className="text-primary">worldwide</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real data from real businesses running on Akount.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`glass rounded-xl p-8 border border-ak-border text-center transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="font-mono text-4xl md:text-5xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto">
            Join thousands of solopreneurs who've eliminated manual bookkeeping and gained complete
            financial visibility across their global operations.
          </p>
        </div>
      </div>
    </section>
  );
}
