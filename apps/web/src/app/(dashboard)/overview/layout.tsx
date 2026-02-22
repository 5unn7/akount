import { DomainTabs } from '@/components/shared/DomainTabs';
import { getDomainTabs } from '@/lib/navigation';

export default function OverviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <DomainTabs tabs={getDomainTabs('overview')} />
            {children}
        </div>
    );
}
