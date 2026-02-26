'use client';

import { useState, useCallback } from 'react';
import type {
    AIRule,
    RuleStats,
    RuleSuggestion,
    RuleConditions,
    RuleAction,
    RuleSource,
} from '@/lib/api/ai';
import { apiFetch } from '@/lib/api/client-browser';
import { EmptyState } from '@akount/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
    Lightbulb,
    Plus,
    Pencil,
    Trash2,
    ToggleLeft,
    Loader2,
    Sparkles,
    Check,
    X,
    ChevronDown,
    Search,
    Zap,
    BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { RuleConditionBuilder } from './rule-condition-builder';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RulesClientProps {
    initialRules: AIRule[];
    initialNextCursor: string | null;
    initialStats: RuleStats;
    initialSuggestions: RuleSuggestion[];
    entityId: string;
}

type RuleListResponse = { rules: AIRule[]; nextCursor: string | null };

const SOURCE_LABELS: Record<RuleSource, string> = {
    USER_MANUAL: 'Manual',
    AI_SUGGESTED: 'AI Suggested',
    PATTERN_DETECTED: 'Pattern',
    CORRECTION_LEARNED: 'Learned',
};

const SOURCE_COLORS: Record<RuleSource, string> = {
    USER_MANUAL: 'bg-ak-blue-dim text-ak-blue',
    AI_SUGGESTED: 'bg-ak-purple-dim text-ak-purple',
    PATTERN_DETECTED: 'bg-ak-teal/15 text-ak-teal',
    CORRECTION_LEARNED: 'bg-ak-green-dim text-ak-green',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RulesClient({
    initialRules,
    initialNextCursor,
    initialStats,
    initialSuggestions,
    entityId,
}: RulesClientProps) {
    const [rules, setRules] = useState(initialRules);
    const [nextCursor, setNextCursor] = useState(initialNextCursor);
    const [stats, setStats] = useState(initialStats);
    const [suggestions, setSuggestions] = useState(initialSuggestions);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<string>('all');

    // Sheet state
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<AIRule | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formConditions, setFormConditions] = useState<RuleConditions>({
        operator: 'AND',
        conditions: [{ field: 'description', op: 'contains', value: '' }],
    });
    const [formAction, setFormAction] = useState<RuleAction>({ setCategoryId: '' });
    const [formIsActive, setFormIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // -----------------------------------------------------------------------
    // Data fetching
    // -----------------------------------------------------------------------

    const fetchRules = useCallback(async (cursor?: string) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ entityId, take: '20' });
            if (searchQuery) params.set('search', searchQuery);
            if (activeFilter === 'active') params.set('isActive', 'true');
            if (activeFilter === 'inactive') params.set('isActive', 'false');
            if (cursor) params.set('cursor', cursor);

            const result = await apiFetch<RuleListResponse>(
                `/api/ai/rules?${params.toString()}`
            );
            if (cursor) {
                setRules(prev => [...prev, ...result.rules]);
            } else {
                setRules(result.rules);
            }
            setNextCursor(result.nextCursor);
        } finally {
            setIsLoading(false);
        }
    }, [entityId, searchQuery, activeFilter]);

    const refreshStats = useCallback(async () => {
        const result = await apiFetch<RuleStats>(
            `/api/ai/rules/stats?entityId=${encodeURIComponent(entityId)}`
        );
        setStats(result);
    }, [entityId]);

    // -----------------------------------------------------------------------
    // Rule CRUD
    // -----------------------------------------------------------------------

    function openCreateSheet() {
        setEditingRule(null);
        setFormName('');
        setFormConditions({ operator: 'AND', conditions: [{ field: 'description', op: 'contains', value: '' }] });
        setFormAction({ setCategoryId: '' });
        setFormIsActive(true);
        setSheetOpen(true);
    }

    function openEditSheet(rule: AIRule) {
        setEditingRule(rule);
        setFormName(rule.name);
        setFormConditions(rule.conditions);
        setFormAction(rule.action);
        setFormIsActive(rule.isActive);
        setSheetOpen(true);
    }

    async function handleSave() {
        // Clean empty values from action
        const cleanAction: RuleAction = {};
        if (formAction.setCategoryId) cleanAction.setCategoryId = formAction.setCategoryId;
        if (formAction.setGLAccountId) cleanAction.setGLAccountId = formAction.setGLAccountId;
        if (formAction.flagForReview) cleanAction.flagForReview = true;

        // Validate
        const hasValidConditions = formConditions.conditions.every(c => c.value !== '');
        const hasAction = cleanAction.setCategoryId || cleanAction.setGLAccountId || cleanAction.flagForReview;
        if (!formName.trim() || !hasValidConditions || !hasAction) return;

        setIsSaving(true);
        try {
            if (editingRule) {
                const updated = await apiFetch<AIRule>(
                    `/api/ai/rules/${editingRule.id}`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify({
                            name: formName,
                            conditions: formConditions,
                            action: cleanAction,
                            isActive: formIsActive,
                        }),
                    }
                );
                setRules(prev => prev.map(r => r.id === updated.id ? updated : r));
            } else {
                const created = await apiFetch<AIRule>('/api/ai/rules', {
                    method: 'POST',
                    body: JSON.stringify({
                        entityId,
                        name: formName,
                        conditions: formConditions,
                        action: cleanAction,
                        isActive: formIsActive,
                    }),
                });
                setRules(prev => [created, ...prev]);
            }
            setSheetOpen(false);
            await refreshStats();
        } finally {
            setIsSaving(false);
        }
    }

    async function handleToggle(ruleId: string) {
        const updated = await apiFetch<AIRule>(
            `/api/ai/rules/${ruleId}/toggle`,
            { method: 'POST' }
        );
        setRules(prev => prev.map(r => r.id === ruleId ? updated : r));
        await refreshStats();
    }

    async function handleDelete(ruleId: string) {
        await apiFetch<void>(`/api/ai/rules/${ruleId}`, { method: 'DELETE' });
        setRules(prev => prev.filter(r => r.id !== ruleId));
        await refreshStats();
    }

    // -----------------------------------------------------------------------
    // Suggestion actions
    // -----------------------------------------------------------------------

    async function handleApproveSuggestion(id: string) {
        const result = await apiFetch<{ approved: true; ruleId: string }>(
            `/api/ai/suggestions/${id}/approve`,
            { method: 'POST' }
        );
        setSuggestions(prev => prev.filter(s => s.id !== id));
        // Refresh rules list to show newly created rule
        await fetchRules();
        await refreshStats();
        return result;
    }

    async function handleRejectSuggestion(id: string) {
        await apiFetch<void>(
            `/api/ai/suggestions/${id}/reject`,
            { method: 'POST', body: JSON.stringify({}) }
        );
        setSuggestions(prev => prev.filter(s => s.id !== id));
    }

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-ak-purple" />
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Rules</p>
                        </div>
                        <p className="text-2xl font-mono font-semibold mt-1">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-ak-green" />
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Active</p>
                        </div>
                        <p className="text-2xl font-mono font-semibold mt-1">{stats.active}</p>
                    </CardContent>
                </Card>
                <Card className="glass rounded-[14px]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Inactive</p>
                        </div>
                        <p className="text-2xl font-mono font-semibold mt-1">{stats.inactive}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Suggestions (DEV-214) */}
            {suggestions.length > 0 && (
                <Card className="glass rounded-[14px] border-ak-purple/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-ak-purple" />
                            AI Suggestions ({suggestions.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {suggestions.map((suggestion) => (
                            <div
                                key={suggestion.id}
                                className="flex items-start gap-3 p-3 rounded-lg border border-ak-border hover:border-ak-border-2 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {suggestion.suggestedRule.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {suggestion.suggestedRule.patternSummary}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-mono text-ak-purple">
                                            {suggestion.aiConfidence}% confidence
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-ak-green hover:bg-ak-green-dim"
                                        onClick={() => handleApproveSuggestion(suggestion.id)}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 text-ak-red hover:bg-ak-red-dim"
                                        onClick={() => handleRejectSuggestion(suggestion.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Search + Filters + Create */}
            <Card className="glass rounded-[14px]">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search rules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>

                        <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v)}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchRules()}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                        </Button>

                        <div className="ml-auto">
                            <Button
                                size="sm"
                                className="gap-1"
                                onClick={openCreateSheet}
                            >
                                <Plus className="h-4 w-4" />
                                Create Rule
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Rules List */}
            {rules.length === 0 ? (
                <EmptyState
                    icon={Lightbulb}
                    title="No rules yet"
                    description="Create rules to automatically categorize transactions based on conditions."
                />
            ) : (
                <div className="space-y-2">
                    {rules.map((rule) => (
                        <Card
                            key={rule.id}
                            className="glass rounded-[14px] transition-all hover:border-ak-border-2 hover:-translate-y-px"
                        >
                            <CardContent className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                    <Lightbulb className={`h-5 w-5 shrink-0 ${rule.isActive ? 'text-ak-purple' : 'text-muted-foreground/40'}`} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-sm font-medium ${!rule.isActive ? 'text-muted-foreground' : ''}`}>
                                                {rule.name}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-1.5 py-0 ${SOURCE_COLORS[rule.source]}`}
                                            >
                                                {SOURCE_LABELS[rule.source]}
                                            </Badge>
                                            {!rule.isActive && (
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-muted-foreground">
                                                {rule.conditions.conditions.length} condition{rule.conditions.conditions.length !== 1 ? 's' : ''}
                                                {' '}&middot;{' '}
                                                {rule.conditions.operator}
                                            </span>
                                            {rule.executionCount > 0 && (
                                                <span className="text-xs font-mono text-ak-green">
                                                    {rule.executionCount} matched
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(rule.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => handleToggle(rule.id)}
                                            title={rule.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            <ToggleLeft className={`h-4 w-4 ${rule.isActive ? 'text-ak-green' : 'text-muted-foreground'}`} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={() => openEditSheet(rule)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-ak-red hover:bg-ak-red-dim"
                                            onClick={() => handleDelete(rule.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Load More */}
                    {nextCursor && (
                        <div className="flex justify-center pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchRules(nextCursor)}
                                disabled={isLoading}
                                className="gap-1"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                                Load More
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{editingRule ? 'Edit Rule' : 'Create Rule'}</SheetTitle>
                        <SheetDescription>
                            {editingRule
                                ? 'Update the rule conditions and actions.'
                                : 'Define conditions to automatically categorize matching transactions.'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 mt-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="rule-name">Rule Name</Label>
                            <Input
                                id="rule-name"
                                placeholder="e.g., Coffee expenses"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                            />
                        </div>

                        {/* Active toggle */}
                        <div className="flex items-center justify-between">
                            <Label>Active</Label>
                            <Switch
                                checked={formIsActive}
                                onCheckedChange={setFormIsActive}
                            />
                        </div>

                        {/* Conditions (DEV-213) */}
                        <RuleConditionBuilder
                            conditions={formConditions}
                            onChange={setFormConditions}
                        />

                        {/* Actions */}
                        <div className="space-y-3">
                            <Label>Actions</Label>
                            <div className="space-y-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="action-category" className="text-xs text-muted-foreground">
                                        Set Category ID
                                    </Label>
                                    <Input
                                        id="action-category"
                                        placeholder="Category ID (CUID)"
                                        value={formAction.setCategoryId ?? ''}
                                        onChange={(e) => setFormAction(prev => ({
                                            ...prev,
                                            setCategoryId: e.target.value || undefined,
                                        }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="action-gl" className="text-xs text-muted-foreground">
                                        Set GL Account ID
                                    </Label>
                                    <Input
                                        id="action-gl"
                                        placeholder="GL Account ID (CUID)"
                                        value={formAction.setGLAccountId ?? ''}
                                        onChange={(e) => setFormAction(prev => ({
                                            ...prev,
                                            setGLAccountId: e.target.value || undefined,
                                        }))}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={formAction.flagForReview ?? false}
                                        onCheckedChange={(checked) => setFormAction(prev => ({
                                            ...prev,
                                            flagForReview: checked || undefined,
                                        }))}
                                    />
                                    <Label className="text-xs">
                                        Flag for review
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Save */}
                        <div className="flex justify-end gap-2 pt-4 border-t border-ak-border">
                            <Button
                                variant="outline"
                                onClick={() => setSheetOpen(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !formName.trim()}
                                className="gap-1"
                            >
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editingRule ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
