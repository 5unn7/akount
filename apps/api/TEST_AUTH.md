# Testing Authentication

## How to test the `/me` endpoint

### Option 1: Using the Web App (Recommended)

1. Start the web app: `npm run dev` (from root)
2. Sign in at http://localhost:3000/sign-in
3. Open browser DevTools > Console
4. Run this code to get your session token:

```javascript
// Get session token from Clerk
const token = await window.Clerk.session.getToken()
console.log('Token:', token)

// Test the API endpoint
const response = await fetch('http://localhost:3001/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const data = await response.json()
console.log('User data:', data)
```

### Option 2: Using curl (after getting token from Option 1)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:3001/me
```

### Option 3: Using Thunder Client or Postman

1. Create a new GET request to `http://localhost:3001/me`
2. Add header: `Authorization: Bearer YOUR_TOKEN_HERE`
3. Send request

## Expected Response (Success)

```json
{
  "id": "cm...",
  "clerkUserId": "user_...",
  "email": "your@email.com",
  "name": "Your Name",
  "tenants": [
    {
      "id": "cm...",
      "name": "My Workspace",
      "role": "OWNER"
    }
  ]
}
```

## Expected Response (No Auth)

```json
{
  "error": "Unauthorized",
  "message": "Missing Authorization header"
}
```

## Expected Response (Invalid Token)

```json
{
  "error": "Unauthorized",
  "message": "Failed to verify token"
}
```
