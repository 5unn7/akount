#!/usr/bin/env tsx
/**
 * Simple TASKS.md → Linear Import
 * Uses existing teams/labels from workspace setup
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

// Map TASKS.md task IDs to Linear teams
const TASK_PREFIX_TO_TEAM: Record<string, string> = {
  'SEC': 'Platform',
  'PERF': 'Platform',
  'FIN': 'Platform',
  'DRY': 'Platform',
  'TEST': 'Platform',
  'DEV': 'Platform',
  'ARCH': 'Platform',
  'INFRA': 'Platform',
  'DOC': 'Platform',

  'UX': 'Overview', // UX tasks are cross-cutting, assign to Overview for now

  // Will be manually reassigned based on task description
}

async function main() {
  console.log('📥 Importing TASKS.md to Linear...\n')

  // Get existing teams
  const teams = await linear.teams()
  const teamMap: Record<string, any> = {}
  teams.nodes.forEach(t => {
    teamMap[t.name] = t
  })

  console.log('Teams:', Object.keys(teamMap).join(', '))

  // Parse TASKS.md (simple version - just get task IDs and titles)
  const content = await fs.readFile(TASKS_FILE, 'utf-8')
  const lines = content.split('\n')

  let imported = 0
  let skipped = 0

  for (const line of lines) {
    // Match task rows: | ID | Task | ...
    const match = line.match(/^\| ([A-Z]+-\d+) \| (.+?) \|/)
    if (!match) continue

    const [, taskId, title] = match

    // Skip completed tasks (strikethrough)
    if (taskId.startsWith('~~')) {
      skipped++
      continue
    }

    // Determine team based on prefix
    const prefix = taskId.split('-')[0]
    const teamName = TASK_PREFIX_TO_TEAM[prefix] || 'Platform'
    const team = teamMap[teamName]

    if (!team) {
      console.log(`⚠️  No team for ${taskId} (prefix: ${prefix})`)
      continue
    }

    try {
      const issue = await linear.createIssue({
        teamId: team.id,
        title: `${taskId}: ${title.trim()}`,
        description: `Imported from TASKS.md\n\nTask ID: ${taskId}`,
      })

      imported++
      if (imported % 10 === 0) {
        console.log(`  ✅ Imported ${imported} tasks...`)
      }
    } catch (err: any) {
      console.log(`  ❌ Failed to import ${taskId}: ${err.message}`)
    }
  }

  console.log(`\n📊 Import complete:`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Skipped: ${skipped}`)
}

main().catch(err => {
  console.error('❌ Import failed:', err.message)
  process.exit(1)
})
