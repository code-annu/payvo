# `@payvo/dashboard-api`

> The backend REST API for the **Payvo** merchant dashboard. Built with **Express 5**, **TypeScript**, **Inversify** (IoC/DI), **Prisma ORM**, and **Zod** for runtime validation.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Dependency Injection](#dependency-injection)
  - [Module Anatomy](#module-anatomy)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
  - [1. Install dependencies](#1-install-dependencies)
  - [2. Start infrastructure](#2-start-infrastructure)
  - [3. Run database migrations](#3-run-database-migrations)
  - [4. Start the development server](#4-start-the-development-server)
- [API Reference](#api-reference)
  - [Authentication](#authentication----apiauth)
  - [Users](#users----apiusers)
  - [Merchants](#merchants----apimerchants)
  - [API Keys](#api-keys----apimerchantsidapi-keys)
- [Authentication Flow](#authentication-flow)
  - [Token Strategy](#token-strategy)
  - [Session Management](#session-management)
  - [Refresh Token Rotation](#refresh-token-rotation)
- [Request Validation](#request-validation)
- [Error Handling](#error-handling)
  - [Error Response Shape](#error-response-shape)
  - [Error Codes Reference](#error-codes-reference)
- [Workspace Packages Used](#workspace-packages-used)
- [Testing](#testing)
- [Scripts](#scripts)
- [Development Notes](#development-notes)

---

## Overview

`@payvo/dashboard-api` is the core backend service for the Payvo merchant dashboard. It provides:

- **Secure authentication** with JWT access tokens (short-lived, 15 min) and rotating HTTP-only refresh tokens (30 days).
- **Multi-session management** — users can have concurrent sessions across devices and selectively revoke them.
- **Merchant lifecycle management** — create, activate/inactivate, and delete merchants.
- **API key management** — generate, fetch, and rotate `TEST` / `LIVE` environment API keys per merchant with configurable revocation strategies.
- **Structured error handling** with machine-readable error codes for frontend consumption.
- **Zod-powered validation** on every request boundary (body, params, query, cookies).

---

## Architecture

### Project Structure

```
apps/dashboard/api/
├── src/
│   ├── app.ts                  # Express app factory — middleware & route registration
│   ├── server.ts               # Server bootstrap — binds to port from @payvo/config
│   ├── core/
│   │   ├── config/
│   │   │   └── cookie.ts       # Refresh-token cookie options (httpOnly, secure, sameSite)
│   │   ├── di/
│   │   │   ├── inversify.config.ts   # IoC container — all singleton bindings
│   │   │   └── inversify.types.ts    # Symbol registry for DI tokens
│   │   ├── handlers/
│   │   │   └── async.catch.ts        # Async error wrapper for Express handlers
│   │   ├── middleware/
│   │   │   ├── authenticate.middleware.ts    # JWT Bearer token verification
│   │   │   ├── error-handler.middleware.ts  # Global Express error handler
│   │   │   └── validate-request.middleware.ts # Zod-based request validation factory
│   │   └── util/
│   │       └── client.util.ts        # UA parser + IP extractor for session metadata
│   └── modules/
│       ├── auth/               # Authentication & session domain
│       ├── user/               # User profile domain
│       ├── merchant/           # Merchant management domain
│       └── api-key/            # API key lifecycle domain
├── tests/
│   ├── helper/                 # Shared test utilities
│   └── integration/            # Integration tests per module
│       ├── auth/               # signup, login, logout, rotate-token tests
│       ├── user/
│       ├── merchant/
│       └── api-key/
├── .env                        # Local environment variables (not committed)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Dependency Injection

The API uses **[Inversify](https://inversify.io/)** v8 for IoC/DI. Every class is decorated with `@injectable()`, and constructor dependencies are injected with `@inject(TYPES.<Token>)`.

All bindings are registered in `src/core/di/inversify.config.ts` and all token symbols live in `src/core/di/inversify.types.ts`. Every dependency is bound in **singleton scope** — one instance per application lifecycle.

```
Container
  ├── ClientInfoUtil          (Util)
  ├── UserRepository
  ├── UserMapper
  ├── UserService
  ├── UserController
  ├── UserRouter
  ├── SessionRepository
  ├── AuthMapper
  ├── AuthService
  ├── AuthController
  ├── AuthRouter
  ├── MerchantRepository
  ├── MerchantMapper
  ├── MerchantService
  ├── MerchantController
  ├── MerchantRouter
  ├── ApiKeyRepository
  ├── ApiKeyMapper
  ├── ApiKeyService
  ├── ApiKeyController
  └── ApiKeyRouter
```

### Module Anatomy

Each business domain (auth, user, merchant, api-key) follows a strict layered pattern:

```
modules/<domain>/
├── <domain>.router.ts      # Injectable Express Router — declares routes & middleware chain
├── <domain>.controller.ts  # Request/response handling — delegates to service
├── <domain>.service.ts     # Business logic — throws typed domain errors
├── <domain>.mapper.ts      # Prisma model -> domain entity transformer
├── dto/                    # Data Transfer Objects (input shapes)
├── entity/                 # Domain entity types (output shapes)
├── error/                  # Typed AppError subclasses + error code enums
├── schema/                 # Zod validation schemas
└── repository/             # Database access layer (Prisma)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Language | TypeScript 7 |
| Framework | Express 5 |
| IoC / DI | Inversify 8 |
| ORM | Prisma (via `@payvo/database`) |
| Validation | Zod 4 |
| Hashing | Argon2 (via `@payvo/shared/crypto`) |
| JWT | Jose (via `@payvo/shared/auth/jwt`) |
| UA Parsing | ua-parser-js |
| Date Utils | date-fns |
| Testing | Vitest + Supertest |
| Package Manager | pnpm (workspace) |

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 11.25.0
- **Docker** (for the PostgreSQL database)
- All commands should be run from the **monorepo root** unless otherwise noted.

---

## Environment Variables

Create a `.env` file in `apps/dashboard/api/`. These variables are read at runtime.

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `ACCESS_TOKEN_SECRET` | Base64-encoded secret for signing JWTs | `HsnTf0kB8An...` |
| `ACCESS_TOKEN_EXPIRY_MIN` | Access token lifespan in minutes | `15` |
| `REFRESH_TOKEN_EXPIRY_DAYS` | Refresh token lifespan in days | `30` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://admin:pass@localhost:5432/payvo-development` |

> **Security note:** Never commit real secrets. The `ACCESS_TOKEN_SECRET` should be a cryptographically random base64-encoded value of at least 32 bytes.

```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

The **root** `.env` also configures Docker Compose (Postgres credentials, pgAdmin credentials, ports).

---

## Getting Started

### 1. Install dependencies

From the **monorepo root**:

```bash
pnpm install
```

### 2. Start infrastructure

Start PostgreSQL and pgAdmin via Docker Compose from the monorepo root:

```bash
docker compose up -d
```

pgAdmin will be accessible at `http://localhost:<PGADMIN_PORT>` (configured in the root `.env`).

### 3. Run database migrations

```bash
pnpm db:migrate
```

This runs Prisma migrations defined in `packages/database/migrations/`.

### 4. Start the development server

From the **monorepo root**:

```bash
pnpm --filter @payvo/dashboard-api dev
```

Or from `apps/dashboard/api/` directly:

```bash
pnpm dev
```

The server starts with `tsx --watch`, giving hot-reload on file changes. You should see:

```
Dashboard API is running on port 3000
```

**Health check:**

```
GET http://localhost:3000/health
200 OK  "OK"
```

---

## API Reference

All endpoints are prefixed with the base URL (e.g. `http://localhost:3000`).

### Authentication — `/api/auth`

Authentication endpoints use a **dual-token** strategy. The access token is returned in the JSON body; the refresh token is set as an **HTTP-only cookie** (`refreshToken`).

---

#### `POST /api/auth/signup`

Register a new user account.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "MyPass@123",
  "fullname": "Jane Doe",
  "companyName": "Acme Corp"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char (`@$!%*?&`) |
| `fullname` | string | Yes | 3 to 50 characters |
| `companyName` | string | No | Max 100 characters |

**Success response — `201 Created`:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "fullname": "Jane Doe",
      "companyName": "Acme Corp",
      "isEmailVerified": false,
      "createdAt": "2026-09-02T15:00:00.000Z"
    },
    "accessToken": "<jwt>"
  }
}
```

Sets `refreshToken` HTTP-only cookie.

**Error responses:**
- `400 Bad Request` — validation failure
- `409 Conflict` — email already registered (`EMAIL_ALREADY_EXISTS`)

---

#### `POST /api/auth/login`

Authenticate an existing user.

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "MyPass@123"
}
```

**Success response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "fullname": "Jane Doe",
      "companyName": "Acme Corp",
      "isEmailVerified": false,
      "createdAt": "2026-09-02T15:00:00.000Z"
    },
    "accessToken": "<jwt>"
  }
}
```

Sets `refreshToken` HTTP-only cookie.

**Error responses:**
- `400 Bad Request` — validation failure
- `401 Unauthorized` — wrong credentials (`INVALID_CREDENTIALS`)

---

#### `POST /api/auth/rotate-token`

Exchange the current refresh token (read from the `refreshToken` cookie) for a fresh pair of tokens. Implements **refresh token rotation** — the old refresh token is immediately invalidated.

**Cookie required:** `refreshToken`

**Success response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "<new-jwt>"
  }
}
```

Sets a new `refreshToken` cookie.

**Error responses:**
- `401 Unauthorized` — invalid (`INVALID_REFRESH_TOKEN`), expired (`EXPIRED_REFRESH_TOKEN`), or revoked (`REVOKED_REFRESH_TOKEN`) token

---

#### `POST /api/auth/logout`

Revoke the current session (based on the access token's `sid` claim).

**Authorization:** `Bearer <accessToken>`

**Success response — `204 No Content`**

---

#### `POST /api/auth/logout-all`

Revoke **all** active sessions for the authenticated user.

**Authorization:** `Bearer <accessToken>`

**Success response — `204 No Content`**

---

### Users — `/api/users`

All user endpoints require a valid `Bearer` access token.

---

#### `GET /api/users/me`

Retrieve the authenticated user profile.

**Authorization:** `Bearer <accessToken>`

**Success response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullname": "Jane Doe",
    "companyName": "Acme Corp",
    "isEmailVerified": false,
    "createdAt": "2026-09-02T15:00:00.000Z",
    "updatedAt": "2026-09-02T15:00:00.000Z"
  }
}
```

---

#### `PATCH /api/users/me`

Update the authenticated user profile fields.

**Authorization:** `Bearer <accessToken>`

**Request body** (all fields optional):

```json
{
  "fullname": "Jane Smith",
  "companyName": "New Corp"
}
```

**Success response — `200 OK`:** Updated user object.

---

#### `DELETE /api/users/me`

Soft-delete the authenticated user account. Sets `deletedAt` timestamp; the user can no longer log in.

**Authorization:** `Bearer <accessToken>`

**Success response — `204 No Content`**

---

### Merchants — `/api/merchants`

All merchant endpoints require a valid `Bearer` access token.

---

#### `GET /api/merchants`

List all merchants belonging to the authenticated user.

**Authorization:** `Bearer <accessToken>`

**Success response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "merchants": [
      {
        "id": "uuid",
        "userId": "uuid",
        "isActive": true,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

#### `POST /api/merchants`

Create a new merchant for the authenticated user.

**Authorization:** `Bearer <accessToken>`

**Success response — `201 Created`:** The created merchant object.

---

#### `GET /api/merchants/:id`

Get details for a specific merchant.

**Authorization:** `Bearer <accessToken>`

**Path param:** `id` — UUID of the merchant.

**Success response — `200 OK`:** Merchant object.

**Error responses:**
- `404 Not Found` — merchant not found (`MERCHANT_NOT_FOUND`)

---

#### `PATCH /api/merchants/:id/activate`

Activate a merchant (`isActive = true`).

**Authorization:** `Bearer <accessToken>`

**Success response — `200 OK`:** Updated merchant object.

---

#### `PATCH /api/merchants/:id/inactivate`

Deactivate a merchant (`isActive = false`).

**Authorization:** `Bearer <accessToken>`

**Success response — `200 OK`:** Updated merchant object.

---

#### `DELETE /api/merchants/:id`

Delete a merchant by ID.

**Authorization:** `Bearer <accessToken>`

**Success response — `200 OK`:** Deleted merchant object.

---

### API Keys — `/api/merchants/:id/api-keys`

All API key endpoints require a valid `Bearer` access token. The `:id` is the **merchant UUID**.

Environment values are `TEST` or `LIVE`. Only one active key per environment per merchant is allowed at a time.

---

#### `POST /api/merchants/:id/api-keys`

Generate a new API key for the merchant in the specified environment.

**Authorization:** `Bearer <accessToken>`

**Request body:**

```json
{
  "environment": "TEST"
}
```

Only available for **active** merchants. Will fail if an active key already exists for that environment.

**Success response — `201 Created`:**

```json
{
  "success": true,
  "data": {
    "apiKey": {
      "id": "uuid",
      "keyId": "test_key_...",
      "merchantId": "uuid",
      "environment": "TEST",
      "createdAt": "..."
    },
    "keySecret": "sk_test_..."
  }
}
```

> **The `keySecret` is only returned once.** Store it securely — it cannot be retrieved again.

**Error responses:**
- `403 Forbidden` — user does not own this merchant (`MERCHANT_USER_MISMATCH`)
- `404 Not Found` — merchant not found (`MERCHANT_NOT_FOUND`)
- `409 Conflict` — active key already exists (`API_KEY_ALREADY_EXISTS`)
- `422 Unprocessable` — merchant is inactive (`MERCHANT_INACTIVE`)

---

#### `GET /api/merchants/:id/api-keys`

Retrieve the active API key metadata for the specified environment.

**Authorization:** `Bearer <accessToken>`

**Query params:**

| Param | Type | Required | Values |
|---|---|---|---|
| `environment` | string | Yes | `TEST` or `LIVE` |

**Success response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "apiKey": {
      "id": "uuid",
      "keyId": "test_key_...",
      "merchantId": "uuid",
      "environment": "TEST",
      "createdAt": "..."
    }
  }
}
```

> `keySecret` is **never** returned after initial creation.

---

#### `PATCH /api/merchants/:id/api-keys/rotate`

Rotate the active API key. Generates a new key and schedules the old key for revocation.

**Authorization:** `Bearer <accessToken>`

**Request body:**

```json
{
  "environment": "TEST",
  "oldKeyRevokeStrategy": "IMMEDIATELY"
}
```

| Field | Type | Required | Values |
|---|---|---|---|
| `environment` | string | Yes | `TEST` or `LIVE` |
| `oldKeyRevokeStrategy` | string | Yes | `IMMEDIATELY` or `AFTER_24_HOURS` |

- `IMMEDIATELY` — old key is revoked at the time of rotation.
- `AFTER_24_HOURS` — old key remains valid for 24 hours, allowing zero-downtime key migrations.

This operation runs inside a **database transaction** to guarantee atomicity.

**Success response — `200 OK`:** New API key object + `keySecret` (store immediately).

---

## Authentication Flow

### Token Strategy

```
Client                              Server
  |                                   |
  |---- POST /api/auth/login -------> |
  |                                   | 1. Verify credentials
  |                                   | 2. Create session row (DB)
  |                                   | 3. Sign access token (JWT, 15 min)
  |                                   | 4. Generate refresh token (opaque, 30 days)
  | <-- 200 OK ---------------------- |    stored as SHA-256 hash in sessions table
  |     body: { accessToken }         |
  |     cookie: refreshToken          |
```

**Access Token** — Short-lived JWT (15 minutes) signed with `ACCESS_TOKEN_SECRET`.
Payload: `{ sid: sessionId, sub: userId, iat, exp }`

**Refresh Token** — Long-lived opaque token (30 days). Stored as a cryptographic hash in the `sessions` table. Delivered as an `httpOnly; secure; sameSite=strict` cookie, scoped to the `/api/auth/refresh` path.

### Session Management

Every login and signup creates a new row in the `sessions` table, recording:

| Field | Description |
|---|---|
| `userId` | Owner of the session |
| `tokenHash` | SHA-256 hash of the refresh token |
| `userAgent` | Parsed from the `User-Agent` header via `ua-parser-js` |
| `ipAddress` | Client IP from `req.ip` |
| `expiresAt` | `now + REFRESH_TOKEN_EXPIRY_DAYS` |
| `revokedAt` | `null` until explicitly revoked |

### Refresh Token Rotation

On every call to `POST /api/auth/rotate-token`:

1. The `refreshToken` cookie is read from the request.
2. The token is hashed and the matching session is looked up.
3. Guards: session must exist, not be expired, not be revoked, and user must not be deleted.
4. The session row is updated with a new `tokenHash` and extended `expiresAt`.
5. A new access token is signed and returned.
6. The new refresh token is set as a cookie.

This ensures **single-use refresh tokens** — a stolen token cannot be reused after rotation.

---

## Request Validation

All request validation is performed by the `validateRequest` middleware factory using **Zod** schemas. It validates `body`, `query`, `params`, and `cookies` independently:

```typescript
validateRequest({
  body: z.object({ ... }),
  params: z.object({ id: z.string().uuid() }),
  query: z.object({ environment: z.enum(['TEST', 'LIVE']) }),
  cookies: z.object({ refreshToken: z.string() }),
})
```

On validation failure, a structured `400 Bad Request` is returned with per-field error details in the `details` array.

---

## Error Handling

All errors flow through the global `handleError` Express middleware. Domain-specific errors extend the `AppError` base class from `@payvo/shared/error`.

### Error Response Shape

```json
{
  "success": false,
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-readable description",
    "details": [
      { "field": ["fieldName"], "message": "Validation message" }
    ]
  }
}
```

`details` is only present for `400` validation errors.

### Error Codes Reference

#### Auth Errors

| Code | HTTP Status | Description |
|---|---|---|
| `EMAIL_ALREADY_EXISTS` | 409 | Registration with duplicate email |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token not found in DB |
| `EXPIRED_REFRESH_TOKEN` | 401 | Session has passed its expiry date |
| `REVOKED_REFRESH_TOKEN` | 401 | Session was explicitly revoked |
| `MISSING_ACCESS_TOKEN` | 401 | No Bearer token in Authorization header |
| `INVALID_ACCESS_TOKEN` | 401 | JWT signature invalid or expired |
| `SESSION_EXPIRED` | 401 | Access token session is expired |
| `SESSION_REVOKED` | 401 | Access token session was revoked |

#### Merchant Errors

| Code | HTTP Status | Description |
|---|---|---|
| `MERCHANT_NOT_FOUND` | 404 | Merchant with given ID does not exist |
| `MERCHANT_INACTIVE` | 422 | Operation requires an active merchant |
| `MERCHANT_USER_MISMATCH` | 403 | Authenticated user does not own this merchant |

#### API Key Errors

| Code | HTTP Status | Description |
|---|---|---|
| `API_KEY_ALREADY_EXISTS` | 409 | Active key already exists for this environment |
| `API_KEY_NOT_FOUND` | 404 | No active API key for this environment |

#### Generic Errors

| Code | HTTP Status | Description |
|---|---|---|
| `BAD_REQUEST` | 400 | Zod validation failure |
| `INTERNAL_SERVER` | 500 | Unhandled server error |

---

## Workspace Packages Used

This service depends on internal monorepo packages managed by pnpm workspaces:

| Package | Purpose |
|---|---|
| `@payvo/config` | Centralized app, JWT, and session configuration |
| `@payvo/database` | Prisma client, schema, migrations, and typed DB models |
| `@payvo/shared` | Shared utilities: Argon2 hashing, JWT helpers, API key generators, HTTP status codes, `AppError` base class |

---

## Testing

Tests live in `tests/integration/` and run with **Vitest** + **Supertest** against the full Express app instance (Supertest mounts the app in-process — no network port needed).

### Run Tests

```bash
# From apps/dashboard/api/
pnpm test

# From the monorepo root
pnpm --filter @payvo/dashboard-api test
```

### Coverage

```bash
pnpm vitest run --coverage
```

### Test Suites

| Module | Tests |
|---|---|
| Auth | `signup`, `login`, `logout`, `logout-all`, `rotate-token` |
| Users | `get-me`, `update-me`, `delete-me` |
| Merchants | `list`, `create`, `get`, `activate`, `inactivate`, `delete` |
| API Keys | `generate`, `get-active`, `rotate` |

> `fileParallelism: false` is set in `vitest.config.ts` to prevent database race conditions during integration testing.

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx --watch src/server.ts` | Start dev server with hot-reload |
| `build` | `tsc && tsc-alias` | Compile TypeScript and resolve path aliases |
| `start` | `node dist/server.js` | Run compiled production build |
| `test` | `vitest run` | Run all tests once |

**Monorepo-level scripts** (run from root):

| Script | Description |
|---|---|
| `pnpm db:migrate` | Run Prisma migrations via `@payvo/database` |
| `pnpm db:emit` | Emit Prisma client type contracts |
| `pnpm build` | Build all packages in dependency order |

---

## Development Notes

- **Path alias** `@/*` resolves to `./src/*` — configured in `tsconfig.json` and mirrored in `vitest.config.ts` for tests.
- **Decorator metadata** — `experimentalDecorators` and `emitDecoratorMetadata` are enabled in `tsconfig.json` for Inversify to work at runtime.
- **ESM** — The package uses `"type": "module"`. All internal imports must use the `.js` extension (TypeScript resolves to the corresponding `.ts` source at build time via `tsc-alias`).
- **Async error handling** — All controller methods are wrapped with the `catchAsync` utility to forward async exceptions to the Express error middleware automatically.
- **Cookie path scoping** — The `refreshToken` cookie is scoped to `/api/auth/refresh`, limiting its exposure across unrelated requests.
