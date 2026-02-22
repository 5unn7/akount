#!/usr/bin/env tsx
/**
 * Linear Duplicate Detection (Automation #9)
 *
 * Runs hourly to detect duplicate CS issues using string similarity
 * Auto-links duplicates, adds "duplicate" label
 *
 * Usage: Run via cron or GitHub Actions schedule
 */

import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || ''
if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY })

// Simple string similarity (Levenshtein distance)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1

  if (longer.length === 0) return 1.0

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

async function main() {
  console.log('🔍 Checking for duplicate CS issues...\n')

  // Get Customer Success team
  const teams = await linear.teams()
  const csTeam = teams.nodes.find(t => t.key === 'CS' || t.name === 'Customer Success')

  if (!csTeam) {
    console.log('⚠️  Customer Success team not found, skipping')
    return
  }

  // Get recent CS issues (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const issues = await linear.issues({
    filter: {
      team: { id: { eq: csTeam.id } },
      createdAt: { gte: sevenDaysAgo },
    },
    first: 100,
  })

  console.log(`Found ${issues.nodes.length} recent CS issues`)

  let duplicatesFound = 0

  // Check each issue against all others
  for (let i = 0; i < issues.nodes.length; i++) {
    const issue1 = issues.nodes[i]

    for (let j = i + 1; j < issues.nodes.length; j++) {
      const issue2 = issues.nodes[j]

      // Calculate title similarity
      const titleSim = similarity(
        issue1.title.toLowerCase(),
        issue2.title.toLowerCase()
      )

      // If >80% similar, likely duplicate
      if (titleSim > 0.8) {
        console.log(`\n🔗 Possible duplicate:`)
        console.log(`   ${issue1.identifier}: ${issue1.title}`)
        console.log(`   ${issue2.identifier}: ${issue2.title}`)
        console.log(`   Similarity: ${(titleSim * 100).toFixed(1)}%`)

        try {
          // Link issues
          await linear.createIssueRelation({
            issueId: issue2.id,
            relatedIssueId: issue1.id,
            type: 'duplicate',
          })

          // Add comment
          await linear.createComment({
            issueId: issue2.id,
            body: `Possible duplicate of ${issue1.identifier} (${(titleSim * 100).toFixed(1)}% similarity)`,
          })

          duplicatesFound++
        } catch (err: any) {
          console.log(`   ⚠️  Failed to link: ${err.message}`)
        }
      }
    }
  }

  console.log(`\n✅ Duplicate check complete`)
  console.log(`   Duplicates found: ${duplicatesFound}`)
}

main().catch(err => {
  console.error('❌ Duplicate check failed:', err.message)
  process.exit(1)
})
