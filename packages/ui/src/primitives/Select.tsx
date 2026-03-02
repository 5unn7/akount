'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../utils';

export interface SelectOption {
  /** Unique value for the option */
  value: string;
  /** Display label */
  label: string;
  /** Optional group this option belongs to */
  group?: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Whether option is disabled */
  disabled?: boolean;
}

export interface SelectProps {
  /** Available options */
  options: SelectOption[];
  /** Currently selected value(s) */
  value: string | string[] | null;
  /** Change handler */
  onChange: (value: string | string[]) => void;
  /** Label text */
  label?: string;
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Enable search/filter */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field */
  required?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Select/Dropdown component with glassmorphism panel.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Category"
 *   options={[
 *     { value: 'marketing', label: 'Marketing' },
 *     { value: 'cloud', label: 'Cloud Services' },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 *   searchable
 * />
 * ```
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      label,
      placeholder = 'Select...',
      error,
      helperText,
      multiple = false,
      searchable = false,
      searchPlaceholder = 'Search...',
      disabled = false,
      required = false,
      fullWidth = false,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const id = useId();
    const labelId = `${id}-label`;
    const listboxId = `${id}-listbox`;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const hasError = Boolean(error);

    // Group options
    const groupedOptions = options.reduce(
      (acc, option) => {
        const group = option.group || '';
        if (!acc[group]) acc[group] = [];
        acc[group].push(option);
        return acc;
      },
      {} as Record<string, SelectOption[]>
    );

    // Filter options by search
    const filteredOptions = search
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase())
        )
      : options;

    // Get selected labels for display
    const getDisplayValue = () => {
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return null;
      }
      if (Array.isArray(value)) {
        return options
          .filter((opt) => value.includes(opt.value))
          .map((opt) => opt.label)
          .join(', ');
      }
      return options.find((opt) => opt.value === value)?.label;
    };

    const displayValue = getDisplayValue();

    // Handle option selection
    const handleSelect = useCallback(
      (optionValue: string) => {
        if (multiple) {
          const currentValues = Array.isArray(value) ? value : [];
          const newValues = currentValues.includes(optionValue)
            ? currentValues.filter((v) => v !== optionValue)
            : [...currentValues, optionValue];
          onChange(newValues);
        } else {
          onChange(optionValue);
          setIsOpen(false);
        }
        setSearch('');
      },
      [multiple, value, onChange]
    );

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          if (!isOpen) {
            e.preventDefault();
            setIsOpen(true);
          } else if (focusedIndex >= 0) {
            e.preventDefault();
            handleSelect(filteredOptions[focusedIndex].value);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearch('');
          setFocusedIndex(-1);
          break;
        case 'Tab':
          if (isOpen) {
            setIsOpen(false);
            setSearch('');
          }
          break;
      }
    };

    // Close on click outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
          setSearch('');
          setFocusedIndex(-1);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Focus search input when opened
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    // Scroll focused option into view
    useEffect(() => {
      if (focusedIndex >= 0 && listRef.current) {
        const focusedOption = listRef.current.children[focusedIndex] as HTMLElement;
        focusedOption?.scrollIntoView({ block: 'nearest' });
      }
    }, [focusedIndex]);

    const isSelected = (optionValue: string) => {
      if (Array.isArray(value)) {
        return value.includes(optionValue);
      }
      return value === optionValue;
    };

    return (
      <div
        ref={containerRef}
        className={cn('relative flex flex-col gap-1.5', fullWidth && 'w-full')}
      >
        {label && (
          <label
            id={labelId}
            className={cn(
              'text-sm font-medium text-slate-700',
              disabled && 'text-slate-400'
            )}
          >
            {label}
            {required && (
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <button
          ref={ref}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-labelledby={label ? labelId : undefined}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            // Base styles
            'h-10 px-3 w-full rounded-[10px] border bg-white font-sans text-left',
            'flex items-center justify-between gap-2',
            'transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)]',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            // State styles
            hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
              : 'border-slate-300 focus:border-orange-500 focus:ring-orange-500/30',
            disabled && 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200',
            isOpen && 'border-orange-500 ring-2 ring-orange-500/30',
            className
          )}
          data-testid="select-trigger"
        >
          <span
            className={cn(
              'truncate',
              !displayValue && 'text-slate-400'
            )}
          >
            {displayValue || placeholder}
          </span>
          <span
            className={cn(
              'shrink-0 transition-transform duration-[120ms]',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-slate-500"
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        {isOpen && (
          <div
            className={cn(
              'absolute z-50 top-full mt-1 w-full',
              'bg-white/80 backdrop-blur-xl',
              'border border-slate-200 rounded-[14px]',
              'shadow-lg',
              'overflow-hidden'
            )}
          >
            {searchable && (
              <div className="p-2 border-b border-slate-100">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setFocusedIndex(-1);
                  }}
                  placeholder={searchPlaceholder}
                  className={cn(
                    'w-full h-8 px-3 text-sm rounded-md',
                    'border border-slate-200 bg-white',
                    'focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30'
                  )}
                  aria-label="Search options"
                />
              </div>
            )}

            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-multiselectable={multiple}
              className="max-h-[300px] overflow-y-auto py-1"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500 text-center">
                  No options found
                </li>
              ) : (
                filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected(option.value)}
                    aria-disabled={option.disabled}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={cn(
                      'px-3 py-2 text-sm cursor-pointer',
                      'flex items-center gap-2',
                      'transition-colors duration-75',
                      focusedIndex === index && 'bg-orange-50',
                      isSelected(option.value) && 'bg-orange-100 font-medium',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {option.icon && (
                      <span className="shrink-0" aria-hidden="true">
                        {option.icon}
                      </span>
                    )}
                    <span className="truncate flex-1">{option.label}</span>
                    {isSelected(option.value) && (
                      <span className="shrink-0 text-orange-500" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M3 8L6.5 11.5L13 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {hasError && (
          <p id={errorId} className="text-sm text-red-500 flex items-center gap-1">
            <span aria-hidden="true">!</span>
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p id={helperId} className="text-sm text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
