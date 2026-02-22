#!/usr/bin/env tsx
/**
 * TASKS.md → GitHub Issues
 *
 * Creates GitHub issues from TASKS.md, then use Linear's GitHub import
 *
 * Alternative approach since Linear API import is failing
 */

import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'

const TASKS_FILE = path.join(process.cwd(), 'TASKS.md')

async function main() {
  console.log('📤 Creating GitHub issues from TASKS.md\n')
  console.log('⚠️  This will create issues in your GitHub repo')
  console.log('   Then you can import them to Linear via: Linear → Import → GitHub Issues\n')

  const content = await fs.readFile(TASKS_FILE, 'utf-8')
  const lines = content.split('\n')

  let created = 0

  for (const line of lines) {
    const match = line.match(/^\| ([A-Z]+-\d+) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|/)
    if (!match) continue

    const [, id, title, effort, priority, status, deps, source] = match

    // Skip completed
    if (id.startsWith('~~')) continue

    // Skip first 5 to avoid spam (test with small batch first)
    if (created >= 5) {
      console.log(`\n⏸️  Paused after 5 issues (test batch)`)
      console.log(`   If successful, remove the limit and run again for all ${lines.filter(l => l.match(/^\| [A-Z]+-\d+/)).length} tasks`)
      break
    }

    const body = `**Priority:** ${priority}
**Effort:** ${effort}
**Status:** ${status}
**Source:** ${source}
**Dependencies:** ${deps}

---
_Imported from TASKS.md task ${id}_`

    // Use gh CLI to create issue
    try {
      const cmd = `gh issue create --title "${id}: ${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --label "imported"`
      execSync(cmd, { stdio: 'inherit' })
      created++
    } catch (err) {
      console.log(`❌ Failed to create ${id}`)
    }
  }

  console.log(`\n✅ Created ${created} GitHub issues`)
  console.log(`\n📋 Next: Import to Linear`)
  console.log(`   Linear → Settings → Import & Export → Import → GitHub Issues`)
}

main()
