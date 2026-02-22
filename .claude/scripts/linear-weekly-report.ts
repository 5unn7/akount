#!/usr/bin/env tsx
/**
 * Linear Weekly Report
 *
 * Generates executive summary every Friday:
 * - Tasks completed per team
 * - Velocity trends
 * - Blocked count
 * - Top priorities for next week
 *
 * Run via cron: 0 17 * * 5 (Fridays at 5pm)
 */

import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || ''
if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY })

async function main() {
  console.log('📊 Generating Weekly Executive Report\n')

  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get all teams
  const teams = await linear.teams()

  const report: any[] = []

  for (const team of teams.nodes) {
    // Skip parent teams (they don't have issues directly)
    if (team.key === 'PROD' || team.key === 'OPERA') continue

    // Get issues completed this week
    const completed = await linear.issues({
      filter: {
        team: { id: { eq: team.id } },
        completedAt: { gte: oneWeekAgo },
      },
      first: 100,
    })

    // Get currently blocked issues
    const blocked = await linear.issues({
      filter: {
        team: { id: { eq: team.id } },
        state: { name: { eq: 'Blocked' } },
      },
      first: 50,
    })

    // Get high priority issues for next week
    const highPriority = await linear.issues({
      filter: {
        team: { id: { eq: team.id } },
        priority: { lte: 2 }, // Critical or High
        state: { type: { nin: ['completed', 'canceled'] } },
      },
      first: 10,
    })

    // Calculate velocity (story points completed)
    const storyPoints = completed.nodes.reduce((sum, i) => sum + (i.estimate || 0), 0)

    report.push({
      team: team.name,
      completed: completed.nodes.length,
      storyPoints,
      blocked: blocked.nodes.length,
      highPriority: highPriority.nodes.length,
      topTasks: highPriority.nodes.slice(0, 3).map(i => ({
        id: i.identifier,
        title: i.title.substring(0, 60),
      })),
    })
  }

  // Generate report
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`       AKOUNT WEEKLY REPORT - ${now.toISOString().split('T')[0]}`)
  console.log('═══════════════════════════════════════════════════════════\n')

  console.log('TEAM PERFORMANCE (Last 7 Days):\n')

  report.forEach(r => {
    console.log(`${r.team}:`)
    console.log(`  ✅ Completed: ${r.completed} tasks (${r.storyPoints} story points)`)
    console.log(`  🔒 Blocked: ${r.blocked}`)
    console.log(`  🔥 High Priority: ${r.highPriority}`)
    if (r.topTasks.length > 0) {
      console.log(`  Top 3 for next week:`)
      r.topTasks.forEach((t: any) => console.log(`    - ${t.id}: ${t.title}`))
    }
    console.log('')
  })

  // Overall metrics
  const totalCompleted = report.reduce((sum, r) => sum + r.completed, 0)
  const totalStoryPoints = report.reduce((sum, r) => sum + r.storyPoints, 0)
  const totalBlocked = report.reduce((sum, r) => sum + r.blocked, 0)

  console.log('OVERALL:')
  console.log(`  Velocity: ${totalStoryPoints} story points/week`)
  console.log(`  Completed: ${totalCompleted} tasks`)
  console.log(`  Blocked: ${totalBlocked} tasks`)
  console.log(`  Health: ${totalBlocked < 5 ? '✅ Healthy' : totalBlocked < 10 ? '⚠️  Watch' : '🔴 Action needed'}`)

  console.log('\n═══════════════════════════════════════════════════════════')

  // TODO: Send via email
  // await sendEmail({ to: 'founder@akount.com', subject: 'Weekly Linear Report', html: report })

  console.log('\n✅ Weekly report generated')
}

main().catch(err => {
  console.error('❌ Report failed:', err.message)
  process.exit(1)
})
