'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@akount/ui';
import { Sparkles, Download, Settings, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

/**
 * CCPA ADMT Notice Component (DEV-262)
 *
 * Pre-use notice for Automated Decision-Making Technology under CCPA.
 * Required for California residents before first AI feature use.
 *
 * **CCPA Requirements:**
 * - Pre-use notice explaining AI processing
 * - Clear opt-out mechanism
 * - Ability to export AI decisions
 * - Notice before FIRST use only
 *
 * **What qualifies as ADMT:**
 * - Auto-categorization of transactions
 * - Auto-creation of bills/invoices from scans
 * - Auto-matching transactions to documents
 * - Natural language bookkeeping commands
 *
 * @example
 * ```tsx
 * const [showNotice, setShowNotice] = useState(false);
 *
 * // Trigger before first AI feature use
 * if (isCaliforniaUser && !hasSeenNotice) {
 *   setShowNotice(true);
 * }
 *
 * <ADMTNotice
 *   open={showNotice}
 *   onAcknowledge={() => {
 *     setShowNotice(false);
 *     // Mark as seen, proceed with AI feature
 *   }}
 *   onDecline={() => {
 *     setShowNotice(false);
 *     // Redirect to settings or disable AI
 *   }}
 * />
 * ```
 */

export interface ADMTNoticeProps {
  /** Control dialog open state */
  open: boolean;
  /** Called when user acknowledges and wants to proceed */
  onAcknowledge: () => void;
  /** Called when user declines (wants to opt out) */
  onDecline: () => void;
  /** User's email (for export link personalization) */
  userEmail?: string;
}

export function ADMTNotice({
  open,
  onAcknowledge,
  onDecline,
  userEmail,
}: ADMTNoticeProps) {
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Export user's AI decision log as CSV
   * Implements CCPA right to access AI decisions
   */
  async function handleExport() {
    setIsExporting(true);
    try {
      // Call API to export AIDecisionLog
      const response = await fetch('/api/system/ai-data/export', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-decisions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[ADMTNotice] Export failed:', error);
      alert('Failed to export AI decisions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] glass-2 border-ak-border-2">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-ak-purple" />
            <DialogTitle className="text-xl font-heading">
              Notice: AI-Powered Features
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            California Consumer Privacy Act (CCPA) — Automated Decision-Making Technology Notice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What is ADMT */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              What are AI-powered features?
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Akount uses artificial intelligence to help automate bookkeeping tasks.
              These features analyze your financial documents and transactions to
              save you time.
            </p>
          </div>

          {/* AI Features List */}
          <div className="glass rounded-lg p-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
              AI Features Available
            </p>
            <div className="grid gap-2">
              {[
                {
                  feature: 'Document Scanning',
                  description: 'Extract data from bills and invoices',
                },
                {
                  feature: 'Auto-Categorization',
                  description: 'Suggest categories for transactions',
                },
                {
                  feature: 'Smart Matching',
                  description: 'Match receipts to bank transactions',
                },
                {
                  feature: 'Natural Language',
                  description: 'Create transactions from plain English commands',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-ak-purple mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.feature}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Rights */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              Your Rights
            </h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">Opt out anytime:</strong> Disable
                  AI features in Settings
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">View AI decisions:</strong> See
                  all automated decisions in your audit log
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">Export your data:</strong> Download
                  AI decision history as CSV
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  <strong className="text-foreground">Human review:</strong> All
                  AI-created records can be edited or deleted
                </span>
              </li>
            </ul>
          </div>

          {/* Important Note */}
          <div className="bg-ak-blue-dim border border-ak-blue/20 rounded-lg p-3">
            <p className="text-xs text-foreground leading-relaxed">
              <strong>Important:</strong> AI suggestions are not final decisions.
              You always review and approve AI-created data before it affects your
              financial records. AI features are optional and can be disabled at any time.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2 rounded-lg border-ak-border-2 hover:bg-ak-bg-3"
          >
            <Download className="h-3.5 w-3.5" />
            {isExporting ? 'Exporting...' : 'Export AI Decisions'}
          </Button>

          {/* Settings Link */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-lg hover:bg-ak-bg-3"
            asChild
          >
            <Link href="/system/settings">
              <Settings className="h-3.5 w-3.5" />
              AI Settings
            </Link>
          </Button>

          {/* Decline Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onDecline}
            className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Opt Out
          </Button>

          {/* Acknowledge & Continue */}
          <Button
            size="sm"
            onClick={onAcknowledge}
            className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
          >
            I Understand, Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to check if user should see ADMT notice
 *
 * Checks:
 * 1. Is user in California? (via profile or IP geolocation)
 * 2. Has user seen the notice before? (localStorage)
 * 3. Is this their first AI feature use?
 *
 * @returns {boolean} Whether to show ADMT notice
 */
export function useShouldShowADMTNotice(): {
  shouldShow: boolean;
  markAsShown: () => void;
  userRegion?: string;
} {
  const [shouldShow, setShouldShow] = useState(false);
  const [userRegion, setUserRegion] = useState<string>();

  // Check if notice has been shown before
  const hasSeenNotice = typeof window !== 'undefined'
    ? localStorage.getItem('admt-notice-acknowledged') === 'true'
    : false;

  // Check user region (simplified - would use actual user profile or geolocation)
  // Future: Check user.region === 'CA' or IP-based geolocation
  const isCaliforniaUser = typeof window !== 'undefined'
    ? localStorage.getItem('user-region') === 'CA'
    : false;

  // Should show if: California user + hasn't seen notice
  const needsNotice = isCaliforniaUser && !hasSeenNotice;

  // Mark notice as shown
  function markAsShown() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admt-notice-acknowledged', 'true');
      localStorage.setItem('admt-notice-acknowledged-at', new Date().toISOString());
    }
    setShouldShow(false);
  }

  return {
    shouldShow: needsNotice,
    markAsShown,
    userRegion: userRegion || (isCaliforniaUser ? 'CA' : undefined),
  };
}
