'use client';

import { useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@akount/ui';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/client-browser';
import type {
  FilterChip,
  SearchFilters,
  NaturalSearchResponse,
  NLSearchBarProps,
  SearchMode,
} from './NLSearchBar.types';

// Re-export types for convenience
export type { SearchFilters, FilterChip, NLSearchBarProps } from './NLSearchBar.types';

/**
 * Natural Language Search Bar Component
 *
 * Provides toggle between keyword search and AI-powered natural language search.
 * AI mode parses queries like "Show me restaurant expenses over $100 in Q4"
 * and displays filter chips for each extracted criteria.
 *
 * @example
 * ```tsx
 * <NLSearchBar
 *   entityId={entityId}
 *   onFiltersChange={setFilters}
 *   scope="transactions"
 * />
 * ```
 */
export function NLSearchBar({
  entityId,
  onFiltersChange,
  placeholder,
  scope = 'transactions',
}: NLSearchBarProps) {
  const [mode, setMode] = useState<SearchMode>('keyword');
  const [query, setQuery] = useState('');
  const [filterChips, setFilterChips] = useState<FilterChip[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});

  /**
   * Handle keyword search (simple text filter)
   */
  function handleKeywordSearch() {
    const filters: SearchFilters = query.trim()
      ? { description: query.trim() }
      : {};

    setCurrentFilters(filters);
    onFiltersChange(filters);
  }

  /**
   * Handle AI-powered natural language search
   * Calls backend Natural Search API to parse query
   */
  async function handleAISearch() {
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiFetch<NaturalSearchResponse>('/api/ai/search/natural', {
        method: 'POST',
        body: JSON.stringify({
          query: query.trim(),
          entityId,
          scope,
        }),
      });

      // Check confidence threshold
      if (response.confidence < 50) {
        toast.error(
          'Couldn\'t understand query. Try: "expenses over $100 last month"'
        );
        return;
      }

      // Display filter chips
      setFilterChips(response.filterChips);

      // Update current filters state
      setCurrentFilters(response.parsed);

      // Pass parsed filters to parent component
      onFiltersChange(response.parsed);

      // Show AI explanation as success toast
      toast.success(response.explanation);
    } catch (error) {
      console.error('[NLSearchBar] AI search failed:', error);

      // Check for missing consent (403)
      if (error instanceof Error && error.message.includes('403')) {
        toast.error('Enable AI Search in Settings');
      } else {
        toast.error('Search failed. Try using keywords instead.');
        // Fallback to keyword mode on failure
        setMode('keyword');
      }
    } finally {
      setIsProcessing(false);
    }
  }

  /**
   * Handle Enter key press to submit search
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (mode === 'ai') {
        handleAISearch();
      } else {
        handleKeywordSearch();
      }
    }
  }

  /**
   * Remove a single filter chip
   * Updates both UI and filter state
   */
  function handleRemoveChip(field: string) {
    // Remove chip from display
    setFilterChips((prev) => prev.filter((c) => c.field !== field));

    // Update filters (remove that field)
    const updated = { ...currentFilters };
    delete updated[field as keyof SearchFilters];
    setCurrentFilters(updated);
    onFiltersChange(updated);
  }

  /**
   * Clear all filters and chips
   * Resets to empty state
   */
  function handleClearAll() {
    setFilterChips([]);
    setCurrentFilters({});
    setQuery('');
    onFiltersChange({});
    toast.success('Filters cleared');
  }

  /**
   * Toggle between keyword and AI search modes
   */
  function handleModeToggle() {
    const newMode = mode === 'keyword' ? 'ai' : 'keyword';
    setMode(newMode);

    // Clear chips when switching to keyword mode
    if (newMode === 'keyword') {
      setFilterChips([]);
    }

    toast.info(
      newMode === 'ai'
        ? 'AI mode enabled - ask in plain English'
        : 'Keyword mode - simple text search'
    );
  }

  const hasFilters = filterChips.length > 0 || Object.keys(currentFilters).length > 0;

  return (
    <div className="w-full space-y-3">
      {/* Search Input with Mode Toggle */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {mode === 'keyword' ? (
              <Search className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sparkles className="h-4 w-4 text-ak-purple" />
            )}
          </div>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              placeholder ||
              (mode === 'keyword'
                ? 'Search transactions...'
                : 'Ask in plain English... (e.g., "restaurant expenses over $100 in Q4")')
            }
            disabled={isProcessing}
            className="pl-10 glass-2 rounded-lg border-ak-border focus:ring-primary"
          />
        </div>

        {/* Search Button */}
        <Button
          onClick={mode === 'ai' ? handleAISearch : handleKeywordSearch}
          disabled={isProcessing || !query.trim()}
          className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium"
        >
          {isProcessing ? 'Searching...' : 'Search'}
        </Button>

        {/* Mode Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleModeToggle}
          disabled={isProcessing}
          className="gap-2 rounded-lg hover:bg-ak-bg-3"
          aria-label={`Switch to ${mode === 'keyword' ? 'AI' : 'keyword'} mode`}
        >
          {mode === 'keyword' ? (
            <>
              <Sparkles className="h-4 w-4 text-ak-purple" />
              AI Mode
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Keywords
            </>
          )}
        </Button>

        {/* Clear All Button */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            disabled={isProcessing}
            className="text-muted-foreground hover:text-destructive rounded-lg hover:bg-ak-bg-3"
            aria-label="Clear all filters"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Chips (AI Mode Only) */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip, i) => (
            <Badge
              key={`${chip.field}-${i}`}
              variant="ai"
              className="gap-1 bg-ak-pri-dim text-ak-pri-text border-ak-border rounded-lg px-3 py-1"
            >
              {chip.label}
              <button
                type="button"
                onClick={() => handleRemoveChip(chip.field)}
                className="ml-1 hover:text-destructive transition-colors"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
