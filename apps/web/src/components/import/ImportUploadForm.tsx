'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { ImportPreviewTable } from './ImportPreviewTable';
import { ImportConfirmation } from './ImportConfirmation';
import {
    ColumnMappingEditor,
    readCsvHeaders,
    detectMappings,
    type ColumnMappings,
} from './ColumnMappingEditor';

/**
 * Bank Statement Import — Multi-Step Wizard
 *
 * Step 1: Select file + account
 * Step 2: Map columns (CSV only — reads headers client-side)
 * Step 3: Uploading (progress)
 * Step 4: Results (ImportConfirmation)
 *
 * Financial Clarity: glass cards, amber drag state, dark-mode surfaces
 */

type WizardStep = 'select' | 'map' | 'uploading' | 'results';

interface ImportAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  entity: { id: string; name: string };
}

interface ImportUploadFormProps {
  accounts?: ImportAccount[];
}

interface ImportResult {
  id: string;
  sourceType: 'CSV' | 'PDF';
  sourceFileName: string;
  status: string;
  totalRows: number;
  processedRows: number;
  duplicateRows: number;
  errorRows: number;
  transactions?: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    isDuplicate?: boolean;
  }>;
}

export function ImportUploadForm({ accounts = [] }: ImportUploadFormProps) {
  // Wizard state
  const [step, setStep] = useState<WizardStep>('select');

  // Step 1 state
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state (CSV column mapping)
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<Record<string, string>[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMappings | null>(null);

  // Step 3-4 state
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const isCSV = selectedFile?.name.toLowerCase().endsWith('.csv');

  // --- Step 1: File selection ---

  const handleFileSelect = (file: File) => {
    setError(null);

    const validExtensions = ['.csv', '.pdf', '.ofx', '.qfx', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setError('Invalid file type. Supported formats: CSV, PDF, OFX, XLSX');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // --- Step 1 → Step 2/3 transition ---

  const handleProceed = async () => {
    if (!selectedFile) return;

    if (isCSV) {
      // CSV: read headers client-side, go to column mapping step
      setError(null);
      try {
        const { columns, previewRows } = await readCsvHeaders(selectedFile);
        setCsvColumns(columns);
        setCsvPreviewRows(previewRows);
        setColumnMappings(detectMappings(columns));
        setStep('map');
      } catch (err: any) {
        setError(err.message || 'Failed to read CSV headers');
      }
    } else {
      // PDF/OFX: skip mapping, go straight to upload
      await handleUpload();
    }
  };

  // --- Step 2 → Step 3: Upload with mappings ---

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStep('uploading');
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('[Import] Uploading with:', {
        fileName: selectedFile.name,
        accountId: selectedAccountId,
        hasColumnMappings: !!columnMappings,
      });

      if (selectedAccountId) {
        formData.append('accountId', selectedAccountId);
      } else {
        console.error('[Import] No accountId selected - upload will fail');
      }

      if (columnMappings && isCSV) {
        formData.append('columnMappings', JSON.stringify(columnMappings));
      }

      const response = await fetch('/api/import/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();

      setImportResult({
        id: data.id || data.parseId || '',
        sourceType: isCSV ? 'CSV' : 'PDF',
        sourceFileName: selectedFile.name,
        status: data.status || 'PROCESSED',
        totalRows: data.summary?.total ?? data.totalRows ?? 0,
        processedRows: data.summary?.total
          ? data.summary.total - (data.summary?.duplicates ?? 0)
          : data.processedRows ?? 0,
        duplicateRows: data.summary?.duplicates ?? data.duplicateRows ?? 0,
        errorRows: data.errorRows ?? 0,
        transactions: data.transactions,
      });

      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Failed to upload file. Please try again.');
      setStep('select');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Reset ---

  const handleReset = () => {
    setStep('select');
    setSelectedAccountId('');
    setSelectedFile(null);
    setCsvColumns([]);
    setCsvPreviewRows([]);
    setColumnMappings(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  // Step 4: Results
  if (step === 'results' && importResult) {
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    return (
      <ImportConfirmation
        result={importResult}
        currency={selectedAccount?.currency}
        onUploadAnother={handleReset}
      />
    );
  }

  // Step 3: Uploading
  if (step === 'uploading') {
    return (
      <Card variant="glass">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg font-heading font-normal mb-2">
            Importing your statement...
          </p>
          <p className="text-sm text-muted-foreground">
            Parsing {selectedFile?.name}, detecting duplicates, and categorizing transactions.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Column Mapping (CSV only)
  if (step === 'map' && columnMappings) {
    return (
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={() => setStep('select')}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to file selection
          </button>
          <span className="text-white/[0.13]">|</span>
          <span>Step 2 of 3: Map Columns</span>
        </div>

        {/* File info bar */}
        <div className="flex items-center justify-between p-3 glass rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedFile?.name}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {csvColumns.length} columns detected
            </span>
          </div>
        </div>

        {/* Column Mapping Editor */}
        <ColumnMappingEditor
          columns={csvColumns}
          mappings={columnMappings}
          onMappingsChange={setColumnMappings}
          previewRows={csvPreviewRows}
        />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="rounded-lg border-white/[0.09]"
            onClick={() => setStep('select')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            className="rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-medium"
            onClick={handleUpload}
            disabled={!columnMappings.date || !columnMappings.description || !columnMappings.amount}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Transactions
          </Button>
        </div>
      </div>
    );
  }

  // Step 1: Select file + account
  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="font-heading font-normal">Upload Bank Statement</CardTitle>
          <CardDescription>
            Supported formats: CSV, PDF, OFX/QFX, Excel (XLSX/XLS). Maximum file size: 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account-select" className="text-xs uppercase tracking-wider text-muted-foreground">
              Target Account
            </Label>
            {accounts.length > 0 ? (
              <>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger
                    id="account-select"
                    className="glass-2 rounded-lg border-white/[0.06] focus:ring-[#F59E0B]"
                  >
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent className="glass-2 rounded-lg border-white/[0.09]">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currency}) &mdash; {account.entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Required. Select the account these transactions belong to.
                </p>
              </>
            ) : (
              <div className="p-4 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-lg">
                <p className="text-sm font-medium text-[#F59E0B] mb-1">No Accounts Found</p>
                <p className="text-sm text-muted-foreground">
                  You need to create a bank account before importing transactions.{' '}
                  <a href="/banking/accounts" className="text-[#F59E0B] hover:text-[#FBBF24] underline">
                    Create an account
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* File Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-primary bg-[rgba(245,158,11,0.06)] glow-primary'
                : 'border-[rgba(255,255,255,0.09)] hover:border-[rgba(255,255,255,0.13)]'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-[rgba(245,158,11,0.14)] rounded-full">
                <Upload className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV, PDF, OFX, or XLSX up to 10MB
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.pdf,.ofx,.qfx,.xlsx,.xls"
                onChange={handleFileInputChange}
              />

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleProceed}
                  disabled={!selectedAccountId}
                >
                  {isCSV ? 'Next: Map Columns' : 'Import'}
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)] rounded-lg">
              <AlertCircle className="h-5 w-5 text-[#F87171] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#F87171]">Upload Error</p>
                <p className="text-sm text-[rgba(248,113,113,0.8)]">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
