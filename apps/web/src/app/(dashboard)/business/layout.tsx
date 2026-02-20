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
    <div className="space-y-4">
      <DomainTabs tabs={tabs} />
      {children}
    </div>
  );
}
