#!/usr/bin/env node
import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const client = new LinearClient({ apiKey: LINEAR_API_KEY })

async function analyzeStates() {
  console.log('🔍 Linear Workflow State Analysis\n')

  try {
    const states = await client.workflowStates({ first: 250 })
    console.log(`📊 Total workflow states: ${states.nodes.length}\n`)

    // Group by team
    const byTeam: Record<string, Array<{
      id: string
      name: string
      type: string
      position: number
      color: string
    }>> = {}

    for (const state of states.nodes) {
      const team = await state.team
      const teamKey = team?.key || 'NO_TEAM'

      if (!byTeam[teamKey]) {
        byTeam[teamKey] = []
      }

      byTeam[teamKey].push({
        id: state.id,
        name: state.name,
        type: state.type,
        position: state.position,
        color: state.color
      })
    }

    console.log('📋 STATES BY TEAM:\n')

    for (const [teamKey, teamStates] of Object.entries(byTeam).sort()) {
      console.log(`   ${teamKey} (${teamStates.length} states):`)

      // Group by type
      const byType: Record<string, typeof teamStates> = {}
      teamStates.forEach(s => {
        if (!byType[s.type]) byType[s.type] = []
        byType[s.type].push(s)
      })

      for (const [type, typeStates] of Object.entries(byType).sort()) {
        console.log(`      ${type}:`)
        typeStates.sort((a, b) => a.position - b.position).forEach(s => {
          console.log(`         - ${s.name} (pos: ${s.position}, color: ${s.color})`)
        })
      }
      console.log()
    }

    // Look for exact duplicates (same team, same name, same type)
    console.log('🔍 CHECKING FOR EXACT DUPLICATES:\n')

    const duplicateCheck: Record<string, typeof byTeam[string]> = {}
    let duplicateCount = 0

    for (const [teamKey, teamStates] of Object.entries(byTeam)) {
      for (const state of teamStates) {
        const key = `${teamKey}::${state.name}::${state.type}`

        if (!duplicateCheck[key]) {
          duplicateCheck[key] = []
        }

        duplicateCheck[key].push(state)
      }
    }

    for (const [key, states] of Object.entries(duplicateCheck)) {
      if (states.length > 1) {
        const [teamKey, name, type] = key.split('::')
        console.log(`   ${teamKey}: "${name}" (${type}) × ${states.length}`)
        states.forEach((s, i) => {
          console.log(`      ${i + 1}. ${s.id} - pos: ${s.position}`)
        })
        console.log()
        duplicateCount++
      }
    }

    if (duplicateCount === 0) {
      console.log('   ✅ No exact duplicates found\n')
    } else {
      console.log(`   Found ${duplicateCount} duplicate groups\n`)
    }

    // Check for issues in each state
    console.log('📊 ISSUE COUNT BY STATE:\n')

    for (const [teamKey, teamStates] of Object.entries(byTeam).slice(0, 3)) {
      console.log(`   ${teamKey}:`)

      for (const state of teamStates.slice(0, 5)) {
        const issues = await client.issues({
          first: 1,
          filter: { state: { id: { eq: state.id } } }
        })

        const count = issues.pageInfo.hasNextPage ? '1+' : issues.nodes.length.toString()
        console.log(`      ${state.name}: ${count} issues`)
      }

      if (teamStates.length > 5) {
        console.log(`      ... and ${teamStates.length - 5} more states`)
      }
      console.log()
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

analyzeStates()
