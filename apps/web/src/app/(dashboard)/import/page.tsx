import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ImportUploadForm } from '@/components/import/ImportUploadForm';

/**
 * Bank Statement Import Page
 *
 * Allows users to upload bank statements (CSV, PDF, OFX, XLSX) and import transactions.
 * Includes duplicate detection and auto-categorization.
 */

export default async function ImportPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Import Transactions</h2>
          <p className="text-muted-foreground">
            Upload bank statements to automatically import transactions
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <ImportUploadForm />
      </div>
    </div>
  );
}
