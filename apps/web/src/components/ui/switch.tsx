'use client';

import * as React from 'react';

interface SwitchProps {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
    ({ checked = false, onCheckedChange, disabled = false, className = '', ...props }, ref) => {
        return (
            <button
                ref={ref}
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onCheckedChange?.(!checked)}
                className={`
                    relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full
                    border border-white/[0.06] transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    disabled:cursor-not-allowed disabled:opacity-50
                    ${checked ? 'bg-[#F59E0B]' : 'bg-white/[0.06]'}
                    ${className}
                `}
                {...props}
            >
                <span
                    className={`
                        pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform
                        ${checked ? 'translate-x-4' : 'translate-x-0.5'}
                    `}
                />
            </button>
        );
    }
);
Switch.displayName = 'Switch';

export { Switch };
