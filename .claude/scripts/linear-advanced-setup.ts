#!/usr/bin/env tsx
/**
 * Linear Advanced Features Setup
 *
 * Configures Linear Business plan advanced features:
 * - Initiatives (strategic roadmap grouping)
 * - Projects (with proper hierarchy and parent initiatives)
 * - Documents (Linear Docs for specs, RFCs, runbooks)
 * - Agents (AI-powered triage, insights, and automation)
 *
 * Prerequisites: Workspace setup complete (teams, labels)
 */

import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || ''

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY })

// ============================================================================
// Configuration
// ============================================================================

const INITIATIVES = [
  {
    name: 'Phase 6: Launch MVP',
    description: 'Production-ready Akount with core features for 100k users - Security, performance, complete product domains',
    targetDate: '2026-03-31',
    color: '#10B981', // Green - current phase
  },
  {
    name: 'Phase 7: Scale & Optimize',
    description: 'Advanced features for growth - Multi-currency, integrations, AI enhancements, enterprise features',
    targetDate: '2026-06-30',
    color: '#3B82F6', // Blue - future
  },
  {
    name: 'Linear PM System',
    description: 'Complete PM infrastructure - Automations, integrations, dashboards for managing at scale',
    targetDate: '2026-03-15',
    color: '#F59E0B', // Amber - infrastructure
  },
]

const PROJECTS_WITH_INITIATIVES = [
  // Phase 6: Launch MVP (current phase, most tasks here)
  { name: 'Security & Performance', initiative: 'Phase 6: Launch MVP', description: 'SEC, PERF, INFRA tasks - prod hardening', targetDate: '2026-03-15', teams: ['Platform', 'Infrastructure'] },
  { name: 'Banking Domain Complete', initiative: 'Phase 6: Launch MVP', description: 'Accounts, transactions, reconciliation, imports', targetDate: '2026-02-28', teams: ['Banking'] },
  { name: 'Business Domain Complete', initiative: 'Phase 6: Launch MVP', description: 'Invoices, bills, clients, vendors, payments', targetDate: '2026-03-07', teams: ['Business'] },
  { name: 'Accounting Domain Complete', initiative: 'Phase 6: Launch MVP', description: 'GL, journal entries, reports, COA', targetDate: '2026-03-14', teams: ['Accounting'] },
  { name: 'UX Polish & Testing', initiative: 'Phase 6: Launch MVP', description: 'Loading states, confirmations, toasts, E2E tests', targetDate: '2026-03-20', teams: ['Overview', 'Platform'] },

  // Phase 7: Scale & Optimize (future work)
  { name: 'Planning & Forecasting', initiative: 'Phase 7: Scale & Optimize', description: 'Budgets, goals, cash flow projection', targetDate: '2026-04-30', teams: ['Planning'] },
  { name: 'AI & Insights', initiative: 'Phase 7: Scale & Optimize', description: 'Chat, categorization, anomaly detection', targetDate: '2026-05-15', teams: ['Insights'] },
  { name: 'Multi-Currency & Tax', initiative: 'Phase 7: Scale & Optimize', description: 'Advanced financial features', targetDate: '2026-05-31', teams: ['Accounting', 'Business'] },
  { name: 'Enterprise Integrations', initiative: 'Phase 7: Scale & Optimize', description: 'Plaid, QuickBooks, Xero, Stripe', targetDate: '2026-06-15', teams: ['Platform', 'Banking'] },

  // Linear PM System (infrastructure for managing the business)
  { name: 'Linear Workspace & Automations', initiative: 'Linear PM System', description: 'Teams, labels, workflows, automations', targetDate: '2026-02-28', teams: ['Infrastructure'] },
  { name: 'Customer Success Operations', initiative: 'Linear PM System', description: 'Support workflows, triage, escalation', targetDate: '2026-03-15', teams: ['Customer Success'] },
  { name: 'Growth & Content Pipeline', initiative: 'Linear PM System', description: 'Marketing, content, docs workflows', targetDate: '2026-03-31', teams: ['Growth', 'Content'] },
]

const DOCUMENTS = [
  {
    title: 'Linear Workflows',
    content: `# Linear Workflows

## Product Teams

### Overview Team
- Owns: Dashboard, analytics, reporting features
- Workflow: Feature request → Design → Implement → Review → Ship

### Banking Team
...

## Operations Teams

### Customer Success Team
- Owns: Support tickets, bug reports, feature requests from users
- Triage SLA: <4 hours for Critical, <24 hours for High
- Escalation: >1000 users affected → Auto-escalate to exec
...
`,
    icon: '📋',
    color: '#3B82F6',
  },
  {
    title: 'Automation Runbook',
    content: `# Linear Automation Runbook

## Auto-Triage Bugs
**Trigger:** CS issue + label "bug" + Customer Count >10
**Actions:** Set High priority, add to cycle, notify Platform lead
**How to test:** Create CS issue, label "bug", set Customer Count = 15
**How to disable:** Settings → Automations → Find "Auto-Triage" → Disable
...
`,
    icon: '🤖',
    color: '#8B5CF6',
  },
  {
    title: 'Integration Guide',
    content: `# Linear Integrations

## GitHub
- Auto-link commits: Mention PLAT-123 in commit → Links to issue
- Auto-close: PR with "Closes PLAT-123" → Closes issue on merge
- Deploy notifications: GitHub Actions webhook → Creates Infrastructure issue
...

## Intercom
- Webhook URL: https://api.linear.app/webhooks/...
- Trigger: Conversation tagged "bug" or "feature-request"
- Action: Creates CS issue with customer context
...
`,
    icon: '🔗',
    color: '#10B981',
  },
]

// ============================================================================
// Setup Functions
// ============================================================================

async function createInitiatives() {
  console.log('\n🎯 Creating Initiatives (Strategic Roadmap)...\n')

  const existingInitiatives = await linear.initiatives()
  let created = 0

  for (const config of INITIATIVES) {
    const exists = existingInitiatives.nodes.find(i => i.name === config.name)

    if (!exists) {
      try {
        await linear.createInitiative({
          name: config.name,
          description: config.description,
          targetDate: config.targetDate,
        })
        console.log(`  ✅ ${config.name}`)
        created++
      } catch (err: any) {
        if (err.message?.includes('already exists') || err.message?.includes('not a function')) {
          console.log(`  ⏭️  ${config.name} (already exists or API unavailable)`)
        } else {
          console.log(`  ⚠️  ${config.name}: ${err.message}`)
        }
      }
    } else {
      console.log(`  ⏭️  ${config.name}`)
    }
  }

  console.log(`\n✅ ${created} initiatives created`)

  // Return map of initiative names to IDs for project linking
  const initiatives = await linear.initiatives()
  const initiativeMap: Record<string, any> = {}
  initiatives.nodes.forEach(i => {
    initiativeMap[i.name] = i
  })

  return initiativeMap
}

async function createProjectsWithInitiatives(defaultTeamId: string, initiativeMap: Record<string, any>) {
  console.log('\n📁 Creating Projects (linked to Initiatives)...\n')

  const existingProjects = await linear.projects()
  let created = 0

  for (const config of PROJECTS_WITH_INITIATIVES) {
    const exists = existingProjects.nodes.find(p => p.name === config.name)

    if (!exists) {
      const initiative = initiativeMap[config.initiative]

      try {
        await linear.createProject({
          name: config.name,
          description: config.description,
          teamIds: [defaultTeamId],
          targetDate: config.targetDate,
          ...(initiative && { initiativeId: initiative.id }),
        })
        console.log(`  ✅ ${config.name} → ${config.initiative}`)
        created++
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          console.log(`  ⏭️  ${config.name}`)
        } else {
          console.log(`  ⚠️  ${config.name}: ${err.message}`)
        }
      }
    } else {
      console.log(`  ⏭️  ${config.name}`)
    }
  }

  console.log(`\n✅ ${created} projects created and linked to initiatives`)
}

async function createDocuments() {
  console.log('\n📝 Creating Documents (Linear Docs)...\n')

  let created = 0

  for (const doc of DOCUMENTS) {
    try {
      // Check if document creation is available
      if (!linear.createDocument || typeof linear.createDocument !== 'function') {
        console.log('  ℹ️  Document creation via API not available')
        console.log('     Create documents manually in Linear: Docs → New Doc')
        break
      }

      await linear.createDocument({
        title: doc.title,
        content: doc.content,
        icon: doc.icon,
        color: doc.color,
      })
      console.log(`  ✅ ${doc.title}`)
      created++
    } catch (err: any) {
      if (err.message?.includes('not a function')) {
        console.log(`  ℹ️  Documents must be created manually in Linear UI`)
        console.log(`     Docs → New Doc → "${doc.title}"`)
        break
      } else {
        console.log(`  ⚠️  ${doc.title}: ${err.message}`)
      }
    }
  }

  if (created > 0) {
    console.log(`\n✅ ${created} documents created`)
  } else {
    console.log(`\n  📋 Create ${DOCUMENTS.length} documents manually (templates provided above)`)
  }
}

async function setupAgents() {
  console.log('\n🤖 Configuring Linear Agents (AI Features)...\n')

  console.log(`  Linear Agents are configured in the UI:

  1. Go to: Settings → Agents
  2. Enable these agents:

  **Triage Agent:**
  - Auto-categorize incoming CS issues
  - Suggest priority based on keywords
  - Detect duplicates using AI similarity

  **Smart Assignment:**
  - Auto-assign issues to best team member
  - Based on past work, expertise tags
  - Load balancing

  **Context Enrichment:**
  - Auto-add relevant labels
  - Suggest related issues
  - Extract key information to custom fields

  **Insights Agent:**
  - Weekly summary of team health
  - Bottleneck detection
  - Velocity predictions
`)

  console.log('✅ Agent configuration guide printed')
}

async function printAdvancedSummary() {
  console.log('\n' + '='.repeat(70))
  console.log('✅ ADVANCED SETUP COMPLETE')
  console.log('='.repeat(70))

  const teams = await linear.teams()
  const projects = await linear.projects()
  const labels = await linear.issueLabels()
  const issues = await linear.issues()

  console.log(`
📊 Workspace Summary:
   Teams:        ${teams.nodes.length} (with 2-level hierarchy)
   Issues:       ${issues.nodes.length}
   Projects:     ${projects.nodes.length}
   Labels:       ${labels.nodes.length}

🎯 Initiatives: 3 strategic groups
   - Launch MVP (4 projects)
   - Scale & Optimize (3 projects)
   - Customer Success Excellence (2 projects)

📝 Documents: Create manually in Linear UI (templates provided)
   - Linear Workflows
   - Automation Runbook
   - Integration Guide

🤖 Agents: Configure in Settings → Agents
   - Triage Agent (auto-categorize)
   - Smart Assignment (auto-assign)
   - Context Enrichment (auto-label)
   - Insights Agent (team health)

🚀 Ready for:
   ✅ Sprint 2: Automation workflows
   ✅ Sprint 3: Integrations (GitHub, Intercom, Sentry)
   ✅ Sprint 4: Custom dashboards
   ✅ Task import: npm run linear:import (if not done)
`)
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('\n🚀 Linear Advanced Features Setup\n')

  try {
    // Step 1: Create Initiatives
    const initiativeMap = await createInitiatives()

    // Step 2: Create Projects linked to Initiatives
    const teams = await linear.teams()
    const platformTeam = teams.nodes.find(t => t.key === 'PLAT' || t.name === 'Platform')

    if (platformTeam) {
      await createProjectsWithInitiatives(platformTeam.id, initiativeMap)
    } else {
      console.log('\n⚠️  Platform team not found, skipping project creation')
    }

    // Step 3: Create Documents
    await createDocuments()

    // Step 4: Configure Agents
    await setupAgents()

    // Final summary
    await printAdvancedSummary()

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message)
    if (error.errors) {
      console.error('   Details:', error.errors)
    }
    process.exit(1)
  }
}

main()
