import { DomainTabs } from '@/components/shared/DomainTabs';
import { getDomainTabs } from '@/lib/navigation';

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <DomainTabs tabs={getDomainTabs('business')} />
      {children}
    </div>
  );
}
