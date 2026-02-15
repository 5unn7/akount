import { prisma, Prisma } from '@akount/db';
import type { TenantContext } from '@/lib/middleware/tenant';
import type {
  CreateClientInput,
  UpdateClientInput,
  ListClientsInput,
} from '../schemas/client.schema';

/**
 * Client service — Business logic for client CRUD operations.
 *
 * CRITICAL RULES:
 * - Tenant isolation: All queries MUST filter by tenantId via entity relation
 * - Soft delete: Use deletedAt field, filter deletedAt: null
 * - Get single includes aggregated stats (openInvoices count, balanceDue)
 */

export async function createClient(
  data: CreateClientInput,
  ctx: TenantContext
) {
  // Verify entity belongs to tenant
  const entity = await prisma.entity.findFirst({
    where: {
      id: data.entityId,
      tenantId: ctx.tenantId,
      deletedAt: null,
    },
  });

  if (!entity) {
    throw new Error('Entity not found');
  }

  return prisma.client.create({
    data: {
      entityId: data.entityId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      paymentTerms: data.paymentTerms,
      status: data.status,
    },
    include: { entity: true },
  });
}

export async function listClients(
  filters: ListClientsInput,
  ctx: TenantContext
) {
  const where: Prisma.ClientWhereInput = {
    entity: { tenantId: ctx.tenantId },
    deletedAt: null,
  };

  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.cursor) where.id = { gt: filters.cursor };

  const clients = await prisma.client.findMany({
    where,
    include: { entity: true },
    orderBy: { createdAt: 'desc' },
    take: filters.limit,
  });

  const nextCursor =
    clients.length === filters.limit
      ? clients[clients.length - 1].id
      : null;

  return { clients, nextCursor };
}

export async function getClient(id: string, ctx: TenantContext) {
  const client = await prisma.client.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
    include: { entity: true },
  });

  if (!client) throw new Error('Client not found');

  // Aggregate open invoices and balance due
  // SECURITY FIX H-1: Add tenant isolation to prevent cross-tenant data leakage
  const [openInvoices, balance] = await Promise.all([
    prisma.invoice.count({
      where: {
        clientId: id,
        entity: { tenantId: ctx.tenantId },
        status: { in: ['SENT', 'OVERDUE'] },
        deletedAt: null,
      },
    }),
    prisma.invoice.aggregate({
      where: {
        clientId: id,
        entity: { tenantId: ctx.tenantId },
        status: { in: ['SENT', 'OVERDUE'] },
        deletedAt: null,
      },
      _sum: { total: true, paidAmount: true },
    }),
  ]);

  const balanceDue = (balance._sum.total || 0) - (balance._sum.paidAmount || 0);

  return {
    ...client,
    openInvoices,
    balanceDue, // Integer cents
  };
}

export async function updateClient(
  id: string,
  data: UpdateClientInput,
  ctx: TenantContext
) {
  // Verify exists and tenant owns (without stats)
  const client = await prisma.client.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
  });

  if (!client) throw new Error('Client not found');

  return prisma.client.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.paymentTerms !== undefined && { paymentTerms: data.paymentTerms }),
      ...(data.status && { status: data.status }),
    },
    include: { entity: true },
  });
}

export async function deleteClient(id: string, ctx: TenantContext) {
  // Verify exists and tenant owns
  const client = await prisma.client.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
  });

  if (!client) throw new Error('Client not found');

  return prisma.client.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
