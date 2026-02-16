'use client';

import type { Vendor } from '@/lib/api/vendors';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/currency';
import { Building2, Mail, Phone, MapPin, FileText, DollarSign } from 'lucide-react';

interface VendorDetailPanelProps {
    vendor: Vendor | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currency?: string;
}

const STATUS_BADGE_STYLES: Record<Vendor['status'], string> = {
    active: 'bg-ak-green/10 text-ak-green border-ak-green/20',
    inactive: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export function VendorDetailPanel({
    vendor,
    open,
    onOpenChange,
    currency = 'CAD',
}: VendorDetailPanelProps) {
    if (!vendor) return null;

    const balanceDue = vendor.balanceDue ?? 0;
    const statusStyle = STATUS_BADGE_STYLES[vendor.status];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="glass w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-heading font-normal flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-ak-red" />
                                {vendor.name}
                            </SheetTitle>
                            <SheetDescription>
                                Vendor for {vendor.entity.name}
                            </SheetDescription>
                        </div>
                        <Badge className={`text-xs ${statusStyle}`}>
                            {vendor.status.toUpperCase()}
                        </Badge>
                    </div>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Contact Information */}
                    <div className="space-y-3">
                        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
                            Contact Information
                        </h3>
                        <div className="glass-2 rounded-lg p-4 space-y-3">
                            {vendor.email && (
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{vendor.email}</span>
                                </div>
                            )}
                            {vendor.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{vendor.phone}</span>
                                </div>
                            )}
                            {vendor.address && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span className="text-sm whitespace-pre-wrap">
                                        {vendor.address}
                                    </span>
                                </div>
                            )}
                            {!vendor.email && !vendor.phone && !vendor.address && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    No contact information available
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Payment Terms */}
                    {vendor.paymentTerms && (
                        <div className="space-y-3">
                            <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
                                Payment Terms
                            </h3>
                            <div className="glass-2 rounded-lg p-4">
                                <p className="text-sm">{vendor.paymentTerms}</p>
                            </div>
                        </div>
                    )}

                    <Separator className="bg-ak-border" />

                    {/* Account Statistics */}
                    <div className="space-y-3">
                        <h3 className="text-sm uppercase tracking-wide text-muted-foreground">
                            Account Summary
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-2 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                                    <FileText className="h-3 w-3" />
                                    Open Bills
                                </div>
                                <p className="text-2xl font-mono font-semibold">
                                    {vendor.openBills ?? 0}
                                </p>
                            </div>
                            <div className="glass-2 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                                    <DollarSign className="h-3 w-3" />
                                    Balance Due
                                </div>
                                <p
                                    className={`text-2xl font-mono font-semibold ${
                                        balanceDue > 0 ? 'text-ak-red' : 'text-ak-green'
                                    }`}
                                >
                                    {formatCurrency(balanceDue, currency)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-ak-border" />

                    {/* Metadata */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span>Created</span>
                            <span>
                                {new Date(vendor.createdAt).toLocaleDateString('en-CA', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Last Updated</span>
                            <span>
                                {new Date(vendor.updatedAt).toLocaleDateString('en-CA', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
