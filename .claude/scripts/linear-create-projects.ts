#!/usr/bin/env tsx
/**
 * Create Linear Projects
 *
 * Creates all 9 projects (without initiative linking - do that in UI)
 */

import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || ''
if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY })

const PROJECTS = [
  // Phase 6: Launch MVP
  { name: 'Security & Performance', description: 'SEC, PERF, INFRA tasks - production hardening', targetDate: '2026-03-15' },
  { name: 'Banking Domain Complete', description: 'Accounts, transactions, reconciliation, imports', targetDate: '2026-02-28' },
  { name: 'Business Domain Complete', description: 'Invoices, bills, clients, vendors, payments', targetDate: '2026-03-07' },
  { name: 'Accounting Domain Complete', description: 'GL, journal entries, reports, COA', targetDate: '2026-03-14' },
  { name: 'UX Polish & Testing', description: 'Loading states, confirmations, toasts, E2E tests', targetDate: '2026-03-20' },

  // Phase 7: Scale & Optimize
  { name: 'Planning & Forecasting', description: 'Budgets, goals, cash flow projection', targetDate: '2026-04-30' },
  { name: 'AI & Insights', description: 'Chat, categorization, anomaly detection', targetDate: '2026-05-15' },

  // Linear PM System
  { name: 'Linear Workspace Setup', description: 'Teams, labels, automations, integrations', targetDate: '2026-02-28' },
  { name: 'Customer Success Operations', description: 'Support workflows, triage, escalation', targetDate: '2026-03-15' },
]

async function main() {
  console.log('📁 Creating Linear Projects\n')

  // Get a default team to assign projects to
  const teams = await linear.teams()
  const platformTeam = teams.nodes.find(t => t.key === 'PLAT')

  if (!platformTeam) {
    console.error('❌ Platform team not found')
    process.exit(1)
  }

  console.log(`Using team: ${platformTeam.name}\n`)

  let created = 0

  for (const project of PROJECTS) {
    try {
      await linear.createProject({
        name: project.name,
        description: project.description,
        targetDate: project.targetDate,
        teamIds: [platformTeam.id],
      })
      console.log(`✅ ${project.name}`)
      created++
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.log(`⏭️  ${project.name} (already exists)`)
      } else {
        console.log(`❌ ${project.name}: ${err.message}`)
      }
    }
  }

  console.log(`\n✅ Created ${created}/${PROJECTS.length} projects`)

  console.log(`
📋 Next: Link to initiatives in Linear UI

1. Go to: Linear → Roadmap view
2. Drag projects under initiatives:

   Phase 6: Launch MVP
   ├── Security & Performance
   ├── Banking Domain Complete
   ├── Business Domain Complete
   ├── Accounting Domain Complete
   └── UX Polish & Testing

   Phase 7: Scale & Optimize
   ├── Planning & Forecasting
   └── AI & Insights

   Linear PM System
   ├── Linear Workspace Setup
   └── Customer Success Operations

3. Save (auto-saves on drag)
`)
}

main().catch(err => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
