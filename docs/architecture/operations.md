# Operational Procedures

**Last Updated:** 2026-01-27
**Purpose:** Document incident management, monitoring, disaster recovery, and security best practices.

---

## Incident Management

### Severity Levels

**SEV-1 (Critical)**: Complete service outage, data loss

- **Response**: Immediate, all hands
- **Communication**: Status page, email to all users
- **Resolution Target**: Within 1 hour
- **Examples**: Database down, payment system broken, data breach

**SEV-2 (Major)**: Significant functionality broken, no workaround

- **Response**: Within 30 minutes
- **Communication**: Status page
- **Resolution Target**: Within 4 hours
- **Examples**: Cannot create invoices, bank sync failing, login slow

**SEV-3 (Minor)**: Small issue, workaround available

- **Response**: Within 2 hours
- **Communication**: Ticket system
- **Resolution Target**: Within 24 hours
- **Examples**: UI bug, minor feature broken, slow report generation

### Incident Response Plan

1. **Detect** (monitoring alert or user report)
2. **Triage** (assess severity using levels above)
3. **Communicate** (status page, team notification)
4. **Investigate** (logs, metrics, tracing)
5. **Fix** (deploy hotfix or rollback)
6. **Verify** (health checks, user testing)
7. **Post-mortem** (blameless, document lessons)

### Communication Templates

**SEV-1 Status Page:**

```
🔴 Service Disruption
We are experiencing a complete service outage. Our team is
actively working on a resolution. We will provide updates
every 15 minutes.

Last updated: [timestamp]
Next update: [timestamp + 15min]
```

**Post-Incident:**

```
✅ Incident Resolved
The issue affecting [functionality] has been resolved.
Services are operating normally. We will publish a detailed
post-mortem within 48 hours.

Impacted users: [number]
Duration: [time]
Root cause: [brief description]
```

---

## Monitoring & Alerting

### Critical Alerts (SEV-1)

**Trigger immediate page:**

- API error rate >5% for 5 minutes
- Database connection failures
- Payment processing failures
- Security breach indicators (unauthorized access attempts)
- Disk space >95%
- Memory >95% for 5 minutes

### Warning Alerts (SEV-2)

**Notify via Slack + Email:**

- API latency p95 >2s for 10 minutes
- Disk usage >80%
- Memory usage >85%
- Failed background jobs >10%
- Bank sync success rate <90%
- Email delivery failures >5%

### Info Alerts

**Dashboard only:**

- Slow queries >5s
- High memory usage >70%
- Bank sync failures (individual accounts)
- Clerk webhook delays
- Report generation taking >30s

### Alert Routing

**SEV-1:**

- PagerDuty (on-call rotation)
- Slack #incidents channel
- Email to engineering team

**SEV-2:**

- Slack #alerts channel
- Email to on-call engineer

**SEV-3:**

- Email to support queue
- Dashboard notification

**Info:**

- Dashboard only
- Weekly digest email

---

## Backup & Disaster Recovery

### Backup Strategy

**Database:**

- Automated daily backups with 30-day retention
- Point-in-time recovery (PITR) enabled
- Backups stored in separate region
- Encrypted at rest

**Attachments:**

- Daily sync to separate region (Cloudflare R2)
- Versioning enabled (30-day retention)

**Configuration:**

- Version controlled in Git
- Infrastructure as Code (Terraform/Pulumi)
- Secrets in separate vault

**Code:**

- Git repository with full history
- Daily mirror to separate provider
- Tagged releases

### Recovery Targets

**RTO (Recovery Time Objective):** 4 hours

- Maximum acceptable downtime
- Time to restore service from backup

**RPO (Recovery Point Objective):** 24 hours

- Maximum acceptable data loss
- Daily backups = 24-hour window

### Disaster Recovery Plan

**Scenario 1: Database Failure**

1. Restore database from latest backup
2. Verify data integrity (run validation queries)
3. Update connection strings
4. Deploy application
5. Run health checks
6. Communicate to users

**Scenario 2: Complete Infrastructure Loss**

1. Provision new infrastructure (Railway or backup provider)
2. Restore database from backup
3. Deploy latest application version
4. Restore file attachments from R2
5. Update DNS records
6. Run comprehensive health checks
7. Monitor for 24 hours

**Scenario 3: Data Corruption**

1. Identify corruption point-in-time
2. Restore from backup before corruption
3. Replay transactions from audit log
4. Verify data integrity
5. Communicate to affected users

### Testing Schedule

**Quarterly:**

- Backup restore test (non-production)
- Verify backup integrity
- Test recovery procedures

**Annually:**

- Full DR failover drill
- Complete infrastructure rebuild
- Team training on DR procedures

---

## Security Best Practices

### Development Security

**Code Security:**

- No secrets in code or Git (use env vars)
- Input validation on all endpoints (Zod)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React escaping + CSP headers)
- CSRF protection (SameSite cookies + tokens)
- Rate limiting per IP and per user

**Dependencies:**

- Regular updates (Dependabot)
- Security scanning in CI (npm audit, Snyk)
- Review security advisories
- Pin versions in production

### Infrastructure Security

**Network:**

- TLS 1.2+ only, strong cipher suites
- HTTPS enforced (redirect HTTP → HTTPS)
- HSTS headers enabled
- No public database access (internal VPC only)

**Data:**

- Database encryption at rest (native PostgreSQL)
- Encrypted backups
- TLS in transit for all services
- Secrets in environment variables (Railway/Render)

**Access Control:**

- Principle of least privilege
- IAM roles and policies
- Database roles with minimal permissions
- SSH key authentication (no passwords)
- MFA required for infrastructure access

### Operations Security

**Monitoring:**

- Regular dependency updates (Dependabot)
- Security scanning in CI (npm audit, Snyk)
- Quarterly security review
- Incident response plan tested
- Log all security events

**Audit:**

- All sensitive operations logged (AuditLog table)
- Login attempts logged
- Failed authentication attempts monitored
- Admin actions logged with actor ID

**Compliance:**

- GDPR data export capability
- User data deletion (right to erasure)
- Data retention policies
- Privacy policy published

### Security Incident Response

**If breach detected:**

1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Notify**: Legal, users (if PII affected), authorities (if required)
4. **Remediate**: Fix vulnerability, change credentials
5. **Review**: Post-mortem, improve security

**Notification Timeline:**

- Internal team: Immediate
- Legal: Within 1 hour
- Affected users: Within 24 hours (GDPR requirement: 72 hours)
- Authorities: As required by jurisdiction

---

## Health Checks

### Application Health

**Endpoint:** `GET /api/health`

**Checks:**

- API server responsive
- Database connection
- Redis connection
- Clerk API accessible
- Disk space available
- Memory usage acceptable

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T12:00:00Z",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "clerk": "ok",
    "disk": "ok (45% used)",
    "memory": "ok (62% used)"
  }
}
```

### Smoke Tests

**Post-Deployment:**

1. API health check passes
2. User can log in
3. Dashboard loads with data
4. Can create transaction
5. Can query database
6. Background jobs processing

**Frequency:**

- After every deployment
- Every 5 minutes in production
- Alerts if any check fails

---

## On-Call Rotation

### Schedule

- 24/7 coverage
- 1-week rotations
- Primary and secondary on-call
- Handoff meeting every Monday

### Responsibilities

- Respond to SEV-1 alerts within 5 minutes
- Triage and escalate as needed
- Update status page
- Document incidents
- Conduct post-mortems

### Compensation

- On-call stipend per week
- Additional pay for incident response
- Comp time for after-hours incidents

---

## Runbooks

### Common Issues

**Database Connection Failure:**

1. Check Railway/database status page
2. Verify connection string in env vars
3. Check connection pool exhaustion
4. Restart API server
5. Scale up database if needed

**High API Latency:**

1. Check database slow queries (Prisma Studio)
2. Check Redis connection
3. Review recent deployments
4. Check external API latency (Clerk, Plaid)
5. Scale API server if needed

**Failed Background Jobs:**

1. Check BullMQ dashboard
2. Review job error logs
3. Check Redis memory usage
4. Retry failed jobs manually
5. Fix underlying issue

---

## References

- [decisions.md](./decisions.md) - Infrastructure choices
- [processes.md](./processes.md) - Development workflows
- [schema-design.md](./schema-design.md) - Database design
- [ROADMAP.md](/ROADMAP.md) - Implementation phases
