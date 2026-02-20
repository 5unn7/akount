import { DomainTabs } from '@/components/shared/DomainTabs';

const overviewTabs = [
    { label: 'Dashboard', href: '/overview' },
    { label: 'Cash Flow', href: '/overview/cash-flow' },
    { label: 'Net Worth', href: '/overview/net-worth' },
];

export default function OverviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <DomainTabs tabs={overviewTabs} />
            {children}
        </div>
    );
}
