// Sample problematic TypeScript code for testing agents

// Problem 1: Using 'any' type
function processInvoice(data: any) {
  return data.total;
}

// Problem 2: Float arithmetic for money
function calculateTax(subtotal: number): number {
  return subtotal * 0.05;
}

// Problem 3: Missing tenant isolation
export async function getInvoices() {
  return await prisma.invoice.findMany();
}

// Problem 4: No input validation
export async function POST(request: NextRequest) {
  const body = await request.json();
  await prisma.invoice.create({ data: body });
  return NextResponse.json({ success: true });
}

// Problem 5: Using 'use client' unnecessarily
'use client';
export default function InvoiceList() {
  return <div>List of invoices</div>;
}
