# Backup & Security Implementation Guide

**Version:** 1.0
**Last Updated:** 2026-01-29
**Status:** 🚨 CRITICAL - Implement BEFORE production

---

## 🎯 Purpose

This guide provides **actionable steps** to prevent data loss and secure your application. Unlike the theoretical plans in `docs/architecture/operations.md`, this document contains commands you can run today.

---

## ⚠️ Current Status

**Database Backups:** ❌ Not configured
**Code Backups:** ⚠️ Git only (single point of failure)
**Configuration Backups:** ❌ Not configured
**Security Hardening:** ❌ Not implemented
**Recovery Testing:** ❌ Never tested

**Risk Level:** 🔴 HIGH - One incident could wipe out all work

---

## 🚨 IMMEDIATE ACTIONS (Do This Today)

### 1. Enable Git Remote Backup (5 minutes)

**Why:** If GitHub goes down or your account is compromised, you lose everything.

```bash
# Add a second remote (GitLab as backup)
git remote add backup git@gitlab.com:yourusername/akount-backup.git

# Push to both remotes
git push origin main
git push backup main

# Create alias to push to both at once
git config alias.pushall '!git push origin --all && git push backup --all'
```

**Test it:**
```bash
git pushall
```

**Set up automatic dual-push:**
Add to `.git/config`:
```ini
[remote "all"]
    url = git@github.com:yourusername/akount.git
    url = git@gitlab.com:yourusername/akount-backup.git
```

Then use: `git push all main`

---

### 2. Backup Critical Configuration Files (10 minutes)

**Why:** `.env` files are not in Git. If you lose them, you lose access to everything.

**Create backup script:**
```bash
# scripts/backup-config.sh
#!/bin/bash

BACKUP_DIR="$HOME/akount-backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Backup .env files (encrypted)
tar czf "$BACKUP_DIR/env-files.tar.gz" .env apps/*/.env packages/*/.env 2>/dev/null

# Encrypt with password
openssl enc -aes-256-cbc -salt -in "$BACKUP_DIR/env-files.tar.gz" \
  -out "$BACKUP_DIR/env-files.tar.gz.enc" \
  -k "YOUR_BACKUP_PASSWORD"

# Remove unencrypted version
rm "$BACKUP_DIR/env-files.tar.gz"

echo "✅ Configuration backed up to: $BACKUP_DIR/env-files.tar.gz.enc"
echo "📅 Retention: Keep last 30 days of backups"

# Clean up old backups (keep 30 days)
find "$HOME/akount-backups" -type d -mtime +30 -exec rm -rf {} \;
```

**Run it:**
```bash
chmod +x scripts/backup-config.sh
./scripts/backup-config.sh
```

**Schedule it (daily at 2 AM):**
```bash
# Add to crontab
crontab -e

# Add this line:
0 2 * * * cd /path/to/akount && ./scripts/backup-config.sh
```

**Recovery:**
```bash
# Decrypt and extract
openssl enc -aes-256-cbc -d -in env-files.tar.gz.enc -out env-files.tar.gz -k "YOUR_BACKUP_PASSWORD"
tar xzf env-files.tar.gz
```

---

### 3. Document Your Credentials (15 minutes)

**Why:** If you forget credentials or lose access, you're locked out.

**Create a secure credential vault:**

Option A: **Use 1Password/Bitwarden** (Recommended)
- Store all credentials in a shared vault
- Share with team members
- Enable 2FA recovery codes

Option B: **Encrypted file** (Solo developer)
```bash
# Create encrypted credentials file
cat > credentials.txt << EOF
# Akount Credentials - $(date +%Y-%m-%d)

## Database (Railway/Supabase)
- Database URL: postgresql://...
- Admin username:
- Admin password:
- Recovery email:
- 2FA backup codes:

## Clerk Authentication
- Dashboard: https://dashboard.clerk.com
- Account email:
- Publishable key:
- Secret key:
- 2FA backup codes:

## GitHub
- Repository: https://github.com/yourusername/akount
- Personal access token:
- SSH key location: ~/.ssh/id_ed25519

## GitLab (Backup)
- Repository: https://gitlab.com/yourusername/akount-backup
- Personal access token:
- SSH key location: ~/.ssh/id_ed25519

## Cloud Storage (Backups)
- Provider:
- Access key:
- Secret key:
- Bucket name:

## Emergency Contact
- Your email:
- Backup email:
- Phone:
EOF

# Encrypt it
gpg -c credentials.txt
rm credentials.txt

# Store credentials.txt.gpg in a SAFE PLACE (USB drive, encrypted cloud)
```

**Store in 3 places:**
1. Password manager (1Password/Bitwarden)
2. Encrypted USB drive (physical backup)
3. Encrypted cloud storage (Dropbox/Google Drive)

---

### 4. Set Up Database Backups (30 minutes)

**Phase 1: Local Development Backups**

```bash
# scripts/backup-db-local.sh
#!/bin/bash

BACKUP_DIR="$HOME/akount-db-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/akount_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

# Get DATABASE_URL from .env
source .env

# Extract connection details
DB_URL=$DATABASE_URL

# Backup database
pg_dump "$DB_URL" > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

echo "✅ Database backed up to: $BACKUP_FILE.gz"

# Keep only last 7 days of local backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

# Optional: Upload to cloud storage
# aws s3 cp "$BACKUP_FILE.gz" s3://your-bucket/db-backups/
# rclone copy "$BACKUP_FILE.gz" remote:akount-backups/
```

**Run it:**
```bash
chmod +x scripts/backup-db-local.sh
./scripts/backup-db-local.sh
```

**Schedule it (daily at 3 AM):**
```bash
crontab -e
# Add:
0 3 * * * cd /path/to/akount && ./scripts/backup-db-local.sh
```

**Phase 2: Production Database Backups**

When you deploy to Railway/Supabase:

**Railway:**
- Built-in automated daily backups (7-day retention on free tier)
- Enable in Railway dashboard → Database → Backups
- Upgrade to Pro for 30-day retention + point-in-time recovery

**Supabase:**
- Automated daily backups on paid plans
- Free tier: Manual backups only

**Manual Production Backup:**
```bash
# scripts/backup-db-production.sh
#!/bin/bash

# Production DATABASE_URL (store securely)
PROD_DB_URL="postgresql://prod_user:prod_pass@prod_host:5432/akount"

BACKUP_DIR="$HOME/akount-prod-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/akount_prod_$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

pg_dump "$PROD_DB_URL" > "$BACKUP_FILE"
gzip "$BACKUP_FILE"

# Upload to cloud (CRITICAL for production)
# Example: AWS S3
# aws s3 cp "$BACKUP_FILE.gz" s3://akount-prod-backups/daily/

echo "✅ Production database backed up: $BACKUP_FILE.gz"
```

---

### 5. Test Your Recovery Process (20 minutes)

**Why:** Backups are useless if you can't restore from them.

**Test recovery:**
```bash
# 1. Create a test database
createdb akount_test

# 2. Restore from backup
gunzip -c ~/akount-db-backups/akount_20260129_030000.sql.gz | psql akount_test

# 3. Verify data
psql akount_test -c "SELECT COUNT(*) FROM \"User\";"
psql akount_test -c "SELECT COUNT(*) FROM \"Account\";"

# 4. Drop test database
dropdb akount_test

echo "✅ Recovery test successful"
```

**Schedule quarterly recovery tests:**
- Add to calendar: Test backup recovery every 3 months
- Document results in `BACKUP-TESTS.md`

---

## 🔒 Security Hardening Checklist

### Phase 0: Pre-Development Security

- [ ] **1. Secure your .env file**
  ```bash
  # Make sure .env is in .gitignore
  echo ".env" >> .gitignore
  echo ".env.*" >> .gitignore
  echo "!.env.example" >> .gitignore

  # Set restrictive permissions
  chmod 600 .env
  ```

- [ ] **2. Create .env.example (safe for Git)**
  ```bash
  cat > .env.example << EOF
  # Database (PostgreSQL)
  DATABASE_URL="postgresql://user:password@localhost:5432/akount?schema=public"

  # Authentication (Clerk)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
  CLERK_SECRET_KEY="sk_test_..."

  # Environment
  NODE_ENV="development"
  EOF
  ```

- [ ] **3. Set up Git hooks to prevent secret leaks**
  ```bash
  # Install pre-commit hook
  npm install --save-dev @commitlint/cli git-secrets

  # Initialize git-secrets
  git secrets --install
  git secrets --register-aws

  # Add custom patterns
  git secrets --add 'CLERK_SECRET_KEY=.*'
  git secrets --add 'DATABASE_URL=.*'
  git secrets --add 'sk_test_[a-zA-Z0-9]+'
  ```

- [ ] **4. Enable GitHub security features**
  - Go to Settings → Security → Dependabot
  - Enable: Dependabot alerts
  - Enable: Dependabot security updates
  - Enable: Secret scanning
  - Enable: Code scanning (CodeQL)

- [ ] **5. Set up .gitattributes for security**
  ```bash
  cat > .gitattributes << EOF
  # Prevent env files from being committed
  .env* filter=secret
  credentials.* filter=secret
  *secret* filter=secret
  *password* filter=secret

  # LF line endings
  * text=auto eol=lf
  EOF
  ```

### Phase 1: Authentication Security (When implementing Clerk)

- [ ] **1. Use environment variables for all secrets**
  - Never hardcode API keys
  - Use `process.env.CLERK_SECRET_KEY`
  - Validate env vars on startup

- [ ] **2. Enable Clerk security features**
  - Enable bot detection
  - Enable rate limiting
  - Require email verification
  - Enable 2FA for admin accounts
  - Set session timeout (24 hours max)

- [ ] **3. Implement CSP headers**
  ```typescript
  // apps/web/next.config.js
  const securityHeaders = [
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on'
    },
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
      key: 'X-Frame-Options',
      value: 'SAMEORIGIN'
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff'
    },
    {
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin'
    }
  ];
  ```

### Phase 2: Database Security (When connecting DB)

- [ ] **1. Use connection pooling**
  ```typescript
  // prisma/schema.prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    connectionLimit = 10 // Prevent connection exhaustion
  }
  ```

- [ ] **2. Enable SSL for database connections**
  ```bash
  # Update DATABASE_URL
  DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
  ```

- [ ] **3. Use read-only users for queries**
  ```sql
  -- Create read-only role
  CREATE ROLE akount_readonly;
  GRANT CONNECT ON DATABASE akount TO akount_readonly;
  GRANT USAGE ON SCHEMA public TO akount_readonly;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO akount_readonly;

  -- Create read-only user
  CREATE USER akount_reader WITH PASSWORD 'secure_password';
  GRANT akount_readonly TO akount_reader;
  ```

- [ ] **4. Enable audit logging**
  ```sql
  -- Enable in Prisma schema (already done)
  -- Use AuditLog model for all sensitive operations
  ```

### Phase 3: API Security (When building endpoints)

- [ ] **1. Implement rate limiting**
  ```typescript
  // apps/api/src/middleware/rateLimit.ts
  import rateLimit from '@fastify/rate-limit';

  app.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes'
  });
  ```

- [ ] **2. Add request validation (Zod)**
  ```typescript
  import { z } from 'zod';

  const CreateAccountSchema = z.object({
    name: z.string().min(1).max(100),
    type: z.enum(['ASSET', 'LIABILITY']),
    balance: z.number()
  });
  ```

- [ ] **3. Sanitize user input**
  ```typescript
  import DOMPurify from 'isomorphic-dompurify';

  const sanitizedInput = DOMPurify.sanitize(userInput);
  ```

- [ ] **4. Implement CORS properly**
  ```typescript
  app.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://yourdomain.com'
      : 'http://localhost:3000',
    credentials: true
  });
  ```

---

## 📋 Pre-Production Security Audit

Before deploying to production, complete this checklist:

### Code Security
- [ ] No secrets in Git history (`git secrets --scan-history`)
- [ ] All dependencies updated (`npm audit fix`)
- [ ] No high/critical vulnerabilities (`npm audit`)
- [ ] TypeScript strict mode enabled
- [ ] ESLint security rules enabled

### Authentication
- [ ] Clerk production keys configured
- [ ] Session timeout set (24 hours max)
- [ ] 2FA enabled for admin accounts
- [ ] Password complexity enforced
- [ ] Rate limiting on login endpoints

### Database
- [ ] SSL connections enforced
- [ ] Automated backups enabled (daily minimum)
- [ ] Backup restoration tested
- [ ] Read-only replicas configured (if applicable)
- [ ] Connection pooling configured

### API
- [ ] HTTPS enforced (no HTTP)
- [ ] Rate limiting enabled (100 req/15min per IP)
- [ ] CORS configured (whitelist only)
- [ ] Input validation on all endpoints (Zod)
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention (CSP headers)
- [ ] CSRF protection (SameSite cookies)

### Infrastructure
- [ ] Environment variables not exposed to client
- [ ] Secrets stored in secure vault (Railway secrets)
- [ ] Monitoring and alerting configured
- [ ] Error tracking configured (Sentry)
- [ ] Logs don't contain sensitive data

### Disaster Recovery
- [ ] Automated backups configured
- [ ] Backup restoration tested (successfully)
- [ ] Recovery runbook documented
- [ ] Incident response plan documented
- [ ] Team trained on recovery procedures

---

## 🚨 Incident Response Plan

### If Database is Corrupted/Lost

**Immediate Actions (0-15 minutes):**
1. Stop all write operations (take app offline if needed)
2. Identify last known good backup
3. Assess data loss window (time between backup and incident)

**Recovery Steps (15-60 minutes):**
```bash
# 1. Create new database
createdb akount_recovery

# 2. Restore from backup
gunzip -c ~/akount-prod-backups/akount_prod_latest.sql.gz | psql akount_recovery

# 3. Verify data integrity
psql akount_recovery -c "SELECT COUNT(*) FROM \"User\";"
psql akount_recovery -c "SELECT MAX(\"createdAt\") FROM \"Transaction\";"

# 4. Update DATABASE_URL to point to recovered database
# In Railway/Supabase dashboard

# 5. Restart application
# Deploy with new DATABASE_URL

# 6. Run health checks
curl https://yourapi.com/api/health

# 7. Communicate to users about data loss window
```

**Post-Incident (1-24 hours):**
- Document what happened
- Identify root cause
- Implement prevention measures
- Test recovery process again

### If .env File is Lost

**Recovery:**
```bash
# 1. Restore from encrypted backup
openssl enc -aes-256-cbc -d -in env-files.tar.gz.enc -out env-files.tar.gz -k "YOUR_BACKUP_PASSWORD"
tar xzf env-files.tar.gz

# 2. Verify environment variables
cat .env

# 3. Test application startup
npm run dev
```

**If backup is also lost:**
1. Retrieve Clerk keys from https://dashboard.clerk.com
2. Retrieve DATABASE_URL from Railway/Supabase dashboard
3. Regenerate any API keys that can't be retrieved
4. Update applications with new keys

### If Git Repository is Lost

**Recovery:**
```bash
# 1. Clone from backup remote
git clone git@gitlab.com:yourusername/akount-backup.git akount-recovered

# 2. Add primary remote back
cd akount-recovered
git remote add origin git@github.com:yourusername/akount.git

# 3. Push to primary remote
git push origin --all
git push origin --tags

# 4. Verify all branches recovered
git branch -a
```

---

## 🔄 Backup Testing Schedule

### Weekly (Every Monday)
- [ ] Verify automated backups ran successfully
- [ ] Check backup file sizes (should be growing)
- [ ] Review backup logs for errors

### Monthly (First Friday)
- [ ] Test database backup restoration (to test database)
- [ ] Verify configuration backups are encrypted
- [ ] Update credential vault with any new credentials
- [ ] Review access logs for unauthorized access

### Quarterly (Every 3 months)
- [ ] Full disaster recovery drill (restore everything)
- [ ] Test recovery procedures with timer
- [ ] Update recovery documentation with learnings
- [ ] Train team members on recovery procedures

### Annually
- [ ] Rotate all credentials (passwords, API keys)
- [ ] Review and update backup retention policies
- [ ] Security audit by external party (if applicable)
- [ ] Disaster recovery tabletop exercise

---

## 📊 Backup Monitoring

### Metrics to Track

**Database Backups:**
- Last successful backup timestamp
- Backup file size (trend over time)
- Backup duration
- Backup failures (should be 0)

**Configuration Backups:**
- Last backup timestamp
- Files backed up count
- Encryption status

**Recovery Tests:**
- Last test date
- Test duration
- Test success/failure
- Time to full recovery

### Alerts to Configure

**Critical (Immediate):**
- Database backup failed
- Backup older than 48 hours
- Backup file size dropped >50%
- Recovery test failed

**Warning:**
- Backup file size growing >20% week-over-week
- Backup duration >10 minutes
- Recovery test not run in >90 days

---

## 📝 Recovery Runbooks

### Runbook 1: Restore Database from Backup

**When to use:** Database corrupted, data loss, migration failure

**Time to complete:** 15-30 minutes

**Prerequisites:**
- Access to backup files
- Database admin credentials
- Application deployment access

**Steps:**
```bash
# 1. Stop application (prevent further writes)
# In Railway/Vercel: Pause deployments

# 2. Identify backup to restore from
ls -lh ~/akount-prod-backups/
# Choose most recent backup before incident

# 3. Create new database instance
createdb akount_restore_$(date +%Y%m%d)

# 4. Restore backup
gunzip -c ~/akount-prod-backups/akount_prod_20260129.sql.gz | \
  psql akount_restore_20260129

# 5. Verify data
psql akount_restore_20260129 << EOF
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Transaction";
SELECT MAX("createdAt") FROM "Transaction";
SELECT COUNT(*) FROM "Account";
EOF

# 6. Update DATABASE_URL
# In Railway: Update environment variable
# DATABASE_URL=postgresql://...akount_restore_20260129

# 7. Deploy application
# In Railway: Resume deployments

# 8. Run health checks
curl https://api.akount.com/api/health

# 9. Monitor for 1 hour
# Check error logs, user reports

# 10. Communicate to users
# Email: "Service restored. Data between [time] and [time] may be lost."
```

**Rollback plan:** Keep old database for 7 days in case restore fails

### Runbook 2: Recover from Secret Leak

**When to use:** API key exposed in Git, Clerk secret leaked

**Time to complete:** 10-20 minutes

**Steps:**
```bash
# 1. Rotate compromised credentials immediately
# - Clerk: Generate new secret key in dashboard
# - Database: Change password
# - API keys: Regenerate

# 2. Update .env with new credentials
vim .env
# Update all compromised values

# 3. Update production environment variables
# In Railway/Vercel dashboard

# 4. Restart application
# Deploy with new environment variables

# 5. Revoke old credentials
# In respective dashboards (Clerk, Railway, etc.)

# 6. Search Git history for leaked secrets
git secrets --scan-history

# 7. If found in Git, remove from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 8. Force push (DANGER - coordinate with team)
git push origin --force --all
git push origin --force --tags

# 9. Monitor for unauthorized access
# Check logs for suspicious activity

# 10. Document incident
# Add to INCIDENTS.md with lessons learned
```

### Runbook 3: Recover Deleted Production Database

**When to use:** Accidental DROP DATABASE, provider outage

**Time to complete:** 30-60 minutes

**Prerequisites:**
- Most recent backup file
- Cloud provider access (Railway/Supabase)
- DNS/deployment access

**Steps:**
```bash
# 1. Confirm database is actually gone
psql $DATABASE_URL -c "SELECT 1"
# Should fail with connection error

# 2. Create new database instance
# Option A: Railway
# - Create new PostgreSQL service
# - Note new DATABASE_URL

# Option B: Supabase
# - Create new project
# - Note new DATABASE_URL

# 3. Restore from most recent backup
gunzip -c ~/akount-prod-backups/akount_prod_latest.sql.gz | \
  psql "NEW_DATABASE_URL"

# 4. Run migrations to ensure schema is current
cd packages/db
export DATABASE_URL="NEW_DATABASE_URL"
npx prisma migrate deploy

# 5. Verify data integrity
psql "NEW_DATABASE_URL" << EOF
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Transaction";
SELECT MAX("createdAt") FROM "Transaction";
EOF

# 6. Update production environment variables
# Railway/Vercel: Update DATABASE_URL to NEW_DATABASE_URL

# 7. Deploy application
git commit --allow-empty -m "Force redeploy with new DB"
git push origin main

# 8. Run health checks
curl https://api.akount.com/api/health

# 9. Test critical user flows
# - Login
# - View accounts
# - Create transaction

# 10. Monitor and communicate
# Post status update
# Monitor error rates for 24 hours
```

---

## 🎯 Next Steps

### This Week (Phase 0)
1. ✅ Set up dual Git remotes (GitHub + GitLab)
2. ✅ Create and run configuration backup script
3. ✅ Document all credentials in password manager
4. ✅ Set up local database backup script
5. ✅ Test backup recovery once

### Before Production (Phase 8)
1. ✅ Enable Railway/Supabase automated backups
2. ✅ Set up cloud backup storage (S3/R2)
3. ✅ Configure monitoring and alerts
4. ✅ Test full disaster recovery drill
5. ✅ Complete pre-production security checklist

### Ongoing
- [ ] Run backup verification weekly
- [ ] Test recovery monthly
- [ ] Rotate credentials quarterly
- [ ] Update this document as you learn

---

## 📚 References

- [docs/architecture/operations.md](./docs/architecture/operations.md) - High-level operations plan
- [ROADMAP.md](./ROADMAP.md) - Development roadmap
- [Railway Backups](https://docs.railway.app/databases/postgresql#backups)
- [Supabase Backups](https://supabase.com/docs/guides/platform/backups)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated:** 2026-01-29
**Next Review:** 2026-02-05 (weekly until production)
**Owner:** Development Team
