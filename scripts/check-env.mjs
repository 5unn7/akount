#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

const requiredEnvVars = {
  root: ['DATABASE_URL', 'CLERK_SECRET_KEY'],
  web: ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'],
}

function checkEnvFile(path, vars, label) {
  const fullPath = resolve(projectRoot, path)

  if (!existsSync(fullPath)) {
    console.error(`❌ Missing ${label} file: ${path}`)
    console.error(`   Copy from ${path}.example and fill in values`)
    return false
  }

  const content = readFileSync(fullPath, 'utf8')
  const missing = []

  for (const varName of vars) {
    // Check if variable is defined (has a value after =)
    const regex = new RegExp(`^${varName}=.+`, 'm')
    if (!regex.test(content)) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Missing or empty required env vars in ${label}:`)
    missing.forEach((v) => console.error(`   - ${v}`))
    return false
  }

  console.log(`✅ ${label} environment configured`)
  return true
}

console.log('🔍 Checking environment configuration...\n')

const rootOk = checkEnvFile('.env', requiredEnvVars.root, 'Root .env')
const webOk = checkEnvFile(
  'apps/web/.env.local',
  requiredEnvVars.web,
  'Web .env.local'
)

console.log('')

if (!rootOk || !webOk) {
  console.error('❌ Environment validation failed.')
  console.error('\n📖 Setup Guide:')
  console.error('   1. Copy .env.example to .env (root)')
  console.error('   2. Copy apps/web/.env.example to apps/web/.env.local')
  console.error('   3. Fill in your credentials (see README.md for details)')
  console.error('\n💡 Need help? Check README.md → Getting Started → Environment Setup\n')
  process.exit(1)
}

console.log('✅ All environment variables configured correctly\n')
