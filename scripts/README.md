# Backup & Recovery Scripts

Automated scripts for data protection and disaster recovery.

## 📋 Available Scripts

### 1. `setup-git-backup.sh`

**Purpose:** Set up dual Git remotes for code redundancy

**When to run:** Once, at project start

**Usage:**

```bash
./scripts/setup-git-backup.sh
```

**What it does:**

- Adds a backup Git remote (GitLab, Bitbucket, Azure DevOps, or custom)
- Pushes your code to the backup remote
- Provides commands to push to both remotes simultaneously

**Why:** If GitHub goes down or your account is compromised, you have a complete backup.

---

### 2. `backup-config.sh`

**Purpose:** Back up environment files and sensitive configuration

**When to run:**

- After initial setup (when you first create .env)
- Weekly (automated via cron)
- Before major changes

**Usage:**

```bash
./scripts/backup-config.sh
```

**What it does:**

- Backs up all .env files
- Backs up configuration files (.claude/settings.local.json, etc.)
- Encrypts backups with AES-256
- Stores in `~/akount-backups/`
- Keeps 30 days of backups

**Recovery:**

```bash
# Decrypt and restore
cd ~/akount-backups/2026-01-29
openssl enc -aes-256-cbc -d -in env-files_*.tar.gz.enc -out env-files.tar.gz -k "PASSWORD"
tar xzf env-files.tar.gz
```

---

### 3. `backup-db-local.sh`

**Purpose:** Back up local development database

**When to run:**

- Daily (automated via cron)
- Before running migrations
- Before major data changes

**Usage:**

```bash
./scripts/backup-db-local.sh
```

**Prerequisites:**

- PostgreSQL client tools installed (`pg_dump`)
- DATABASE_URL set in `.env`
- Database is running

**What it does:**

- Dumps database to SQL file
- Compresses with gzip
- Stores in `~/akount-db-backups/`
- Keeps 7 days of backups

**Recovery:**

```bash
# Restore to new database
createdb akount_restored
gunzip -c ~/akount-db-backups/akount_20260129_*.sql.gz | psql akount_restored
```

---

### 4. `test-recovery.sh`

**Purpose:** Verify backups can be restored successfully

**When to run:**

- Monthly (scheduled test)
- After setting up backups for the first time
- Before deploying to production

**Usage:**

```bash
./scripts/test-recovery.sh
```

**What it does:**

- Finds most recent database backup
- Creates test database
- Restores backup to test database
- Verifies data integrity
- Cleans up test database
- Reports success/failure

**Why:** Untested backups are useless. This ensures your disaster recovery works.

---

## 🔄 Automation Setup

### Daily Database Backups (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add this line (runs at 3 AM daily)
0 3 * * * cd /path/to/product-plan && ./scripts/backup-db-local.sh >> ~/akount-backups/cron.log 2>&1
```

### Weekly Configuration Backups

```bash
# Edit crontab
crontab -e

# Add this line (runs every Monday at 2 AM)
0 2 * * 1 cd /path/to/product-plan && echo "YOUR_BACKUP_PASSWORD" | ./scripts/backup-config.sh >> ~/akount-backups/cron.log 2>&1
```

### Monthly Recovery Tests

```bash
# Edit crontab
crontab -e

# Add this line (runs first day of month at 4 AM)
0 4 1 * * cd /path/to/product-plan && ./scripts/test-recovery.sh >> ~/akount-backups/test-results.log 2>&1
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (daily, weekly, monthly)
4. Action: Start a program
5. Program: `bash.exe` (from Git Bash or WSL)
6. Arguments: `-c "cd /path/to/product-plan && ./scripts/backup-db-local.sh"`

---

## 📦 Backup Storage Locations

### Local Backups

- **Configuration:** `~/akount-backups/YYYY-MM-DD/`
- **Database:** `~/akount-db-backups/`
- **Retention:** 30 days (config), 7 days (db)

### Cloud Backups (Optional)

To upload backups to cloud storage, uncomment and configure in scripts:

**AWS S3:**

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
sudo apt-get install awscli  # Ubuntu

# Configure
aws configure

# Uncomment in scripts:
# aws s3 cp "$BACKUP_FILE" s3://your-bucket/backups/
```

**Cloudflare R2:**

```bash
# Install rclone
brew install rclone  # macOS

# Configure
rclone config

# Uncomment in scripts:
# rclone copy "$BACKUP_FILE" r2:akount-backups/
```

---

## 🚨 Emergency Recovery

### Scenario 1: Lost .env file

```bash
# 1. Find latest config backup
ls -lt ~/akount-backups/

# 2. Decrypt and restore
cd ~/akount-backups/2026-01-29
openssl enc -aes-256-cbc -d -in env-files_*.tar.gz.enc -out env-files.tar.gz -k "PASSWORD"
tar xzf env-files.tar.gz

# 3. Copy .env back to project
cp .env /path/to/product-plan/.env
```

### Scenario 2: Database corrupted

```bash
# 1. Find latest database backup
ls -lt ~/akount-db-backups/

# 2. Restore to new database
createdb akount_restored
gunzip -c ~/akount-db-backups/akount_20260129_*.sql.gz | psql akount_restored

# 3. Update DATABASE_URL in .env
# Change: postgresql://...akount
# To:     postgresql://...akount_restored

# 4. Restart application
npm run dev
```

### Scenario 3: Lost Git repository

```bash
# 1. Clone from backup remote
git clone git@gitlab.com:yourusername/akount-backup.git akount-recovered

# 2. Re-add primary remote
cd akount-recovered
git remote add origin git@github.com:yourusername/akount.git

# 3. Push back to primary
git push origin --all
git push origin --tags
```

---

## ✅ Pre-Flight Checklist

Before starting development, ensure:

- [ ] Dual Git remotes configured (`git remote -v` shows origin + backup)
- [ ] Configuration backup script runs successfully
- [ ] Database backup script runs successfully
- [ ] Recovery test passes
- [ ] Cron jobs scheduled (if on Linux/macOS)
- [ ] Backup encryption password stored in password manager
- [ ] Cloud backup configured (optional but recommended)

---

## 📊 Monitoring Backups

### Check backup health

```bash
# List recent database backups
ls -lht ~/akount-db-backups/ | head -10

# List recent config backups
ls -lht ~/akount-backups/

# Check cron job logs
tail -f ~/akount-backups/cron.log

# Verify backup sizes (should grow over time)
du -sh ~/akount-db-backups/*
```

### Set up alerts (optional)

Create a monitoring script:

```bash
#!/bin/bash
# scripts/check-backup-health.sh

LATEST_DB_BACKUP=$(ls -t ~/akount-db-backups/*.sql.gz 2>/dev/null | head -1)
LATEST_BACKUP_AGE=$(( ($(date +%s) - $(stat -f %m "$LATEST_DB_BACKUP")) / 3600 ))

if [ $LATEST_BACKUP_AGE -gt 48 ]; then
  echo "⚠️  WARNING: Last database backup is $LATEST_BACKUP_AGE hours old"
  # Send alert (email, Slack, etc.)
  # mail -s "Backup Alert" you@example.com <<< "Last backup: $LATEST_BACKUP_AGE hours ago"
else
  echo "✅ Backups are healthy (last: $LATEST_BACKUP_AGE hours ago)"
fi
```

---

## 🔒 Security Notes

**Encryption:**

- All config backups are encrypted with AES-256
- Store backup password in password manager (NOT in Git)
- Use strong passwords (20+ characters)

**Storage:**

- Local backups: Restricted to your user (`chmod 600`)
- Cloud backups: Use encrypted buckets
- Never commit backups to Git

**Access:**

- Limit access to backup directories
- Use SSH keys for Git remotes (not passwords)
- Enable 2FA on all cloud accounts

---

## 📚 References

- [BACKUP-SECURITY.md](../BACKUP-SECURITY.md) - Complete backup & security guide
- [docs/architecture/operations.md](../docs/architecture/operations.md) - Operations procedures
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Git Remote Management](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)

---

**Last Updated:** 2026-01-29
**Maintained by:** Development Team
