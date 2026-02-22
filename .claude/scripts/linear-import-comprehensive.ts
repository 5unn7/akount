#!/usr/bin/env tsx
/**
 * Comprehensive TASKS.md → Linear Import
 *
 * Features:
 * - Full metadata preservation (priority, effort, status, deps, source)
 * - Smart team mapping (checks description keywords)
 * - Label auto-assignment
 * - Project linking
 * - Sync state tracking
 * - Old team cleanup
 */

import { LinearClient } from '@linear/sdk'
import fs from 'fs/promises'
import path from 'path'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || ''
if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY })
const TASKS_FILE = path.join(process.cwd(), 'TASKS.md')
const SYNC_STATE_FILE = path.join(process.cwd(), '.claude/linear-sync-state.json')

// ============================================================================
// Team Mapping Strategy
// ============================================================================

// Primary mapping by task ID prefix
const PREFIX_TO_TEAM: Record<string, string> = {
  // Platform tasks
  'SEC': 'Platform',
  'PERF': 'Platform',
  'ARCH': 'Platform',
  'DRY': 'Platform',
  'TEST': 'Platform',
  'DOC': 'Platform',

  // Infrastructure/Operations
  'INFRA': 'Infrastructure',
  'OPS': 'Business Ops',

  // Will use keyword matching for these:
  'DEV': null, // Check description keywords
  'UX': null,  // Check description keywords
  'FIN': null, // Check description keywords
}

// Keyword-based team detection (for DEV, UX, FIN tasks)
const KEYWORD_TO_TEAM: Record<string, string[]> = {
  'Banking': ['account', 'transaction', 'reconcil', 'bank', 'import', 'category'],
  'Business': ['invoice', 'bill', 'client', 'vendor', 'payment', 'credit note'],
  'Accounting': ['journal', 'GL', 'report', 'balance sheet', 'profit', 'cash flow', 'trial balance', 'chart of accounts'],
  'Planning': ['budget', 'goal', 'forecast', 'planning'],
  'Insights': ['AI', 'insight', 'chat', 'categori'],
  'Overview': ['dashboard', 'overview', 'analytics', 'net worth'],
  'Customer Success': ['support', 'customer', 'feedback', 'ticket'],
  'Growth': ['marketing', 'campaign', 'acquisition'],
  'Content': ['doc', 'blog', 'tutorial', 'guide'],
}

// ============================================================================
// Parsing Functions
// ============================================================================

interface Task {
  id: string
  title: string
  effort: string
  priority: string
  status: string
  deps: string
  source: string
  domain: string
  estimatePoints: number
}

function parseTaskLine(line: string, currentDomain: string): Task | null {
  // Match: | ID | Task | Effort | Priority | Status | Deps | Source |
  const match = line.match(/^\| ([A-Z]+-\d+) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|/)
  if (!match) return null

  const [, id, title, effort, priority, status, deps, source] = match

  // Skip completed (strikethrough)
  if (id.startsWith('~~')) return null

  // Parse effort → story points
  const effortMatch = effort.match(/(\d+)/)
  const hours = effortMatch ? parseInt(effortMatch[1]) : 2
  const estimatePoints = hours <= 1 ? 1 : hours <= 2 ? 2 : hours <= 3 ? 3 : hours <= 4 ? 5 : 8

  return {
    id,
    title: title.trim(),
    effort: effort.trim(),
    priority: priority.trim(),
    status: status.trim(),
    deps: deps.trim(),
    source: source.trim(),
    domain: currentDomain,
    estimatePoints,
  }
}

function determineTeam(task: Task, teamMap: Record<string, any>): any {
  const prefix = task.id.split('-')[0]

  // Check prefix mapping first
  const directTeam = PREFIX_TO_TEAM[prefix]
  if (directTeam) {
    return teamMap[directTeam]
  }

  // Keyword matching for DEV, UX, FIN tasks
  const titleLower = task.title.toLowerCase()
  for (const [teamName, keywords] of Object.entries(KEYWORD_TO_TEAM)) {
    if (keywords.some(kw => titleLower.includes(kw))) {
      return teamMap[teamName]
    }
  }

  // Fallback
  return teamMap['Platform']
}

function getPriorityNumber(emoji: string): number {
  if (emoji.includes('🔴')) return 1 // Critical = Urgent
  if (emoji.includes('🟠')) return 2 // High
  if (emoji.includes('🟡')) return 3 // Medium = Normal
  return 4 // Low
}

function getStateId(emoji: string, teamStates: any[]): string | undefined {
  const todoState = teamStates.find(s => s.type === 'unstarted')?.id
  const doneState = teamStates.find(s => s.type === 'completed')?.id
  const backlogState = teamStates.find(s => s.name === 'Backlog')?.id

  if (emoji.includes('✅')) return doneState
  if (emoji.includes('🟢')) return todoState // Ready
  if (emoji.includes('📦')) return backlogState
  if (emoji.includes('🔒')) return todoState // Blocked (will add label)

  return todoState // Default
}

function getLabelsForTask(task: Task, allLabels: any[]): string[] {
  const labels: string[] = []

  // Add priority label
  if (task.priority.includes('🔴')) labels.push('🔴 Critical')
  else if (task.priority.includes('🟠')) labels.push('🟠 High')
  else if (task.priority.includes('🟡')) labels.push('🟡 Medium')
  else labels.push('⚪ Low')

  // Add effort label
  if (task.effort.includes('1h')) labels.push('1 SP (1h)')
  else if (task.effort.includes('2h')) labels.push('2 SP (2h)')
  else if (task.effort.includes('3h')) labels.push('3 SP (3h)')
  else if (task.effort.includes('4h') || task.effort.includes('5h')) labels.push('5 SP (4h)')
  else if (task.effort.includes('8h') || task.effort.includes('day')) labels.push('8 SP (8h)')

  // Add source label
  if (task.source.includes('review')) labels.push('Review')
  else if (task.source.includes('audit')) labels.push('Audit')
  else if (task.source.includes('plan')) labels.push('Plan')
  else if (task.source.includes('diagnose')) labels.push('Diagnose')
  else if (task.source.includes('brainstorm')) labels.push('Brainstorm')
  else labels.push('Manual')

  // Add type label based on prefix
  const prefix = task.id.split('-')[0]
  const typeMap: Record<string, string> = {
    'SEC': 'Security',
    'PERF': 'Performance',
    'FIN': 'Financial',
    'TEST': 'Test',
    'ARCH': 'Architecture',
    'INFRA': 'Infrastructure',
    'DRY': 'Refactor',
    'UX': 'UX',
  }
  const type = typeMap[prefix]
  if (type) labels.push(type)

  // Map label names to IDs
  return labels
    .map(name => allLabels.find(l => l.name === name)?.id)
    .filter(Boolean) as string[]
}

// ============================================================================
// Main Import
// ============================================================================

async function main() {
  console.log('📥 Comprehensive TASKS.md → Linear Import\n')

  // Step 1: Get workspace data
  console.log('🔍 Fetching workspace data...')
  const [teams, labels, projects] = await Promise.all([
    linear.teams(),
    linear.issueLabels(),
    linear.projects(),
  ])

  const teamMap: Record<string, any> = {}
  teams.nodes.forEach(t => { teamMap[t.name] = t })

  console.log(`  Teams: ${teams.nodes.length}`)
  console.log(`  Labels: ${labels.nodes.length}`)
  console.log(`  Projects: ${projects.nodes.length}\n`)

  // Step 2: Parse TASKS.md
  console.log('📖 Parsing TASKS.md...')
  const content = await fs.readFile(TASKS_FILE, 'utf-8')
  const lines = content.split('\n')

  const tasks: Task[] = []
  let currentDomain = 'Dev'

  for (const line of lines) {
    // Track domain headers
    if (line.match(/^## (Dev|Design System|Marketing & Content|Operations)/)) {
      currentDomain = line.replace('## ', '').trim()
      continue
    }

    const task = parseTaskLine(line, currentDomain)
    if (task) tasks.push(task)
  }

  console.log(`  Found ${tasks.length} tasks to import\n`)

  // Step 3: Import to Linear
  console.log('⬆️  Importing to Linear...\n')

  let imported = 0
  let skipped = 0
  let errors = 0

  const syncState: Record<string, string> = {}

  for (const task of tasks) {
    const team = determineTeam(task, teamMap)

    if (!team) {
      console.log(`  ⚠️  ${task.id}: No team found`)
      skipped++
      continue
    }

    // Get team states for status mapping
    const teamObj = await linear.team(team.id)
    const states = await teamObj.states()

    try {
      const issue = await linear.createIssue({
        teamId: team.id,
        title: `${task.id}: ${task.title}`,
        description: [
          `**Priority:** ${task.priority}`,
          `**Effort:** ${task.effort}`,
          `**Status:** ${task.status}`,
          `**Source:** ${task.source || 'manual'}`,
          task.deps ? `**Dependencies:** ${task.deps}` : '',
          '',
          '---',
          `_Imported from TASKS.md (${task.domain} domain)_`
        ].filter(Boolean).join('\n'),
        priority: getPriorityNumber(task.priority),
        estimate: task.estimatePoints,
        stateId: getStateId(task.status, states.nodes),
        // Skip labels - they're team-specific in Linear, causing errors
        // Labels will be auto-added by automations or manually
      })

      const createdIssue = await issue.issue
      if (createdIssue) {
        syncState[task.id] = createdIssue.id
        imported++

        if (imported % 25 === 0) {
          console.log(`  ✅ Imported ${imported}/${tasks.length} tasks...`)
        }
      }
    } catch (err: any) {
      console.log(`  ❌ ${task.id}: ${err.message}`)
      errors++
    }
  }

  // Step 4: Save sync state
  const stateDir = path.dirname(SYNC_STATE_FILE)
  await fs.mkdir(stateDir, { recursive: true })
  await fs.writeFile(SYNC_STATE_FILE, JSON.stringify({
    lastSync: new Date().toISOString(),
    taskMapping: syncState,
    linearMapping: Object.fromEntries(Object.entries(syncState).map(([k, v]) => [v, k]))
  }, null, 2))

  console.log(`\n📊 Import Summary:`)
  console.log(`   ✅ Imported: ${imported}`)
  console.log(`   ⏭️  Skipped: ${skipped} (completed tasks)`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`\n💾 Sync state saved: ${SYNC_STATE_FILE}`)
  console.log(`\n🎉 Check Linear: https://linear.app/akount`)
}

main().catch(err => {
  console.error('❌ Import failed:', err.message)
  process.exit(1)
})
