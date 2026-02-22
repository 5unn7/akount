import { DomainTabs } from '@/components/shared/DomainTabs';
import { accountingTabs } from './tabs';

export default function AccountingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-4">
            <DomainTabs tabs={accountingTabs} />
            {children}
        </div>
    );
}
