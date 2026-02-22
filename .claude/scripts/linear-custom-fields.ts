#!/usr/bin/env tsx
/**
 * Create Custom Fields in Linear (Business Plan Feature)
 *
 * Fields:
 * - Response Time (number) - Track CS response in hours
 * - Customer Count (number) - How many users affected
 * - Deployment ID (text) - Link to specific deployment
 * - Marketing Campaign (select) - Which campaign this relates to
 */

import { LinearClient } from '@linear/sdk'

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || ''

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY required')
  process.exit(1)
}

const linear = new LinearClient({ apiKey: LINEAR_API_KEY })

async function main() {
  console.log('🔧 Creating custom fields...\n')

  // Get organization
  const org = await linear.organization

  const fields = [
    {
      name: 'Response Time',
      description: 'Customer support response time in hours',
      type: 'number' as const,
    },
    {
      name: 'Customer Count',
      description: 'Number of customers affected by this issue',
      type: 'number' as const,
    },
    {
      name: 'Deployment ID',
      description: 'GitHub deployment ID or version number',
      type: 'text' as const,
    },
    {
      name: 'Marketing Campaign',
      description: 'Associated marketing campaign',
      type: 'text' as const, // Would be 'select' but needs options array
    },
  ]

  let created = 0

  for (const field of fields) {
    try {
      await linear.createCustomField({
        name: field.name,
        description: field.description,
        type: field.type,
      })
      console.log(`  ✅ ${field.name}`)
      created++
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.log(`  ⏭️  ${field.name} (already exists)`)
      } else {
        console.log(`  ❌ ${field.name}: ${err.message}`)
      }
    }
  }

  console.log(`\n✅ ${created} custom fields created`)
  console.log('\nℹ️  Custom fields can be added to issues in Linear UI')
  console.log('   Teams → [Team] → Settings → Custom Fields → Add to team')
}

main().catch(err => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
