import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getVendor } from '@/lib/api/vendors';
import { listBills } from '@/lib/api/bills';
import { VendorDetailClient } from './vendor-detail-client';

interface VendorDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({
    params,
}: VendorDetailPageProps): Promise<Metadata> {
    const { id } = await params;
    try {
        const vendor = await getVendor(id);
        return {
            title: `${vendor.name} | Vendors | Akount`,
            description: `View vendor details for ${vendor.name}`,
        };
    } catch {
        return { title: 'Vendor Not Found | Akount' };
    }
}

export default async function VendorDetailPage({
    params,
}: VendorDetailPageProps) {
    const { id } = await params;

    let vendor;
    let bills;

    try {
        const [vendorData, billData] = await Promise.all([
            getVendor(id),
            listBills({ vendorId: id, limit: 50 }),
        ]);
        vendor = vendorData;
        bills = billData.bills;
    } catch {
        notFound();
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <Link
                href="/business/vendors"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Vendors
            </Link>

            <VendorDetailClient vendor={vendor} bills={bills} />
        </div>
    );
}
