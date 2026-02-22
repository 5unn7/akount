#!/usr/bin/env node
import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const client = new LinearClient({ apiKey: LINEAR_API_KEY })

async function inspectWorkspace() {
  console.log('🔍 Linear Workspace Inspector\n')

  try {
    // Get viewer (current user)
    const viewer = await client.viewer
    console.log(`👤 Viewer: ${viewer.name} (${viewer.email})`)
    console.log(`   Organization: ${(await viewer.organization).name}\n`)

    // Get teams
    const teams = await client.teams({ first: 50 })
    console.log(`🏢 Teams: ${teams.nodes.length}`)
    for (const team of teams.nodes) {
      console.log(`   - ${team.key}: ${team.name}`)
    }
    console.log()

    // Get issues with various filters
    console.log('📊 Issue Count Tests:\n')

    const allIssues = await client.issues({ first: 1 })
    console.log(`   Total issues (first batch): ${allIssues.pageInfo.hasNextPage ? '250+' : allIssues.nodes.length}`)

    const backlogIssues = await client.issues({
      first: 1,
      filter: { state: { type: { eq: 'backlog' } } }
    })
    console.log(`   Backlog issues: ${backlogIssues.nodes.length}${backlogIssues.pageInfo.hasNextPage ? '+' : ''}`)

    const startedIssues = await client.issues({
      first: 1,
      filter: { state: { type: { eq: 'started' } } }
    })
    console.log(`   In Progress: ${startedIssues.nodes.length}${startedIssues.pageInfo.hasNextPage ? '+' : ''}`)

    const completedIssues = await client.issues({
      first: 1,
      filter: { state: { type: { eq: 'completed' } } }
    })
    console.log(`   Completed: ${completedIssues.nodes.length}${completedIssues.pageInfo.hasNextPage ? '+' : ''}`)

    console.log()

    // Get projects
    const projects = await client.projects({ first: 50 })
    console.log(`📂 Projects: ${projects.nodes.length}`)
    for (const project of projects.nodes) {
      console.log(`   - ${project.name}`)
    }
    console.log()

    // Get labels
    const labels = await client.issueLabels({ first: 50 })
    console.log(`🏷️  Labels: ${labels.nodes.length}`)
    for (const label of labels.nodes) {
      console.log(`   - ${label.name}`)
    }
    console.log()

    // Get cycles
    const cycles = await client.cycles({ first: 10 })
    console.log(`🔄 Active Cycles: ${cycles.nodes.length}`)
    for (const cycle of cycles.nodes) {
      console.log(`   - ${cycle.name} (${cycle.startsAt.toISOString().split('T')[0]} - ${cycle.endsAt.toISOString().split('T')[0]})`)
    }
    console.log()

    // Get workflow states
    const states = await client.workflowStates({ first: 50 })
    console.log(`📈 Workflow States: ${states.nodes.length}`)
    const statesByTeam = states.nodes.reduce((acc, state) => {
      const teamKey = state.team?.key || 'NO_TEAM'
      if (!acc[teamKey]) acc[teamKey] = []
      acc[teamKey].push(`${state.name} (${state.type})`)
      return acc
    }, {} as Record<string, string[]>)

    for (const [teamKey, teamStates] of Object.entries(statesByTeam)) {
      console.log(`   ${teamKey}:`)
      teamStates.forEach(s => console.log(`      - ${s}`))
    }

  } catch (error) {
    console.error('❌ Inspection failed:', error)
    process.exit(1)
  }
}

inspectWorkspace()
