'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Send, Edit, Check } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils/currency'
import { apiFetch } from '@/lib/api/client-browser'

interface ParsedTransaction {
  vendor: string
  amount: number // Integer cents
  category?: string
  glAccountId?: string
  date: string // ISO 8601
  description?: string
  explanation: string // AI reasoning
}

interface ParseResponse {
  parsed: Omit<ParsedTransaction, 'explanation'>
  confidence: number
  explanation: string
  requiresReview: boolean
}

interface NLBookkeepingBarProps {
  entityId: string
  onTransactionCreated?: (transactionId: string) => void
}

export function NLBookkeepingBar({ entityId, onTransactionCreated }: NLBookkeepingBarProps) {
  const [input, setInput] = useState('')
  const [state, setState] = useState<'idle' | 'processing' | 'preview'>('idle')
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null)
  const [confidence, setConfidence] = useState<number>(0)

  async function handleSubmit() {
    if (!input.trim()) return

    setState('processing')

    try {
      const response = await apiFetch<ParseResponse>('/api/ai/bookkeeping/natural', {
        method: 'POST',
        body: JSON.stringify({
          text: input,
          entityId,
        }),
      })

      const { parsed: parsedData, confidence: conf, explanation, requiresReview } = response

      if (requiresReview) {
        toast.warning('Low confidence. Please review carefully.')
      }

      setParsed({ ...parsedData, explanation })
      setConfidence(conf)
      setState('preview')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse'

      if (message.includes('403') || message.includes('Enable AI')) {
        toast.error('Enable AI features in Settings first')
      } else if (message.includes('Confidence too low')) {
        toast.error('Couldn\'t understand. Try: "Paid $50 at Starbucks yesterday"')
      } else if (message.includes('temporarily unavailable')) {
        toast.error('AI service temporarily unavailable. Try again shortly.')
      } else {
        toast.error('Failed to parse. Try: "Paid $50 at Starbucks"')
      }

      setState('idle')
    }
  }

  async function handleApprove() {
    if (!parsed) return

    try {
      // TODO: Need to get accountId from context or form
      // For now, show error prompting user to select account
      toast.error('Please select an account from the transactions page')
      return

      // Once account selection is implemented:
      // const transaction = await apiFetch('/api/banking/transactions', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     description: parsed.description || parsed.vendor,
      //     amount: parsed.amount,
      //     date: parsed.date,
      //     categoryId: parsed.categoryId,
      //     glAccountId: parsed.glAccountId,
      //     entityId,
      //     accountId: selectedAccountId,
      //   }),
      // })

      // toast.success('Transaction created!')
      // onTransactionCreated?.(transaction.id)

      // Reset state
      // setInput('')
      // setParsed(null)
      // setState('idle')
    } catch (error) {
      toast.error('Failed to create transaction')
    }
  }

  function handleEdit() {
    // For now, just reset to allow re-input
    // Future: open a form pre-filled with parsed data
    setState('idle')
    toast.info('Edit mode coming soon. Please create transaction manually.')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Card variant="glass" className="w-full">
      <div className="p-4 space-y-4">
        {/* Input bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ak-purple" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What did you spend on?"
              className="pl-10"
              disabled={state === 'processing'}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || state === 'processing'}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Processing state */}
        {state === 'processing' && (
          <div className="space-y-2 border-t border-ak-border pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-ak-purple border-t-transparent" />
              <span>Processing "{input.substring(0, 30)}{input.length > 30 ? '...' : ''}"</span>
            </div>
          </div>
        )}

        {/* Preview state */}
        {state === 'preview' && parsed && (
          <div className="space-y-3 border-t border-ak-border pt-4">
            {/* Confidence badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-ak-green" />
                <span className="text-sm font-medium">Ready to create</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Confidence: {confidence}%
              </div>
            </div>

            {/* Extracted data */}
            <div className="grid grid-cols-2 gap-3 rounded-lg glass-2 p-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Vendor</p>
                <p className="text-sm font-medium">{parsed.vendor}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount</p>
                <p className="text-sm font-mono font-medium">{formatCurrency(parsed.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
                <p className="text-sm font-medium">{parsed.category || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
                <p className="text-sm font-medium">
                  {new Date(parsed.date).toLocaleDateString('en-CA', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* AI explanation */}
            <p className="text-xs text-muted-foreground italic font-heading">
              {parsed.explanation}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleEdit} variant="outline" size="sm" className="gap-1.5">
                <Edit className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button onClick={handleApprove} size="sm" className="gap-1.5 flex-1">
                <Check className="h-3.5 w-3.5" />
                Create Transaction
              </Button>
            </div>
          </div>
        )}

        {/* Helper text */}
        {state === 'idle' && (
          <p className="text-micro text-muted-foreground">
            Try: "Paid $50 at Starbucks" or "Uber ride $15 yesterday"
          </p>
        )}
      </div>
    </Card>
  )
}
