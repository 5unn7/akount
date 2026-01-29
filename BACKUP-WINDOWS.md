# Backup Setup for Windows

**Platform:** Windows with Git Bash
**Time Required:** 15 minutes

---

## ✅ What's Already Done

- [x] **Configuration Backup Created**
  - Location: `C:\Users\Sunny\akount-backups\2026-01-29\`
  - Files: `.env`, `.claude/settings.local.json`, `package.json`
  - Size: 777 bytes
  - Date: 2026-01-29 09:21 AM

---

## 🚀 Next Steps

### 1. Set Up Git Backup Remote (5 minutes)

Since you're on Windows, here's the manual setup:

**Option A: GitLab (Recommended)**

```bash
# 1. Create repository on GitLab
# Go to: https://gitlab.com/projects/new
# Name it: akount-backup
# Set to PRIVATE

# 2. Add GitLab as backup remote
git remote add backup git@gitlab.com:YOUR_USERNAME/akount-backup.git

# 3. Push to backup
git push backup main

# 4. Verify both remotes
git remote -v
```

**Option B: Use Automated Script (Interactive)**

```bash
# Run in Git Bash
./scripts/setup-git-backup.sh

# Follow prompts:
# - Choose provider (1=GitLab, 2=Bitbucket)
# - Enter username
# - Enter repo name
```

---

### 2. Set Up Encrypted Configuration Backups (5 minutes)

**Windows-Compatible Backup:**

Since the encryption script needs OpenSSL, here's a simpler Windows approach:

```bash
# Quick backup (already done automatically)
bash scripts/quick-backup-setup.sh

# For encrypted backups, install OpenSSL:
# - Download from: https://slproweb.com/products/Win32OpenSSL.html
# - Or use: choco install openssl (if you have Chocolatey)

# Then run:
bash scripts/backup-config.sh
```

**Or use Windows ZIP with password:**

```powershell
# In PowerShell
$date = Get-Date -Format "yyyy-MM-dd"
$backupDir = "$env:USERPROFILE\akount-backups\$date"
New-Item -ItemType Directory -Force -Path $backupDir

# Copy files
Copy-Item .env, .claude\settings.local.json, package.json $backupDir\

# Compress (Windows 10/11)
Compress-Archive -Path "$backupDir\*" -DestinationPath "$backupDir\config-backup.zip"

Write-Host "Backup created: $backupDir\config-backup.zip"
```

---

### 3. Set Up Automated Daily Backups (5 minutes)

**Windows Task Scheduler Setup:**

1. Open Task Scheduler (search in Start menu)

2. Click "Create Basic Task"

3. Configure:
   - **Name:** Akount Config Backup
   - **Trigger:** Daily at 2:00 AM
   - **Action:** Start a program
   - **Program:** `C:\Program Files\Git\bin\bash.exe`
   - **Arguments:** `-c "cd 'W:\Marakana Corp\Companies\akount\Development\Brand\aggoogle\product-plan' && ./scripts/quick-backup-setup.sh"`

4. Click Finish

**Test it:**
```bash
# Run task manually in Task Scheduler
# Check: C:\Users\Sunny\akount-backups\
```

---

## 🗄️ Database Backups (When DB is Set Up)

**Prerequisites:**
- PostgreSQL installed (or use Docker)
- DATABASE_URL in .env
- Database is running

**Install PostgreSQL Client Tools:**

```bash
# Option 1: Chocolatey
choco install postgresql

# Option 2: Download from
# https://www.postgresql.org/download/windows/

# Option 3: Use Docker PostgreSQL
# (includes pg_dump)
```

**Run Database Backup:**

```bash
# Once DB is set up
bash scripts/backup-db-local.sh

# Test recovery
bash scripts/test-recovery.sh
```

**Automate with Task Scheduler:**
- Same as config backup above
- Run at 3:00 AM daily
- Script: `./scripts/backup-db-local.sh`

---

## 📋 Verification Checklist

Run these commands to verify everything is set up:

```bash
# 1. Check Git remotes (should show origin + backup)
git remote -v

# 2. Check config backups exist
ls ~/akount-backups/

# 3. Check backup contents
tar tzf ~/akount-backups/2026-01-29/config-backup_*.tar.gz

# 4. Test backup restoration
mkdir test-restore
cd test-restore
tar xzf ~/akount-backups/2026-01-29/config-backup_*.tar.gz
ls -la
cd ..
rm -rf test-restore
```

---

## 🆘 Quick Recovery Guide

### Lost .env file?

```bash
# Find latest backup
ls ~/akount-backups/

# Restore from backup
cd ~/akount-backups/2026-01-29
tar xzf config-backup_*.tar.gz
cp .env "W:/Marakana Corp/Companies/akount/Development/Brand/aggoogle/product-plan/.env"
```

### Lost Git repository?

```bash
# Clone from backup remote (once set up)
git clone git@gitlab.com:YOUR_USERNAME/akount-backup.git akount-recovered
cd akount-recovered
git remote add origin git@github.com:5unn7/akount.git
```

---

## 🔐 Security Notes

**Current Backup Security:**
- ✅ Backups stored in user home directory (`C:\Users\Sunny\`)
- ✅ Not committed to Git
- ⚠️ Not encrypted (use backup-config.sh for encryption)

**Recommendations:**
1. Set up GitLab backup remote (private repository)
2. Store backup password in password manager
3. Enable Windows File History for extra protection
4. Consider cloud backup (OneDrive, Dropbox, Google Drive)

---

## 📊 Current Status

| Item | Status | Location |
|------|--------|----------|
| **Git Primary Remote** | ✅ Set up | GitHub (5unn7/akount) |
| **Git Backup Remote** | ⏳ Manual setup needed | - |
| **Config Backup** | ✅ Created | `~/akount-backups/2026-01-29/` |
| **Config Backup Automated** | ⏳ Task Scheduler setup | - |
| **Database Backup** | ⏳ Needs DB setup first | - |

---

## 🎯 Priority Actions

### Today (Critical):
1. [ ] Set up GitLab backup remote (5 min)
2. [ ] Push code to backup remote (1 min)
3. [ ] Store credentials in password manager (3 min)

### This Week:
1. [ ] Set up Task Scheduler for config backups (5 min)
2. [ ] Test backup restoration (2 min)
3. [ ] Install OpenSSL for encrypted backups (optional)

### When Database is Ready:
1. [ ] Run database backup script
2. [ ] Set up automated DB backups
3. [ ] Test database recovery

---

## 📚 References

- [BACKUP-QUICKSTART.md](./BACKUP-QUICKSTART.md) - Quick start guide
- [BACKUP-SECURITY.md](./BACKUP-SECURITY.md) - Complete security guide
- [scripts/README.md](./scripts/README.md) - Script documentation
- [Git Bash for Windows](https://gitforwindows.org/)
- [PostgreSQL for Windows](https://www.postgresql.org/download/windows/)

---

**Last Updated:** 2026-01-29
**Your Backup Location:** `C:\Users\Sunny\akount-backups\`
**Next Action:** Set up GitLab backup remote
