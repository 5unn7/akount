import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEntityDetail } from '@/lib/api/entities';
import { EntityDetailClient } from '@/components/entities/EntityDetailClient';

interface EntityDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(
    { params }: EntityDetailPageProps
): Promise<Metadata> {
    const { id } = await params;
    try {
        const entity = await getEntityDetail(id);
        return {
            title: `${entity.name} | Entities | Akount`,
            description: `Manage ${entity.name} entity settings`,
        };
    } catch {
        return {
            title: 'Entity Not Found | Akount',
        };
    }
}

export default async function EntityDetailPage({ params }: EntityDetailPageProps) {
    const { id } = await params;

    let entity;
    try {
        entity = await getEntityDetail(id);
    } catch {
        notFound();
    }

    return <EntityDetailClient entity={entity} />;
}
