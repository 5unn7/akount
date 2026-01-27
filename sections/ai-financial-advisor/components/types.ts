// =============================================================================
// Data Types
// =============================================================================

export interface Insight {
  id: string
  type: 'spending' | 'tax' | 'subsidy' | 'rule'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: number
  impactLabel: string
  confidence: number
  status: 'new' | 'dismissed' | 'applied'
  createdDate: string
  actionDeadline: string | null
  actionDeadlineLabel: string | null
  relatedTransactionIds: string[]
  category: string
  actionable: boolean
  aiGenerated: boolean
}

export interface RuleCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
  value: string
}

export interface RuleAction {
  type: 'categorize' | 'tag' | 'assign_entity'
  categoryId?: string
  categoryName?: string
  tagId?: string
  tagName?: string
  entityId?: string
}

export interface Rule {
  id: string
  name: string
  description: string
  conditions: RuleCondition[]
  action: RuleAction
  status: 'active' | 'inactive' | 'pending'
  createdBy: 'AI' | 'User'
  createdDate: string
  approvedDate: string | null
  affectedTransactionCount: number
  confidence: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface InsightsFeedProps {
  /** List of AI insights to display */
  insights: Insight[]
  /** Called when user dismisses an insight */
  onDismiss?: (insightId: string) => void
  /** Called when user applies an insight's suggestion */
  onApply?: (insightId: string) => void
  /** Called when user provides feedback on an insight */
  onFeedback?: (insightId: string, helpful: boolean) => void
  /** Called when user wants to share an insight */
  onShare?: (insightId: string) => void
  /** Called when user clicks on an insight for details */
  onInsightClick?: (insightId: string) => void
  /** Called when user clicks on related transactions */
  onViewRelatedTransactions?: (transactionIds: string[]) => void
  /** Filter by priority level */
  priorityFilter?: 'all' | 'high' | 'medium' | 'low'
  /** Filter by insight type */
  typeFilter?: 'all' | 'spending' | 'tax' | 'subsidy' | 'rule'
  /** Called when user changes priority filter */
  onPriorityFilterChange?: (filter: 'all' | 'high' | 'medium' | 'low') => void
  /** Called when user changes type filter */
  onTypeFilterChange?: (filter: 'all' | 'spending' | 'tax' | 'subsidy' | 'rule') => void
}

export interface RulesViewProps {
  /** List of categorization rules to display */
  rules: Rule[]
  /** Called when user approves a pending rule */
  onApprove?: (ruleId: string) => void
  /** Called when user rejects a pending rule */
  onReject?: (ruleId: string) => void
  /** Called when user activates an inactive rule */
  onActivate?: (ruleId: string) => void
  /** Called when user deactivates an active rule */
  onDeactivate?: (ruleId: string) => void
  /** Called when user wants to edit a rule */
  onEdit?: (ruleId: string) => void
  /** Called when user wants to delete a rule */
  onDelete?: (ruleId: string) => void
  /** Called when user clicks on a rule for details */
  onRuleClick?: (ruleId: string) => void
  /** Filter by rule status */
  statusFilter?: 'all' | 'active' | 'inactive' | 'pending'
  /** Filter by creator */
  creatorFilter?: 'all' | 'AI' | 'User'
  /** Called when user changes status filter */
  onStatusFilterChange?: (filter: 'all' | 'active' | 'inactive' | 'pending') => void
  /** Called when user changes creator filter */
  onCreatorFilterChange?: (filter: 'all' | 'AI' | 'User') => void
}
