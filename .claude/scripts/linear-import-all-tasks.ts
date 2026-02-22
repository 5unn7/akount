#!/usr/bin/env tsx
/**
 * Complete TASKS.md Import - Import ALL tasks from all sections
 * Handles rate limiting, provides detailed progress
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
}

// Sleep helper for rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  console.log('📥 Complete TASKS.md Import\n')

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

  console.log('🔄 Processing tasks...\n')

  for (const line of lines) {
    // Match: | ID | Task | Effort | Priority | Status | Deps | Source |
    const match = line.match(/^\| ([A-Z]+-\d+) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|/)
    if (!match) continue

    const [, id, title, effort, priority, status, deps, source] = match

    // Skip completed (strikethrough)
    if (id.startsWith('~~')) {
      skipped++
      continue
    }

    // Skip header rows
    if (id === 'ID' || title === 'Task') {
      continue
    }

    // Determine team from task prefix
    const prefix = id.split('-')[0]
    const teamName = TEAM_MAP[prefix] || 'Platform'
    const team = teamMap.get(teamName)

    if (!team) {
      console.log(`  ⚠️  Team not found for ${id}, using Platform`)
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
    const states = await team.states()
    if (status.includes('🟢')) {
      // Ready - use "Todo" or "Backlog"
      stateId = states.nodes.find(s => s.name === 'Todo' || s.name === 'Backlog')?.id
    } else if (status.includes('🟡')) {
      // Deferred/Blocked - use "Blocked" or fallback to "Backlog"
      stateId = states.nodes.find(s => s.name === 'Blocked' || s.name === 'Backlog')?.id
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

      if (imported % 10 === 0) {
        console.log(`  ✅ Imported ${imported} tasks...`)
      }

      // Rate limiting: 50 requests per second max, be conservative
      await sleep(100) // 10 requests per second
    } catch (err: any) {
      errors++
      console.log(`  ❌ ${id}: ${err.message}`)

      // If rate limited, wait longer
      if (err.message.includes('rate') || err.message.includes('429')) {
        console.log(`  ⏳ Rate limited, waiting 5 seconds...`)
        await sleep(5000)
      }
    }
  }

  console.log(`\n📊 Import Complete:`)
  console.log(`   ✅ Imported: ${imported} tasks`)
  console.log(`   ⏭️  Skipped: ${skipped} (completed)`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`\n📈 Tasks by Team:`)
  Object.entries(tasksByTeam).sort((a, b) => b[1] - a[1]).forEach(([team, count]) => {
    console.log(`   ${team}: ${count}`)
  })
  console.log(`\n🔗 Linear: https://linear.app/akount`)
}

main().catch(err => {
  console.error('❌ Import failed:', err.message)
  process.exit(1)
})
