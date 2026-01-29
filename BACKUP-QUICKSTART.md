# Backup Quick Start

**⏱️ Time Required:** 10 minutes to protect your work

---

## 🚨 Run These 4 Commands Now

### 1. Set Up Git Backup (2 minutes)
```bash
./scripts/setup-git-backup.sh
```
Creates a backup Git remote so you don't lose code if GitHub fails.

### 2. Backup Your Configuration (2 minutes)
```bash
./scripts/backup-config.sh
```
Backs up your .env files (encrypted). You'll need to set a password.

### 3. Test Database Backup (3 minutes)
```bash
# Only if you have a database set up
./scripts/backup-db-local.sh
./scripts/test-recovery.sh
```

### 4. Schedule Automatic Backups (3 minutes)
```bash
# On Linux/macOS
crontab -e

# Add these lines:
0 3 * * * cd $(pwd) && ./scripts/backup-db-local.sh
0 2 * * 1 cd $(pwd) && ./scripts/backup-config.sh
```

---

## ✅ Verification

Check everything is working:

```bash
# Verify Git backups
git remote -v
# Should show both 'origin' and 'backup'

# Verify config backups
ls -lh ~/akount-backups/
# Should show encrypted backup files

# Verify database backups (if DB is set up)
ls -lh ~/akount-db-backups/
# Should show .sql.gz files
```

---

## 🆘 Quick Recovery

### Lost .env file?
```bash
cd ~/akount-backups/$(ls ~/akount-backups | tail -1)
openssl enc -aes-256-cbc -d -in env-files_*.tar.gz.enc -out env.tar.gz -k "YOUR_PASSWORD"
tar xzf env.tar.gz
cp .env /path/to/product-plan/.env
```

### Database corrupted?
```bash
createdb akount_restored
gunzip -c ~/akount-db-backups/akount_*.sql.gz | psql akount_restored
# Update DATABASE_URL in .env to point to akount_restored
```

### Lost Git repo?
```bash
git clone git@gitlab.com:yourusername/akount-backup.git
```

---

## 📖 Full Documentation

- **[BACKUP-SECURITY.md](./BACKUP-SECURITY.md)** - Complete guide with all procedures
- **[scripts/README.md](./scripts/README.md)** - Script documentation
- **[docs/architecture/operations.md](./docs/architecture/operations.md)** - Operations procedures

---

**Next Steps:**
1. Store your backup password in a password manager
2. Write down recovery instructions somewhere safe
3. Test recovery once a month

**⚠️ Remember:** Untested backups = no backups
