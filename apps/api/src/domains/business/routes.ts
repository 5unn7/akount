import type { FastifyInstance } from 'fastify';
import { invoiceRoutes } from '../invoicing/routes/invoices';
import { billRoutes } from '../invoicing/routes/bills';
import { paymentRoutes } from '../invoicing/routes/payments';
import { clientRoutes } from '../clients/routes/clients';
import { vendorRoutes } from '../vendors/routes/vendors';
import { billScanRoutes } from './routes/bill-scan';
import { invoiceScanRoutes } from './routes/invoice-scan';

/**
 * Business Domain Routes
 *
 * Handles invoices, bills, payments, clients, and vendors.
 * All routes require authentication and are tenant-scoped (handled by sub-routes).
 *
 * Routes available:
 * - /api/business/invoices (AR)
 * - /api/business/bills (AP)
 * - /api/business/payments (AR/AP)
 * - /api/business/clients
 * - /api/business/vendors
 * - /api/business/bills/scan (DEV-240 - AI bill scanning)
 * - /api/business/invoices/scan (DEV-241 - AI invoice scanning)
 */
export async function businessRoutes(fastify: FastifyInstance) {
  // Register sub-routes (each handles its own auth/tenant middleware)
  await fastify.register(invoiceRoutes, { prefix: '/invoices' });
  await fastify.register(billRoutes, { prefix: '/bills' });
  await fastify.register(paymentRoutes, { prefix: '/payments' });
  await fastify.register(clientRoutes, { prefix: '/clients' });
  await fastify.register(vendorRoutes, { prefix: '/vendors' });

  // AI document scanning routes (DEV-240, DEV-241)
  await fastify.register(billScanRoutes, { prefix: '/bills' });
  await fastify.register(invoiceScanRoutes, { prefix: '/invoices' });
}
