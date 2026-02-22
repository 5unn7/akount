'use client';

import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssetSheet } from './asset-sheet';

interface AssetsEmptyProps {
    entityId?: string;
}

export function AssetsEmpty({ entityId }: AssetsEmptyProps) {
    const [sheetOpen, setSheetOpen] = useState(false);

    return (
        <div className="flex flex-col items-center py-12 space-y-8">
            <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-2xl glass flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <h3 className="text-lg font-heading font-medium">No assets tracked</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Capitalize your first fixed asset to start tracking depreciation.
                    Assets like equipment, vehicles, and buildings can be tracked here.
                </p>
            </div>

            <Button className="gap-2" onClick={() => setSheetOpen(true)}>
                <Plus className="h-4 w-4" />
                Capitalize Your First Asset
            </Button>

            <AssetSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                entityId={entityId}
            />
        </div>
    );
}
