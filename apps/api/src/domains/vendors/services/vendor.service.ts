import { prisma, Prisma } from '@akount/db';
import type { TenantContext } from '@/lib/middleware/tenant';
import type {
  CreateVendorInput,
  UpdateVendorInput,
  ListVendorsInput,
} from '../schemas/vendor.schema';

/**
 * Vendor service — Business logic for vendor CRUD operations.
 *
 * Mirrors client.service.ts but uses Bill instead of Invoice.
 *
 * CRITICAL RULES:
 * - Tenant isolation: All queries MUST filter by tenantId via entity relation
 * - Soft delete: Use deletedAt field, filter deletedAt: null
 * - Get single includes aggregated stats (openBills count, balanceDue)
 */

export async function createVendor(
  data: CreateVendorInput,
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

  return prisma.vendor.create({
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

export async function listVendors(
  filters: ListVendorsInput,
  ctx: TenantContext
) {
  const where: Prisma.VendorWhereInput = {
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

  const vendors = await prisma.vendor.findMany({
    where,
    include: { entity: true },
    orderBy: { createdAt: 'desc' },
    take: filters.limit,
  });

  const nextCursor =
    vendors.length === filters.limit
      ? vendors[vendors.length - 1].id
      : null;

  return { vendors, nextCursor };
}

export async function getVendor(id: string, ctx: TenantContext) {
  const vendor = await prisma.vendor.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
    include: { entity: true },
  });

  if (!vendor) throw new Error('Vendor not found');

  // Aggregate open bills and balance due
  // SECURITY FIX H-1: Add tenant isolation to prevent cross-tenant data leakage
  const [openBills, balance] = await Promise.all([
    prisma.bill.count({
      where: {
        vendorId: id,
        entity: { tenantId: ctx.tenantId },
        status: { in: ['RECEIVED', 'OVERDUE'] },
        deletedAt: null,
      },
    }),
    prisma.bill.aggregate({
      where: {
        vendorId: id,
        entity: { tenantId: ctx.tenantId },
        status: { in: ['RECEIVED', 'OVERDUE'] },
        deletedAt: null,
      },
      _sum: { total: true, paidAmount: true },
    }),
  ]);

  const balanceDue = (balance._sum.total || 0) - (balance._sum.paidAmount || 0);

  return {
    ...vendor,
    openBills,
    balanceDue, // Integer cents
  };
}

export async function updateVendor(
  id: string,
  data: UpdateVendorInput,
  ctx: TenantContext
) {
  // Verify exists and tenant owns (without stats)
  const vendor = await prisma.vendor.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
  });

  if (!vendor) throw new Error('Vendor not found');

  return prisma.vendor.update({
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

export async function deleteVendor(id: string, ctx: TenantContext) {
  // Verify exists and tenant owns
  const vendor = await prisma.vendor.findFirst({
    where: {
      id,
      entity: { tenantId: ctx.tenantId },
      deletedAt: null,
    },
  });

  if (!vendor) throw new Error('Vendor not found');

  return prisma.vendor.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
