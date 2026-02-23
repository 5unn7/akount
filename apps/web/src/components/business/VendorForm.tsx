'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api/client-browser';
import { Loader2 } from 'lucide-react';
import type { Vendor } from '@/lib/api/vendors';
import { toast } from 'sonner';

interface VendorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  onSuccess?: () => void;
  editVendor?: Vendor;
}

export function VendorForm({ open, onOpenChange, entityId, onSuccess, editVendor }: VendorFormProps) {
  const isEdit = !!editVendor;

  const [name, setName] = useState(editVendor?.name ?? '');
  const [email, setEmail] = useState(editVendor?.email ?? '');
  const [phone, setPhone] = useState(editVendor?.phone ?? '');
  const [address, setAddress] = useState(editVendor?.address ?? '');
  const [paymentTerms, setPaymentTerms] = useState(editVendor?.paymentTerms ?? '');
  const [status, setStatus] = useState<'active' | 'inactive'>(editVendor?.status ?? 'active');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPaymentTerms('');
    setStatus('active');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Vendor name is required'); return; }

    setSubmitting(true);
    try {
      if (isEdit) {
        await apiFetch(`/api/business/vendors/${editVendor.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            address: address.trim() || null,
            paymentTerms: paymentTerms.trim() || null,
            status,
          }),
        });
        toast.success('Vendor updated');
      } else {
        await apiFetch('/api/business/vendors', {
          method: 'POST',
          body: JSON.stringify({
            entityId,
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
            paymentTerms: paymentTerms.trim() || undefined,
            status,
          }),
        });
        toast.success('Vendor created');
      }

      if (!isEdit) resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} vendor`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">
            {isEdit ? 'Edit Vendor' : 'New Vendor'}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div className="space-y-2">
            <Label>Vendor Name *</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Acme Corp"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="123 Main St..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Input
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                placeholder="e.g., Net 30"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: 'active' | 'inactive') => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Vendor'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
