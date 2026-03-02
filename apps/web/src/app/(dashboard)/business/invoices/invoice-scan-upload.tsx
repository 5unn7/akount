'use client';

import { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useJobStream } from '@/hooks/use-job-stream';
import { apiFetch } from '@/lib/api/client-browser';
import { formatCurrency } from '@/lib/utils/currency';
import { Button, Badge, Card, ProgressBar } from '@akount/ui';
import { toast } from 'sonner';
import { Upload, Camera, FileText, CheckCircle2, XCircle, Edit, Loader2 } from 'lucide-react';

/**
 * Invoice Scan Upload Component (DEV-244, B10)
 *
 * Client component for uploading and scanning invoice PDFs via AI.
 *
 * **Features:**
 * - Drag-and-drop file upload (images + PDFs)
 * - File picker button as fallback
 * - Mobile camera capture
 * - SSE real-time processing status via useJobStream
 * - Extracted data preview with confidence badge
 * - Approve / Edit / Reject actions
 * - Glass card design matching Akount aesthetic
 *
 * **Usage:**
 * ```tsx
 * <InvoiceScanUpload entityId={entityId} onApprove={(invoiceId) => router.push(`/business/invoices/${invoiceId}`)} />
 * ```
 *
 * **Flow:**
 * 1. User uploads image → POST /api/business/invoices/scan
 * 2. API returns jobId → component starts SSE streaming
 * 3. useJobStream tracks extraction progress
 * 4. On completion, show extracted data for review
 * 5. User approves → create invoice → redirect
 */

interface InvoiceExtraction {
  client: string;
  clientId?: string | null;
  amount: number; // Integer cents
  totalAmount: number; // Integer cents
  subtotal: number; // Integer cents
  taxAmount: number; // Integer cents
  date: string; // ISO date (issue date)
  dueDate: string; // ISO date (calculated from payment terms)
  paymentTerms: string; // "NET 30", "Due on receipt", etc.
  invoiceNumber?: string | null;
  confidence: number; // 0-100
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number; // Integer cents
    amount: number; // Integer cents
    taxAmount: number; // Integer cents
  }>;
}

type UploadState =
  | { stage: 'idle' }
  | { stage: 'uploading'; progress: number }
  | { stage: 'processing'; jobId: string }
  | { stage: 'review'; data: InvoiceExtraction }
  | { stage: 'approved'; invoiceId: string }
  | { stage: 'error'; message: string };

interface InvoiceScanUploadProps {
  entityId: string;
  /** Callback when invoice is approved and created */
  onApprove?: (invoiceId: string) => void;
  /** Callback when user wants to edit extracted data */
  onEdit?: (data: InvoiceExtraction) => void;
  /** Callback when extraction is rejected */
  onReject?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/pdf': ['.pdf'],
  'image/heic': ['.heic'],
};

export function InvoiceScanUpload({ entityId, onApprove, onEdit, onReject }: InvoiceScanUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ stage: 'idle' });
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // SSE streaming for job progress (only active when processing)
  const jobId = uploadState.stage === 'processing' ? uploadState.jobId : null;
  const { status, progress, result, error: jobError } = useJobStream(jobId);

  // Handle job completion/failure from SSE
  if (uploadState.stage === 'processing' && status === 'completed' && result) {
    const extraction = result as InvoiceExtraction;
    setUploadState({ stage: 'review', data: extraction });

    // Low confidence warning
    if (extraction.confidence < 80) {
      toast.warning('Low confidence extraction. Please review the extracted data carefully before approving.');
    }
  }

  if (uploadState.stage === 'processing' && status === 'failed' && jobError) {
    setUploadState({ stage: 'error', message: jobError });
    toast.error(`Extraction failed: ${jobError}`);
  }

  // File upload handler
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      const file = files[0];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size exceeds 10MB limit. Please upload a smaller file.');
        return;
      }

      setUploadState({ stage: 'uploading', progress: 0 });

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entityId', entityId);

        // Upload to API
        const response = await fetch('/api/business/invoices/scan', {
          method: 'POST',
          body: formData,
          headers: {
            // Auth token added by Clerk automatically
          },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({
            error: response.statusText,
          }));

          throw new Error(error.error || error.message || 'Upload failed');
        }

        const { jobId: returnedJobId } = await response.json();

        // Start processing stage (SSE will take over)
        setUploadState({ stage: 'processing', jobId: returnedJobId });

        toast.success('Processing invoice - extracting data from your document...');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        setUploadState({ stage: 'error', message });
        toast.error(`Upload failed: ${message}`);
      }
    },
    [entityId]
  );

  // Dropzone setup
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    onDrop: handleFileUpload,
    disabled: uploadState.stage !== 'idle',
  });

  // Camera capture handler
  const handleCameraCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(Array.from(files));
      }
    },
    [handleFileUpload]
  );

  // Action handlers
  const handleApprove = useCallback(async () => {
    if (uploadState.stage !== 'review') return;

    try {
      // Create invoice from extracted data
      const response = await apiFetch<{ id: string }>('/api/business/invoices', {
        method: 'POST',
        body: JSON.stringify({
          entityId,
          clientId: uploadState.data.clientId || undefined,
          invoiceNumber: uploadState.data.invoiceNumber || `INV-${Date.now()}`,
          issueDate: uploadState.data.date,
          dueDate: uploadState.data.dueDate,
          paymentTerms: uploadState.data.paymentTerms,
          currency: 'CAD', // Default
          subtotal: uploadState.data.subtotal,
          taxAmount: uploadState.data.taxAmount,
          total: uploadState.data.totalAmount,
          status: 'DRAFT' as const,
          lines: uploadState.data.lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxAmount: item.taxAmount,
            amount: item.amount,
          })),
        }),
      });

      setUploadState({ stage: 'approved', invoiceId: response.id });

      toast.success('Invoice has been created successfully.');

      onApprove?.(response.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create invoice';
      toast.error(`Failed to create invoice: ${message}`);
    }
  }, [uploadState, entityId, onApprove]);

  const handleEdit = useCallback(() => {
    if (uploadState.stage !== 'review') return;
    onEdit?.(uploadState.data);
  }, [uploadState, onEdit]);

  const handleReject = useCallback(() => {
    setUploadState({ stage: 'idle' });
    onReject?.();
    toast('Extraction rejected. You can upload another invoice.');
  }, [onReject]);

  const handleRetry = useCallback(() => {
    setUploadState({ stage: 'idle' });
  }, []);

  // Render states
  if (uploadState.stage === 'uploading') {
    return (
      <Card variant="glass" padding="lg" className="rounded-xl">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading file...</p>
            <ProgressBar value={uploadState.progress} className="w-full" />
        </div>
      </Card>
    );
  }

  if (uploadState.stage === 'processing') {
    return (
      <Card variant="glass" padding="lg" className="rounded-xl">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <p className="font-medium">Processing Invoice...</p>
              <p className="text-sm text-muted-foreground">
                Extracting client, amount, payment terms, and line items
              </p>
            </div>
            <ProgressBar value={progress} className="w-full" />
            <p className="text-micro text-muted-foreground">{progress}% complete</p>
        </div>
      </Card>
    );
  }

  if (uploadState.stage === 'review') {
    const { data } = uploadState;

    return (
      <Card variant="glass" padding="lg" className="rounded-xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-ak-green" />
              <h3 className="font-heading text-lg">Extraction Complete</h3>
            </div>
            <Badge
              variant="default"
              className={
                data.confidence >= 80
                  ? 'bg-ak-green-dim text-ak-green border-ak-green/20'
                  : 'bg-ak-red-dim text-ak-red border-ak-red/20'
              }
            >
              {data.confidence}% Confidence
            </Badge>
          </div>

          {/* Extracted Data */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Client</span>
              <span className="font-medium">{data.client}</span>
            </div>

            {data.invoiceNumber && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Invoice Number</span>
                <span className="font-mono text-sm">{data.invoiceNumber}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm">{new Date(data.date).toLocaleDateString('en-CA')}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Due Date</span>
              <span className="text-sm">{new Date(data.dueDate).toLocaleDateString('en-CA')}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Payment Terms</span>
              <Badge variant="default">{data.paymentTerms}</Badge>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-ak-border">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatCurrency(data.subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tax</span>
              <span className="font-mono">{formatCurrency(data.taxAmount)}</span>
            </div>

            <div className="flex justify-between items-center font-medium pt-2 border-t border-ak-border">
              <span>Total</span>
              <span className="font-mono text-lg">{formatCurrency(data.totalAmount)}</span>
            </div>
          </div>

          {/* Line Items */}
          {data.lineItems.length > 0 && (
            <div className="border-t border-ak-border pt-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Line Items
              </p>
              <div className="space-y-2">
                {data.lineItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex-1">
                      <span className="text-muted-foreground">
                        {item.quantity}x {item.description}
                      </span>
                    </div>
                    <span className="font-mono">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t border-ak-border">
            <Button variant="ghost" onClick={handleReject} className="gap-2">
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button variant="ghost" onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button onClick={handleApprove} className="gap-2 bg-ak-green hover:bg-ak-green/90">
              <CheckCircle2 className="h-4 w-4" />
              Approve & Create Invoice
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (uploadState.stage === 'error') {
    return (
      <Card variant="glass" padding="lg" className="rounded-xl border-destructive/50">
        <div className="flex flex-col items-center gap-4 text-center">
            <XCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-2">
              <p className="font-medium text-destructive">Extraction Failed</p>
              <p className="text-sm text-muted-foreground">{uploadState.message}</p>
            </div>
            <Button variant="ghost" onClick={handleRetry} className="gap-2">
              Try Again
            </Button>
        </div>
      </Card>
    );
  }

  if (uploadState.stage === 'approved') {
    return (
      <Card variant="glass" padding="lg" className="rounded-xl border-ak-green/50">
        <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-ak-green" />
            <div className="space-y-2">
              <p className="font-medium text-ak-green">Invoice Created Successfully</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to invoice details...
              </p>
            </div>
        </div>
      </Card>
    );
  }

  // Idle state - upload UI
  return (
    <Card variant="glass" padding="lg" className="rounded-xl">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8
            transition-all cursor-pointer
            ${
              isDragActive
                ? 'border-primary bg-ak-pri-dim'
                : 'border-ak-border-2 hover:border-ak-border-3 hover:bg-ak-bg-3'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-ak-pri-dim">
              <FileText className="h-8 w-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h3 className="font-heading text-lg">
                {isDragActive ? 'Drop your invoice here' : 'Drag & Drop Invoice or PDF'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Accepts: JPEG, PNG, PDF, HEIC • Max 10MB
              </p>
            </div>
          </div>
        </div>

        {/* Alternative upload methods */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="ghost"
            className="flex-1 gap-2"
            onClick={() => document.querySelector<HTMLInputElement>('#file-input')?.click()}
          >
            <Upload className="h-4 w-4" />
            Choose File
          </Button>

          <Button
            variant="ghost"
            className="flex-1 gap-2"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
        </div>

        {/* Hidden file inputs */}
        <input
          id="file-input"
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleFileUpload(Array.from(files));
            }
          }}
          className="hidden"
        />

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
          className="hidden"
        />
    </Card>
  );
}
