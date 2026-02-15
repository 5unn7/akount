import type { FastifyInstance } from 'fastify';
import { invoiceRoutes } from '../invoicing/routes/invoices';
import { billRoutes } from '../invoicing/routes/bills';
import { clientRoutes } from '../clients/routes/clients';
import { vendorRoutes } from '../vendors/routes/vendors';

/**
 * Business Domain Routes
 *
 * Handles invoices, bills, clients, and vendors.
 * All routes require authentication and are tenant-scoped (handled by sub-routes).
 *
 * Routes available:
 * - /api/business/invoices (AR)
 * - /api/business/bills (AP)
 * - /api/business/clients
 * - /api/business/vendors
 */
export async function businessRoutes(fastify: FastifyInstance) {
  // Register sub-routes (each handles its own auth/tenant middleware)
  await fastify.register(invoiceRoutes, { prefix: '/invoices' });
  await fastify.register(billRoutes, { prefix: '/bills' });
  await fastify.register(clientRoutes, { prefix: '/clients' });
  await fastify.register(vendorRoutes, { prefix: '/vendors' });
}
