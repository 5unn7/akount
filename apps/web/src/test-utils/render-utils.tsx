import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

/**
 * Custom render with app providers.
 *
 * Currently just wraps RTL's render, but provides a single place
 * to add global providers (ThemeProvider, etc.) when needed.
 */
export function renderWithProviders(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return <>{children}</>
    }

    return {
        ...render(ui, { wrapper: Wrapper, ...options }),
    }
}

// Re-export everything from testing-library for convenience
export { screen, within, waitFor, act } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
