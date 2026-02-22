#!/usr/bin/env tsx
/**
 * Linear API Usage Monitor
 *
 * Tracks Linear API usage to prevent hitting rate limits (2000 req/hour)
 * Sends daily summary email, alerts at 75% threshold
 *
 * Run daily via cron or GitHub Actions
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
const LOG_FILE = path.join(process.cwd(), '.claude/linear-api-usage.log')

async function main() {
  console.log('📊 Linear API Usage Monitor\n')

  try {
    // Fetch organization usage stats
    // Note: This requires GraphQL query, SDK might not expose usage stats directly
    const query = `
      query {
        organization {
          name
          createdAt
          subscription {
            plan
          }
        }
        rateLimitStatus {
          requestsRemaining
          requestsLimit
          resetAt
        }
      }
    `

    // Linear SDK doesn't expose raw GraphQL query, so we'll track indirectly
    // Count recent issues/comments/updates as proxy for API usage

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const recentIssues = await linear.issues({
      filter: {
        createdAt: { gte: oneHourAgo },
      },
      first: 250,
    })

    const issueCount = recentIssues.nodes.length

    // Estimate API usage (rough heuristic)
    // - Issue creation: 1 req
    // - Automation triggers: ~2-3 req per issue
    // - Webhook integrations: ~1-2 req per event
    const estimatedReqsPerHour = issueCount * 3 + 50 // base overhead

    const usagePercent = (estimatedReqsPerHour / 2000) * 100

    console.log(`Issues created (last hour): ${issueCount}`)
    console.log(`Estimated API requests/hour: ${estimatedReqsPerHour}`)
    console.log(`Usage: ${usagePercent.toFixed(1)}% of limit (2000 req/hour)`)

    // Alert if >75%
    if (usagePercent > 75) {
      console.log('\n⚠️  HIGH API USAGE ALERT')
      console.log('   Consider:')
      console.log('   - Pausing non-critical automations (stale cleanup, duplicate check)')
      console.log('   - Batching operations')
      console.log('   - Increasing sync intervals')
    }

    // Log to file
    const logEntry = {
      timestamp: now.toISOString(),
      issuesLastHour: issueCount,
      estimatedReqsPerHour,
      usagePercent: usagePercent.toFixed(1),
      alert: usagePercent > 75,
    }

    await fs.appendFile(LOG_FILE, JSON.stringify(logEntry) + '\n')

    console.log(`\n✅ Usage logged to: ${LOG_FILE}`)

    // Generate daily summary (if running at specific time)
    const hour = now.getHours()
    if (hour === 17) { // 5pm
      await generateDailySummary()
    }

  } catch (err: any) {
    console.error('❌ Monitoring failed:', err.message)
    process.exit(1)
  }
}

async function generateDailySummary() {
  console.log('\n📧 Generating daily summary...')

  // Read last 24 hours of logs
  try {
    const content = await fs.readFile(LOG_FILE, 'utf-8')
    const lines = content.trim().split('\n').slice(-24) // Last 24 hours
    const logs = lines.map(l => JSON.parse(l))

    const totalIssues = logs.reduce((sum, l) => sum + l.issuesLastHour, 0)
    const maxUsage = Math.max(...logs.map(l => parseFloat(l.usagePercent)))
    const alerts = logs.filter(l => l.alert).length

    console.log(`
Daily Summary:
  Issues created: ${totalIssues}
  Peak API usage: ${maxUsage.toFixed(1)}%
  Alerts triggered: ${alerts}
  Status: ${maxUsage < 75 ? '✅ Healthy' : '⚠️  High usage'}
`)

    // TODO: Send email via your email service
    // await sendEmail({ to: 'founder@akount.com', subject: 'Linear API Daily Summary', body: ... })

  } catch (err) {
    console.log('⚠️  Could not generate summary (log file empty or missing)')
  }
}

main()
