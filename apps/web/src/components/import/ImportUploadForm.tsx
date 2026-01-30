'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ImportPreviewTable } from './ImportPreviewTable';

/**
 * Bank Statement Import Upload Form
 *
 * Features:
 * - Drag-and-drop file upload
 * - File type validation
 * - Progress indicator
 * - Real-time preview with duplicate detection and categorization
 */

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

export function ImportUploadForm() {
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
      // Create form data (no accountId yet - we'll extract account info from file)
      const formData = new FormData();
      formData.append('file', selectedFile);
      // Don't send accountId yet - let the API extract account info and suggest matches

      // Upload to API
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
      <Card>
        <CardHeader>
          <CardTitle>Upload Bank Statement</CardTitle>
          <CardDescription>
            Supported formats: CSV, PDF, OFX/QFX, Excel (XLSX/XLS). Maximum file size: 10MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Zone */}
          {!uploadedData && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-full">
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
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
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
            <div className="flex items-start space-x-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Upload Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {uploadedData && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Upload Successful</p>
                  <p className="text-sm text-green-700">
                    Found {uploadedData.summary.total} transactions
                    {uploadedData.summary.duplicates > 0 &&
                      ` (${uploadedData.summary.duplicates} duplicates detected)`}
                    {uploadedData.summary.categorized > 0 &&
                      `, ${uploadedData.summary.categorized} auto-categorized`}
                  </p>
                  {uploadedData.externalAccountData && (
                    <div className="mt-2 text-xs text-green-600">
                      <p>
                        Detected:{' '}
                        {uploadedData.externalAccountData.institutionName && (
                          <span className="font-medium">
                            {uploadedData.externalAccountData.institutionName}
                          </span>
                        )}
                        {uploadedData.externalAccountData.externalAccountId && (
                          <span className="ml-2">
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
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-3">
                    Select an Account for Import
                  </h3>
                  <p className="text-xs text-blue-700 mb-4">
                    We found these matching accounts based on the statement information:
                  </p>

                  <div className="space-y-2">
                    {uploadedData.suggestedAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-3 bg-white border border-blue-200 rounded-md hover:border-blue-400 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{account.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {account.entity.name} • {account.type} • {account.currency}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              Match: {account.matchReasons.join(', ')} ({account.matchScore}% confidence)
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-200">
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
