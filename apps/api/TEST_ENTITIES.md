# Testing the Entities Endpoint

## Endpoint: GET /api/entities

Returns all entities for the authenticated user's tenant.

## Prerequisites

1. ✅ API server running on http://localhost:3001
2. ✅ Database seeded with sample data
3. ✅ User authenticated via Clerk

## How to Test

### Option 1: Using the Web App (Easiest)

1. Open http://localhost:3000
2. Sign in with your Clerk account
3. Open browser DevTools (F12)
4. Go to Console tab
5. Run this code:

```javascript
// Get your auth token
const token = await window.Clerk.session.getToken();

// Test the entities endpoint
const response = await fetch('http://localhost:3001/api/entities', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log('Entities:', data);
```

### Option 2: Using cURL

First, get your token from the browser console:

```javascript
await window.Clerk.session.getToken();
```

Then use cURL:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3001/api/entities
```

### Expected Response

```json
{
  "entities": [
    {
      "id": "...",
      "name": "Akount Inc.",
      "type": "BUSINESS",
      "currency": "USD"
    },
    {
      "id": "...",
      "name": "Personal",
      "type": "PERSONAL",
      "currency": "USD"
    }
  ]
}
```

## Testing Error Cases

### 1. Missing Authentication Token

```bash
curl http://localhost:3001/api/entities
```

Expected: `401 Unauthorized`

```json
{
  "error": "Unauthorized"
}
```

### 2. Invalid Token

```bash
curl -H "Authorization: Bearer invalid_token" http://localhost:3001/api/entities
```

Expected: `401 Unauthorized`

```json
{
  "error": "Invalid token"
}
```

### 3. User Not in Database

If you're authenticated but not in the database:

Expected: `404 Not Found`

```json
{
  "error": "Tenant not found",
  "message": "User is not associated with any tenant. Please contact support."
}
```

## Next Steps

Once this endpoint is working:
- ✅ Phase 0.3 (API Foundation) is complete!
- 🎯 Next: Phase 0.4 - First Vertical Slice (Frontend integration)
- Build a frontend component to fetch and display entities

## Troubleshooting

**Issue:** 401 Unauthorized
**Fix:** Make sure you're signed in and using a fresh token (tokens expire)

**Issue:** 404 Tenant not found
**Fix:** Run the database seed script: `cd packages/db && npx prisma db seed`

**Issue:** Empty entities array
**Fix:** Check Prisma Studio to verify entities exist: `cd packages/db && npx prisma studio`
