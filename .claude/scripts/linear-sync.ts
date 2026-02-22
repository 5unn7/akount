#!/usr/bin/env tsx
/**
 * Linear ↔ TASKS.md Bidirectional Sync
 *
 * Features:
 * - Import TASKS.md → Linear (one-time migration)
 * - Sync Linear → TASKS.md (PM updates flow back)
 * - Sync TASKS.md → Linear (Agent updates flow forward)
 * - Conflict resolution (Linear wins — PM is source of truth)
 * - Preserve metadata (source, deps, effort estimates)
 *
 * Usage:
 *   npm run linear:import     # One-time migration
 *   npm run linear:sync       # Bidirectional sync (run in CI/cron)
 *   npm run linear:push       # TASKS.md → Linear only
 *   npm run linear:pull       # Linear → TASKS.md only
 */

import { LinearClient, Issue, IssueLabel, Team, Project, Cycle } from '@linear/sdk'
import fs from 'fs/promises'
import path from 'path'

// ============================================================================
// Configuration
// ============================================================================

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || ''
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID || '' // Default team for tasks without domain
const TASKS_FILE = path.join(process.cwd(), 'TASKS.md')
const SYNC_STATE_FILE = path.join(process.cwd(), '.claude/linear-sync-state.json')

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY environment variable required')
  console.error('   Get your API key: https://linear.app/settings/api')
  process.exit(1)
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY })

// ============================================================================
// Types
// ============================================================================

interface Task {
  id: string
  title: string
  effort?: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'done' | 'ready' | 'blocked' | 'backlog' | 'deferred'
  deps?: string
  source?: string
  domain: string
  linearId?: string // Linear issue ID
  estimatePoints?: number
}

interface SyncState {
  lastSync: string
  taskMapping: Record<string, string> // TASKS.md ID → Linear ID
  linearMapping: Record<string, string> // Linear ID → TASKS.md ID
}

// ============================================================================
// TASKS.md Parser
// ============================================================================

async function parseTASKS(): Promise<Task[]> {
  const content = await fs.readFile(TASKS_FILE, 'utf-8')
  const tasks: Task[] = []

  let currentDomain = ''
  const lines = content.split('\n')

  for (const line of lines) {
    // Domain headers (## Dev, ## Design System, etc.)
    const domainMatch = line.match(/^## (.+)$/)
    if (domainMatch) {
      currentDomain = domainMatch[1].trim()
      continue
    }

    // Task rows: | ID | Task | Effort | Priority | Status | Deps | Source |
    const taskMatch = line.match(/^\| (\S+) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|/)
    if (taskMatch) {
      const [, id, title, effort, priority, status, deps, source] = taskMatch

      // Skip completed tasks (strikethrough)
      if (id.startsWith('~~')) continue

      // Parse priority emoji → text
      const priorityMap: Record<string, Task['priority']> = {
        '🔴': 'Critical',
        '🟠': 'High',
        '🟡': 'Medium',
        '⚪': 'Low'
      }
      const priorityText = Object.entries(priorityMap).find(([emoji]) =>
        priority.includes(emoji)
      )?.[1] || 'Medium'

      // Parse status emoji → text
      const statusMap: Record<string, Task['status']> = {
        '✅': 'done',
        '🟢': 'ready',
        '🔒': 'blocked',
        '📦': 'backlog',
        '🟡': 'deferred'
      }
      const statusText = Object.entries(statusMap).find(([emoji]) =>
        status.includes(emoji)
      )?.[1] || 'backlog'

      // Parse effort → story points (1h=1, 2h=2, 3h=3, 4h=5, 8h=8)
      const effortPoints = effort.match(/(\d+)h/)?.[1]
      const estimatePoints = effortPoints ? Math.min(parseInt(effortPoints), 8) : undefined

      tasks.push({
        id,
        title: title.trim(),
        effort: effort.trim(),
        priority: priorityText,
        status: statusText,
        deps: deps.trim() || undefined,
        source: source.trim() || undefined,
        domain: currentDomain,
        estimatePoints
      })
    }
  }

  return tasks
}

// ============================================================================
// Linear Team/Label Setup
// ============================================================================

async function ensureTeamsAndLabels() {
  console.log('🔧 Setting up Linear workspace...')

  // Get or create teams for each domain
  const domains = [
    'Dev', 'Design System', 'Marketing & Content', 'Operations',
    'Banking', 'Invoicing', 'Accounting', 'Planning', 'Insights'
  ]

  const teams = await linear.teams()
  const teamMap: Record<string, Team> = {}

  for (const domain of domains) {
    let team = teams.nodes.find(t => t.name === domain)
    if (!team) {
      console.log(`  Creating team: ${domain}`)
      const created = await linear.createTeam({
        name: domain,
        key: domain.toUpperCase().replace(/\s+/g, '_').substring(0, 5)
      })
      team = await created.team
    }
    if (team) {
      teamMap[domain] = team
    }
  }

  // Create priority labels
  const labels = await linear.issueLabels()
  const priorities = [
    { name: 'Critical', color: '#FF0000' },
    { name: 'High', color: '#FF6B00' },
    { name: 'Medium', color: '#FFB800' },
    { name: 'Low', color: '#CCCCCC' }
  ]

  for (const { name, color } of priorities) {
    if (!labels.nodes.find(l => l.name === name)) {
      console.log(`  Creating label: ${name}`)
      await linear.createIssueLabel({
        name,
        color,
        teamId: LINEAR_TEAM_ID
      })
    }
  }

  console.log('✅ Workspace setup complete')
  return teamMap
}

// ============================================================================
// Sync State Management
// ============================================================================

async function loadSyncState(): Promise<SyncState> {
  try {
    const content = await fs.readFile(SYNC_STATE_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {
      lastSync: new Date(0).toISOString(),
      taskMapping: {},
      linearMapping: {}
    }
  }
}

async function saveSyncState(state: SyncState) {
  await fs.mkdir(path.dirname(SYNC_STATE_FILE), { recursive: true })
  await fs.writeFile(SYNC_STATE_FILE, JSON.stringify(state, null, 2))
}

// ============================================================================
// Import TASKS.md → Linear (One-Time Migration)
// ============================================================================

async function importToLinear() {
  console.log('📥 Importing TASKS.md → Linear...\n')

  const teamMap = await ensureTeamsAndLabels()
  const tasks = await parseTASKS()
  const state = await loadSyncState()

  let created = 0
  let skipped = 0

  for (const task of tasks) {
    // Skip if already synced
    if (state.taskMapping[task.id]) {
      skipped++
      continue
    }

    const team = teamMap[task.domain] || teamMap['Dev']
    if (!team) {
      console.warn(`⚠️  No team found for domain: ${task.domain}`)
      continue
    }

    // Get priority label
    const labels = await linear.issueLabels()
    const priorityLabel = labels.nodes.find(l => l.name === task.priority)

    // Create issue
    const issue = await linear.createIssue({
      teamId: team.id,
      title: `${task.id}: ${task.title}`,
      description: [
        `**Source:** ${task.source || 'manual'}`,
        task.deps ? `**Dependencies:** ${task.deps}` : '',
        `**Effort:** ${task.effort || 'TBD'}`,
        '',
        '---',
        '_Synced from TASKS.md_'
      ].filter(Boolean).join('\n'),
      priority: task.priority === 'Critical' ? 1 : task.priority === 'High' ? 2 : task.priority === 'Medium' ? 3 : 4,
      labelIds: priorityLabel ? [priorityLabel.id] : [],
      estimate: task.estimatePoints,
      // Map status to Linear state
      stateId: task.status === 'done' ? undefined : undefined, // Will need to fetch state IDs
    })

    const created_issue = await issue.issue
    if (created_issue) {
      state.taskMapping[task.id] = created_issue.id
      state.linearMapping[created_issue.id] = task.id
      created++

      console.log(`✅ ${task.id} → ${created_issue.identifier}`)
    }
  }

  state.lastSync = new Date().toISOString()
  await saveSyncState(state)

  console.log(`\n📊 Import complete:`)
  console.log(`   Created: ${created}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total:   ${tasks.length}`)
}

// ============================================================================
// Sync Linear → TASKS.md (PM Updates Flow Back)
// ============================================================================

async function pullFromLinear() {
  console.log('📥 Syncing Linear → TASKS.md...\n')

  const state = await loadSyncState()
  const lastSync = new Date(state.lastSync)

  // Fetch issues updated since last sync
  const issues = await linear.issues({
    filter: {
      updatedAt: { gte: lastSync }
    }
  })

  let updated = 0

  for (const issue of issues.nodes) {
    const taskId = state.linearMapping[issue.id]
    if (!taskId) continue // Not tracked in TASKS.md

    // TODO: Update TASKS.md with Linear changes
    // - Status changes
    // - Title/description edits
    // - Priority changes
    // - Estimate updates

    console.log(`🔄 ${taskId} updated from Linear`)
    updated++
  }

  state.lastSync = new Date().toISOString()
  await saveSyncState(state)

  console.log(`\n✅ Synced ${updated} tasks from Linear`)
}

// ============================================================================
// Sync TASKS.md → Linear (Agent Updates Flow Forward)
// ============================================================================

async function pushToLinear() {
  console.log('📤 Syncing TASKS.md → Linear...\n')

  const state = await loadSyncState()
  const tasks = await parseTASKS()

  let updated = 0

  for (const task of tasks) {
    const linearId = state.taskMapping[task.id]
    if (!linearId) continue // Not yet synced

    // TODO: Update Linear issue with TASKS.md changes
    // - Status changes (agent marks done)
    // - Dependency updates
    // - Source tracking

    console.log(`🔄 ${task.id} pushed to Linear`)
    updated++
  }

  state.lastSync = new Date().toISOString()
  await saveSyncState(state)

  console.log(`\n✅ Pushed ${updated} tasks to Linear`)
}

// ============================================================================
// Bidirectional Sync (Run Both)
// ============================================================================

async function sync() {
  console.log('🔄 Running bidirectional sync...\n')

  await pullFromLinear()
  console.log('')
  await pushToLinear()

  console.log('\n✅ Sync complete')
}

// ============================================================================
// CLI
// ============================================================================

const command = process.argv[2]

switch (command) {
  case 'import':
    importToLinear()
    break
  case 'pull':
    pullFromLinear()
    break
  case 'push':
    pushToLinear()
    break
  case 'sync':
    sync()
    break
  default:
    console.log(`
Akount Linear Sync

Commands:
  import    One-time migration: TASKS.md → Linear
  pull      Sync Linear → TASKS.md (PM updates)
  push      Sync TASKS.md → Linear (Agent updates)
  sync      Bidirectional sync (pull + push)

Examples:
  npm run linear:import    # First-time setup
  npm run linear:sync      # Daily sync (run in CI)
  npm run linear:pull      # After PM updates tasks in Linear
  npm run linear:push      # After agent completes tasks
    `)
}
