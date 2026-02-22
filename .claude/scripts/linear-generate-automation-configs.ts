#!/usr/bin/env tsx
/**
 * Generate Linear Automation Configurations
 *
 * Linear automations must be created via UI, but this script generates
 * the exact configuration for each automation to make setup easy.
 *
 * Output: JSON configs + step-by-step instructions
 */

import { LinearClient } from '@linear/sdk'
import fs from 'fs/promises'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || ''
if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY })

// ============================================================================
// Automation Configurations
// ============================================================================

interface AutomationConfig {
  name: string
  description: string
  category: 'triage' | 'routing' | 'escalation' | 'maintenance' | 'cross-team'
  trigger: {
    type: string
    conditions: string[]
  }
  actions: {
    type: string
    value: string
  }[]
  teams?: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
}

const AUTOMATIONS: AutomationConfig[] = [
  // 1. Auto-Triage Bugs (Customer Impact)
  {
    name: 'Auto-Triage High-Impact Bugs',
    description: 'Bugs affecting >10 customers auto-escalate to High priority',
    category: 'triage',
    trigger: {
      type: 'Issue created or updated',
      conditions: [
        'Labels include "bug"',
        'Custom field "Customer Count" > 10',
        'Priority is not Critical or High',
      ],
    },
    actions: [
      { type: 'Set priority', value: 'High' },
      { type: 'Add label', value: 'affects-100+' },
      { type: 'Add comment', value: '🚨 Auto-escalated: High customer impact (>10 affected)' },
    ],
    teams: ['Customer Success', 'Platform'],
    priority: 'critical',
  },

  // 2. Feature Request Auto-Routing
  {
    name: 'Auto-Route Feature Requests',
    description: 'Route feature requests to correct team based on keywords',
    category: 'routing',
    trigger: {
      type: 'Issue created',
      conditions: [
        'Labels include "feature-request"',
        'Team is Customer Success',
      ],
    },
    actions: [
      { type: 'If title/description contains "invoice|bill|payment|client|vendor"', value: 'Move to Business team' },
      { type: 'If title/description contains "account|transaction|bank|import"', value: 'Move to Banking team' },
      { type: 'If title/description contains "report|journal|gl|accounting"', value: 'Move to Accounting team' },
      { type: 'If title/description contains "budget|forecast|plan"', value: 'Move to Planning team' },
      { type: 'If title/description contains "ai|chat|insight|categorization"', value: 'Move to Insights team' },
      { type: 'If title/description contains "dashboard|overview"', value: 'Move to Overview team' },
      { type: 'Else', value: 'Add comment: "Please assign to correct product team"' },
    ],
    teams: ['Customer Success'],
    priority: 'high',
  },

  // 3. Critical Issue Executive Notification
  {
    name: 'Critical Issue Exec Escalation',
    description: 'Critical issues affecting >1000 users notify executives immediately',
    category: 'escalation',
    trigger: {
      type: 'Issue created or updated',
      conditions: [
        'Priority is Critical',
        'Custom field "Customer Count" > 1000',
      ],
    },
    actions: [
      { type: 'Add label', value: 'affects-1000+' },
      { type: 'Add label', value: 'production-down' },
      { type: 'Send Slack notification', value: '#incidents channel' },
      { type: 'Add comment', value: '🔴 CRITICAL: >1000 customers affected. Executive team notified.' },
      { type: 'Set cycle', value: 'Current cycle' },
    ],
    teams: ['All'],
    priority: 'critical',
  },

  // 4. Stale Issue Cleanup
  {
    name: 'Stale Issue Cleanup',
    description: 'Close issues with no activity for 90+ days',
    category: 'maintenance',
    trigger: {
      type: 'Scheduled (weekly)',
      conditions: [
        'Last updated > 90 days ago',
        'Status is not Done or Canceled',
        'Priority is Low or None',
      ],
    },
    actions: [
      { type: 'Add comment', value: '⏰ No activity for 90 days. Closing as stale. Comment to reopen.' },
      { type: 'Wait 7 days', value: '' },
      { type: 'If still no activity', value: 'Move to Canceled' },
    ],
    teams: ['All'],
    priority: 'low',
  },

  // 5. Feature Shipped → Docs Task
  {
    name: 'Auto-Create Docs Tasks',
    description: 'When feature ships, create Content team task to document',
    category: 'cross-team',
    trigger: {
      type: 'Issue moved to Done',
      conditions: [
        'Labels include "feature"',
        'Team is product team (Overview, Banking, Business, etc.)',
      ],
    },
    actions: [
      { type: 'Create issue in Content team', value: 'Document: {issue.title}' },
      { type: 'Link as "Blocks"', value: 'New docs task blocks original issue' },
      { type: 'Set priority', value: 'Same as original' },
      { type: 'Add label', value: 'documentation' },
    ],
    teams: ['All product teams'],
    priority: 'medium',
  },

  // 6. Bug Fixed → Customer Notification
  {
    name: 'Bug Fixed Notification',
    description: 'When bug is fixed, notify Customer Success to update affected users',
    category: 'cross-team',
    trigger: {
      type: 'Issue moved to Done',
      conditions: [
        'Labels include "bug"',
        'Custom field "Customer Count" > 0',
      ],
    },
    actions: [
      { type: 'Create issue in Customer Success team', value: 'Notify customers: {issue.title} fixed' },
      { type: 'Copy customer count', value: 'From original issue' },
      { type: 'Add label', value: 'customer-communication' },
      { type: 'Link as "Related"', value: 'Link to original bug' },
    ],
    teams: ['All product teams'],
    priority: 'medium',
  },

  // 7. Blocked Issues Alert
  {
    name: 'Long-Blocked Issue Alert',
    description: 'Alert team when issue blocked for >7 days',
    category: 'escalation',
    trigger: {
      type: 'Scheduled (daily)',
      conditions: [
        'Status is Blocked',
        'Time in Blocked state > 7 days',
        'Priority is High or Critical',
      ],
    },
    actions: [
      { type: 'Add comment', value: '⚠️ Blocked for 7+ days. Please unblock or deprioritize.' },
      { type: 'Send Slack notification', value: 'To issue assignee + team channel' },
    ],
    teams: ['All'],
    priority: 'high',
  },

  // 8. New Team Member Onboarding
  {
    name: 'New Team Member Setup',
    description: 'When user joins team, create onboarding checklist',
    category: 'maintenance',
    trigger: {
      type: 'User added to team',
      conditions: [],
    },
    actions: [
      { type: 'Create issue', value: 'Onboarding: {user.name}' },
      { type: 'Add description template', value: 'Onboarding checklist (Linear access, repo access, docs, etc.)' },
      { type: 'Assign to team lead', value: '' },
      { type: 'Add label', value: 'onboarding' },
    ],
    teams: ['All'],
    priority: 'low',
  },

  // 9. Security Issue SLA Enforcement
  {
    name: 'Security SLA Enforcement',
    description: 'Security issues must be acknowledged within 4 hours',
    category: 'escalation',
    trigger: {
      type: 'Scheduled (hourly)',
      conditions: [
        'Labels include "security"',
        'Status is Backlog or Triage',
        'Created > 4 hours ago',
        'No assignee',
      ],
    },
    actions: [
      { type: 'Add comment', value: '⏰ Security SLA breach: Not acknowledged in 4 hours' },
      { type: 'Send Slack notification', value: '#security channel + @security-lead' },
      { type: 'Set priority', value: 'High (if not already higher)' },
    ],
    teams: ['Platform', 'Infrastructure'],
    priority: 'critical',
  },

  // 10. Duplicate Detection Helper
  {
    name: 'Potential Duplicate Detection',
    description: 'Flag issues with similar titles for duplicate review',
    category: 'triage',
    trigger: {
      type: 'Issue created',
      conditions: [
        'Title similarity > 80% to existing open issue',
      ],
    },
    actions: [
      { type: 'Add label', value: 'potential-duplicate' },
      { type: 'Add comment', value: 'Potential duplicate of #{similar_issue}. Please review.' },
      { type: 'Link as "Related"', value: 'Link to similar issue' },
    ],
    teams: ['All'],
    priority: 'medium',
  },
]

// ============================================================================
// Main Script
// ============================================================================

async function main() {
  console.log('🤖 Linear Automation Configuration Generator\n')

  // Get teams for reference
  const teams = await linear.teams()
  const teamMap = new Map(teams.nodes.map(t => [t.name, { id: t.id, key: t.key }]))

  console.log(`✅ Found ${teams.nodes.length} teams\n`)

  // Generate automation configs
  const configs = {
    generatedAt: new Date().toISOString(),
    linearUrl: 'https://linear.app/akount',
    automationCount: AUTOMATIONS.length,
    teams: Array.from(teamMap.entries()).map(([name, data]) => ({ name, ...data })),
    automations: AUTOMATIONS.map((auto, index) => ({
      number: index + 1,
      ...auto,
      setupUrl: `https://linear.app/akount/settings/automations/new`,
    })),
  }

  // Save to file
  await fs.writeFile(
    '.claude/linear-automation-configs.json',
    JSON.stringify(configs, null, 2)
  )

  console.log('📝 Generated Configuration Files:\n')
  console.log('   ✅ .claude/linear-automation-configs.json')

  // Generate step-by-step guide
  const guide = generateSetupGuide(configs)
  await fs.writeFile('docs/LINEAR-AUTOMATION-SETUP.md', guide)
  console.log('   ✅ docs/LINEAR-AUTOMATION-SETUP.md')

  // Print summary
  console.log('\n📊 Automation Summary:\n')
  const byCategory = AUTOMATIONS.reduce((acc, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} automations`)
  })

  console.log('\n🎯 Priority Breakdown:\n')
  const byPriority = AUTOMATIONS.reduce((acc, a) => {
    acc[a.priority] = (acc[a.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log(`   🔴 Critical: ${byPriority.critical || 0}`)
  console.log(`   🟠 High: ${byPriority.high || 0}`)
  console.log(`   🟡 Medium: ${byPriority.medium || 0}`)
  console.log(`   ⚪ Low: ${byPriority.low || 0}`)

  console.log('\n📖 Next Steps:\n')
  console.log('1. Review: docs/LINEAR-AUTOMATION-SETUP.md')
  console.log('2. Go to: https://linear.app/akount/settings/automations')
  console.log('3. Create automations following the guide (10-15 min)')
  console.log('4. Test each automation with a sample issue')
  console.log('\n💡 Tip: Start with Critical priority automations first')
}

function generateSetupGuide(configs: any): string {
  return `# Linear Automation Setup Guide

**Generated:** ${new Date().toISOString()}

This guide provides step-by-step instructions to set up ${configs.automationCount} automations in Linear.

---

## Quick Start

1. Go to [Linear Automations Settings](https://linear.app/akount/settings/automations)
2. Click **"New automation"**
3. Follow the configurations below for each automation
4. Test with sample issues

**Estimated time:** 15-20 minutes (all automations)

---

## Priority Setup Order

Set up in this order for maximum impact:

### 1. Critical Priority (Setup First)
${AUTOMATIONS.filter(a => a.priority === 'critical').map((a, i) => `${i + 1}. ${a.name}`).join('\n')}

### 2. High Priority
${AUTOMATIONS.filter(a => a.priority === 'high').map((a, i) => `${i + 1}. ${a.name}`).join('\n')}

### 3. Medium Priority
${AUTOMATIONS.filter(a => a.priority === 'medium').map((a, i) => `${i + 1}. ${a.name}`).join('\n')}

### 4. Low Priority (Optional)
${AUTOMATIONS.filter(a => a.priority === 'low').map((a, i) => `${i + 1}. ${a.name}`).join('\n')}

---

## Detailed Configurations

${AUTOMATIONS.map((auto, index) => `
### ${index + 1}. ${auto.name}

**Description:** ${auto.description}
**Category:** ${auto.category}
**Priority:** ${auto.priority}
**Teams:** ${auto.teams?.join(', ') || 'All'}

#### Trigger
- Type: ${auto.trigger.type}
- Conditions:
${auto.trigger.conditions.map(c => `  - ${c}`).join('\n')}

#### Actions
${auto.actions.map((action, i) => `${i + 1}. ${action.type}: ${action.value}`).join('\n')}

#### Setup in Linear UI
1. Go to [Automations](https://linear.app/akount/settings/automations) → "New automation"
2. Name: "${auto.name}"
3. Trigger: ${auto.trigger.type}
4. Add conditions (see above)
5. Add actions (see above)
6. Save & test

---
`).join('\n')}

## Testing Your Automations

After setup, test each automation:

1. **Auto-Triage Bugs:** Create test issue with label "bug" + Customer Count >10 → Should auto-set to High priority
2. **Feature Request Routing:** Create issue with label "feature-request" + title "invoice export" → Should move to Business team
3. **Critical Escalation:** Create Critical issue with Customer Count >1000 → Should add labels + notify Slack
4. **Stale Cleanup:** Check existing old issues → Should have cleanup comment (if enabled)
5. **Feature Shipped Docs:** Mark feature as Done → Should create Content team task

## Custom Fields Required

Before setting up automations, ensure these custom fields exist:

- **Customer Count** (Number) - How many customers affected
- **Related Teams** (Multi-select) - For cross-team issues

Create at: [Custom Fields Settings](https://linear.app/akount/settings/custom-fields)

## Slack Integration (for notifications)

To enable Slack notifications in automations:

1. Go to [Integrations](https://linear.app/akount/settings/integrations)
2. Find "Slack" → Connect
3. Authorize Linear to access your Slack workspace
4. Select channels for notifications (#incidents, #security, etc.)

## Troubleshooting

**Automation not triggering:**
- Check that all conditions are met
- Verify custom fields have values
- Check automation is enabled (not draft)

**Actions not working:**
- Ensure team exists (for routing actions)
- Check labels exist (for label actions)
- Verify Slack integration (for notifications)

**Too many false positives:**
- Adjust thresholds (e.g., Customer Count >10 → >20)
- Add more specific conditions
- Use "AND" logic instead of "OR"

## Monitoring & Tuning

After 1 week of use:

1. Check automation trigger counts (Settings → Automations → View stats)
2. Review false positives/negatives
3. Adjust thresholds if needed
4. Add/remove conditions based on usage

**Target:** <5% false positive rate for each automation

---

**Need help?** Check [Linear Docs](https://linear.app/docs/automations) or reach out in #linear-help
`
}

main().catch(err => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
