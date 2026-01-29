# Next Steps - Database Setup

You're now ready to set up your PostgreSQL database!

## Quick Setup (5 minutes)

### Step 1: Choose Your Database

Pick one option below:

#### Option A: Railway (Recommended - Easiest)
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Provision PostgreSQL"
4. Click on PostgreSQL service → "Variables" tab
5. Copy the `DATABASE_URL` value

#### Option B: Supabase (Alternative)
1. Go to [supabase.com](https://supabase.com)
2. Create new project (takes ~2 minutes)
3. Go to Settings → Database → Connection string (URI)
4. Copy and replace `[YOUR-PASSWORD]` with your password

#### Option C: Local PostgreSQL
1. Download from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Install with default settings
3. Use URL: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/akount?schema=public`

### Step 2: Update .env File

Replace the placeholder DATABASE_URL in your `.env` file:

```bash
DATABASE_URL="postgresql://[paste your connection string here]"
```

### Step 3: Run Setup Command

From your project root:

```bash
npm run db:setup
```

This will:
- Install database dependencies
- Generate Prisma Client
- Run migrations to create tables
- Seed test data (demo company, invoices, etc.)

### Step 4: Verify It Works

```bash
# Start the dev server
npm run dev

# In another terminal, open Prisma Studio to view data
npx prisma studio
```

Then visit http://localhost:3000 and sign in with Clerk!

## What You Get

After setup, your database will have:

- ✅ Complete chart of accounts (Assets, Liabilities, Equity, Revenue, Expenses)
- ✅ Demo company: "Demo Consulting Inc."
- ✅ 2 test clients with contact info
- ✅ 2 sample invoices (1 sent, 1 paid)
- ✅ 1 sample bill
- ✅ Journal entries showing revenue and payment
- ✅ Test user: demo@akount.com

## Troubleshooting

### "Can't reach database server"
- Make sure you copied the full DATABASE_URL
- Check if your database service is running (Railway/Supabase dashboard)
- Try the connection test in DATABASE-SETUP.md

### "Module not found: tsx"
```bash
cd packages/db
npm install
cd ../..
```

### Need to start over?
```bash
npm run db:reset  # Deletes all data and re-runs migrations
npm run db:seed   # Re-adds test data
```

## After Database Setup

Once your database is ready, you can:

1. ✅ **Test the dashboard** - View demo invoices and financial data
2. 📝 **Continue Phase 0** - Task 0.3: API Foundation
3. 🔧 **Customize test data** - Edit `packages/db/prisma/seed.ts`

## Need More Help?

- **Full guide**: See [DATABASE-SETUP.md](./DATABASE-SETUP.md)
- **Prisma docs**: https://www.prisma.io/docs
- **Railway docs**: https://docs.railway.app
- **Supabase docs**: https://supabase.com/docs

---

**Current Status:**
- ✅ Phase 0 - Task 0.1: Clerk Authentication (Complete)
- 🔄 Phase 0 - Task 0.2: Database Setup (Ready to run)
- ⏳ Phase 0 - Task 0.3: API Foundation (Next)

Let's get your database running! 🚀
