# API Validation Guide

The Akount API uses **Zod** for runtime validation of requests and responses.

## Quick Start

### 1. Define a Schema

```typescript
import { z } from 'zod'

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).optional(),
})

type CreateUser = z.infer<typeof createUserSchema>
```

### 2. Use in Route

```typescript
import { validateBody } from './middleware/validation'

server.post('/users', {
  preValidation: [validateBody(createUserSchema)]
}, async (request, reply) => {
  const userData = request.body as CreateUser
  // userData is now validated and type-safe
  return { success: true }
})
```

## Validation Middleware

### `validateBody(schema)`

Validates request body against a Zod schema.

**Usage:**

```typescript
server.post('/endpoint', {
  preValidation: [validateBody(mySchema)]
}, handler)
```

**Error Response (400):**

```json
{
  "error": "Validation Error",
  "message": "Request body validation failed",
  "details": [
    {
      "path": "email",
      "message": "Invalid email",
      "code": "invalid_string"
    }
  ]
}
```

### `validateQuery(schema)`

Validates query parameters.

**Usage:**

```typescript
server.get('/endpoint', {
  preValidation: [validateQuery(querySchema)]
}, handler)
```

### `validateParams(schema)`

Validates URL parameters.

**Usage:**

```typescript
const paramsSchema = z.object({
  id: z.string().uuid()
})

server.get('/users/:id', {
  preValidation: [validateParams(paramsSchema)]
}, handler)
```

## Common Schemas

Located in `src/schemas/common.ts`:

### UUID Validation

```typescript
import { uuidSchema } from './schemas/common'

const schema = z.object({
  id: uuidSchema
})
```

### Pagination

```typescript
import { paginationQuerySchema } from './schemas/common'

// Returns: { page: number, limit: number }
// Defaults: page=1, limit=20
```

### Date Range

```typescript
import { dateRangeSchema } from './schemas/common'

// Returns: { startDate?: Date, endDate?: Date }
```

### Entity Type

```typescript
import { entityTypeSchema } from './schemas/common'

// Validates: 'INDIVIDUAL' | 'BUSINESS' | 'TRUST' | 'OTHER'
```

### Currency Code

```typescript
import { currencySchema } from './schemas/common'

// Validates ISO 4217 currency codes (3 letters, uppercase)
// Example: USD, EUR, GBP
```

## Test Endpoints

### POST /validation/test

Test body validation with sample data.

**Valid Request:**

```bash
curl -X POST http://localhost:3001/validation/test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }'
```

**Response:**

```json
{
  "message": "Validation successful!",
  "received": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }
}
```

**Invalid Request (bad email):**

```bash
curl -X POST http://localhost:3001/validation/test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John",
    "email": "not-an-email"
  }'
```

**Error Response:**

```json
{
  "error": "Validation Error",
  "message": "Request body validation failed",
  "details": [
    {
      "path": "email",
      "message": "Invalid email",
      "code": "invalid_string"
    }
  ]
}
```

### GET /validation/query

Test query parameter validation.

**Valid Request:**

```bash
curl "http://localhost:3001/validation/query?search=test&status=active&page=2&limit=10"
```

**Response:**

```json
{
  "message": "Query validation successful!",
  "filters": {
    "search": "test",
    "status": "active",
    "page": 2,
    "limit": 10
  }
}
```

**Invalid Request:**

```bash
curl "http://localhost:3001/validation/query?status=invalid&page=0"
```

**Error Response:**

```json
{
  "error": "Validation Error",
  "message": "Query parameters validation failed",
  "details": [
    {
      "path": "status",
      "message": "Invalid enum value. Expected 'active' | 'inactive' | 'pending', received 'invalid'",
      "code": "invalid_enum_value"
    },
    {
      "path": "page",
      "message": "Number must be greater than or equal to 1",
      "code": "too_small"
    }
  ]
}
```

## Error Handling

All validation errors are automatically caught by the global error handler and return a consistent format:

```json
{
  "error": "Validation Error",
  "message": "Request body validation failed",
  "details": [
    {
      "path": "field.nested",
      "message": "Human-readable error",
      "code": "zod_error_code"
    }
  ]
}
```

## Best Practices

### 1. Define schemas in separate files

```typescript
// src/schemas/user.ts
export const createUserSchema = z.object({...})
export const updateUserSchema = z.object({...})
export const userQuerySchema = z.object({...})
```

### 2. Export TypeScript types

```typescript
export type CreateUser = z.infer<typeof createUserSchema>
```

### 3. Reuse common patterns

```typescript
import { paginationQuerySchema } from './common'

const myQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  customField: z.string(),
})
```

### 4. Use transformations

```typescript
const schema = z.object({
  // Coerce string to number
  age: z.coerce.number(),
  // Transform to uppercase
  code: z.string().transform(s => s.toUpperCase()),
  // Parse date
  date: z.coerce.date(),
})
```

### 5. Optional fields with defaults

```typescript
const schema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
})
```

## Zod Tips

### String Validations

```typescript
z.string()
  .min(1)           // Non-empty
  .max(100)         // Max length
  .email()          // Email format
  .url()            // URL format
  .uuid()           // UUID format
  .regex(/^\d+$/)   // Custom regex
  .trim()           // Trim whitespace
  .toLowerCase()    // Transform to lowercase
```

### Number Validations

```typescript
z.number()
  .int()            // Integer only
  .positive()       // > 0
  .min(0)           // >= 0
  .max(100)         // <= 100
```

### Array Validations

```typescript
z.array(z.string())     // Array of strings
  .min(1)               // At least one item
  .max(10)              // At most 10 items
  .nonempty()           // Alias for min(1)
```

### Object Validations

```typescript
z.object({
  name: z.string(),
})
  .strict()             // No extra fields
  .partial()            // All fields optional
  .pick({ name: true }) // Only include 'name'
  .omit({ id: true })   // Exclude 'id'
```

### Union Types

```typescript
z.union([
  z.string(),
  z.number(),
])

// Or use discriminated unions
z.discriminatedUnion('type', [
  z.object({ type: z.literal('user'), userId: z.string() }),
  z.object({ type: z.literal('guest'), sessionId: z.string() }),
])
```

## Next Steps

- Create schemas for all API endpoints
- Add response validation in development mode
- Generate OpenAPI/Swagger docs from Zod schemas
- Add custom error messages for better UX
