#!/bin/bash

# Database Setup Script for Akount
# This script helps you set up your PostgreSQL database

set -e  # Exit on error

echo "🗄️  Akount Database Setup"
echo "========================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in environment"
    echo ""
    echo "Please update your .env file with a PostgreSQL connection string."
    echo ""
    echo "Quick setup options:"
    echo ""
    echo "1. Railway (Recommended):"
    echo "   → Visit: https://railway.app"
    echo "   → Create PostgreSQL project"
    echo "   → Copy DATABASE_URL"
    echo ""
    echo "2. Supabase:"
    echo "   → Visit: https://supabase.com"
    echo "   → Create new project"
    echo "   → Copy connection string from Settings → Database"
    echo ""
    echo "3. Local PostgreSQL:"
    echo "   DATABASE_URL=\"postgresql://postgres:password@localhost:5432/akount?schema=public\""
    echo ""
    echo "See DATABASE-SETUP.md for detailed instructions."
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Test database connection
echo "🔌 Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database"
    echo ""
    echo "Please check:"
    echo "  - Database server is running"
    echo "  - Connection string is correct"
    echo "  - Firewall allows the connection"
    echo ""
    exit 1
fi

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
cd packages/db
npm install
cd ../..

echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
cd packages/db
npx prisma generate
cd ../..

echo ""

# Run migrations
echo "🚀 Running database migrations..."
cd packages/db
npx prisma migrate dev --name init
cd ../..

echo ""

# Seed database
echo "🌱 Seeding database with test data..."
cd packages/db
npm run seed
cd ../..

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 Your database now has:"
echo "   - Chart of Accounts (6 accounts)"
echo "   - Test clients and vendors"
echo "   - Sample invoices and bills"
echo "   - Demo journal entries"
echo ""
echo "🔐 Test login: demo@akount.com"
echo ""
echo "Next steps:"
echo "  1. Start dev server: npm run dev"
echo "  2. Open http://localhost:3000"
echo "  3. Sign in and explore the dashboard"
echo ""
