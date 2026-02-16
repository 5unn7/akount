'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { COUNTRIES, type CountryData } from '@/lib/data/countries'
import { cn } from '@/lib/utils'

interface CountrySelectProps {
  value: string
  onChange: (countryCode: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function CountrySelect({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = 'Select country...',
}: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(
    () => COUNTRIES.find(c => c.code === value),
    [value]
  )

  const filtered = useMemo(() => {
    if (!search) return COUNTRIES
    const q = search.toLowerCase()
    return COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currency.toLowerCase().includes(q)
    )
  }, [search])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg',
          'border border-input bg-background',
          'focus:ring-2 focus:ring-ring focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-all',
          open && 'ring-2 ring-ring border-transparent'
        )}
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? `${selected.name} (${selected.code})` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-ak-border bg-background shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-ak-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {/* Country list */}
          <ScrollArea className="h-[240px]">
            <div className="p-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No countries found
                </p>
              ) : (
                filtered.map(country => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onChange(country.code)
                      setOpen(false)
                      setSearch('')
                    }}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2 text-sm rounded-md',
                      'text-left hover:bg-ak-bg-3 transition-colors',
                      country.code === value && 'bg-ak-bg-3'
                    )}
                  >
                    <span className="truncate">
                      <span className="text-foreground">{country.name}</span>
                      <span className="text-muted-foreground ml-1.5">
                        ({country.code})
                      </span>
                      <span className="text-muted-foreground ml-1.5 font-mono text-xs">
                        {country.currency}
                      </span>
                    </span>
                    {country.code === value && (
                      <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
