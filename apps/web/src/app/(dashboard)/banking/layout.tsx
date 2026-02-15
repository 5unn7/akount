import { DomainTabs } from '@/components/shared/DomainTabs';

const bankingTabs = [
    { label: 'Accounts', href: '/banking/accounts' },
    { label: 'Transactions', href: '/banking/transactions' },
    { label: 'Reconciliation', href: '/banking/reconciliation' },
    { label: 'Imports', href: '/banking/imports' },
    { label: 'Transfers', href: '/banking/transfers' },
];

export default function BankingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="px-6 py-6 space-y-6">
            <DomainTabs tabs={bankingTabs} />
            {children}
        </div>
    );
}
