import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in development only)
  console.log('🧹 Cleaning existing data...');
  await prisma.journalLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.billLine.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.gLAccount.deleteMany();
  await prisma.tenantUser.deleteMany();
  await prisma.user.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.tenant.deleteMany();

  // Create test user
  // NOTE: Update clerkUserId with your actual Clerk user ID after creating the account
  // See TEST_CREDENTIALS.md for setup instructions
  console.log('👤 Creating test user...');
  const user = await prisma.user.create({
    data: {
      id: 'user_test_akount',
      clerkUserId: 'user_REPLACE_WITH_YOUR_CLERK_ID', // Replace with actual Clerk user ID
      email: 'testuser1@akount.local',
      name: 'Test User 1',
    },
  });

  // Create tenant
  console.log('🏢 Creating tenant...');
  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant_demo',
      name: 'Demo Company',
      region: 'CA',
      status: 'TRIAL',
      plan: 'PRO',
    },
  });

  // Create tenant-user relationship
  await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      role: 'OWNER',
    },
  });

  // Create entities (the actual businesses/accounts being tracked)
  console.log('🏪 Creating entities...');
  const businessEntity = await prisma.entity.create({
    data: {
      tenantId: tenant.id,
      name: 'Akount Inc.',
      type: 'CORPORATION',
      country: 'CA',
      taxId: '123456789',
      functionalCurrency: 'USD',
      reportingCurrency: 'USD',
    },
  });

  const personalEntity = await prisma.entity.create({
    data: {
      tenantId: tenant.id,
      name: 'Personal',
      type: 'PERSONAL',
      country: 'CA',
      taxId: null,
      functionalCurrency: 'USD',
      reportingCurrency: 'USD',
    },
  });

  // Use business entity for the rest of the seed data
  const entity = businessEntity;

  // Create chart of accounts
  console.log('📊 Creating chart of accounts...');
  const cashAccount = await prisma.gLAccount.create({
    data: {
      entityId: entity.id,
      code: '1000',
      name: 'Cash',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      isActive: true,
    },
  });

  const arAccount = await prisma.gLAccount.create({
    data: {
      entityId: entity.id,
      code: '1200',
      name: 'Accounts Receivable',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      isActive: true,
    },
  });

  const apAccount = await prisma.gLAccount.create({
    data: {
      entityId: entity.id,
      code: '2000',
      name: 'Accounts Payable',
      type: 'LIABILITY',
      normalBalance: 'CREDIT',
      isActive: true,
    },
  });

  const incomeAccount = await prisma.gLAccount.create({
    data: {
      entityId: entity.id,
      code: '4000',
      name: 'Service Revenue',
      type: 'INCOME',
      normalBalance: 'CREDIT',
      isActive: true,
    },
  });

  const expenseAccount = await prisma.gLAccount.create({
    data: {
      entityId: entity.id,
      code: '5000',
      name: 'Operating Expenses',
      type: 'EXPENSE',
      normalBalance: 'DEBIT',
      isActive: true,
    },
  });

  const equityAccount = await prisma.gLAccount.create({
    data: {
      entityId: entity.id,
      code: '3000',
      name: 'Owner Equity',
      type: 'EQUITY',
      normalBalance: 'CREDIT',
      isActive: true,
    },
  });

  // Create clients
  console.log('👥 Creating clients...');
  const client1 = await prisma.client.create({
    data: {
      entityId: entity.id,
      name: 'Acme Corporation',
      email: 'billing@acme.com',
      phone: '+1-555-0001',
      address: JSON.stringify({
        street: '123 Business St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5H 2N2',
        country: 'CA',
      }),
    },
  });

  const client2 = await prisma.client.create({
    data: {
      entityId: entity.id,
      name: 'Tech Startup Ltd',
      email: 'finance@techstartup.com',
      phone: '+1-555-0002',
      address: JSON.stringify({
        street: '456 Innovation Ave',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V6B 1A1',
        country: 'CA',
      }),
    },
  });

  // Create vendors
  console.log('🏭 Creating vendors...');
  const vendor1 = await prisma.vendor.create({
    data: {
      entityId: entity.id,
      name: 'Office Supplies Co',
      email: 'sales@officesupplies.com',
      phone: '+1-555-0101',
      address: JSON.stringify({
        street: '789 Supply Rd',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M4B 1B3',
        country: 'CA',
      }),
    },
  });

  // Create invoices
  console.log('💰 Creating invoices...');
  const invoice1 = await prisma.invoice.create({
    data: {
      entityId: entity.id,
      clientId: client1.id,
      invoiceNumber: 'INV-001',
      issueDate: new Date('2026-01-15'),
      dueDate: new Date('2026-02-14'),
      status: 'SENT',
      currency: 'CAD',
      subtotal: 5000_00, // $5,000.00 in cents
      taxAmount: 650_00,   // $650.00 (13% HST)
      total: 5650_00,     // $5,650.00
      paidAmount: 0,      // Not paid yet
      notes: 'Consulting services for January 2026',
      invoiceLines: {
        create: [
          {
            description: 'Software Development Consulting',
            quantity: 50, // 50 hours
            unitPrice: 100_00, // $100/hour
            taxAmount: 650_00,
            amount: 5000_00,
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      entityId: entity.id,
      clientId: client2.id,
      invoiceNumber: 'INV-002',
      issueDate: new Date('2026-01-20'),
      dueDate: new Date('2026-02-19'),
      status: 'PAID',
      currency: 'CAD',
      subtotal: 3000_00, // $3,000.00
      taxAmount: 390_00,   // $390.00 (13% HST)
      total: 3390_00,     // $3,390.00
      paidAmount: 3390_00,
      notes: 'System architecture consultation',
      invoiceLines: {
        create: [
          {
            description: 'Architecture Consultation',
            quantity: 30, // 30 hours
            unitPrice: 100_00, // $100/hour
            taxAmount: 390_00,
            amount: 3000_00,
          },
        ],
      },
    },
  });

  // Create bills
  console.log('📄 Creating bills...');
  const bill1 = await prisma.bill.create({
    data: {
      entityId: entity.id,
      vendorId: vendor1.id,
      billNumber: 'BILL-001',
      issueDate: new Date('2026-01-10'),
      dueDate: new Date('2026-02-09'),
      status: 'PENDING',
      currency: 'CAD',
      subtotal: 250_00, // $250.00
      taxAmount: 32_50,   // $32.50 (13% HST)
      total: 282_50,     // $282.50
      paidAmount: 0,     // Not paid yet
      notes: 'Office supplies for January',
      billLines: {
        create: [
          {
            description: 'Paper, pens, folders',
            quantity: 1,
            unitPrice: 250_00,
            taxAmount: 32_50,
            amount: 250_00,
          },
        ],
      },
    },
  });

  // Create journal entries for the paid invoice
  console.log('📖 Creating journal entries...');
  await prisma.journalEntry.create({
    data: {
      entityId: entity.id,
      date: new Date('2026-01-20'),
      memo: 'Invoice INV-002 issued',
      status: 'POSTED',
      sourceType: 'INVOICE',
      sourceId: invoice2.id,
      createdBy: user.id,
      journalLines: {
        create: [
          {
            glAccountId: arAccount.id,
            memo: 'Accounts Receivable - Invoice INV-002',
            debitAmount: 3390_00,
            creditAmount: 0,
          },
          {
            glAccountId: incomeAccount.id,
            memo: 'Service Revenue',
            debitAmount: 0,
            creditAmount: 3390_00,
          },
        ],
      },
    },
  });

  // Create payment for invoice2
  console.log('💳 Creating payments...');
  await prisma.payment.create({
    data: {
      entityId: entity.id,
      amount: 3390_00,
      currency: 'CAD',
      date: new Date('2026-01-25'),
      paymentMethod: 'TRANSFER',
      reference: 'PMT-001',
    },
  });

  // Create payment journal entry
  await prisma.journalEntry.create({
    data: {
      entityId: entity.id,
      date: new Date('2026-01-25'),
      memo: 'Payment received for Invoice INV-002',
      status: 'POSTED',
      sourceType: 'PAYMENT',
      createdBy: user.id,
      journalLines: {
        create: [
          {
            glAccountId: cashAccount.id,
            memo: 'Cash received',
            debitAmount: 3390_00,
            creditAmount: 0,
          },
          {
            glAccountId: arAccount.id,
            memo: 'Accounts Receivable payment',
            debitAmount: 0,
            creditAmount: 3390_00,
          },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log('  - 1 Tenant (Demo Company)');
  console.log('  - 1 Entity (Demo Consulting Inc.)');
  console.log('  - 1 User (demo@akount.com)');
  console.log('  - 6 GL Accounts');
  console.log('  - 2 Clients');
  console.log('  - 1 Vendor');
  console.log('  - 2 Invoices (1 sent, 1 paid)');
  console.log('  - 1 Bill (pending)');
  console.log('  - 1 Payment');
  console.log('  - 2 Journal Entries');
  console.log('');
  console.log('🔐 Test login: demo@akount.com');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
