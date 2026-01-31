# Akount API

Backend API for the Akount financial management system.

## Stack

- **Framework:** Fastify
- **Database:** PostgreSQL (via Prisma)
- **Authentication:** Clerk
- **Language:** TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Required in `.env` at project root:

```env
DATABASE_URL="postgresql://..."
CLERK_SECRET_KEY="sk_test_..."
```

## API Endpoints

### Public Endpoints

#### `GET /`
Health check endpoint with database status.

**Response:**
```json
{
  "status": "ok",
  "system": "Akount API",
  "timestamp": "2026-01-30T20:29:02.908Z",
  "database": {
    "connected": true,
    "tenants": 1,
    "users": 1
  }
}
```

### Protected Endpoints (Require Authentication)

All protected endpoints require an `Authorization` header with a valid Clerk session token:

```
Authorization: Bearer <clerk_session_token>
```

#### `GET /auth/test`
Simple endpoint to test authentication.

**Response:**
```json
{
  "authenticated": true,
  "userId": "user_...",
  "message": "Authentication successful!"
}
```

#### `GET /me`
Get current authenticated user's information.

**Response:**
```json
{
  "id": "cm...",
  "clerkUserId": "user_...",
  "email": "user@example.com",
  "name": "John Doe",
  "tenants": [
    {
      "id": "cm...",
      "name": "My Workspace",
      "role": "OWNER"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User exists in Clerk but not in database
- `500 Internal Server Error` - Server error

## Authentication

The API uses Clerk for authentication. To authenticate requests:

1. Get a session token from Clerk (in the web app)
2. Include it in the Authorization header
3. The middleware verifies the token and populates `request.userId`

See [TEST_AUTH.md](./TEST_AUTH.md) for testing instructions.

## Project Structure

```
apps/api/
├── src/
│   ├── index.ts              # Main server file
│   ├── lib/
│   │   └── prisma.ts         # Prisma client singleton
│   ├── middleware/
│   │   └── auth.ts           # Authentication middleware
│   └── types/
│       └── fastify.d.ts      # TypeScript type extensions
├── package.json
└── tsconfig.json
```

## Development

The server runs on port **3001** by default.

### Adding New Routes

```typescript
// In index.ts or a separate routes file
server.get('/your-route', {
  onRequest: [authMiddleware]  // Add auth if needed
}, async (request, reply) => {
  // Access authenticated user
  const userId = request.userId

  // Query database
  const data = await prisma.yourModel.findMany()

  return data
})
```

### Using Prisma

The Prisma client is available at `./lib/prisma`:

```typescript
import { prisma } from './lib/prisma'

const users = await prisma.user.findMany()
```

## Validation

The API uses Zod for request validation. See [VALIDATION.md](./VALIDATION.md) for detailed documentation.

**Quick Example:**
```typescript
import { z } from 'zod'
import { validateBody } from './middleware/validation'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

server.post('/endpoint', {
  preValidation: [validateBody(schema)]
}, handler)
```

**Test Endpoints:**
- `POST /validation/test` - Test body validation
- `GET /validation/query` - Test query parameter validation

## Next Steps

- [x] Add Zod validation middleware ✅
- [x] Add error handling middleware ✅
- [ ] Create CRUD endpoints for entities
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Generate OpenAPI/Swagger documentation
