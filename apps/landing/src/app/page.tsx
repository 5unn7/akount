// UX-103: Import HeroSectionClient (dynamic with ssr:false) instead of direct HeroSection
// to prevent 3D orb hydration errors
import { HeroSectionClient as HeroSection } from '@/components/landing/HeroSectionClient';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { FeaturesShowcaseWrapper } from '@/components/landing/FeaturesShowcaseWrapper';
import { StatsSection } from '@/components/landing/StatsSection';
import { CTASection } from '@/components/landing/CTASection';
import { LandingLayout } from '@/components/landing/LandingLayout';

export default function LandingPage() {
  return (
    <LandingLayout>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesShowcaseWrapper />
      <StatsSection />
      <CTASection />
    </LandingLayout>
  );
}
