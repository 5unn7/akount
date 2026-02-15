'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client-browser'
import type { EntityType } from '@/lib/api/entities'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'CORPORATION', label: 'Corporation' },
  { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'LLC', label: 'LLC' },
]

const COUNTRIES = [
  { code: 'CA', label: 'Canada', currency: 'CAD' },
  { code: 'US', label: 'United States', currency: 'USD' },
  { code: 'GB', label: 'United Kingdom', currency: 'GBP' },
  { code: 'AU', label: 'Australia', currency: 'AUD' },
]

export function EntityFormSheet() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<EntityType>('CORPORATION')
  const [country, setCountry] = useState('CA')
  const [currency, setCurrency] = useState('CAD')

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    const found = COUNTRIES.find(c => c.code === newCountry)
    if (found) setCurrency(found.currency)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Entity name is required')
      return
    }

    setIsLoading(true)
    try {
      await apiFetch('/api/system/entities', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          type,
          country,
          currency,
        }),
      })

      // Reset form and close
      setName('')
      setType('CORPORATION')
      setCountry('CA')
      setCurrency('CAD')
      setOpen(false)

      // Refresh the page to show new entity
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entity')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Entity
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-heading font-normal">Add Entity</SheetTitle>
          <SheetDescription>
            Create a new business or personal entity.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="entity-name" className="block text-sm font-medium mb-1.5">
              Name
            </label>
            <input
              id="entity-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., My Design Studio"
              disabled={isLoading}
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Type
            </label>
            <Select value={type} onValueChange={(v) => setType(v as EntityType)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Country
              </label>
              <Select value={country} onValueChange={handleCountryChange} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="entity-currency" className="block text-sm font-medium mb-1.5">
                Currency
              </label>
              <input
                id="entity-currency"
                type="text"
                value={currency}
                readOnly
                disabled
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Entity'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
