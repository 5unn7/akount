# Database Setup Guide

This guide will help you set up PostgreSQL for Akount development.

## Quick Start

Choose one of the following options:

### Option 1: Railway (Recommended for Development)
**Pros:** Free tier, instant setup, managed backups, no local installation
**Cons:** Requires internet connection

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Provision PostgreSQL"
3. Click on the PostgreSQL service
4. Go to "Variables" tab and copy the `DATABASE_URL`
5. Update your `.env` file:
   ```bash
   DATABASE_URL="postgresql://postgres:password@host:port/database"
   ```
6. Run setup:
   ```bash
   npm run db:setup
   ```

### Option 2: Supabase (Alternative Cloud Option)
**Pros:** Free tier, great UI, includes auth/storage/realtime
**Cons:** More features than needed for basic setup

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose organization, enter project name and database password
4. Wait for project to initialize (~2 minutes)
5. Go to "Settings" → "Database" → "Connection string" → "URI"
6. Copy the connection string and replace `[YOUR-PASSWORD]` with your password
7. Update your `.env` file
8. Run setup:
   ```bash
   npm run db:setup
   ```

### Option 3: Local PostgreSQL (Windows)
**Pros:** Full control, works offline, faster queries
**Cons:** Requires installation, manual backup management

1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer (default settings work fine)
3. Remember the password you set for the `postgres` user
4. PostgreSQL should auto-start as a Windows service
5. Create database using pgAdmin (installed with PostgreSQL):
   - Open pgAdmin
   - Right-click "Databases" → "Create" → "Database"
   - Name it `akount`
6. Update your `.env` file:
   ```bash
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/akount?schema=public"
   ```
7. Run setup:
   ```bash
   npm run db:setup
   ```

### Option 4: Docker PostgreSQL (Advanced)
**Pros:** Isolated environment, easy cleanup
**Cons:** Requires Docker Desktop

1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Run PostgreSQL container:
   ```bash
   docker run --name akount-postgres -e POSTGRES_PASSWORD=akount123 -e POSTGRES_DB=akount -p 5432:5432 -d postgres:16
   ```
3. Update your `.env` file:
   ```bash
   DATABASE_URL="postgresql://postgres:akount123@localhost:5432/akount?schema=public"
   ```
4. Run setup:
   ```bash
   npm run db:setup
   ```

## Database Setup Commands

After you have a `DATABASE_URL` configured:

### Initial Setup (First Time)
```bash
# From project root
npm run db:setup
```

This will:
1. Run Prisma migrations to create tables
2. Seed the database with test data
3. Generate Prisma Client

### Individual Commands

```bash
# Generate Prisma Client only
npm run db:generate

# Create and apply a new migration
npm run db:migrate

# Apply migrations in production
npm run db:migrate:deploy

# Seed database with test data
npm run db:seed

# Reset database (WARNING: Deletes all data)
npm run db:reset
```

## Test Data

After running `npm run db:setup`, your database will have:

- **1 Tenant**: Demo Company (trial, pro plan)
- **1 Entity**: Demo Consulting Inc. (Canadian corporation)
- **1 User**: demo@akount.com
- **6 GL Accounts**: Cash, AR, AP, Revenue, Expenses, Equity
- **2 Clients**: Acme Corporation, Tech Startup Ltd
- **1 Vendor**: Office Supplies Co
- **2 Invoices**:
  - INV-001: $5,650 (sent, unpaid)
  - INV-002: $3,390 (paid)
- **1 Bill**: BILL-001: $282.50 (pending)
- **1 Payment**: $3,390 for INV-002
- **2 Journal Entries**: Revenue recognition and payment

## Verify Setup

Test your database connection:

```bash
# Using Prisma Studio (GUI)
npx prisma studio

# Or query directly
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.tenant.count().then(console.log)"
```

## Troubleshooting

### "Environment variable not found: DATABASE_URL"
- Make sure `.env` file exists in project root
- Check that `DATABASE_URL` is set correctly
- Restart your terminal/dev server

### "Can't reach database server"
- Verify database is running (Railway/Supabase dashboard or local service)
- Check firewall isn't blocking the connection
- Test connection string format is correct

### "SSL connection required"
Add `?sslmode=require` to your DATABASE_URL:
```bash
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

### Migration conflicts
If you get migration errors:
```bash
npm run db:reset  # WARNING: Deletes all data
npm run db:setup  # Re-runs migrations and seed
```

## Production Setup

For production deployment:

1. **Use Railway/Supabase or managed PostgreSQL** (don't use local)
2. **Enable connection pooling** (use Supabase Pooler or PgBouncer)
3. **Set up automated backups** (Railway/Supabase have this built-in)
4. **Use environment-specific URLs**:
   ```bash
   # .env.production
   DATABASE_URL="postgresql://..."  # Your production DB
   ```
5. **Run migrations safely**:
   ```bash
   npm run db:migrate:deploy  # Never use db:reset in production!
   ```

## Next Steps

After database setup is complete:

1. ✅ Start the dev server: `npm run dev`
2. ✅ Test authentication with Clerk
3. ✅ Verify dashboard loads with test data
4. 📝 Continue with Phase 0 - Task 0.3: API Foundation

---

Need help? Check the [Prisma Documentation](https://www.prisma.io/docs) or create an issue.
