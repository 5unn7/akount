# Linear Custom Fields Setup Guide

**Purpose:** Create custom fields required by automations

**Time required:** 5 minutes

---

## Required Custom Fields

These fields are needed for the automations to work properly:

### 1. Customer Count (Number)

**Purpose:** Track how many customers are affected by an issue
**Used by:** Auto-Triage Bugs, Critical Escalation, Bug Fixed Notification
**Type:** Number
**Teams:** All

**Setup:**
1. Go to [Organization Settings → Custom Fields](https://linear.app/akount/settings/custom-fields)
2. Click **"New custom field"**
3. Name: `Customer Count`
4. Description: `Number of customers affected by this issue`
5. Type: **Number**
6. Icon: 👥 (optional)
7. Apply to: **All teams** (or select specific teams)
8. Save

### 2. Response Time (Number)

**Purpose:** Track customer support response time in hours
**Used by:** Customer Success SLA monitoring
**Type:** Number
**Teams:** Customer Success

**Setup:**
1. Go to [Organization Settings → Custom Fields](https://linear.app/akount/settings/custom-fields)
2. Click **"New custom field"**
3. Name: `Response Time`
4. Description: `Customer support response time in hours`
5. Type: **Number**
6. Icon: ⏱️ (optional)
7. Apply to: **Customer Success** team
8. Save

### 3. Deployment ID (Text)

**Purpose:** Link issue to specific GitHub deployment or version
**Used by:** Release tracking, incident investigation
**Type:** Text
**Teams:** Platform, Infrastructure

**Setup:**
1. Go to [Organization Settings → Custom Fields](https://linear.app/akount/settings/custom-fields)
2. Click **"New custom field"**
3. Name: `Deployment ID`
4. Description: `GitHub deployment ID or version number`
5. Type: **Text**
6. Icon: 🚀 (optional)
7. Apply to: **Platform** and **Infrastructure** teams
8. Save

### 4. Marketing Campaign (Select)

**Purpose:** Associate feature requests with marketing campaigns
**Used by:** Growth team coordination
**Type:** Select (single choice)
**Teams:** Growth, Content

**Setup:**
1. Go to [Organization Settings → Custom Fields](https://linear.app/akount/settings/custom-fields)
2. Click **"New custom field"**
3. Name: `Marketing Campaign`
4. Description: `Associated marketing campaign`
5. Type: **Select**
6. Options:
   - Launch 2026
   - Q1 Growth
   - Partner Integration
   - Product Hunt
   - Content Series
   - Other
7. Icon: 📢 (optional)
8. Apply to: **Growth** and **Content** teams
9. Save

---

## Verification

After creating fields, verify they appear:

1. Create a test issue in any team
2. Check the right sidebar → Custom Fields section
3. You should see the fields you created
4. Try setting values to confirm they work

---

## Usage Examples

### Customer Count
- Bug affecting all users: `Customer Count = 1000`
- Feature request from 5 users: `Customer Count = 5`
- Internal issue: `Customer Count = 0`

### Response Time
- Responded in 2 hours: `Response Time = 2`
- Next business day: `Response Time = 24`
- Auto-filled by automation (future)

### Deployment ID
- GitHub Actions deployment: `Deployment ID = 12345678`
- Version number: `Deployment ID = v1.2.3`
- Commit SHA: `Deployment ID = abc1234`

### Marketing Campaign
- Select from dropdown: `Launch 2026`
- Used to filter issues by campaign

---

## Next Steps

After creating custom fields:

1. ✅ Proceed to automation setup: [LINEAR-AUTOMATION-SETUP.md](./LINEAR-AUTOMATION-SETUP.md)
2. ✅ Test automations with custom field values
3. ✅ Train team to use fields when creating issues

---

**Need help?** Check [Linear Custom Fields Docs](https://linear.app/docs/custom-fields)
