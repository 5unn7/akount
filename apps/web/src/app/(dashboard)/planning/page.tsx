import type { Metadata } from 'next';
import Link from 'next/link';
import { listGoals, listBudgets } from '@/lib/api/planning';
import { listEntities } from '@/lib/api/entities';
import { getEntitySelection, validateEntityId } from '@/lib/entity-cookies';
import { formatCurrency } from '@/lib/utils/currency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PiggyBank, Target, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Planning | Akount',
    description: 'Financial planning — budgets, goals, and forecasts',
};

export default async function PlanningPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    const entityId = validateEntityId(rawEntityId, entities) ?? undefined;

    if (!entityId) {
        return (
            <div className="flex-1 space-y-4">
                <h1 className="text-2xl font-heading font-normal">Planning</h1>
                <p className="text-sm text-muted-foreground">
                    Select an entity to view financial planning.
                </p>
            </div>
        );
    }

    const [goalsResult, budgetsResult] = await Promise.all([
        listGoals({ entityId, limit: 5 }),
        listBudgets({ entityId, limit: 5 }),
    ]);

    const activeGoals = goalsResult.goals.filter(g => g.status === 'ACTIVE');
    const onTrackGoals = goalsResult.goals.filter(
        g => (g.status === 'ACTIVE' || g.status === 'COMPLETED') && (g.targetAmount > 0 ? g.currentAmount / g.targetAmount >= 0.5 : false)
    );
    const totalBudgetAmount = budgetsResult.budgets.reduce((sum, b) => sum + b.amount, 0);

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-normal">Planning</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Set budgets, track goals, and plan your financial future
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/planning/budgets">
                        <Button variant="outline" className="rounded-lg border-ak-border hover:bg-ak-bg-3 gap-2">
                            <PiggyBank className="h-4 w-4" />
                            Create Budget
                        </Button>
                    </Link>
                    <Link href="/planning/goals">
                        <Button className="rounded-lg bg-primary hover:bg-ak-pri-hover text-black font-medium gap-2">
                            <Target className="h-4 w-4" />
                            Set Goal
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="glass rounded-xl hover:border-ak-border-2 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Total Budgets</CardTitle>
                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">{budgetsResult.budgets.length}</div>
                    </CardContent>
                </Card>

                <Card className="glass rounded-xl hover:border-ak-border-2 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Active Goals</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">{activeGoals.length}</div>
                    </CardContent>
                </Card>

                <Card className="glass rounded-xl hover:border-ak-border-2 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Goals On Track</CardTitle>
                        <TrendingUp className="h-4 w-4 text-ak-green" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold text-ak-green">{onTrackGoals.length}</div>
                    </CardContent>
                </Card>

                <Card className="glass rounded-xl hover:border-ak-border-2 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Budget Allocated</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-mono font-bold">{formatCurrency(totalBudgetAmount)}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Goals & Budgets */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Recent Goals</CardTitle>
                        <Link href="/planning/goals">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
                                View All <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {goalsResult.goals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No goals set yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {goalsResult.goals.map(goal => {
                                    const progress = goal.targetAmount > 0
                                        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                                        : 0;
                                    return (
                                        <div key={goal.id} className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{goal.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1.5 rounded-full bg-ak-bg-3 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${progress >= 100 ? 'bg-ak-green' : 'bg-primary'}`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-mono text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Budgets */}
                <Card className="glass rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Recent Budgets</CardTitle>
                        <Link href="/planning/budgets">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-foreground">
                                View All <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {budgetsResult.budgets.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No budgets created yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {budgetsResult.budgets.map(budget => (
                                    <div key={budget.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <p className="text-sm font-medium truncate">{budget.name}</p>
                                            <Badge variant="outline" className="text-xs bg-ak-blue-dim text-ak-blue border-transparent shrink-0">
                                                {budget.period}
                                            </Badge>
                                        </div>
                                        <span className="text-sm font-mono text-muted-foreground">{formatCurrency(budget.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
