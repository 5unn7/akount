'use client';

import { useEffect, useState } from 'react';
import { Command, Search, Building2, HelpCircle, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Shortcut {
    keys: string[];
    description: string;
    section: string;
}

const shortcuts: Shortcut[] = [
    { keys: ['⌘', 'K'], description: 'Open search', section: 'Navigation' },
    { keys: ['E'], description: 'Toggle Entity Matrix', section: 'Overview' },
    { keys: ['?'], description: 'Show keyboard shortcuts', section: 'Help' },
    { keys: ['Esc'], description: 'Close dialog', section: 'General' },
];

export function KeyboardShortcutsModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
                const target = event.target as HTMLElement;
                if (
                    target.tagName !== 'INPUT' &&
                    target.tagName !== 'TEXTAREA' &&
                    !target.isContentEditable
                ) {
                    event.preventDefault();
                    setIsOpen(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
        if (!acc[shortcut.section]) acc[shortcut.section] = [];
        acc[shortcut.section].push(shortcut);
        return acc;
    }, {} as Record<string, Shortcut[]>);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Command className="h-5 w-5" />
                        Keyboard Shortcuts
                    </DialogTitle>
                    <DialogDescription>
                        Navigate Akount faster with these keyboard shortcuts
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {Object.entries(groupedShortcuts).map(([section, sectionShortcuts]) => (
                        <div key={section}>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                {section}
                            </h3>
                            <div className="space-y-2">
                                {sectionShortcuts.map((shortcut, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg glass-2 hover:border-ak-border-2 transition-colors"
                                    >
                                        <span className="text-sm">{shortcut.description}</span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, keyIndex) => (
                                                <kbd
                                                    key={keyIndex}
                                                    className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-mono bg-ak-bg-4 border border-ak-border rounded"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-ak-border text-xs text-muted-foreground">
                    <p>Press ? anytime to see shortcuts</p>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                        <X className="h-3 w-3" />
                        Close
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
