'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="relative py-32 px-6 bg-gradient-to-br from-[#09090F] via-ak-bg-4 to-[#09090F] overflow-hidden">
      {/* Gradient orb background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="glass rounded-2xl p-12 md:p-16 border border-ak-border-2 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>

          <div className="relative z-10">
            <h2 className="font-heading text-3xl md:text-5xl font-normal text-foreground mb-6">
              Start tracking your global business{' '}
              <span className="text-primary">today</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              No credit card required. 14-day free trial. Cancel anytime.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="text-base px-10 py-6 h-auto">
                  Get started free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="text-base px-10 py-6 h-auto">
                  Sign in
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-ak-green"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-ak-green"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span>14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-ak-green"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
