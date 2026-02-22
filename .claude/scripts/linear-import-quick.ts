#!/usr/bin/env tsx
/**
 * Quick TASKS.md Import - Import ALL tasks to Platform team
 * Then manually organize by team in Linear UI
 *
 * This avoids team mapping errors - just gets your tasks into Linear ASAP
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

async function main() {
  console.log('📥 Quick Import: ALL tasks → Platform team\n')

  // Get Platform team
  const teams = await linear.teams()
  const platformTeam = teams.nodes.find(t => t.key === 'PLAT' || t.name === 'Platform')

  if (!platformTeam) {
    console.error('❌ Platform team not found')
    process.exit(1)
  }

  console.log(`✅ Using team: ${platformTeam.name} (${platformTeam.key})\n`)

  // Parse TASKS.md
  const content = await fs.readFile(TASKS_FILE, 'utf-8')
  const lines = content.split('\n')

  let imported = 0
  let skipped = 0

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

    // Parse effort → story points
    const effortMatch = effort.match(/(\d+)/)
    const hours = effortMatch ? parseInt(effortMatch[1]) : 2
    const estimate = hours <= 1 ? 1 : hours <= 2 ? 2 : hours <= 3 ? 3 : hours <= 4 ? 5 : 8

    // Parse priority
    const priorityNum = priority.includes('🔴') ? 1 : priority.includes('🟠') ? 2 : priority.includes('🟡') ? 3 : 4

    try {
      await linear.createIssue({
        teamId: platformTeam.id,
        title: `${id}: ${title.trim()}`,
        description: [
          `**Priority:** ${priority}`,
          `**Effort:** ${effort}`,
          `**Status:** ${status}`,
          `**Source:** ${source}`,
          deps.trim() ? `**Dependencies:** ${deps}` : '',
          '',
          '---',
          `_Imported from TASKS.md - Reassign to correct team in Linear UI_`
        ].filter(Boolean).join('\n'),
        priority: priorityNum,
        estimate,
      })

      imported++
      if (imported % 25 === 0) {
        console.log(`  ✅ Imported ${imported} tasks...`)
      }
    } catch (err: any) {
      console.log(`  ❌ ${id}: ${err.message}`)
    }
  }

  console.log(`\n📊 Import Complete:`)
  console.log(`   ✅ Imported: ${imported} tasks`)
  console.log(`   ⏭️  Skipped: ${skipped} (completed tasks)`)
  console.log(`\n🎯 All tasks imported to Platform team`)
  console.log(`📋 Next: Bulk-reassign to correct teams in Linear UI`)
  console.log(`   Select multiple issues → Team → Change team`)
  console.log(`\n🔗 Linear: https://linear.app/akount`)
}

main().catch(err => {
  console.error('❌ Import failed:', err.message)
  process.exit(1)
})
