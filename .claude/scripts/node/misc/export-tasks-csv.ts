#!/usr/bin/env tsx
/**
 * Export TASKS.md to CSV for Linear import
 *
 * Linear can import CSV files directly via UI
 * This bypasses all API complexity
 */

import fs from 'fs/promises'
import path from 'path'

const TASKS_FILE = path.join(process.cwd(), 'TASKS.md')
const CSV_FILE = path.join(process.cwd(), 'tasks-for-linear.csv')

async function main() {
  console.log('📤 Exporting TASKS.md to CSV for Linear import\n')

  const content = await fs.readFile(TASKS_FILE, 'utf-8')
  const lines = content.split('\n')

  // CSV header (Linear import format)
  const csv: string[] = ['Title,Description,Priority,Estimate,Labels,Team']

  let exported = 0

  for (const line of lines) {
    // Match: | ID | Task | Effort | Priority | Status | Deps | Source |
    const match = line.match(/^\| ([A-Z]+-\d+) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|/)
    if (!match) continue

    const [, id, title, effort, priority, status, deps, source] = match

    // Skip completed
    if (id.startsWith('~~')) continue

    // Map to Linear format
    const linearPriority = priority.includes('🔴') ? 'Urgent' :
                           priority.includes('🟠') ? 'High' :
                           priority.includes('🟡') ? 'Normal' : 'Low'

    const effortMatch = effort.match(/(\d+)/)
    const estimate = effortMatch ? effortMatch[1] : '2'

    const description = `**Status:** ${status}\n**Source:** ${source}\n**Dependencies:** ${deps}\n**Effort:** ${effort}`

    // Determine team from task ID prefix
    const prefix = id.split('-')[0]
    const team = prefix === 'SEC' || prefix === 'PERF' || prefix === 'ARCH' || prefix === 'INFRA' || prefix === 'TEST' || prefix === 'DOC' ? 'Platform' :
                 prefix === 'OPS' ? 'Business Ops' :
                 'Platform' // Default

    // Escape commas and quotes for CSV
    const csvTitle = `"${id}: ${title.replace(/"/g, '""')}"`
    const csvDesc = `"${description.replace(/"/g, '""')}"`

    csv.push(`${csvTitle},${csvDesc},${linearPriority},${estimate},,${team}`)
    exported++
  }

  await fs.writeFile(CSV_FILE, csv.join('\n'))

  console.log(`✅ Exported ${exported} tasks to CSV`)
  console.log(`📄 File: ${CSV_FILE}`)
  console.log(`
📋 Next Steps:

1. Open Linear: https://linear.app/akount
2. Click your workspace name (top left) → Settings
3. Go to: Import & Export → Import
4. Click "Upload CSV"
5. Select file: tasks-for-linear.csv
6. Map columns:
   - Title → Title
   - Description → Description
   - Priority → Priority
   - Estimate → Estimate
   - Team → Team
7. Click "Import"
8. Done! All ${exported} tasks will be in Linear

This is MUCH more reliable than the API import.
`)
}

main().catch(err => {
  console.error('❌ Export failed:', err.message)
  process.exit(1)
})
