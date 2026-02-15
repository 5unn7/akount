# Development Setup Guide

> **Last Updated:** 2026-02-05

## Prerequisites

- Node.js 20+
- npm 10+ (included with Node.js)
- PostgreSQL 15+ (or Railway/Supabase account)
- Clerk account (for authentication)

## Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd akount

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your credentials (see below)

# 4. Set up database
npm run db:setup

# 5. Start development
npm run dev
```

## Environment Variables

Create `.env` in the project root:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/akount?schema=public"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Environment
NODE_ENV="development"
```

### Getting Credentials

**Clerk:**

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy the Publishable Key and Secret Key from the API Keys page

**Database (Choose One):**

| Option | Best For | Setup Time |
|--------|----------|------------|
| Railway | Cloud dev, teams | 5 min |
| Local PostgreSQL | Offline work | 15 min |
| Docker | Isolated testing | 10 min |

**Railway (Recommended):**

1. Go to [railway.app](https://railway.app)
2. Create project → Provision PostgreSQL
3. Copy `DATABASE_URL` from Variables tab

**Local PostgreSQL:**

1. Install from [postgresql.org](https://www.postgresql.org/download/)
2. Create database: `createdb akount`
3. Use: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/akount?schema=public`

## Services

After `npm run dev`:

| Service | URL | Description |
|---------|-----|-------------|
| Web | <http://localhost:3000> | Next.js frontend |
| API | <http://localhost:4000> | Fastify backend |

## Database Commands

```bash
# Full setup (migrations + seed)
npm run db:setup

# Individual commands
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed test data
npm run db:studio      # Open Prisma Studio GUI

# Reset (WARNING: deletes all data)
npm run db:reset
```

## Test Data

After seeding, you'll have:

- 1 Tenant (Demo Company)
- 1 Entity (Demo Consulting Inc, CAD)
- 6 GL Accounts
- 2 Clients, 1 Vendor
- 2 Invoices, 1 Bill
- Sample transactions

## Project Structure

```
akount/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Fastify backend
├── packages/
│   ├── db/           # Prisma schema & migrations
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   └── design-tokens/# Design system tokens
└── docs/             # Documentation
```

## Troubleshooting

### "DATABASE_URL not found"

- Ensure `.env` exists in project root
- Check variable is set correctly
- Restart terminal/dev server

### "Can't connect to database"

- Verify database is running
- Check connection string format
- For SSL: add `?sslmode=require` to URL

### "Clerk auth errors"

- Verify keys in `.env` match Clerk dashboard
- Check you're using test keys for development

### Build/Type errors

```bash
npm install          # Update dependencies
npm run typecheck    # Check for type errors
```

## Next Steps

1. Read [CLAUDE.md](../../CLAUDE.md) for project context
2. Check [docs/standards/](../standards/) for coding standards
3. Review [docs/design-system/](../design-system/) for UI specs

## Security Notes

- Never commit `.env` files (in `.gitignore`)
- Use test credentials for development only
- See `docs/archive/pre-restructure/BACKUP-SECURITY.md` for production security
