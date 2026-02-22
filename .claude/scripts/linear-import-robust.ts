#!/usr/bin/env tsx
/**
 * Robust TASKS.md Import - Handles all edge cases
 * Properly parses table format with empty columns
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

// Team mapping based on task prefix
const TEAM_MAP: Record<string, string> = {
  'SEC': 'Platform',
  'PERF': 'Platform',
  'INFRA': 'Infrastructure',
  'ARCH': 'Platform',
  'DRY': 'Platform',
  'TEST': 'Platform',
  'DEV': 'Platform',
  'FIN': 'Accounting',
  'UX': 'Overview',
  'DS': 'Platform',
  'MKT': 'Growth',
  'CNT': 'Content',
  'OPS': 'Business Ops',
  'DOC': 'Platform',
}

// Sleep helper for rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function parseTaskLine(line: string): {
  id: string
  title: string
  effort: string
  priority: string
  status: string
  deps: string
  source: string
} | null {
  // Must start with | and have task ID format
  if (!line.startsWith('| ') || !line.match(/^\| [A-Z]+-\d+/)) {
    return null
  }

  // Split by | and keep empty parts (don't filter)
  const parts = line.split('|').map(s => s.trim())

  // Remove first empty part (before first |) and last empty part (after last |)
  const columns = parts.slice(1, -1)

  // Should have 7 columns: ID | Task | Effort | Priority | Status | Deps | Source
  if (columns.length < 6) {
    return null
  }

  const [id, title, effort, priority, status, deps = '', source = ''] = columns

  // Skip header rows
  if (id === 'ID' || title === 'Task' || id.startsWith('~~')) {
    return null
  }

  // Skip if not valid task ID
  if (!id.match(/^[A-Z]+-\d+$/)) {
    return null
  }

  return { id, title, effort, priority, status, deps, source }
}

async function main() {
  console.log('📥 Robust TASKS.md Import\n')

  // Get all teams
  const teams = await linear.teams()
  const teamMap = new Map(teams.nodes.map(t => [t.name, t]))

  console.log(`✅ Found ${teams.nodes.length} teams\n`)

  // Parse TASKS.md
  const content = await fs.readFile(TASKS_FILE, 'utf-8')
  const lines = content.split('\n')

  let imported = 0
  let skipped = 0
  let errors = 0
  const tasksByTeam: Record<string, number> = {}
  const failedTasks: string[] = []

  console.log('🔄 Processing tasks...\n')

  for (const line of lines) {
    const task = parseTaskLine(line)
    if (!task) continue

    const { id, title, effort, priority, status, deps, source } = task

    // Determine team from task prefix
    const prefix = id.split('-')[0]
    const teamName = TEAM_MAP[prefix] || 'Platform'
    const team = teamMap.get(teamName)

    if (!team) {
      console.log(`  ⚠️  Team not found for ${id}: ${teamName}`)
      failedTasks.push(`${id}: Team ${teamName} not found`)
      errors++
      continue
    }

    // Parse effort → story points
    const effortMatch = effort.match(/(\d+)/)
    const hours = effortMatch ? parseInt(effortMatch[1]) : 2
    const estimate = hours <= 1 ? 1 : hours <= 2 ? 2 : hours <= 3 ? 3 : hours <= 4 ? 5 : 8

    // Parse priority
    const priorityNum = priority.includes('🔴') ? 1 : priority.includes('🟠') ? 2 : priority.includes('🟡') ? 3 : 4

    // Parse status → state
    let stateId = undefined
    try {
      const states = await team.states()
      if (status.includes('🟢')) {
        // Ready - use "Todo" or "Backlog"
        stateId = states.nodes.find(s => s.name === 'Todo' || s.name === 'Backlog')?.id
      } else if (status.includes('🟡')) {
        // Deferred/Blocked - use "Blocked" or fallback to "Backlog"
        stateId = states.nodes.find(s => s.name === 'Blocked' || s.name === 'Backlog')?.id
      }
    } catch (err: any) {
      console.log(`  ⚠️  Could not get states for ${teamName}: ${err.message}`)
    }

    try {
      await linear.createIssue({
        teamId: team.id,
        title: `${id}: ${title.trim()}`,
        description: [
          `**Priority:** ${priority}`,
          `**Effort:** ${effort}`,
          `**Status:** ${status}`,
          `**Source:** ${source}`,
          deps.trim() ? `**Dependencies:** ${deps}` : '',
          '',
          '---',
          `_Imported from TASKS.md_`
        ].filter(Boolean).join('\n'),
        priority: priorityNum,
        estimate,
        stateId,
      })

      imported++
      tasksByTeam[teamName] = (tasksByTeam[teamName] || 0) + 1

      if (imported % 25 === 0) {
        console.log(`  ✅ Imported ${imported} tasks...`)
      }

      // Rate limiting: be conservative
      await sleep(150) // ~6-7 requests per second
    } catch (err: any) {
      errors++
      const errorMsg = err.message || String(err)
      console.log(`  ❌ ${id}: ${errorMsg.substring(0, 100)}`)
      failedTasks.push(`${id}: ${errorMsg}`)

      // If rate limited, wait longer
      if (errorMsg.includes('rate') || errorMsg.includes('429')) {
        console.log(`  ⏳ Rate limited, waiting 10 seconds...`)
        await sleep(10000)
      } else {
        // Small delay after error
        await sleep(500)
      }
    }
  }

  console.log(`\n📊 Import Complete:`)
  console.log(`   ✅ Imported: ${imported} tasks`)
  console.log(`   ⏭️  Skipped: ${skipped} (completed)`)
  console.log(`   ❌ Errors: ${errors}`)

  if (failedTasks.length > 0) {
    console.log(`\n⚠️  Failed Tasks:`)
    failedTasks.forEach(task => console.log(`   ${task}`))
  }

  console.log(`\n📈 Tasks by Team:`)
  Object.entries(tasksByTeam).sort((a, b) => b[1] - a[1]).forEach(([team, count]) => {
    console.log(`   ${team}: ${count}`)
  })
  console.log(`\n🔗 Linear: https://linear.app/akount`)
}

main().catch(err => {
  console.error('❌ Import failed:', err.message)
  console.error(err.stack)
  process.exit(1)
})
