'use client';

import { useState, useCallback, useEffect } from 'react';

export function useSyncStatus() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    const sync = useCallback(async () => {
        setIsSyncing(true);
        try {
            // Simulate sync operation (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 1000));
            setLastSyncTime(new Date());
        } finally {
            setIsSyncing(false);
        }
    }, []);

    // Auto-sync on mount
    useEffect(() => {
        setLastSyncTime(new Date());
    }, []);

    const getTimeSinceSync = useCallback(() => {
        if (!lastSyncTime) return 'Never synced';

        const now = new Date();
        const diffMs = now.getTime() - lastSyncTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins === 1) return '1 minute ago';
        if (diffMins < 60) return `${diffMins} minutes ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) return '1 hour ago';
        return `${diffHours} hours ago`;
    }, [lastSyncTime]);

    return {
        isSyncing,
        lastSyncTime,
        sync,
        getTimeSinceSync,
    };
}
