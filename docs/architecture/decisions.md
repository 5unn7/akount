# Architecture Decisions

**Last Updated:** 2026-01-27
**Purpose:** Document technology choices, rationale, trade-offs, and cost analysis for Akount's tech stack.

---

## Core Principles

- **Budget-Friendly**: Maximize free tiers, open-source tools, and pay-as-you-grow services
- **Enterprise-Grade**: Security, compliance, and reliability from day one
- **Developer Velocity**: Modern tools with great DX to ship fast
- **Type Safety**: End-to-end TypeScript for fewer bugs and better refactoring

---

## Tech Stack

### Backend Stack

| Component | Choice | Rationale | Cost |
|-----------|--------|-----------|------|
| **Language** | TypeScript | Type safety, matches frontend, easier hiring | Free |
| **Runtime** | Node.js 20+ LTS | Excellent async I/O for financial ops, mature ecosystem | Free |
| **Framework** | Fastify | 2x faster than Express, lower hosting costs, great plugins | Free |
| **Database** | PostgreSQL 15+ | Best for financial data (ACID), jsonb for flexibility | Free tier → $5-20/mo |
| **ORM** | Prisma | Type-safe, excellent migrations, great DX | Free |
| **Cache** | Redis (Upstash) | Session storage, rate limits, temp calculations | Free tier → $10/mo |
| **Job Queue** | BullMQ | Redis-based, reliable retries, monitoring | Free |
| **Validation** | Zod | Runtime type validation, integrates with Prisma | Free |

**Monthly Cost Estimate:**
- Development: $0 (free tiers)
- Production (MVP): $15-35/mo (Railway PostgreSQL + Upstash Redis)
- Production (Scale): $100-300/mo (dedicated DB, more Redis memory)
- OCR Usage: Pay per use (~$15-50/mo for 10-30 PDF uploads)

---

### Frontend Stack

| Component | Choice | Rationale | Cost |
|-----------|--------|-----------|------|
| **Framework** | Next.js 14+ | React with API routes, SSR, great DX | Free |
| **Language** | TypeScript | End-to-end type safety | Free |
| **UI Library** | Shadcn/ui + Radix | Already using, accessible, customizable | Free |
| **Styling** | Tailwind CSS v4 | Already using, consistent, fast | Free |
| **State** | Zustand | Lightweight, simpler than Redux | Free |
| **Forms** | React Hook Form + Zod | Best validation DX | Free |
| **Charts** | Recharts | Native React charts, free | Free |
| **Tables** | TanStack Table | Powerful, flexible, free | Free |

**Monthly Cost Estimate:**
- Hosting: $0 (Vercel free tier for hobby) → $20/mo (Pro for production)

---

### Infrastructure & DevOps

| Component | Choice | Rationale | Cost |
|-----------|--------|-----------|------|
| **Hosting** | Railway or Render | Generous free tiers, great DX, easy scaling | Free → $5-20/mo |
| **Database Host** | Railway PostgreSQL | Managed, backups, easy to use | Free tier → $5/mo |
| **Cache/Queue** | Upstash Redis | Generous free tier, serverless pricing | Free → $10/mo |
| **Auth** | Clerk | Passkeys (WebAuthn), MFA, magic links, great UX | Free → $25/mo |
| **Email** | Resend | 3k emails/mo free, great API | Free → $20/mo |
| **File Storage** | Cloudflare R2 | Cheapest object storage, S3-compatible | Free 10GB → $0.015/GB |
| **OCR Service** | Google Vision API | PDF bank statement extraction | $1.50/1000 pages (pay per use) |
| **Monitoring** | Sentry + Vercel Analytics | Error tracking + frontend analytics | Free tiers |
| **CI/CD** | GitHub Actions | 2000 mins/mo free, integrated | Free |

**Monthly Cost Estimate:**
- Development: $0
- MVP (100 users): $30-60/mo
- Scale (1000 users): $150-300/mo

---

### Security & Compliance

| Component | Choice | Rationale | Cost |
|-----------|--------|-----------|------|
| **Auth** | Clerk | Passkeys (WebAuthn), MFA, session management, device tracking | Free → $25/mo |
| **Secrets** | GitHub Secrets + Railway Env | Secure by default, no extra service needed | Free |
| **Encryption** | PostgreSQL native + TLS | Database encryption at rest, TLS in transit | Free |
| **Backups** | Railway auto backups | Daily automated backups with retention | Included |
| **Logging** | Railway Logs + Sentry | Structured logging, error tracking | Free tiers |

---

## Cost Analysis

### Development Phase
**Target: $0-50/mo**
- Railway: Free tier (500 hrs) or $5/mo
- Upstash Redis: Free tier
- Vercel: Free tier
- Clerk: Free tier
- GitHub Actions: Free tier
- **Total: $0-10/mo**

### MVP Launch (100 users)
**Target: $100-150/mo**
- Railway (DB + API): $20-30/mo
- Upstash Redis: $10/mo
- Vercel Pro: $20/mo
- Clerk: $25/mo (100 MAU)
- Resend: $20/mo
- Cloudflare R2: $5/mo
- Sentry: Free tier
- **Total: $100-110/mo**

### Growth Phase (1000 users)
**Target: $400-600/mo**
- Railway (scaled): $100-150/mo
- Upstash Redis: $30/mo
- Vercel Pro: $20/mo
- Clerk: $75/mo (1000 MAU)
- Resend: $40/mo
- Cloudflare R2: $20/mo
- Sentry: $29/mo
- **Total: $314-364/mo**

### Scale Phase (10k users)
**Target: $1500-2500/mo**
- Railway or AWS: $500-800/mo
- Redis: $100/mo
- Vercel: $20-150/mo
- Clerk: $400/mo
- Email: $200/mo
- Storage: $100/mo
- Monitoring: $100/mo
- **Total: $1420-1750/mo**

---

## Alternative Considerations

### Why Fastify over Express?
- **Performance**: 2x faster request throughput
- **Cost**: Lower hosting costs due to efficiency
- **DX**: Better TypeScript support, async/await first-class
- **Plugins**: Mature ecosystem (CORS, JWT, validation)

### Why Prisma over Drizzle/TypeORM?
- **Type Safety**: Best-in-class TypeScript integration
- **Migrations**: Excellent migration workflow
- **DX**: Prisma Studio for database exploration
- **Maturity**: Production-proven for financial apps

### Why Next.js over Remix?
- **Maturity**: Larger ecosystem, more resources
- **Vercel**: Optimized hosting with generous free tier
- **App Router**: Modern patterns (Server Components, streaming)
- **Community**: Easier to hire Next.js developers

### Why Clerk over Auth0/Firebase Auth?
- **Passkeys**: First-class WebAuthn support
- **DX**: Easiest setup, great documentation
- **Pricing**: Free tier suitable for MVP
- **Features**: MFA, magic links, device management included

### Why Railway over AWS/GCP?
- **Simplicity**: Zero DevOps, click to deploy
- **Cost**: Generous free tier, no surprise bills
- **DX**: Great for startups, focus on product
- **Note**: Can migrate to AWS/GCP later if needed

---

## Decision Log

### 2026-01-27: Initial Tech Stack
- Selected all technologies listed above
- Prioritized budget-friendly options with free tiers
- Focused on developer velocity for MVP phase
- All choices support enterprise-grade scale

---

## References

- [ROADMAP.md](/ROADMAP.md) - Implementation phases
- [schema-design.md](./schema-design.md) - Database design validation
- [processes.md](./processes.md) - Development processes
- [operations.md](./operations.md) - Operational procedures
