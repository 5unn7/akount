'use client';

import { useState } from 'react';
import { FileSelectionStep, UploadProgressStep, ResultsStep } from './steps';
import type { ImportAccount, UploadFileItem } from './types';

/**
 * Bank Statement Import — Multi-File Upload Wizard
 *
 * Simplified orchestrator using focused step components:
 * - FileSelectionStep: File selection, validation, account assignment
 * - UploadProgressStep: Sequential upload with progress tracking
 * - ResultsStep: Results display with aggregate stats
 *
 * Financial Clarity: glass cards, amber drag state, dark-mode surfaces
 */

type WizardStep = 'select' | 'uploading' | 'results';

interface ImportUploadFormProps {
    accounts?: ImportAccount[];
}

export function ImportUploadForm({ accounts = [] }: ImportUploadFormProps) {
    const [step, setStep] = useState<WizardStep>('select');
    const [files, setFiles] = useState<UploadFileItem[]>([]);

    const handleNext = () => setStep('uploading');

    const handleUploadComplete = (updatedFiles: UploadFileItem[]) => {
        setFiles(updatedFiles);
        setStep('results');
    };

    const handleError = (error: string) => {
        // eslint-disable-next-line no-console
        console.error('Upload error:', error);
        setStep('select');
    };

    const handleReset = () => {
        setStep('select');
        setFiles([]);
    };

    // Step 3: Results
    if (step === 'results') {
        return (
            <ResultsStep
                files={files}
                accounts={accounts}
                onReset={handleReset}
            />
        );
    }

    // Step 2: Uploading
    if (step === 'uploading') {
        return (
            <UploadProgressStep
                files={files}
                onComplete={handleUploadComplete}
                onError={handleError}
            />
        );
    }

    // Step 1: Select files
    return (
        <FileSelectionStep
            accounts={accounts}
            files={files}
            onFilesChange={setFiles}
            onNext={handleNext}
        />
    );
}
