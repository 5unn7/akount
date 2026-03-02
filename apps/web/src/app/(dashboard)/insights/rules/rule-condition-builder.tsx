'use client';

import type { RuleConditions, RuleCondition } from '@/lib/api/ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FIELD_OPTIONS: Array<{ value: RuleCondition['field']; label: string }> = [
    { value: 'description', label: 'Description' },
    { value: 'amount', label: 'Amount (cents)' },
    { value: 'accountId', label: 'Account ID' },
];

const OPERATOR_OPTIONS: Array<{ value: RuleCondition['op']; label: string; forFields: RuleCondition['field'][] }> = [
    { value: 'contains', label: 'contains', forFields: ['description'] },
    { value: 'eq', label: 'equals', forFields: ['description', 'amount', 'accountId'] },
    { value: 'gt', label: '>', forFields: ['amount'] },
    { value: 'gte', label: '>=', forFields: ['amount'] },
    { value: 'lt', label: '<', forFields: ['amount'] },
    { value: 'lte', label: '<=', forFields: ['amount'] },
];

function getOperatorsForField(field: RuleCondition['field']) {
    return OPERATOR_OPTIONS.filter(op => op.forFields.includes(field));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RuleConditionBuilderProps {
    conditions: RuleConditions;
    onChange: (conditions: RuleConditions) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RuleConditionBuilder({ conditions, onChange }: RuleConditionBuilderProps) {
    function updateCondition(index: number, partial: Partial<RuleCondition>) {
        const updated = [...conditions.conditions];
        const current = updated[index];

        // When field changes, reset operator to first valid one for that field
        if (partial.field && partial.field !== current.field) {
            const validOps = getOperatorsForField(partial.field);
            const currentOpValid = validOps.some(op => op.value === current.op);
            updated[index] = {
                ...current,
                ...partial,
                op: currentOpValid ? current.op : validOps[0].value,
                value: partial.field === 'amount' ? 0 : '',
            };
        } else {
            updated[index] = { ...current, ...partial };
        }

        onChange({ ...conditions, conditions: updated });
    }

    function addCondition() {
        if (conditions.conditions.length >= 10) return;
        onChange({
            ...conditions,
            conditions: [
                ...conditions.conditions,
                { field: 'description', op: 'contains', value: '' },
            ],
        });
    }

    function removeCondition(index: number) {
        if (conditions.conditions.length <= 1) return;
        const updated = conditions.conditions.filter((_, i) => i !== index);
        onChange({ ...conditions, conditions: updated });
    }

    function toggleOperator() {
        onChange({
            ...conditions,
            operator: conditions.operator === 'AND' ? 'OR' : 'AND',
        });
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={toggleOperator}
                >
                    Match{' '}
                    <span className="font-mono font-semibold text-ak-purple">
                        {conditions.operator}
                    </span>
                </Button>
            </div>

            <div className="space-y-2">
                {conditions.conditions.map((condition, index) => {
                    const validOps = getOperatorsForField(condition.field);
                    const isAmount = condition.field === 'amount';

                    return (
                        <div key={index} className="flex items-center gap-2">
                            {/* Field */}
                            <Select
                                value={condition.field}
                                onValueChange={(v) => updateCondition(index, { field: v as RuleCondition['field'] })}
                            >
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_OPTIONS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>
                                            {f.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Operator */}
                            <Select
                                value={condition.op}
                                onValueChange={(v) => updateCondition(index, { op: v as RuleCondition['op'] })}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {validOps.map(op => (
                                        <SelectItem key={op.value} value={op.value}>
                                            {op.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Value */}
                            <Input
                                type={isAmount ? 'number' : 'text'}
                                placeholder={isAmount ? '0' : 'value'}
                                value={condition.value}
                                onChange={(e) =>
                                    updateCondition(index, {
                                        value: isAmount ? Number(e.target.value) : e.target.value,
                                    })
                                }
                                className="flex-1"
                            />

                            {/* Remove */}
                            {conditions.conditions.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-ak-red"
                                    onClick={() => removeCondition(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>

            {conditions.conditions.length < 10 && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={addCondition}
                >
                    <Plus className="h-3 w-3" />
                    Add Condition
                </Button>
            )}
        </div>
    );
}
