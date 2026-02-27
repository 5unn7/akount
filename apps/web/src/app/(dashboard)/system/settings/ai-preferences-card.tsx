'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Info, CheckCircle2 } from 'lucide-react';

/**
 * AI Preferences Card (DEV-260)
 *
 * User interface for managing AI consent settings (GDPR/PIPEDA compliant).
 *
 * **Features:**
 * - 5 granular consent toggles (default: all OFF)
 * - 30-day training period banner for new users
 * - Clear descriptions for each feature
 */

interface ConsentSettings {
  autoCreateBills: boolean;
  autoCreateInvoices: boolean;
  autoMatchTransactions: boolean;
  autoCategorize: boolean;
  useCorrectionsForLearning: boolean;
  createdAt?: string;
}

export function AIPreferencesCard() {
  const [settings, setSettings] = useState<ConsentSettings>({
    autoCreateBills: false,
    autoCreateInvoices: false,
    autoMatchTransactions: false,
    autoCategorize: false,
    useCorrectionsForLearning: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isInTrainingPeriod, setIsInTrainingPeriod] = useState(false);

  // Load consent settings on mount
  useEffect(() => {
    async function loadConsent() {
      try {
        const response = await fetch('/api/system/consent');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);

          // Check if user is in training period
          if (data.createdAt) {
            const accountAge = Date.now() - new Date(data.createdAt).getTime();
            const daysSinceRegistration = accountAge / (1000 * 60 * 60 * 24);
            setIsInTrainingPeriod(daysSinceRegistration < 30);
          }
        }
      } catch (error) {
        console.error('Failed to load consent settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadConsent();
  }, []);

  // Update a single setting
  const updateSetting = async (key: keyof ConsentSettings, value: boolean) => {
    setSaving(true);
    setShowSuccess(false);

    try {
      const response = await fetch('/api/system/consent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (response.ok) {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to update consent:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-xl p-6">
        <p className="text-sm text-muted-foreground">Loading AI preferences...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl">
      {/* Header */}
      <div className="p-6 border-b border-ak-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-ak-purple" />
          <h3 className="text-lg font-medium">AI Preferences</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Control which AI features are enabled. All features are opt-in for your privacy.
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Training period banner */}
        {isInTrainingPeriod && (
          <div className="bg-ak-blue-dim border border-ak-blue/20 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-ak-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-ak-blue">Training Period (30 days)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  New accounts require manual review of AI suggestions for the first 30 days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {showSuccess && (
          <div className="bg-ak-green-dim border border-ak-green/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-ak-green" />
              <p className="text-sm text-ak-green">Preferences saved successfully</p>
            </div>
          </div>
        )}

        {/* Consent toggles */}
        <div className="space-y-6">
          {/* Toggle 1: Auto-create Bills */}
          <ConsentToggle
            label="Auto-create Bills from Receipts"
            description="Automatically create bill drafts when you upload receipt photos."
            checked={settings.autoCreateBills}
            onChange={(checked: boolean) => updateSetting('autoCreateBills', checked)}
            disabled={saving}
          />

          {/* Toggle 2: Auto-create Invoices */}
          <ConsentToggle
            label="Auto-create Invoices"
            description="Automatically create invoice drafts from scanned documents."
            checked={settings.autoCreateInvoices}
            onChange={(checked: boolean) => updateSetting('autoCreateInvoices', checked)}
            disabled={saving}
          />

          {/* Toggle 3: Auto-match Transactions */}
          <ConsentToggle
            label="Auto-match Transactions"
            description="Automatically link bills/invoices to bank transactions when high-confidence matches are found."
            checked={settings.autoMatchTransactions}
            onChange={(checked: boolean) => updateSetting('autoMatchTransactions', checked)}
            disabled={saving}
          />

          {/* Toggle 4: Auto-categorize */}
          <ConsentToggle
            label="Auto-categorize Transactions"
            description="Automatically suggest categories for transactions."
            checked={settings.autoCategorize}
            onChange={(checked: boolean) => updateSetting('autoCategorize', checked)}
            disabled={saving}
          />

          {/* Toggle 5: Use corrections for learning */}
          <ConsentToggle
            label="Use Corrections for Learning"
            description="Allow AI to learn from your manual corrections. Your data stays private to your account."
            checked={settings.useCorrectionsForLearning}
            onChange={(checked: boolean) => updateSetting('useCorrectionsForLearning', checked)}
            disabled={saving}
          />
        </div>

        {/* Privacy notice */}
        <div className="pt-6 border-t border-ak-border">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Privacy:</strong> AI processing uses Mistral AI with PII redaction.
            No sensitive data (credit cards, SSN, emails) is sent to external services.
            All AI decisions are logged for audit compliance (GDPR, PIPEDA, CCPA).
          </p>
        </div>
      </div>
    </div>
  );
}

interface ConsentToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ConsentToggle({ label, description, checked, onChange, disabled }: ConsentToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium cursor-pointer">{label}</label>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className="w-11 h-6 bg-ak-bg-3 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-disabled:opacity-50"></div>
      </label>
    </div>
  );
}
