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
        <div className="px-6 py-6 space-y-6">
            <DomainTabs tabs={overviewTabs} />
            {children}
        </div>
    );
}
