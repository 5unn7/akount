# Test Credentials

## Test User Account

For local development and testing, use these credentials:

**Email:** `testuser1@akount.local`
**Password:** `test_user_123`
**Name:** Test User 1

---

## Setup Instructions

### Option A: Manual Creation (Recommended for Development)

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Go to Sign Up page:** http://localhost:3000/sign-up

3. **Create account with test credentials:**
   - Email: `testuser1@akount.local`
   - Password: `test_user_123` (must be 8+ characters)
   - Name: Test User 1

4. **Copy your Clerk User ID:**
   - After signing in, check browser console or Clerk dashboard
   - Format: `user_xxxxxxxxxxxxx`

5. **Update seed file with your Clerk ID:**
   ```bash
   # Edit packages/db/prisma/seed.ts
   # Replace clerkUserId with your actual ID
   ```

6. **Run seed to populate test data:**
   ```bash
   cd packages/db
   npx prisma db seed
   ```

---

### Option B: Clerk Dashboard (Alternative)

1. **Go to Clerk Dashboard:** https://dashboard.clerk.com

2. **Navigate to:** Users → Create User

3. **Fill in details:**
   - Email: `testuser1@akount.local`
   - Password: `test_user_123`
   - First name: Test
   - Last name: User 1

4. **Copy the User ID** (starts with `user_`)

5. **Update seed file** with the Clerk User ID

---

## Current Test Users in Seed Data

The seed file creates these test accounts:

| Email | Clerk ID (You need to set this) | Name | Role |
|-------|----------------------------------|------|------|
| `testuser1@akount.local` | `user_xxxxxxxxxxxxx` | Test User 1 | OWNER |
| `demo@akount.com` | `user_demo_akount` | Demo User | OWNER |

---

## Seed Data Includes

After running `npx prisma db seed`, your test user will have:

- **1 Tenant:** "Demo Company"
- **2 Entities:**
  - Akount Inc. (Corporation)
  - Personal (Personal account)
- **5 Accounts:**
  - TD Chequing (CAD)
  - RBC Savings (CAD)
  - Amex Credit Card (USD)
  - Wealthsimple Investment (CAD)
  - Student Loan (CAD)
- **10 GL Accounts:** Basic chart of accounts
- **Sample transactions:** For testing import and categorization

---

## Troubleshooting

### "User not found" error
- Make sure you created the user in Clerk first
- Check that the Clerk User ID in seed.ts matches your actual Clerk user

### "Email already exists" in Clerk
- Use the existing user's Clerk ID in seed.ts
- Or delete the user in Clerk dashboard and recreate

### "Authentication error"
- Check that `.env` has valid Clerk keys
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`

### "Tenant not found"
- Run the seed script: `cd packages/db && npx prisma db seed`
- Check database: `npx prisma studio`

---

## Switching Between Test Users

To test multi-tenant scenarios, create multiple users:

```typescript
// In seed.ts, add additional users:
const testUser2 = await prisma.user.create({
  data: {
    clerkUserId: 'user_another_id',
    email: 'testuser2@akount.local',
    name: 'Test User 2',
  },
});
```

Then sign out and sign in with different credentials.

---

## Security Notes

⚠️ **Never commit real Clerk credentials to git**
⚠️ **Use test domains like `@akount.local` for development**
⚠️ **Change passwords for production deployments**

---

**Last Updated:** 2026-01-31
