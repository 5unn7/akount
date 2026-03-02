# Onboarding UX Redesign — Personal-First Experience

> **Context:** Redesign onboarding to feel normal for students/employees, scale naturally to solopreneurs
> **North Star:** Student in Toronto, freelancer in NYC, founder with US LLC + India branch — all feel at home
> **Date:** 2026-02-16

---

## Design Philosophy

**Personal first, maybe-business-later.**

This onboarding NEVER assumes you're an entrepreneur. It starts with:

> "We'll help you understand and organize your money."

Not: "Set up your business account."
Not: "What's your company name?"
Not: "Tell us about your entity."

**The word "entity" appears only when you have 2+ of them.** Until then, you have "your account."

---

## The Flow (Step-by-Step)

### Pre-Onboarding: Clerk Signup

User provides:
- **First name, last name** (required by Clerk)
- **Email address** (verified)
- **Phone number** (optional, but Clerk captures if provided)

**What we DON'T ask yet:** Password (Clerk handles), country, address, employment, intent.

**What we DO auto-capture:**
- IP address (for country inference)
- Signup timestamp
- Referrer (if applicable)

---

### Question 1: "Who are we organizing money for?"

**Screen Title:** "Welcome to Akount"

**Copy:**
> We'll help you understand and organize your money. Who are we helping today?

**Options (cards with icons):**

| Option | Icon | Description |
|--------|------|-------------|
| **Just me** | 👤 Single person | Personal finances only |
| **Me + my business** | 👤 + 🏢 | Personal and business together |

**Why this question first?**
- Sets the entire path (personal-only vs personal+business)
- Simple binary choice, no jargon
- "Just me" feels normal (student, employee, anyone)
- "Me + my business" doesn't assume entity knowledge

**Edge case:** If they choose "Me + my business", we still default to personal entity creation, then immediately follow up with business entity setup.

---

### Question 2: "What do you want help with?"

**Screen Title:** "Let's personalize your experience"

**Copy:**
> Select all that apply — we'll tailor Akount to your goals.

**Options (multi-select checkboxes):**

| Intent | Icon | Description |
|--------|------|-------------|
| **Track where my money goes** | 📊 | Spending insights, categorization |
| **Get better at saving** | 🎯 | Savings goals, budgets |
| **Stay tax-ready with less stress** | 📋 | Tax prep, deductions, quarterly estimates |
| **Keep an eye on debt/loans** | 💳 | Debt payoff, interest tracking |
| **Just exploring** | 🧭 | No specific goal yet |

**Why multi-select?**
- Users often have 2-3 goals (e.g., track spending + tax-ready)
- No single "right answer" pressure
- Drives personalization (e.g., "tax-ready" users see more tax tips)

**Copy note:** "Stay tax-ready with less stress" is better than "Tax planning" (less scary for non-business users).

---

### Question 3: "What's your employment situation?"

**Screen Title:** "A little about you"

**Copy:**
> This helps us show you the right tools and tips.

**Options (single-select radio buttons):**

| Employment Status | When to Show Business Entity Setup |
|-------------------|-------------------------------------|
| **Student** | Never (unless they opt-in later) |
| **Employed full-time** | Never |
| **Employed part-time** | Never |
| **Self-employed / Freelance** | ✅ **YES** — ask next: "Want to set up business tracking?" |
| **Business owner / Founder** | ✅ **YES** — ask next: "Want to set up business tracking?" |
| **Not currently working** | Never |
| **Prefer not to say** | Never (treated as personal-only) |

**CRITICAL:** This question is **required**. No skip button.

**Why required?**
- Determines whether we offer business entity setup
- Helps personalize dashboard (e.g., students see budgeting tips, self-employed see tax deduction reminders)
- Without this, we can't deliver on "personalized experience"

**Conditional Logic:**
- If user selected "Self-employed" OR "Business owner/Founder" **AND** they chose "Me + my business" in Question 1:
  → **Immediately after this question**, show Question 4 (business entity setup)
- Otherwise:
  → Skip to Question 5 (address)

---

### Question 4: "Set up business tracking?" (Conditional)

**Screen Title:** "Want to track your business separately?"

**Copy:**
> Since you're self-employed, you can keep personal and business finances separate. This helps with taxes and clarity.

**Options (cards):**

| Option | Icon | Description |
|--------|------|-------------|
| **Yes, set up business** | 🏢 | "I want separate tracking" |
| **Not right now** | 👤 | "I'll add it later if needed" |

**If "Yes, set up business":**
- Ask for:
  - Business name (text input, e.g., "Acme Consulting")
  - Entity type (dropdown: Sole Proprietorship, LLC, Corporation, Partnership)
  - Country of incorporation (country picker)
  - Industry (optional dropdown, e.g., Consulting, E-commerce, Creative Services)
- Create **two entities**:
  1. Personal entity (entityType = 'PERSONAL', country from residential address)
  2. Business entity (entityType = user's choice, country = incorporation country)

**If "Not right now":**
- Create only personal entity
- Show reminder in dashboard: "💡 **Tip:** You can set up business tracking anytime in Settings → Entities"

**Copy note:** "Track your business separately" is better than "Create a business entity" (less technical).

---

### Question 5: "Where do you live?"

**Screen Title:** "Your location"

**Copy:**
> We'll use this to show you the right tax info and currency.

**Fields (single form):**

| Field | Type | Pre-fill | Required |
|-------|------|----------|----------|
| **Country** | Dropdown (195 countries) | Inferred from IP | Yes |
| **Street address** | Text input | Empty | Yes |
| **City** | Text input | Empty | Yes |
| **Province/State** | Dropdown (context-aware) | Empty | Yes (if applicable) |
| **Postal/Zip code** | Text input | Empty | Yes |

**Smart defaults:**
- Country is **pre-filled from IP address** (e.g., IP from Toronto → Canada)
- Province/State dropdown appears only if country requires it (e.g., Canada, US, India)
- Province/State options are **country-specific** (e.g., if Canada → shows ON, BC, QC, etc.)
- Postal code format validation is **country-aware** (e.g., Canada = A1A 1A1, US = 12345)

**Tax residence inference:**
- We **automatically** set `taxResidence = country from address`
- Users can override later in Settings if they're expats/digital nomads
- For 95% of users, residential address = tax residence

**Currency inference:**
- `functionalCurrency` is set based on country (e.g., Canada → CAD, US → USD, India → INR)
- Users can change in Settings if needed (e.g., USD-based business in Canada)

**Why ask for full address?**
- KYC/identity verification (required for banking integrations)
- Tax filing address (needed for CRA, IRS, etc.)
- Future: shipping for tax documents, debit cards

---

### Question 6: "Almost there!" (Confirmation)

**Screen Title:** "Review your info"

**Copy:**
> Double-check everything looks good. You can change these later in Settings.

**Summary card:**

```
👤 Personal Account

📧 Email: john.doe@example.com
📞 Phone: +1 (416) 555-0123
📍 Location: Toronto, ON, Canada
💼 Employment: Self-employed
🎯 Goals: Track spending, Tax-ready

[Optional: Business entity summary if they set one up]
🏢 Business: Acme Consulting (LLC, United States)
```

**Buttons:**
- **Looks good** (primary) → Creates tenant + entity(ies), redirects to dashboard
- **Edit** (secondary) → Go back to Question 1

**What happens when they click "Looks good":**
1. **Backend:**
   - Create `Tenant` (onboardingStatus = 'IN_PROGRESS')
   - Create `Entity` (entityType = 'PERSONAL', country, currency)
   - If business setup: Create second `Entity` (entityType = user's choice)
   - Create `OnboardingProgress` record (currentStep = 6, version = 1)
   - Create `TenantUser` record (role = 'OWNER')
   - Sync to Clerk metadata: `onboardingCompleted: true`
2. **Frontend:**
   - Redirect to `/dashboard` or `/overview`
   - Show success toast: "✨ **Welcome to Akount!** Your account is ready."
   - Optional: Show onboarding checklist widget ("Connect your first bank account")

---

## Copy Principles

### 1. **Human, not corporate**

❌ "Please provide your residential address for KYC compliance."
✅ "Where do you live? We'll use this to show you the right tax info."

### 2. **Active voice, conversational**

❌ "Your employment status will be used to personalize your experience."
✅ "This helps us show you the right tools and tips."

### 3. **No jargon unless necessary**

❌ "Select your entity type and functional currency."
✅ "What kind of business? We'll set your default currency based on location."

### 4. **Explain the "why"**

Every question has a 1-sentence reason:
- "This helps us show you the right tools and tips." (employment)
- "We'll use this to show you the right tax info and currency." (address)
- "This helps with taxes and clarity." (business tracking)

### 5. **Positive framing**

❌ "Don't worry, you can change this later."
✅ "You can change these later in Settings."

---

## Progressive Disclosure: What We DON'T Ask

**Intentionally deferred to post-onboarding:**

| Field | When We Ask It | Why Defer |
|-------|----------------|-----------|
| **Date of birth** | When they connect a bank (required for Plaid) | Not needed for core experience |
| **Income** | Optional in Settings or when they set up budgets | Feels invasive upfront |
| **Tax ID (SIN/SSN)** | When they need tax filing features | Privacy concern, not needed for MVP |
| **Fiscal year end** | When they create business entity (defaults to Dec 31) | Most users don't know/care |
| **Bank accounts** | Dashboard onboarding checklist | Let them explore first |

**Philosophy:** Ask only what's **required to personalize the dashboard**. Everything else is progressive.

---

## Mental Models: Personal vs Business

### For "Just me" users (95% of people):

**What they see:**
- Dashboard title: "Your Money"
- Account label: "Personal Account" (or just their name)
- No entity switcher (hidden)
- No "entity" terminology anywhere

**What they DON'T see:**
- The word "entity"
- Business entity setup prompts
- Multi-currency switcher (unless they connect foreign accounts)

**Upgrade path:**
- Subtle reminder in Settings: "💡 **Tip:** You can track business finances separately. [Set up business tracking →]"
- OR: When they connect a USD account in Canada, ask: "Is this a business account?"

---

### For "Me + my business" users (solopreneurs):

**What they see:**
- Dashboard title: "Your Accounts"
- Entity switcher (dropdown): "Personal - Canada" | "Acme Consulting (US LLC)"
- Separate transaction lists per entity
- Consolidated view: "All Accounts" (cross-entity overview)

**What they DO see:**
- The word "entity" (now it's necessary for clarity)
- Business-specific features: invoicing, AP, GL accounts
- Multi-currency tracking (if entities use different currencies)

**Migration UX (personal → personal + business):**

When they click "Set up business tracking" later:

1. **Rename personal entity:**
   "Your Account" → "Personal - Canada" (makes entity concept explicit)

2. **Create business entity:**
   Show wizard: business name, entity type, country

3. **Offer recategorization:**
   "We found 12 transactions that might be business. Want to move them to your business entity?"
   - User can select which transactions to recategorize
   - Non-destructive: creates new categorization, doesn't delete old data

4. **Show entity switcher:**
   Top-right dropdown now shows: "Personal - Canada" | "Acme Consulting (LLC)"

---

## International Design Decisions

### Country-Aware Validation

| Country | Province/State Field | Postal Code Format | Currency Default |
|---------|----------------------|--------------------|------------------|
| **Canada** | Required (ON, BC, QC, etc.) | A1A 1A1 | CAD |
| **United States** | Required (NY, CA, TX, etc.) | 12345 or 12345-6789 | USD |
| **India** | Required (state dropdown) | 110001 (6 digits) | INR |
| **UK** | Optional (county) | SW1A 1AA | GBP |
| **Australia** | Required (NSW, VIC, etc.) | 2000 (4 digits) | AUD |
| **Germany** | Optional | 10115 (5 digits) | EUR |

**Implementation:** Use `libphonenumber` for phone validation, `i18n-postal-address` for address formats.

---

### Tax Residence Edge Cases

**Scenario 1:** Digital nomad living in Thailand, paying taxes in Canada
**Solution:** Let them set `taxResidence = CA` in Settings, residential address = TH

**Scenario 2:** US citizen living abroad (FATCA reporting)
**Solution:** Support multiple tax residences in Settings (primary + secondary)

**Scenario 3:** Student on visa, not tax resident
**Solution:** Tax residence defaults to residential country, but can be set to "None" in Settings

**Default behavior:** 95% of users → residential address = tax residence. Edge cases handled post-onboarding.

---

## Copy Examples (Full Screens)

### Screen 1: Who are we organizing money for?

```
┌────────────────────────────────────────────────────┐
│                                                    │
│              Welcome to Akount ✨                  │
│                                                    │
│    We'll help you understand and organize your    │
│    money. Who are we helping today?               │
│                                                    │
│  ┌────────────────┐       ┌────────────────┐     │
│  │                │       │                │     │
│  │       👤       │       │    👤 + 🏢     │     │
│  │                │       │                │     │
│  │    Just me     │       │ Me + my business│     │
│  │                │       │                │     │
│  │ Personal finances│       │ Personal and   │     │
│  │      only       │       │  business together│  │
│  │                │       │                │     │
│  └────────────────┘       └────────────────┘     │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Screen 2: What do you want help with?

```
┌────────────────────────────────────────────────────┐
│                                                    │
│        Let's personalize your experience           │
│                                                    │
│    Select all that apply — we'll tailor Akount    │
│    to your goals.                                  │
│                                                    │
│  ☐ 📊 Track where my money goes                   │
│  ☐ 🎯 Get better at saving                        │
│  ☐ 📋 Stay tax-ready with less stress             │
│  ☐ 💳 Keep an eye on debt/loans                   │
│  ☐ 🧭 Just exploring                              │
│                                                    │
│                        [ Continue → ]              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Screen 3: Employment situation

```
┌────────────────────────────────────────────────────┐
│                                                    │
│              A little about you                    │
│                                                    │
│    This helps us show you the right tools and     │
│    tips.                                           │
│                                                    │
│  What's your employment situation?                 │
│                                                    │
│  ⚪ Student                                        │
│  ⚪ Employed full-time                             │
│  ⚪ Employed part-time                             │
│  ⚪ Self-employed / Freelance                      │
│  ⚪ Business owner / Founder                       │
│  ⚪ Not currently working                          │
│  ⚪ Prefer not to say                              │
│                                                    │
│                        [ Continue → ]              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Screen 4: Business tracking (conditional)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│       Want to track your business separately?      │
│                                                    │
│    Since you're self-employed, you can keep       │
│    personal and business finances separate.       │
│    This helps with taxes and clarity.             │
│                                                    │
│  ┌────────────────┐       ┌────────────────┐     │
│  │                │       │                │     │
│  │       🏢       │       │       👤       │     │
│  │                │       │                │     │
│  │ Yes, set up    │       │  Not right now │     │
│  │    business    │       │                │     │
│  │                │       │ I'll add it later│    │
│  │ I want separate│       │    if needed    │     │
│  │    tracking    │       │                │     │
│  │                │       │                │     │
│  └────────────────┘       └────────────────┘     │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

### Screen 5: Address

```
┌────────────────────────────────────────────────────┐
│                                                    │
│               Your location                        │
│                                                    │
│    We'll use this to show you the right tax       │
│    info and currency.                             │
│                                                    │
│  Country                                           │
│  [ Canada ▼ ]                                      │
│                                                    │
│  Street address                                    │
│  [ 123 Main St                              ]     │
│                                                    │
│  City                                              │
│  [ Toronto                                  ]     │
│                                                    │
│  Province                                          │
│  [ Ontario ▼ ]                                    │
│                                                    │
│  Postal code                                       │
│  [ M5V 3A8                                  ]     │
│                                                    │
│                        [ Continue → ]              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## UX Research Insights (Hypotheses to Test)

### Hypothesis 1: "Just me" framing reduces abandonment

**Test:** A/B test "Just me" vs "Personal account"
**Prediction:** "Just me" feels more conversational, 5-10% higher completion

### Hypothesis 2: Multi-select intent increases engagement

**Test:** Multi-select vs single-select intent question
**Prediction:** Multi-select → users feel more understood → higher feature adoption

### Hypothesis 3: Employment question is not intimidating

**Test:** Track abandonment rate at employment question
**Prediction:** <5% drop-off if copy emphasizes personalization, not compliance

### Hypothesis 4: Address question feels necessary, not invasive

**Test:** Show/hide "why we ask" explanation
**Prediction:** Explanation → 3-5% higher completion (builds trust)

### Hypothesis 5: IP-based country pre-fill saves time

**Test:** Pre-filled vs empty country dropdown
**Prediction:** Pre-fill → 20-30% faster completion (fewer clicks)

---

## Edge Cases & Guardrails

### Edge Case 1: User changes country mid-onboarding

**Scenario:** User sees pre-filled "Canada", changes to "India"
**Solution:** Re-render province/state dropdown + postal code validation for India

### Edge Case 2: User selects "Prefer not to say" employment

**Scenario:** We can't offer business setup (no signal)
**Solution:** Treat as personal-only, never show business entity prompts

### Edge Case 3: User selects "Just me" then later wants business

**Scenario:** Student becomes freelancer 6 months later
**Solution:** Settings → Entities → "Add business entity" button always visible

### Edge Case 4: User has business entity in 3 countries

**Scenario:** Canada personal, US LLC, India branch
**Solution:** Each entity has separate country/currency, entity switcher shows all

### Edge Case 5: User closes browser mid-onboarding

**Scenario:** Auto-save kicks in (from v3 refactor), resume on return
**Solution:** Resume at last completed step, data intact (DB-backed)

---

## Success Metrics

**Completion Rate:**
- Target: >85% of users complete onboarding
- Benchmark: Industry average for fintech is 60-70%

**Time to Complete:**
- Target: <90 seconds for "Just me" path (4 questions)
- Target: <3 minutes for "Me + business" path (5 questions + business form)

**Personalization Accuracy:**
- Target: >90% of users see relevant dashboard content (based on intent + employment)
- Measure: Feature engagement within first 7 days

**Business Entity Adoption:**
- Target: 30% of self-employed users set up business entity during onboarding
- Target: 50% of self-employed users set up business entity within 30 days

**Migration Success:**
- Target: >95% of personal-to-business migrations complete without data loss
- Target: <10% support tickets related to entity confusion

---

## Next Steps (Implementation Sequencing)

1. ✅ **Finalize UX copy** (this document)
2. 🔄 **Create technical implementation plan** (next document)
3. ⏳ **Design high-fidelity mockups** (Figma)
4. ⏳ **Build onboarding v4 frontend** (React components)
5. ⏳ **Update backend schemas** (Prisma migration)
6. ⏳ **Test with 50 beta users** (collect feedback)
7. ⏳ **Iterate based on data** (A/B test hypotheses)
8. ⏳ **Launch to production** (gradual rollout)

---

**Document Status:** ✅ COMPLETE (UX decisions locked)
**Next Document:** `2026-02-16-onboarding-promise-delivery.md` (technical architecture)
