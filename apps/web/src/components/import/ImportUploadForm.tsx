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
 * - ResultsStep: Results display with aggregate stats + retry for failures
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

    const handleRetryFailed = () => {
        // Keep only failed files, reset their status to pending so they re-upload
        const failedFiles = files
            .filter(f => f.status === 'error')
            .map(f => ({ ...f, status: 'pending' as const, error: undefined }));
        if (failedFiles.length > 0) {
            setFiles(failedFiles);
            setStep('uploading');
        }
    };

    const handleReset = () => {
        setStep('select');
        setFiles([]);
    };

    const currentStepIndex = step === 'select' ? 0 : step === 'uploading' ? 1 : 2;

    // Step 3: Results
    if (step === 'results') {
        return (
            <div className="space-y-6">
                <StepIndicator currentStep={currentStepIndex} />
                <ResultsStep
                    files={files}
                    accounts={accounts}
                    onReset={handleReset}
                    onRetryFailed={handleRetryFailed}
                />
            </div>
        );
    }

    // Step 2: Uploading
    if (step === 'uploading') {
        return (
            <div className="space-y-6">
                <StepIndicator currentStep={currentStepIndex} />
                <UploadProgressStep
                    files={files}
                    onComplete={handleUploadComplete}
                    onCancel={() => {
                        // Return to file selection, keep files
                        setStep('select');
                    }}
                />
            </div>
        );
    }

    // Step 1: Select files
    return (
        <div className="space-y-6">
            <StepIndicator currentStep={currentStepIndex} />
            <FileSelectionStep
                accounts={accounts}
                files={files}
                onFilesChange={setFiles}
                onNext={handleNext}
            />
        </div>
    );
}

/* ─── Step Indicator (Task 3.2) ──────────────────────────────────── */

const STEPS = [
    { label: 'Select Files', number: 1 },
    { label: 'Upload', number: 2 },
    { label: 'Results', number: 3 },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
    return (
        <div className="flex items-center justify-center gap-2">
            {STEPS.map((step, i) => {
                const isCompleted = i < currentStep;
                const isActive = i === currentStep;
                return (
                    <div key={step.number} className="flex items-center gap-2">
                        {i > 0 && (
                            <div
                                className={`h-px w-8 transition-colors ${
                                    isCompleted ? 'bg-primary' : 'border-t border-ak-border'
                                }`}
                            />
                        )}
                        <div className="flex items-center gap-1.5">
                            <div
                                className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-medium transition-colors ${
                                    isCompleted
                                        ? 'bg-ak-green/15 text-ak-green'
                                        : isActive
                                          ? 'bg-primary text-primary-foreground'
                                          : 'glass-2 text-muted-foreground'
                                }`}
                            >
                                {isCompleted ? '\u2713' : step.number}
                            </div>
                            <span
                                className={`text-xs font-sans ${
                                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
