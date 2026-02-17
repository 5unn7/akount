'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
    key: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    description: string;
    handler: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Don't trigger shortcuts when typing in inputs/textareas
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const matchingShortcut = shortcuts.find((shortcut) => {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const metaMatch = shortcut.metaKey ? event.metaKey || event.ctrlKey : true;
                const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : true;
                const shiftMatch = shortcut.shiftKey ? event.shiftKey : true;
                const altMatch = shortcut.altKey ? event.altKey : true;

                return keyMatch && metaMatch && ctrlMatch && shiftMatch && altMatch;
            });

            if (matchingShortcut) {
                event.preventDefault();
                matchingShortcut.handler();
            }
        },
        [shortcuts, enabled]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
