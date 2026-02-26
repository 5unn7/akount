# Akount MVP Deployment Checklist (1,000 Users)

**Target:** Launch production-ready Akount for first 1,000 users
**Estimated Cost:** ~$250-350/month
**Timeline:** 2-3 weeks (if developer works full-time)

---

## Phase 1: Account Setup (Day 1 - 2 hours)

### Required Accounts

| Service | Purpose | Free Tier? | Cost (if paid) |
|---------|---------|------------|----------------|
| ☐ **DigitalOcean** | Hosting (servers, database, Redis) | No | $150-200/month |
| ☐ **Clerk** | User authentication | Yes (up to 10K MAU) | Free for 1K users |
| ☐ **Lambda Labs** | GPU server for Mistral OCR | No | $150/month (T4 GPU) |
| ☐ **Cloudflare** | CDN + SSL + DDoS protection | Yes (free tier) | Free |
| ☐ **Sentry** | Error tracking | Yes (5K errors/month) | Free for MVP |
| ☐ **Logtail** | Centralized logging | Yes (3GB/month) | Free for MVP |
| ☐ **Resend** | Transactional emails | Yes (3K emails/month) | Free for MVP |
| ☐ **Namecheap** | Domain name | No | $12/year |

**Total accounts to create:** 8

---

## Phase 2: Infrastructure Setup (Day 2-3)

### DigitalOcean Setup

#### ☐ **Step 1: Create Droplet (Web + API Server)**

**What:** Single server running Next.js + Fastify
**Size:** Basic Droplet - 4GB RAM / 2 vCPUs / 80GB SSD
**Cost:** $24/month
**Region:** Choose closest to your users (e.g., US East for North America)

**Actions:**
1. Log in to DigitalOcean
2. Click "Create" → "Droplets"
3. Choose Ubuntu 22.04 LTS
4. Select "Basic" plan → $24/month (4GB / 2 vCPU)
5. Add SSH key (for secure access)
6. Name it: `akount-web-api-prod`
7. Create

**What you'll get:**
- IP address (e.g., `123.45.67.89`)
- SSH access to server

---

#### ☐ **Step 2: Create Managed PostgreSQL Database**

**What:** Database for all data (users, transactions, bills, invoices)
**Size:** Basic PostgreSQL - 1GB RAM / 1 vCPU / 10GB SSD
**Cost:** $15/month

**Actions:**
1. DigitalOcean → "Databases" → "Create Database Cluster"
2. Choose PostgreSQL 16
3. Select "Basic" plan → $15/month (1GB / 1 vCPU)
4. Same region as your Droplet
5. Name it: `akount-db-prod`
6. Create

**What you'll get:**
- Connection string (looks like: `postgresql://user:pass@host:25060/db?sslmode=require`)
- Automatic daily backups
- SSL encryption enabled

---

#### ☐ **Step 3: Create Managed Redis**

**What:** Job queue for async document processing
**Size:** Basic Redis - 1GB RAM
**Cost:** $15/month

**Actions:**
1. DigitalOcean → "Databases" → "Create Database Cluster"
2. Choose Redis 7
3. Select "Basic" plan → $15/month (1GB)
4. Same region as your Droplet
5. Name it: `akount-redis-prod`
6. Create

**What you'll get:**
- Redis connection string (looks like: `rediss://user:pass@host:25061`)

---

#### ☐ **Step 4: Create Spaces (File Storage)**

**What:** Storage for uploaded receipts, invoices, PDFs
**Size:** 250GB included, then $0.02/GB
**Cost:** $5/month

**Actions:**
1. DigitalOcean → "Spaces" → "Create Space"
2. Choose same region as Droplet
3. Enable CDN
4. Name it: `akount-documents-prod`
5. Create

**What you'll get:**
- Endpoint URL (e.g., `https://akount-documents-prod.nyc3.digitaloceanspaces.com`)
- Access Key ID and Secret Key (like AWS S3)

---

### Lambda Labs GPU Setup

#### ☐ **Step 5: Rent GPU Server for Mistral OCR**

**What:** Dedicated GPU server for self-hosted Mistral OCR 2503
**Size:** 1x NVIDIA T4 (16GB VRAM)
**Cost:** $150/month (on-demand pricing)

**Actions:**
1. Create Lambda Labs account: https://lambdalabs.com/
2. Click "Instances" → "Launch Instance"
3. Choose "1x NVIDIA T4" instance
4. Select region (US or EU based on your users)
5. Choose "Ubuntu 22.04" image
6. Add your SSH key
7. Launch

**What you'll get:**
- GPU server IP address
- SSH access
- 16GB VRAM (enough for Mistral OCR 2503)

**Security setup:**
1. Configure firewall to ONLY allow connections from your DigitalOcean Droplet IP
2. No public internet access (Mistral only talks to your API server)

---

### Cloudflare Setup

#### ☐ **Step 6: Set Up CDN + SSL**

**What:** Free CDN, SSL certificate, DDoS protection
**Cost:** Free

**Actions:**
1. Create Cloudflare account: https://cloudflare.com/
2. Add your domain (e.g., `akount.com`)
3. Update nameservers at your domain registrar (Namecheap)
4. Wait 24 hours for DNS propagation
5. Enable "Full (strict)" SSL mode
6. Enable "Auto Minify" for HTML/CSS/JS
7. Enable "Brotli" compression

**What you'll get:**
- Free SSL certificate (auto-renews)
- DDoS protection
- Faster page loads (CDN caching)

---

## Phase 3: Service Configuration (Day 4-5)

### Authentication (Clerk)

#### ☐ **Step 7: Configure Clerk**

**What:** User authentication (signup, login, password resets)
**Cost:** Free for 1K users

**Actions:**
1. Create Clerk account: https://clerk.dev/
2. Create new application: "Akount"
3. Copy API keys:
   - Publishable Key (starts with `pk_test_` or `pk_live_`)
   - Secret Key (starts with `sk_test_` or `sk_live_`)
4. Enable authentication methods:
   - ✅ Email + Password
   - ✅ Google OAuth
   - ✅ Email Magic Links
5. Set up redirect URLs:
   - Sign-in: `https://app.akount.com/sign-in`
   - Sign-up: `https://app.akount.com/sign-up`
   - After sign-in: `https://app.akount.com/dashboard`

**What you'll get:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

---

### Monitoring (Sentry)

#### ☐ **Step 8: Configure Sentry Error Tracking**

**What:** Catch crashes and errors in production
**Cost:** Free (5K errors/month)

**Actions:**
1. Create Sentry account: https://sentry.io/
2. Create new project: "Akount Web"
3. Choose "Next.js" framework
4. Copy DSN (Data Source Name)
5. Create second project: "Akount API"
6. Choose "Node.js" framework
7. Copy API DSN

**What you'll get:**
- `NEXT_PUBLIC_SENTRY_DSN` (for web app)
- `SENTRY_DSN` (for API)

**Benefits:**
- Email alerts when errors happen
- Stack traces for debugging
- User impact tracking (how many users affected?)

---

### Logging (Logtail)

#### ☐ **Step 9: Configure Centralized Logging**

**What:** All server logs in one place
**Cost:** Free (3GB/month)

**Actions:**
1. Create Logtail account: https://logtail.com/
2. Create source: "Akount Web"
3. Copy source token
4. Create source: "Akount API"
5. Copy API source token

**What you'll get:**
- `LOGTAIL_SOURCE_TOKEN_WEB`
- `LOGTAIL_SOURCE_TOKEN_API`

**Benefits:**
- Search logs across all servers
- Real-time log streaming
- Alerts for specific errors

---

### Email (Resend)

#### ☐ **Step 10: Configure Email Sending**

**What:** Send password resets, invoices, notifications
**Cost:** Free (3K emails/month)

**Actions:**
1. Create Resend account: https://resend.com/
2. Add domain: `akount.com`
3. Add DNS records to Cloudflare (Resend provides them)
4. Wait for verification (usually <1 hour)
5. Create API key

**What you'll get:**
- `RESEND_API_KEY`

**Email templates to set up:**
- Welcome email (new user signup)
- Password reset
- Invoice payment received
- Monthly report

---

## Phase 4: Deploy Application (Day 6-7)

### ☐ **Step 11: Deploy Mistral OCR to GPU Server**

**SSH into Lambda Labs GPU server:**
```bash
ssh -i ~/.ssh/your-key ubuntu@your-gpu-ip
```

**Install Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Install NVIDIA Docker runtime:**
```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

**Pull and run Mistral OCR 2503:**
```bash
# Your developer will provide the exact Docker command
# This is a placeholder - actual command depends on Mistral's release
docker run -d --gpus all \
  -p 8000:8000 \
  --name mistral-ocr \
  --restart unless-stopped \
  mistral/pixtral-ocr:2503
```

**Test it works:**
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

**Configure firewall (only allow your Droplet IP):**
```bash
sudo ufw allow from YOUR_DROPLET_IP to any port 8000
sudo ufw enable
```

---

### ☐ **Step 12: Deploy Web + API to DigitalOcean Droplet**

**SSH into DigitalOcean Droplet:**
```bash
ssh root@your-droplet-ip
```

**Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Install PM2 (process manager):**
```bash
sudo npm install -g pm2
```

**Clone your repository:**
```bash
cd /var/www
git clone https://github.com/your-org/akount.git
cd akount
```

**Install dependencies:**
```bash
npm install
```

**Create `.env` file:**
```bash
nano .env
```

**Add all environment variables:**
```bash
# Database
DATABASE_URL="postgresql://user:pass@your-db-host:25060/db?sslmode=require"

# Redis
REDIS_URL="rediss://user:pass@your-redis-host:25061"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_xxxxx"
CLERK_SECRET_KEY="sk_live_xxxxx"

# Mistral OCR
MISTRAL_OCR_URL="http://your-gpu-ip:8000"

# Spaces (S3-compatible)
SPACES_ENDPOINT="https://nyc3.digitaloceanspaces.com"
SPACES_BUCKET="akount-documents-prod"
SPACES_ACCESS_KEY="your-access-key"
SPACES_SECRET_KEY="your-secret-key"

# Sentry
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"

# Logtail
LOGTAIL_SOURCE_TOKEN_WEB="xxxxx"
LOGTAIL_SOURCE_TOKEN_API="xxxxx"

# Resend
RESEND_API_KEY="re_xxxxx"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://app.akount.com"
API_URL="https://api.akount.com"
```

**Build the app:**
```bash
npm run build
```

**Run database migrations:**
```bash
npm run db:migrate:deploy
```

**Start the app with PM2:**
```bash
pm2 start npm --name "akount-web" -- run start
pm2 start npm --name "akount-api" -- run api:start
pm2 save
pm2 startup
```

**Configure Nginx (reverse proxy):**
```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/akount
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name app.akount.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.akount.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable sites:**
```bash
sudo ln -s /etc/nginx/sites-available/akount /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### ☐ **Step 13: Configure DNS**

**In Cloudflare DNS:**
1. Add A record: `app.akount.com` → Your Droplet IP
2. Add A record: `api.akount.com` → Your Droplet IP
3. Enable "Proxied" (orange cloud) for both
4. SSL will auto-activate in 10-15 minutes

---

## Phase 5: Testing (Day 8-9)

### ☐ **Step 14: Smoke Tests**

**Test authentication:**
1. Go to `https://app.akount.com/sign-up`
2. Create test account
3. Verify email arrives (check spam folder)
4. Sign in

**Test receipt upload:**
1. Upload a test receipt (photo or PDF)
2. Check Logtail logs - should see:
   - Job added to queue
   - Worker picked up job
   - Mistral OCR extraction started
   - Bill created
3. Verify Bill appears in UI

**Test bank import:**
1. Upload a test CSV file
2. Verify transactions imported
3. Check categorization worked

**Test error tracking:**
1. Trigger a test error in the app
2. Check Sentry - should receive email alert
3. View error details in Sentry dashboard

---

### ☐ **Step 15: Load Test**

**Use Artillery or k6 to simulate 100 concurrent users:**
```bash
npm install -g artillery
artillery quick --count 100 --num 10 https://app.akount.com
```

**Monitor:**
- CPU usage (should stay <70%)
- Memory usage (should stay <80%)
- Response times (<500ms for page loads)
- Error rates (should be 0%)

---

## Phase 6: Security Hardening (Day 10)

### ☐ **Step 16: Security Checklist**

**Firewall rules (DigitalOcean Droplet):**
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**Database security:**
- ✅ SSL required (already enabled in connection string)
- ✅ Trusted sources only (DigitalOcean firewall)
- ✅ Daily backups enabled

**API security:**
- ✅ Rate limiting (add to Fastify)
- ✅ CORS configured (only allow app.akount.com)
- ✅ Helmet.js enabled (security headers)

**GPU server security:**
- ✅ Firewall allows ONLY Droplet IP
- ✅ SSH key-only login (no passwords)
- ✅ No public internet access

**File upload security:**
- ✅ File type validation (only images and PDFs)
- ✅ Virus scanning (optional - ClamAV)
- ✅ Pre-signed URLs (expire after 1 hour)

---

## Phase 7: Monitoring Setup (Day 11)

### ☐ **Step 17: Set Up Alerts**

**Sentry alerts:**
- Email when error rate > 10 errors/minute
- Slack notification for new error types

**Logtail alerts:**
- Email when "FATAL" or "CRITICAL" log appears
- Alert when GPU server goes offline

**DigitalOcean monitoring:**
- Email when Droplet CPU > 90% for 5 minutes
- Email when disk space > 80%

**Uptime monitoring (free):**
1. Create UptimeRobot account: https://uptimerobot.com/
2. Add monitors:
   - `https://app.akount.com` (check every 5 minutes)
   - `https://api.akount.com/health` (check every 5 minutes)
3. Email notifications on downtime

---

## Phase 8: Documentation (Day 12)

### ☐ **Step 18: Create Runbooks**

**Create these documents:**
1. **Deployment guide** (this checklist)
2. **Incident response playbook** (what to do if site goes down)
3. **Backup and restore procedure**
4. **Scaling guide** (how to add more servers at 2K users)

---

## Phase 9: Launch! (Day 13)

### ☐ **Step 19: Pre-Launch Checklist**

- [ ] SSL certificate working (green lock in browser)
- [ ] All tests passing
- [ ] Error tracking working (Sentry)
- [ ] Logs aggregating (Logtail)
- [ ] Uptime monitoring configured (UptimeRobot)
- [ ] Backups enabled (daily PostgreSQL backups)
- [ ] Domain email working (test@akount.com)
- [ ] Marketing site live (www.akount.com)
- [ ] Terms of Service + Privacy Policy pages

### ☐ **Step 20: Invite First 10 Beta Users**

1. Send invite emails
2. Watch Logtail logs in real-time
3. Monitor Sentry for errors
4. Gather feedback in Slack/Discord

### ☐ **Step 21: Gradual Rollout**

**Week 1:** 10 users (beta testers)
**Week 2:** 50 users (early adopters)
**Week 3:** 200 users (friends and family)
**Week 4:** 500 users (soft launch)
**Month 2:** 1,000 users (full MVP launch)

---

## Monthly Costs (1,000 Users)

| Service | Cost | Notes |
|---------|------|-------|
| DigitalOcean Droplet | $24/month | 4GB RAM, can scale to $48 at 2K users |
| PostgreSQL Database | $15/month | 1GB, automatic backups |
| Redis | $15/month | 1GB, job queue |
| Spaces (File Storage) | $5/month | 250GB included |
| Lambda Labs GPU | $150/month | Self-hosted Mistral OCR |
| Cloudflare | Free | CDN + SSL + DDoS |
| Clerk | Free | Up to 10K users |
| Sentry | Free | 5K errors/month |
| Logtail | Free | 3GB logs/month |
| Resend | Free | 3K emails/month |
| Domain | $1/month | $12/year |
| **Total** | **$225/month** | ~$0.22 per user |

---

## What If Something Goes Wrong?

### Common Issues

**Issue: GPU server is slow (>10s per receipt)**
- Solution: Check GPU utilization (`nvidia-smi`). If low, increase batch size in Docker config.

**Issue: Database connection errors**
- Solution: Check connection string in `.env`. Verify DigitalOcean firewall allows Droplet IP.

**Issue: Uploads failing**
- Solution: Check Spaces access keys. Verify CORS settings in Spaces console.

**Issue: Sentry not receiving errors**
- Solution: Verify DSN in `.env`. Check Sentry project settings.

**Issue: Emails not sending**
- Solution: Verify domain DNS records in Resend. Check API key.

---

## Support Contacts

- **DigitalOcean Support:** https://www.digitalocean.com/support
- **Lambda Labs Support:** support@lambdalabs.com
- **Clerk Support:** https://clerk.com/support
- **Sentry Support:** https://sentry.io/support

---

## Next: Scale to 5K Users

When you hit 1,000 users, see `scaling-to-5k-users.md` for:
- Load balancer setup
- Multiple Droplets
- Database read replicas
- Second GPU server for Mistral

---

**Estimated total setup time:** 10-13 days (if developer works full-time)
**Monthly cost:** ~$225 for first 1,000 users
**Time to first paying user:** Day 14 (after launch)
