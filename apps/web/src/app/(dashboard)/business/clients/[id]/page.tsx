import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getClient } from '@/lib/api/clients';
import { listInvoices } from '@/lib/api/invoices';
import { ClientDetailClient } from './client-detail-client';

interface ClientDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(
    { params }: ClientDetailPageProps
): Promise<Metadata> {
    const { id } = await params;
    try {
        const client = await getClient(id);
        return {
            title: `${client.name} | Clients | Akount`,
            description: `View client details for ${client.name}`,
        };
    } catch {
        return { title: 'Client Not Found | Akount' };
    }
}

export default async function ClientDetailPage({
    params,
}: ClientDetailPageProps) {
    const { id } = await params;

    let client;
    let invoices;

    try {
        const [clientData, invoiceData] = await Promise.all([
            getClient(id),
            listInvoices({ clientId: id, limit: 50 }),
        ]);
        client = clientData;
        invoices = invoiceData.invoices;
    } catch {
        notFound();
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <Link
                href="/business/clients"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Clients
            </Link>

            <ClientDetailClient client={client} invoices={invoices} />
        </div>
    );
}
