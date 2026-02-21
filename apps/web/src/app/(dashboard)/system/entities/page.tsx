import type { Metadata } from "next";
import { listEntities } from "@/lib/api/entities";
import { EntityHubClient } from "@/components/entities/EntityHubClient";

export const metadata: Metadata = {
    title: "Entities | Akount",
    description: "Manage your business entities",
};

export default async function EntitiesPage() {
    const entities = await listEntities();

    return <EntityHubClient initialEntities={entities} />;
}
