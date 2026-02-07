# Budhan Backend

A production-ready Node.js REST API demonstrating modern backend architecture with TypeScript, Prisma ORM, and comprehensive observability.

## Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 24+ with ES Modules |
| **Language** | TypeScript 5.9 (strict mode) |
| **Framework** | Express 5 |
| **Database** | PostgreSQL with Prisma 7 |
| **Validation** | Zod 4 |
| **Authentication** | JWT (jsonwebtoken) |
| **Logging** | Pino + pino-http |
| **Documentation** | OpenAPI 3.0 + Swagger UI |
| **Testing** | Vitest with V8 coverage |

## Architecture

```
src/
├── index.ts                 # Application entry point
├── db/
│   └── prisma.ts            # Database client singleton
├── middleware/
│   └── auth.ts              # JWT authentication guard
├── openapi/
│   ├── setup.ts             # Zod-OpenAPI extension
│   └── registry.ts          # Schema & path definitions
├── routes/
│   ├── login/
│   │   ├── login.controller.ts
│   │   └── login.route.ts
│   └── users/v1/users/
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.schema.ts
│       ├── user.dto.ts
│       ├── user.mapper.ts
│       └── user.route.ts
├── types/
│   └── express.d.ts         # Type augmentation
└── utils/
    ├── logger.ts            # Pino configuration
    └── response.ts          # Response helpers
```

### Design Principles

- **Layered Architecture**: Routes → Controllers → Services → Database
- **Single Responsibility**: Each module handles one concern
- **Dependency Injection Ready**: Services decoupled from controllers
- **Type Safety**: Strict TypeScript with Zod validation at boundaries
- **API Versioning**: `/api/v1/` namespace for future compatibility

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/budhan_db` |
| `JWT_SECRET` | Secret for signing tokens | `your-256-bit-secret` |
| `LOG_LEVEL` | Pino log level | `info`, `debug`, `error` |
| `NODE_ENV` | Environment mode | `development`, `production` |

## API Documentation

Interactive API documentation is available via Swagger UI:

```
GET /docs        # Swagger UI
GET /openapi.json # Raw OpenAPI 3.0 spec
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/login` | No | Authenticate and receive JWT |
| `GET` | `/api/v1/users/:id` | Yes | Get user by UUID |
| `POST` | `/api/v1/users` | Yes | Create new user |

### Authentication

Protected endpoints require a Bearer token:

```bash
# Login to get token
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test1@gmail.com"}'

# Use token for protected routes
curl http://localhost:3000/api/v1/users/{id} \
  -H "Authorization: Bearer <token>"
```

## Database

### Prisma 7 with PostgreSQL Adapter

This project uses Prisma's native PostgreSQL adapter for optimal performance:

```typescript
// src/db/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
```

### Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
}
```

### Commands

```bash
npx prisma migrate dev     # Run migrations
npx prisma migrate deploy  # Production migrations
npx prisma db seed         # Seed database
npx prisma studio          # Visual database browser
```

## Logging

### Pino Configuration

Structured JSON logging in production, pretty-printed in development:

```typescript
// src/utils/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});
```

### Request Logging

Automatic HTTP request/response logging via pino-http:

```typescript
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/health", // Skip noise
  },
}));
```

### Log Output

**Development:**
```
[2026-02-07 04:01:00] INFO: Server started
    port: 3000
[2026-02-07 04:01:05] INFO: request completed
    req: { method: "GET", url: "/api/v1/users/123" }
    res: { statusCode: 200 }
    responseTime: 12
```

**Production:**
```json
{"level":30,"time":1707274860000,"msg":"Server started","port":3000}
```

## Validation

### Zod Schemas

Type-safe validation with automatic OpenAPI generation:

```typescript
// src/routes/users/v1/users/user.schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter valid email address"),
});

export const getUserSchema = z.object({
  id: z.string().uuid({ version: "v4" }),
});
```

### Controller Integration

```typescript
export async function createUserController(req: Request, res: Response) {
  const { name, email } = createUserSchema.parse(req.body); // Throws ZodError
  const user = await createUser({ name, email });
  return sendSuccess(res, user, 201);
}
```

## Error Handling

Centralized error handler with typed error responses:

```typescript
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error({ err, path: req.path, method: req.method }, "Request error");

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues.map((i) => i.message).join(", "),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({ message: `DB error: ${err.code}` });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};
```

## Testing

### Vitest Setup

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage report
```

### Test Structure

```
src/
├── middleware/
│   └── auth.test.ts           # 8 tests
├── routes/
│   ├── login/
│   │   └── login.controller.test.ts    # 8 tests
│   └── users/v1/users/
│       ├── user.controller.test.ts     # 10 tests
│       └── user.service.test.ts        # 6 tests
```

### Mocking Strategy

```typescript
// Mock Prisma client
vi.mock("../../../../db/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

// Mock Express request/response
const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};
```

### Coverage

```
32 tests across 4 test files
✓ Authentication middleware
✓ Login controller
✓ User controller
✓ User service
```

## OpenAPI Specification

### Zod-to-OpenAPI Integration

Schemas are defined once and used for both validation and documentation:

```typescript
// src/openapi/registry.ts
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const registry = new OpenAPIRegistry();

export const UserSchema = registry.register(
  "User",
  z.object({
    id: z.string().uuid().openapi({ example: "550e8400-..." }),
    email: z.string().email().openapi({ example: "user@example.com" }),
    name: z.string().openapi({ example: "John Doe" }),
  })
);

registry.registerPath({
  method: "get",
  path: "/api/v1/users/{id}",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: { content: { "application/json": { schema: UserSchema } } },
    404: { content: { "application/json": { schema: ErrorSchema } } },
  },
});
```

## Security

| Feature | Implementation |
|---------|----------------|
| **Security Headers** | Helmet.js (CSP, HSTS, X-Frame-Options, etc.) |
| **CORS** | Configurable cross-origin policy |
| **JWT Auth** | Bearer token with 1-hour expiration |
| **Input Validation** | Zod schemas on all endpoints |
| **SQL Injection** | Prisma parameterized queries |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |

## Project Status

This is an MVP demonstrating:

- Clean layered architecture
- Type-safe API development with TypeScript
- Modern ORM patterns with Prisma 7
- Structured logging for observability
- OpenAPI-first documentation
- Comprehensive test coverage

## License

ISC
