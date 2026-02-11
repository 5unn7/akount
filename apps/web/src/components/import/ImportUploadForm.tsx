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
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ImportPreviewTable } from './ImportPreviewTable';

/**
 * Bank Statement Import Upload Form
 * Financial Clarity: glass cards, amber drag state, dark-mode surfaces
 */

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

interface UploadedFile {
  file: File;
  parseId: string;
  accountId?: string;
  fileName: string;
  fileSize: number;
  sourceType: 'CSV' | 'PDF' | 'OFX' | 'XLSX';
  columns?: string[];
  columnMappings?: any;
  preview?: any;
  transactions: any[];
  summary: {
    total: number;
    duplicates: number;
    categorized: number;
    needsReview: number;
  };
  externalAccountData?: {
    externalAccountId?: string;
    institutionName?: string;
    accountType?: string;
    currency?: string;
  };
  suggestedAccounts?: Array<{
    id: string;
    name: string;
    type: string;
    currency: string;
    entity: {
      id: string;
      name: string;
    };
    matchScore: number;
    matchReasons: string[];
  }>;
  requiresAccountSelection?: boolean;
}

export function ImportUploadForm({ accounts = [] }: ImportUploadFormProps) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    const validExtensions = ['.csv', '.pdf', '.ofx', '.qfx', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setError('Invalid file type. Supported formats: CSV, PDF, OFX, XLSX');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`);
      return;
    }

    setSelectedFile(file);
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Upload file to API
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedAccountId) {
        formData.append('accountId', selectedAccountId);
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

      setUploadedData({
        file: selectedFile,
        ...data,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSelectedAccountId('');
    setSelectedFile(null);
    setUploadedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="font-heading font-normal">Upload Bank Statement</CardTitle>
          <CardDescription>
            Supported formats: CSV, PDF, OFX/QFX, Excel (XLSX/XLS). Maximum file size: 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Selection */}
          {accounts.length > 0 && !uploadedData && (
            <div className="space-y-2">
              <Label htmlFor="account-select" className="text-xs uppercase tracking-wider text-muted-foreground">
                Target Account
              </Label>
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
                Optional. Select the account these transactions belong to.
              </p>
            </div>
          )}

          {/* File Upload Zone */}
          {!uploadedData && (
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
                  disabled={isUploading}
                >
                  Browse Files
                </Button>
              </div>
            </div>
          )}

          {/* Selected File Display */}
          {selectedFile && !uploadedData && (
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
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
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

          {/* Success Display */}
          {uploadedData && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.2)] rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-[#34D399] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#34D399]">Upload Successful</p>
                  <p className="text-sm text-[rgba(52,211,153,0.8)]">
                    Found <span className="font-mono">{uploadedData.summary.total}</span> transactions
                    {uploadedData.summary.duplicates > 0 &&
                      ` (${uploadedData.summary.duplicates} duplicates detected)`}
                    {uploadedData.summary.categorized > 0 &&
                      `, ${uploadedData.summary.categorized} auto-categorized`}
                  </p>
                  {uploadedData.externalAccountData && (
                    <div className="mt-2 text-xs text-[rgba(52,211,153,0.7)]">
                      <p>
                        Detected:{' '}
                        {uploadedData.externalAccountData.institutionName && (
                          <span className="font-medium">
                            {uploadedData.externalAccountData.institutionName}
                          </span>
                        )}
                        {uploadedData.externalAccountData.externalAccountId && (
                          <span className="ml-2 font-mono">
                            Account: {uploadedData.externalAccountData.externalAccountId}
                          </span>
                        )}
                        {uploadedData.externalAccountData.accountType && (
                          <span className="ml-2 capitalize">
                            ({uploadedData.externalAccountData.accountType})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Upload New File
                </Button>
              </div>

              {/* Account Selection (if required) */}
              {uploadedData.requiresAccountSelection && uploadedData.suggestedAccounts && (
                <div className="p-4 bg-[rgba(96,165,250,0.08)] border border-[rgba(96,165,250,0.2)] rounded-lg">
                  <h3 className="text-sm font-medium text-[#60A5FA] mb-3">
                    Select an Account for Import
                  </h3>
                  <p className="text-xs text-[rgba(96,165,250,0.7)] mb-4">
                    We found these matching accounts based on the statement information:
                  </p>

                  <div className="space-y-2">
                    {uploadedData.suggestedAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-3 glass rounded-lg hover:bg-[rgba(255,255,255,0.04)] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{account.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {account.entity.name} &bull; {account.type} &bull; <span className="font-mono">{account.currency}</span>
                            </p>
                            <p className="text-xs text-[#60A5FA] mt-1">
                              Match: {account.matchReasons.join(', ')} (<span className="font-mono">{account.matchScore}%</span> confidence)
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[rgba(96,165,250,0.15)]">
                    <Button variant="outline" size="sm" className="w-full">
                      Create New Account
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Table */}
      {uploadedData && (
        <ImportPreviewTable
          transactions={uploadedData.transactions}
          summary={uploadedData.summary}
          sourceType={uploadedData.sourceType}
          columns={uploadedData.columns}
          columnMappings={uploadedData.columnMappings}
          preview={uploadedData.preview}
        />
      )}
    </div>
  );
}
