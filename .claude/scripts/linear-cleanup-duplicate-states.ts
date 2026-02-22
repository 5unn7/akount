#!/usr/bin/env node
import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const client = new LinearClient({ apiKey: LINEAR_API_KEY })

async function cleanupDuplicateStates() {
  console.log('🧹 Linear Workflow State Cleanup\n')

  try {
    // Get all workflow states
    const states = await client.workflowStates({ first: 100 })
    console.log(`📊 Total workflow states: ${states.nodes.length}\n`)

    // Group by team and name
    const stateGroups: Record<string, Array<{
      id: string
      name: string
      type: string
      teamId: string | null
      teamKey: string | null
      position: number
    }>> = {}

    for (const state of states.nodes) {
      const team = await state.team
      const teamKey = team?.key || 'NO_TEAM'
      const key = `${teamKey}::${state.name}::${state.type}`

      if (!stateGroups[key]) {
        stateGroups[key] = []
      }

      stateGroups[key].push({
        id: state.id,
        name: state.name,
        type: state.type,
        teamId: team?.id || null,
        teamKey: teamKey,
        position: state.position
      })
    }

    // Find duplicates
    const duplicates = Object.entries(stateGroups).filter(([, states]) => states.length > 1)
    console.log(`🔍 Found ${duplicates.length} duplicate state groups\n`)

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!')
      return
    }

    // Report duplicates
    console.log('📋 DUPLICATE STATES:\n')
    for (const [key, states] of duplicates) {
      const [teamKey, name, type] = key.split('::')
      console.log(`   ${teamKey}: "${name}" (${type}) × ${states.length}`)
      states.forEach((s, i) => {
        console.log(`      ${i + 1}. ID: ${s.id}, Position: ${s.position}`)
      })
      console.log()
    }

    // Interactive cleanup
    console.log('⚠️  CLEANUP STRATEGY:\n')
    console.log('   For each duplicate group:')
    console.log('   1. Keep the state with the lowest position (likely created first)')
    console.log('   2. Delete all other duplicates')
    console.log('   3. Verify no issues are using deleted states\n')

    // Dry run - show what would be deleted
    console.log('🔍 DRY RUN - States to be deleted:\n')

    let totalToDelete = 0
    const deletionPlan: Array<{ id: string; name: string; teamKey: string; type: string }> = []

    for (const [key, states] of duplicates) {
      const [teamKey, name, type] = key.split('::')

      // Sort by position to keep the first one
      const sorted = states.sort((a, b) => a.position - b.position)
      const toKeep = sorted[0]
      const toDelete = sorted.slice(1)

      console.log(`   ${teamKey}: "${name}" (${type})`)
      console.log(`      ✅ Keep: ${toKeep.id} (position ${toKeep.position})`)

      for (const state of toDelete) {
        console.log(`      ❌ Delete: ${state.id} (position ${state.position})`)
        deletionPlan.push({ id: state.id, name, teamKey, type })
        totalToDelete++
      }
      console.log()
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Total states: ${states.nodes.length}`)
    console.log(`   Duplicate groups: ${duplicates.length}`)
    console.log(`   States to delete: ${totalToDelete}`)
    console.log(`   States after cleanup: ${states.nodes.length - totalToDelete}\n`)

    // Safety check - verify no issues use these states
    console.log('🔍 Checking if any issues use states to be deleted...\n')

    let hasIssues = false
    for (const state of deletionPlan) {
      const issues = await client.issues({
        first: 1,
        filter: { state: { id: { eq: state.id } } }
      })

      if (issues.nodes.length > 0) {
        console.log(`   ⚠️  ${state.teamKey}: "${state.name}" has ${issues.nodes.length}+ issues`)
        hasIssues = true
      }
    }

    if (hasIssues) {
      console.log('\n❌ ABORT: Cannot delete states with active issues')
      console.log('   Move issues to canonical states first, then re-run cleanup\n')
      process.exit(1)
    }

    console.log('   ✅ No issues found using duplicate states\n')

    // Ask for confirmation
    console.log('⚠️  READY TO DELETE\n')
    console.log(`   This will delete ${totalToDelete} duplicate workflow states.`)
    console.log('   This action CANNOT be undone.\n')
    console.log('   To proceed, run with --confirm flag:\n')
    console.log(`   export LINEAR_API_KEY=... && node linear-cleanup-duplicate-states.ts --confirm\n`)

    if (process.argv.includes('--confirm')) {
      console.log('🗑️  Deleting duplicate states...\n')

      let deleted = 0
      for (const state of deletionPlan) {
        try {
          await client.deleteWorkflowState(state.id)
          console.log(`   ✅ Deleted: ${state.teamKey} "${state.name}" (${state.id})`)
          deleted++
        } catch (error: any) {
          console.error(`   ❌ Failed to delete ${state.id}: ${error.message}`)
        }
      }

      console.log(`\n✅ Cleanup complete: ${deleted}/${totalToDelete} states deleted\n`)

      // Verify final state count
      const finalStates = await client.workflowStates({ first: 100 })
      console.log(`📊 Final state count: ${finalStates.nodes.length}`)

    } else {
      console.log('ℹ️  Dry run complete. No changes made.\n')
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  }
}

cleanupDuplicateStates()
