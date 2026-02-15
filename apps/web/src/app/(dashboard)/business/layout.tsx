import { DomainTabs } from '@/components/shared/DomainTabs';

const tabs = [
  { label: 'Invoicing', href: '/business/invoices' },
  { label: 'Clients', href: '/business/clients' },
  { label: 'Vendors', href: '/business/vendors' },
  { label: 'Bills', href: '/business/bills' },
  { label: 'Payments', href: '/business/payments' },
];

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 space-y-6 p-6">
      <DomainTabs tabs={tabs} />
      {children}
    </div>
  );
}
