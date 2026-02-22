#!/usr/bin/env node
import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const client = new LinearClient({ apiKey: LINEAR_API_KEY })

interface WorkspaceIssues {
  id: string
  identifier: string
  title: string
  state: { name: string; type: string }
  priority: number | null
  team: { name: string; key: string }
  labels: Array<{ name: string }>
  assignee: { name: string } | null
  parent: { identifier: string } | null
  project: { name: string } | null
  estimate: number | null
  cycle: { name: string } | null
  createdAt: Date
  updatedAt: Date
}

async function auditWorkspace() {
  console.log('🔍 Linear Workspace Audit\n')

  try {
    // Fetch all issues
    const issues = await client.issues({
      first: 250,
      includeArchived: false
    })

    const allIssues: WorkspaceIssues[] = []

    for await (const issue of issues.nodes) {
      const state = await issue.state
      const team = await issue.team
      const labels = await issue.labels()
      const assignee = await issue.assignee
      const parent = await issue.parent
      const project = await issue.project
      const cycle = await issue.cycle

      allIssues.push({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        state: state ? { name: state.name, type: state.type } : { name: 'Unknown', type: 'unknown' },
        priority: issue.priority ?? null,
        team: team ? { name: team.name, key: team.key } : { name: 'Unknown', key: 'UNK' },
        labels: labels.nodes.map(l => ({ name: l.name })),
        assignee: assignee ? { name: assignee.name } : null,
        parent: parent ? { identifier: parent.identifier } : null,
        project: project ? { name: project.name } : null,
        estimate: issue.estimate ?? null,
        cycle: cycle ? { name: cycle.name } : null,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt
      })
    }

    console.log(`📊 Total Issues: ${allIssues.length}\n`)

    // Problem Detection
    const problems: Record<string, any[]> = {
      noPriority: [],
      noLabels: [],
      noAssignee: [],
      noProject: [],
      noEstimate: [],
      stalledInProgress: [],
      orphanedIssues: [],
      noCycle: [],
      multipleProblems: []
    }

    const now = new Date()
    const staleDays = 14

    allIssues.forEach(issue => {
      const issueProblems = []

      if (issue.priority === null || issue.priority === 0) {
        problems.noPriority.push(issue)
        issueProblems.push('no-priority')
      }

      if (issue.labels.length === 0) {
        problems.noLabels.push(issue)
        issueProblems.push('no-labels')
      }

      if (!issue.assignee && issue.state.type !== 'backlog') {
        problems.noAssignee.push(issue)
        issueProblems.push('no-assignee')
      }

      if (!issue.project) {
        problems.noProject.push(issue)
        issueProblems.push('no-project')
      }

      if (!issue.estimate && issue.state.type !== 'backlog') {
        problems.noEstimate.push(issue)
        issueProblems.push('no-estimate')
      }

      if (!issue.cycle && issue.state.type === 'started') {
        problems.noCycle.push(issue)
        issueProblems.push('no-cycle')
      }

      // Stalled in progress
      if (issue.state.type === 'started') {
        const daysSinceUpdate = Math.floor((now.getTime() - new Date(issue.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceUpdate > staleDays) {
          problems.stalledInProgress.push({ ...issue, daysSinceUpdate })
          issueProblems.push('stalled')
        }
      }

      // Orphaned (has parent but parent doesn't exist)
      if (issue.parent && !allIssues.find(i => i.identifier === issue.parent?.identifier)) {
        problems.orphanedIssues.push(issue)
        issueProblems.push('orphaned')
      }

      if (issueProblems.length >= 3) {
        problems.multipleProblems.push({ ...issue, problems: issueProblems })
      }
    })

    // Report
    console.log('🚨 CRITICAL ISSUES\n')

    console.log(`❌ No Priority Set: ${problems.noPriority.length}`)
    if (problems.noPriority.length > 0) {
      problems.noPriority.slice(0, 5).forEach(i => {
        console.log(`   ${i.identifier}: ${i.title} [${i.team.key}]`)
      })
      if (problems.noPriority.length > 5) {
        console.log(`   ... and ${problems.noPriority.length - 5} more`)
      }
    }
    console.log()

    console.log(`🏷️  No Labels: ${problems.noLabels.length}`)
    if (problems.noLabels.length > 0) {
      problems.noLabels.slice(0, 5).forEach(i => {
        console.log(`   ${i.identifier}: ${i.title} [${i.team.key}]`)
      })
      if (problems.noLabels.length > 5) {
        console.log(`   ... and ${problems.noLabels.length - 5} more`)
      }
    }
    console.log()

    console.log(`👤 No Assignee (non-backlog): ${problems.noAssignee.length}`)
    if (problems.noAssignee.length > 0) {
      problems.noAssignee.slice(0, 5).forEach(i => {
        console.log(`   ${i.identifier}: ${i.title} [${i.state.name}]`)
      })
      if (problems.noAssignee.length > 5) {
        console.log(`   ... and ${problems.noAssignee.length - 5} more`)
      }
    }
    console.log()

    console.log(`📂 No Project: ${problems.noProject.length}`)
    if (problems.noProject.length > 0) {
      problems.noProject.slice(0, 5).forEach(i => {
        console.log(`   ${i.identifier}: ${i.title} [${i.team.key}]`)
      })
      if (problems.noProject.length > 5) {
        console.log(`   ... and ${problems.noProject.length - 5} more`)
      }
    }
    console.log()

    console.log(`⏱️  No Estimate (active): ${problems.noEstimate.length}`)
    if (problems.noEstimate.length > 0) {
      problems.noEstimate.slice(0, 5).forEach(i => {
        console.log(`   ${i.identifier}: ${i.title} [${i.state.name}]`)
      })
      if (problems.noEstimate.length > 5) {
        console.log(`   ... and ${problems.noEstimate.length - 5} more`)
      }
    }
    console.log()

    console.log(`🔄 No Cycle (in progress): ${problems.noCycle.length}`)
    if (problems.noCycle.length > 0) {
      problems.noCycle.slice(0, 5).forEach(i => {
        console.log(`   ${i.identifier}: ${i.title} [${i.team.key}]`)
      })
      if (problems.noCycle.length > 5) {
        console.log(`   ... and ${problems.noCycle.length - 5} more`)
      }
    }
    console.log()

    console.log(`⏸️  Stalled (>14 days): ${problems.stalledInProgress.length}`)
    if (problems.stalledInProgress.length > 0) {
      problems.stalledInProgress.slice(0, 5).forEach((i: any) => {
        console.log(`   ${i.identifier}: ${i.title} (${i.daysSinceUpdate} days)`)
      })
      if (problems.stalledInProgress.length > 5) {
        console.log(`   ... and ${problems.stalledInProgress.length - 5} more`)
      }
    }
    console.log()

    console.log(`🔗 Orphaned (bad parent): ${problems.orphanedIssues.length}`)
    if (problems.orphanedIssues.length > 0) {
      problems.orphanedIssues.forEach(i => {
        console.log(`   ${i.identifier}: ${i.title} (parent: ${i.parent?.identifier})`)
      })
    }
    console.log()

    console.log(`⚠️  Multiple Problems (≥3): ${problems.multipleProblems.length}`)
    if (problems.multipleProblems.length > 0) {
      problems.multipleProblems.slice(0, 5).forEach((i: any) => {
        console.log(`   ${i.identifier}: ${i.title}`)
        console.log(`      Problems: ${i.problems.join(', ')}`)
      })
      if (problems.multipleProblems.length > 5) {
        console.log(`   ... and ${problems.multipleProblems.length - 5} more`)
      }
    }
    console.log()

    // Team Distribution
    const teamGroups = allIssues.reduce((acc, issue) => {
      const teamKey = issue.team.key
      if (!acc[teamKey]) {
        acc[teamKey] = { name: issue.team.name, count: 0 }
      }
      acc[teamKey].count++
      return acc
    }, {} as Record<string, { name: string; count: number }>)

    console.log('📊 TEAM DISTRIBUTION\n')
    Object.entries(teamGroups)
      .sort(([, a], [, b]) => b.count - a.count)
      .forEach(([key, data]) => {
        console.log(`   ${key}: ${data.name} (${data.count} issues)`)
      })
    console.log()

    // State Distribution
    const stateGroups = allIssues.reduce((acc, issue) => {
      const stateName = issue.state.name
      if (!acc[stateName]) {
        acc[stateName] = 0
      }
      acc[stateName]++
      return acc
    }, {} as Record<string, number>)

    console.log('📈 STATE DISTRIBUTION\n')
    Object.entries(stateGroups)
      .sort(([, a], [, b]) => b - a)
      .forEach(([state, count]) => {
        console.log(`   ${state}: ${count}`)
      })
    console.log()

    // Health Score
    const totalIssues = allIssues.length
    const totalProblems = Object.values(problems).flat().length
    const uniqueIssuesWithProblems = new Set(
      Object.values(problems).flat().map((i: any) => i.id)
    ).size

    const healthScore = Math.max(0, 100 - Math.round((uniqueIssuesWithProblems / totalIssues) * 100))

    console.log('🏥 WORKSPACE HEALTH SCORE\n')
    console.log(`   Score: ${healthScore}/100`)
    console.log(`   Issues with problems: ${uniqueIssuesWithProblems}/${totalIssues}`)
    console.log(`   Total problem instances: ${totalProblems}`)
    console.log()

    // Recommendations
    console.log('💡 RECOMMENDATIONS\n')

    if (problems.noPriority.length > 20) {
      console.log('   1. 🔴 URGENT: Triage and set priorities for backlog items')
    }

    if (problems.noProject.length > 10) {
      console.log('   2. 📂 Create projects to group related work')
    }

    if (problems.stalledInProgress.length > 5) {
      console.log('   3. ⏸️  Review stalled issues - move to backlog or unblock')
    }

    if (problems.noLabels.length > 30) {
      console.log('   4. 🏷️  Add labels for better categorization')
    }

    if (problems.noCycle.length > 5) {
      console.log('   5. 🔄 Assign active issues to current cycle')
    }

    if (Object.keys(teamGroups).length > 10) {
      console.log('   6. 🏢 Consider consolidating teams - too many silos')
    }

    console.log()
    console.log('✅ Audit complete')

  } catch (error) {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  }
}

auditWorkspace()
