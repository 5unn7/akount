'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client-browser'
import type { EntityType } from '@/lib/api/entities'
import { getCurrencyForCountry, getCountryByCode } from '@/lib/data/countries'
import { CountrySelect } from '@/components/ui/country-select'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus } from 'lucide-react'

const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'CORPORATION', label: 'Corporation' },
  { value: 'SOLE_PROPRIETORSHIP', label: 'Sole Proprietorship' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'LLC', label: 'LLC' },
]

interface EntityFormSheetProps {
  /** Render a custom trigger instead of the default button */
  trigger?: React.ReactNode
}

export function EntityFormSheet({ trigger }: EntityFormSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Required fields
  const [name, setName] = useState('')
  const [type, setType] = useState<EntityType>('CORPORATION')
  const [country, setCountry] = useState('CA')
  const [currency, setCurrency] = useState('CAD')

  // Optional business details
  const [taxId, setTaxId] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [fiscalYearStart, setFiscalYearStart] = useState(1)

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    setCurrency(getCurrencyForCountry(newCountry))
  }

  const resetForm = () => {
    setName('')
    setType('CORPORATION')
    setCountry('CA')
    setCurrency('CAD')
    setTaxId('')
    setAddress('')
    setCity('')
    setState('')
    setPostalCode('')
    setFiscalYearStart(1)
    setError(null)
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
          fiscalYearStart,
          // Only send optional fields if they have values
          ...(taxId.trim() && { taxId: taxId.trim() }),
          ...(address.trim() && { address: address.trim() }),
          ...(city.trim() && { city: city.trim() }),
          ...(state.trim() && { state: state.trim() }),
          ...(postalCode.trim() && { postalCode: postalCode.trim() }),
        }),
      })

      resetForm()
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entity')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCountry = getCountryByCode(country)
  const currencyLabel = selectedCountry
    ? `${selectedCountry.currency} — ${selectedCountry.currencyName}`
    : currency

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <SheetTrigger asChild>
        {trigger ?? (
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add Entity
          </button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-heading font-normal">Add Entity</SheetTitle>
          <SheetDescription>
            Create a new business or personal entity.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
          <form onSubmit={handleSubmit} className="space-y-5 pb-8">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            {/* ── Required Fields ── */}
            <div>
              <label htmlFor="entity-name" className="block text-sm font-medium mb-1.5">
                Entity Name <span className="text-destructive">*</span>
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
                Entity Type <span className="text-destructive">*</span>
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

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Country <span className="text-destructive">*</span>
              </label>
              <CountrySelect
                value={country}
                onChange={handleCountryChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="entity-currency" className="block text-sm font-medium mb-1.5">
                Currency
              </label>
              <input
                id="entity-currency"
                type="text"
                value={currencyLabel}
                readOnly
                disabled
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-set from country. You can change the reporting currency later.
              </p>
            </div>

            {/* ── Fiscal Year ── */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Fiscal Year Start Month
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1
                  const monthName = new Date(2024, i).toLocaleString('default', { month: 'short' })
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => setFiscalYearStart(month)}
                      disabled={isLoading}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        fiscalYearStart === month
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-input bg-background text-foreground hover:bg-ak-bg-3'
                      } disabled:opacity-50`}
                    >
                      {monthName}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Optional Business Details ── */}
            <div className="border-t border-ak-border pt-5">
              <p className="text-sm font-medium mb-1">Business Details</p>
              <p className="text-xs text-muted-foreground mb-4">
                Optional — used for invoices, tax filings, and reports.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="entity-taxid" className="block text-sm font-medium mb-1.5">
                    Tax ID / EIN / BN
                  </label>
                  <input
                    id="entity-taxid"
                    type="text"
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                    placeholder="e.g., 123456789"
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Appears on invoices and tax reports.
                  </p>
                </div>

                <div>
                  <label htmlFor="entity-address" className="block text-sm font-medium mb-1.5">
                    Street Address
                  </label>
                  <input
                    id="entity-address"
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g., 123 Main Street, Suite 400"
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="entity-city" className="block text-sm font-medium mb-1.5">
                      City
                    </label>
                    <input
                      id="entity-city"
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g., Toronto"
                      disabled={isLoading}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="entity-state" className="block text-sm font-medium mb-1.5">
                      State / Province
                    </label>
                    <input
                      id="entity-state"
                      type="text"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="e.g., Ontario"
                      disabled={isLoading}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                    />
                  </div>
                </div>

                <div className="w-1/2">
                  <label htmlFor="entity-postalcode" className="block text-sm font-medium mb-1.5">
                    Postal / ZIP Code
                  </label>
                  <input
                    id="entity-postalcode"
                    type="text"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="e.g., M5V 2T6"
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 transition-all"
                  />
                </div>
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}