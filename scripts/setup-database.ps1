# Database Setup Script for Akount (Windows PowerShell)
# This script helps you set up your PostgreSQL database

$ErrorActionPreference = "Stop"

Write-Host "🗄️  Akount Database Setup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set in .env
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create a .env file in the project root."
    Write-Host "See DATABASE-SETUP.md for instructions."
    exit 1
}

$databaseUrl = Select-String -Path $envFile -Pattern '^DATABASE_URL=' | ForEach-Object { $_.Line -replace '^DATABASE_URL=', '' -replace '"', '' }

if (-not $databaseUrl -or $databaseUrl -match 'user:password@localhost') {
    Write-Host "❌ DATABASE_URL not configured in .env" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please update your .env file with a PostgreSQL connection string." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick setup options:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Railway (Recommended):" -ForegroundColor Green
    Write-Host "   → Visit: https://railway.app"
    Write-Host "   → Create PostgreSQL project"
    Write-Host "   → Copy DATABASE_URL"
    Write-Host ""
    Write-Host "2. Supabase:" -ForegroundColor Green
    Write-Host "   → Visit: https://supabase.com"
    Write-Host "   → Create new project"
    Write-Host "   → Copy connection string from Settings → Database"
    Write-Host ""
    Write-Host "3. Local PostgreSQL:" -ForegroundColor Green
    Write-Host '   DATABASE_URL="postgresql://postgres:password@localhost:5432/akount?schema=public"'
    Write-Host ""
    Write-Host "See DATABASE-SETUP.md for detailed instructions." -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ DATABASE_URL found in .env" -ForegroundColor Green
Write-Host ""

# Test database connection
Write-Host "🔌 Testing database connection..." -ForegroundColor Yellow
try {
    $null = npx prisma db execute --stdin --schema=packages/db/prisma/schema.prisma <<< "SELECT 1;" 2>&1
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to database" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  - Database server is running"
    Write-Host "  - Connection string is correct"
    Write-Host "  - Firewall allows the connection"
    Write-Host ""
    exit 1
}

Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies in packages/db..." -ForegroundColor Yellow
Push-Location packages/db
try {
    npm install
} finally {
    Pop-Location
}

Write-Host ""

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
Push-Location packages/db
try {
    npx prisma generate
} finally {
    Pop-Location
}

Write-Host ""

# Run migrations
Write-Host "🚀 Running database migrations..." -ForegroundColor Yellow
Write-Host "(This will create all tables and indexes)" -ForegroundColor Gray
Push-Location packages/db
try {
    npx prisma migrate dev --name init
} finally {
    Pop-Location
}

Write-Host ""

# Seed database
Write-Host "🌱 Seeding database with test data..." -ForegroundColor Yellow
Push-Location packages/db
try {
    npm run seed
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Your database now has:" -ForegroundColor Cyan
Write-Host "   - Chart of Accounts (6 accounts)"
Write-Host "   - Test clients and vendors"
Write-Host "   - Sample invoices and bills"
Write-Host "   - Demo journal entries"
Write-Host ""
Write-Host "🔐 Test login: demo@akount.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start dev server: npm run dev"
Write-Host "  2. Open http://localhost:3000"
Write-Host "  3. Sign in with Clerk and explore the dashboard"
Write-Host ""
