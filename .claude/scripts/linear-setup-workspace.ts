#!/usr/bin/env tsx
/**
 * Linear Workspace Setup — Complete Optimization
 *
 * Creates the perfect Linear workspace for Akount PM:
 * - 9 Teams (domains)
 * - Projects (epics/initiatives)
 * - Labels (priorities, categories, sources)
 * - Custom views (sprint board, domain health, roadmap)
 * - Cycles (2-week sprints)
 * - Templates (issue creation)
 * - Workflows (custom statuses)
 *
 * Run once after creating Linear account.
 * Then run linear:import to populate with tasks.
 */

import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || ''

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY environment variable required')
  console.error('   Add to .env: LINEAR_API_KEY=lin_api_...')
  process.exit(1)
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY })

// ============================================================================
// Configuration
// ============================================================================

// Parent teams
const PARENT_TEAMS = [
  { name: 'Product', key: 'PROD', description: 'User-facing product features and domains' },
  { name: 'Operations', key: 'OPS', description: 'Platform, infrastructure, and business operations' },
]

// Child teams with parent reference
const TEAMS = [
  // Product domains (match your frontend routes)
  { name: 'Overview', key: 'OVER', description: 'Dashboard, analytics, reporting', parent: 'PROD' },
  { name: 'Banking', key: 'BANK', description: 'Accounts, transactions, reconciliation', parent: 'PROD' },
  { name: 'Business', key: 'BIZ', description: 'Invoices, clients, vendors, payments (AR/AP)', parent: 'PROD' },
  { name: 'Accounting', key: 'ACCT', description: 'GL, journal entries, reports', parent: 'PROD' },
  { name: 'Planning', key: 'PLAN', description: 'Budgets, goals, forecasts', parent: 'PROD' },
  { name: 'Insights', key: 'AI', description: 'AI insights, chat, categorization', parent: 'PROD' },

  // Operations teams
  { name: 'Platform', key: 'PLAT', description: 'Security, Performance, Infrastructure, Dev tasks', parent: 'OPS' },
  { name: 'Customer Success', key: 'CS', description: 'Support tickets, bug reports, feature requests from users', parent: 'OPS' },
  { name: 'Infrastructure', key: 'INFRA', description: 'DevOps, deployments, monitoring, scaling to 100k users', parent: 'OPS' },
  { name: 'Growth', key: 'GROW', description: 'Marketing campaigns, partnerships, user acquisition', parent: 'OPS' },
  { name: 'Content', key: 'CONT', description: 'Docs, blog, help center, tutorials, onboarding materials', parent: 'OPS' },
  { name: 'Business Ops', key: 'BOPS', description: 'Legal, compliance, finance, HR, admin', parent: 'OPS' },
]

const LABELS = {
  // Priority (auto-assigned based on emoji in import)
  priorities: [
    { name: '🔴 Critical', color: '#E11D48', description: 'Blocks users or launch' },
    { name: '🟠 High', color: '#F59E0B', description: 'Should do this sprint' },
    { name: '🟡 Medium', color: '#FBBF24', description: 'Plan for next sprint' },
    { name: '⚪ Low', color: '#94A3B8', description: 'Nice to have' },
  ],

  // Task type (for filtering)
  types: [
    { name: 'Security', color: '#DC2626', description: 'Security audit, vulnerability' },
    { name: 'Performance', color: '#F59E0B', description: 'Optimization, indexing' },
    { name: 'Financial', color: '#10B981', description: 'Money calculations, double-entry' },
    { name: 'UX', color: '#3B82F6', description: 'User experience, UI polish' },
    { name: 'Test', color: '#8B5CF6', description: 'Test coverage, E2E tests' },
    { name: 'Refactor', color: '#6B7280', description: 'Code cleanup, DRY' },
    { name: 'Infrastructure', color: '#475569', description: 'DevOps, CI/CD, deployment' },
    { name: 'Architecture', color: '#9333EA', description: 'System design, patterns' },
  ],

  // Source (where task came from)
  sources: [
    { name: 'Review', color: '#EC4899', description: 'Code review finding' },
    { name: 'Audit', color: '#EF4444', description: 'Health audit finding' },
    { name: 'Plan', color: '#3B82F6', description: 'Implementation plan step' },
    { name: 'Brainstorm', color: '#8B5CF6', description: 'Brainstorm action item' },
    { name: 'Diagnose', color: '#F59E0B', description: 'Bug investigation' },
    { name: 'Manual', color: '#6B7280', description: 'Ad-hoc task' },
  ],

  // Phase (milestone grouping)
  phases: [
    { name: 'Phase 6', color: '#10B981', description: 'Current: Launch MVP' },
    { name: 'Phase 7', color: '#3B82F6', description: 'Future: Scale & Optimize' },
  ],

  // Effort (story points)
  effort: [
    { name: '1 SP (1h)', color: '#D1FAE5', description: '~1 hour' },
    { name: '2 SP (2h)', color: '#A7F3D0', description: '~2 hours' },
    { name: '3 SP (3h)', color: '#6EE7B7', description: '~3 hours' },
    { name: '5 SP (4h)', color: '#34D399', description: '~4 hours' },
    { name: '8 SP (8h)', color: '#10B981', description: '~8 hours (full day)' },
  ],

  // Customer impact (for 100k user scale)
  customerImpact: [
    { name: 'affects-100+', color: '#FFA500', description: 'Issue affects >100 users' },
    { name: 'affects-1000+', color: '#FF6B00', description: 'Issue affects >1000 users' },
    { name: 'churn-risk', color: '#DC2626', description: 'Customer threatening to leave' },
  ],

  // Urgency (for incident management)
  urgency: [
    { name: 'production-down', color: '#7F1D1D', description: 'P0 - Production outage' },
    { name: 'sev-1', color: '#991B1B', description: 'P1 - Critical, <4h response' },
    { name: 'sev-2', color: '#B91C1C', description: 'P2 - High, <24h response' },
  ],

  // Workflow coordination
  workflow: [
    { name: 'needs-product', color: '#3B82F6', description: 'CS issue needs product decision' },
    { name: 'needs-eng', color: '#8B5CF6', description: 'Non-product issue needs engineering' },
    { name: 'needs-content', color: '#10B981', description: 'Feature shipped, needs documentation' },
  ],
}

const PROJECTS = [
  // Current active epics
  { name: 'Phase 6: Launch MVP', description: 'Production hardening, security, performance', targetDate: '2026-03-15' },
  { name: 'Banking Command Center', description: 'Complete banking domain (accounts, transactions, reconciliation)', targetDate: '2026-02-28' },
  { name: 'Business Operations', description: 'Invoicing, clients, vendors, payments', targetDate: '2026-03-07' },
  { name: 'Accounting Foundation', description: 'GL, journal entries, reports', targetDate: '2026-03-14' },

  // Future initiatives
  { name: 'Phase 7: Scale & Optimize', description: 'Multi-currency, AI enhancements, integrations', targetDate: '2026-04-30' },
  { name: 'Planning & Forecasting', description: 'Budgets, goals, cash flow projection', targetDate: '2026-03-21' },
  { name: 'AI Insights', description: 'Chat, categorization, anomaly detection', targetDate: '2026-03-28' },
]

const WORKFLOW_STATES = {
  backlog: { name: 'Backlog', description: 'Not yet prioritized', type: 'backlog', color: '#94A3B8' },
  ready: { name: 'Ready', description: 'Prioritized, ready to start', type: 'unstarted', color: '#10B981' },
  inProgress: { name: 'In Progress', description: 'Actively working', type: 'started', color: '#3B82F6' },
  blocked: { name: 'Blocked', description: 'Waiting on dependency', type: 'started', color: '#EF4444' },
  review: { name: 'Review', description: 'In code review', type: 'started', color: '#8B5CF6' },
  done: { name: 'Done', description: 'Completed', type: 'completed', color: '#10B981' },
  deferred: { name: 'Deferred', description: 'Not doing now', type: 'canceled', color: '#6B7280' },
}

// ============================================================================
// Setup Functions
// ============================================================================

async function createTeams() {
  console.log('\n📋 Creating Teams with Hierarchy...')

  const existingTeams = await linear.teams()
  const teamMap: Record<string, any> = {}

  // Step 1: Create parent teams first
  console.log('\n  Parent teams:')
  for (const config of PARENT_TEAMS) {
    // Check by both key AND name to handle existing teams
    let team = existingTeams.nodes.find(t => t.key === config.key || t.name === config.name)

    if (!team) {
      try {
        console.log(`    ✅ Creating: ${config.name} (${config.key})`)
        const created = await linear.createTeam({
          name: config.name,
          key: config.key,
          description: config.description,
        })
        team = await created.team
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          console.log(`    ⏭️  Exists: ${config.name} (name collision, will fetch)`)
          // Re-fetch teams to get the newly discovered team
          const refreshedTeams = await linear.teams()
          team = refreshedTeams.nodes.find(t => t.name === config.name || t.key === config.key)
        } else {
          throw err
        }
      }
    } else {
      console.log(`    ⏭️  Exists: ${config.name}`)
    }

    if (team) {
      teamMap[config.key] = team
    }
  }

  // Step 2: Create child teams with parent reference
  console.log('\n  Child teams:')
  for (const config of TEAMS) {
    // Check by both key AND name
    let team = existingTeams.nodes.find(t => t.key === config.key || t.name === config.name)

    if (!team) {
      const parentTeam = teamMap[config.parent]
      if (!parentTeam) {
        console.log(`    ⚠️  Skipping ${config.name} - parent ${config.parent} not found`)
        continue
      }

      try {
        console.log(`    ✅ Creating: ${config.name} (${config.key}) under ${config.parent}`)
        const created = await linear.createTeam({
          name: config.name,
          key: config.key,
          description: config.description,
          parentId: parentTeam.id,
        })
        team = await created.team
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          console.log(`    ⏭️  Exists: ${config.name} (will update parent)`)
          const refreshedTeams = await linear.teams()
          team = refreshedTeams.nodes.find(t => t.name === config.name || t.key === config.key)

          // Update existing team to have correct parent
          if (team && parentTeam) {
            try {
              await linear.updateTeam(team.id, { parentId: parentTeam.id })
              console.log(`    🔄 Updated parent for ${config.name}`)
            } catch (updateErr) {
              // Ignore parent update errors
            }
          }
        } else {
          throw err
        }
      }
    } else {
      console.log(`    ⏭️  Exists: ${config.name}`)

      // Ensure parent is set for existing teams
      const parentTeam = teamMap[config.parent]
      if (team && parentTeam && team.id) {
        try {
          await linear.updateTeam(team.id, { parentId: parentTeam.id })
          console.log(`    🔄 Updated parent for ${config.name}`)
        } catch (updateErr) {
          // Ignore if parent already set
        }
      }
    }

    if (team) {
      teamMap[config.key] = team
    }
  }

  console.log(`\n✅ ${Object.keys(teamMap).length} teams configured (2 parents + 12 children)`)
  return teamMap
}

async function createLabels(defaultTeamId: string) {
  console.log('\n🏷️  Creating Labels...')

  const existingLabels = await linear.issueLabels()
  let created = 0

  for (const [category, labels] of Object.entries(LABELS)) {
    console.log(`\n  ${category}:`)

    for (const config of labels as any[]) {
      const exists = existingLabels.nodes.find(l => l.name === config.name)

      if (!exists) {
        await linear.createIssueLabel({
          name: config.name,
          color: config.color,
          description: config.description,
          teamId: defaultTeamId,
        })
        console.log(`    ✅ ${config.name}`)
        created++
      } else {
        console.log(`    ⏭️  ${config.name}`)
      }
    }
  }

  console.log(`\n✅ ${created} labels created`)
}

async function createProjects(defaultTeamId: string) {
  console.log('\n📁 Creating Projects...')

  const existingProjects = await linear.projects()
  let created = 0

  for (const config of PROJECTS) {
    const exists = existingProjects.nodes.find(p => p.name === config.name)

    if (!exists) {
      try {
        await linear.createProject({
          name: config.name,
          description: config.description,
          teamIds: [defaultTeamId],
          targetDate: config.targetDate,
        })
        console.log(`  ✅ ${config.name}`)
        created++
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          console.log(`  ⏭️  ${config.name} (already exists)`)
        } else {
          console.log(`  ⚠️  ${config.name}: ${err.message}`)
        }
      }
    } else {
      console.log(`  ⏭️  ${config.name}`)
    }
  }

  console.log(`\n✅ ${created} projects created`)
}

async function createCycles(teamId: string) {
  console.log('\n🔄 Creating Cycles (2-week sprints)...')

  // Create next 4 cycles (8 weeks)
  const startDate = new Date()
  const cycles = []

  for (let i = 0; i < 4; i++) {
    const cycleStart = new Date(startDate)
    cycleStart.setDate(startDate.getDate() + (i * 14))

    const cycleEnd = new Date(cycleStart)
    cycleEnd.setDate(cycleStart.getDate() + 13)

    const cycleName = `Sprint ${i + 1} (${cycleStart.toISOString().split('T')[0]})`

    try {
      await linear.createCycle({
        teamId,
        name: cycleName,
        startsAt: cycleStart,
        endsAt: cycleEnd,
      })
      console.log(`  ✅ ${cycleName}`)
      cycles.push(cycleName)
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.log(`  ⏭️  ${cycleName} (already exists)`)
      } else {
        console.log(`  ⚠️  ${cycleName} — ${err.message}`)
      }
    }
  }

  console.log(`\n✅ ${cycles.length} cycles created`)
}

async function configureTeamSettings(teamMap: Record<string, any>) {
  console.log('\n⚙️  Configuring Team Settings (cycles, triage, estimation)...')

  for (const config of TEAMS) {
    const team = teamMap[config.key]
    if (!team) continue

    try {
      console.log(`  Configuring: ${config.name}`)

      await linear.updateTeam(team.id, {
        // Enable cycles (2-week sprints)
        cyclesEnabled: true,
        cycleDuration: 2, // weeks
        cycleStartDay: 1, // Monday (0=Sunday, 1=Monday)
        cycleCooldownTime: 0, // no cooldown
        cycleLockToActive: false, // allow moving issues between cycles

        // Enable triage
        triageEnabled: true,
        defaultIssueEstimate: 1, // Default to 1 story point (Linear only allows 0 or 1)

        // Estimation settings - Fibonacci scale (1, 2, 3, 5, 8)
        issueEstimationType: 'fibonacci',
        issueEstimationAllowZero: true,
        issueEstimationExtended: false, // don't allow decimals
      })

      console.log(`    ✅ ${config.name} configured`)
    } catch (err: any) {
      console.log(`    ⚠️  ${config.name}: ${err.message}`)
    }
  }

  console.log('\n✅ Team settings configured')
}

async function setupWorkflowStates(teamId: string) {
  console.log('\n⚙️  Configuring Workflow States...')

  const team = await linear.team(teamId)
  const states = await team.states()

  // Linear has default states, we'll just verify they exist
  const stateNames = states.nodes.map(s => s.name)
  const requiredStates = Object.values(WORKFLOW_STATES).map(s => s.name)

  const missing = requiredStates.filter(name => !stateNames.includes(name))

  if (missing.length > 0) {
    console.log(`  ⚠️  Missing states: ${missing.join(', ')}`)
    console.log(`  ℹ️  Add these manually in Linear: Settings → Teams → ${team.name} → Workflow`)
  } else {
    console.log(`  ✅ All required states exist`)
  }

  console.log(`\n  Current states: ${stateNames.join(', ')}`)
}

async function createCustomViews() {
  console.log('\n👁️  Custom Views...')
  console.log(`
  ℹ️  Create these views manually in Linear (Views → New View):

  1. **Sprint Board**
     - Filter: Current cycle, Status != Done
     - Group by: Priority
     - Sort by: Story Points (ascending)
     - Display: Board view

  2. **Domain Health**
     - Filter: All active issues
     - Group by: Team
     - Display: Table view
     - Columns: Count, Story Points (sum), Blocked count

  3. **Roadmap Timeline**
     - View type: Roadmap
     - Group by: Project
     - Show: All cycles (next 8 weeks)

  4. **Blocked Tasks**
     - Filter: Status = Blocked
     - Group by: Team
     - Sort by: Priority (Critical first)

  5. **High Priority Inbox**
     - Filter: Priority = Critical OR High, Status != Done
     - Sort by: Created (oldest first)
     - Display: List view

  6. **This Week**
     - Filter: Current cycle, Assignee = Me
     - Sort by: Priority
     - Display: List view
`)
}

async function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('✅ WORKSPACE SETUP COMPLETE')
  console.log('='.repeat(60))

  const teams = await linear.teams()
  const labels = await linear.issueLabels()
  const projects = await linear.projects()

  console.log(`
📊 Summary:
   Teams:    ${teams.nodes.length}
   Labels:   ${labels.nodes.length}
   Projects: ${projects.nodes.length}

🚀 Next Steps:

   1. Import tasks:
      npm run linear:import

   2. Create custom views (manual):
      Linear → Views → New View (see suggestions above)

   3. Configure GitHub integration:
      Linear → Settings → Integrations → GitHub
      - Connect repository
      - Enable auto-link commits
      - Enable auto-close on merge

   4. Start using Linear:
      https://linear.app/akount

   5. Set up daily sync (CI):
      Add LINEAR_API_KEY secret to GitHub Actions
      Push to main will auto-sync
`)
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('\n🚀 Setting up Linear Workspace for Akount...\n')

  try {
    // Step 1: Create teams with hierarchy
    const teamMap = await createTeams()
    const platformTeam = teamMap['PLAT']

    if (!platformTeam) {
      throw new Error('Failed to create Platform team')
    }

    // Step 2: Configure team settings (cycles, triage, estimation)
    await configureTeamSettings(teamMap)

    // Step 3: Create labels
    await createLabels(platformTeam.id)

    // Step 4: Create projects
    await createProjects(platformTeam.id)

    // Step 5: Create cycles for PARENT teams (Product and Operations)
    const productTeam = teamMap['PROD']
    const opsTeam = teamMap['OPS']

    if (productTeam) {
      console.log('\n📅 Creating cycles for Product team...')
      await createCycles(productTeam.id)
    }

    if (opsTeam) {
      console.log('\n📅 Creating cycles for Operations team...')
      await createCycles(opsTeam.id)
    }

    // Step 6: Verify workflow states
    await setupWorkflowStates(platformTeam.id)

    // Step 7: Custom views (manual instructions)
    await createCustomViews()

    // Final summary
    await printSummary()

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message)
    if (error.errors) {
      console.error('   Details:', error.errors)
    }
    process.exit(1)
  }
}

main()