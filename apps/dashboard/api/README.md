# `@payvo/dashboard-api`

> The backend REST API for the **Payvo** merchant dashboard. Built with **Express 5**, **TypeScript**, **Inversify** (IoC/DI), **Prisma ORM**, and **Zod** for runtime validation. Follows **Clean Architecture** principles with explicit Use Cases for every business operation.

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
  - [Account](#account----apiaccount)
  - [Merchants](#merchants----apimerchants)
  - [API Keys (Merchant-scoped)](#api-keys-merchant-scoped----apimerchantsmerchantidapi-keys)
  - [API Keys (Top-level)](#api-keys-top-level----apiapi-keys)
  - [Internal](#internal----internal)
- [Authentication Flow](#authentication-flow)
  - [Token Strategy](#token-strategy)
  - [Session Management](#session-management)
  - [Refresh Token Rotation](#refresh-token-rotation)
- [Middleware Pipeline](#middleware-pipeline)
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

- **Secure authentication** with JWT access tokens (short-lived, configurable) and rotating HTTP-only refresh tokens (configurable session expiry).
- **Account management** — retrieve, update, and soft-delete the authenticated user's account.
- **Merchant lifecycle management** — create, view, and delete merchants with active-user enforcement.
- **API key management** — generate, fetch, rotate, and revoke `TEST` / `LIVE` environment API keys per merchant with configurable revocation strategies.
- **Internal service-to-service API** — validate API key credentials from other Payvo services via a shared secret.
- **CORS configuration** — origin-restricted cross-origin support for the frontend dashboard.
- **Structured error handling** with machine-readable error codes for frontend consumption.
- **Zod-powered validation** on every request boundary (body, params, query, cookies).
- **Clean Architecture** — business logic is encapsulated in single-responsibility Use Case classes, decoupled from HTTP concerns.

---

## Architecture

### Project Structure

```
apps/dashboard/api/
├── src/
│   ├── app.ts                  # Express app factory — middleware, CORS & route registration
│   ├── server.ts               # Server bootstrap — binds to port from @payvo/config
│   ├── core/
│   │   ├── di/
│   │   │   ├── inversify.config.ts   # IoC container — all singleton bindings
│   │   │   └── inversify.types.ts    # Symbol registry for DI tokens
│   │   ├── handlers/
│   │   │   └── async.catch.ts        # Async error wrapper for Express handlers
│   │   ├── middleware/
│   │   │   ├── authenticate.middleware.ts           # JWT Bearer token verification
│   │   │   ├── authenticate-internal.middleware.ts  # x-internal-secret header verification
│   │   │   ├── require-active-user.middleware.ts    # Ensures user is not soft-deleted
│   │   │   ├── error-handler.middleware.ts          # Global Express error handler
│   │   │   └── validate-request.middleware.ts       # Zod-based request validation factory
│   │   └── util/
│   │       └── client.util.ts        # UA parser + IP extractor for session metadata
│   ├── modules/
│   │   ├── auth/               # Authentication & session domain
│   │   ├── account/            # Account management domain (get, update, delete)
│   │   ├── user/               # User data-access layer (repository, mapper, entity)
│   │   ├── merchant/           # Merchant management domain
│   │   └── api-key/            # API key lifecycle domain
│   └── internals/
│       ├── internal.router.ts        # Internal service routes
│       ├── internal.controller.ts    # Internal endpoint handlers
│       ├── application/
│       │   ├── dto/                  # Internal DTOs
│       │   └── usecase/              # Internal use cases (ValidateApiKeyUsecase)
│       ├── error/                    # Internal error codes & classes
│       └── schema/                   # Internal Zod schemas
├── .env.development            # Local development environment variables
├── .env.test                   # Test environment variables
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Dependency Injection

The API uses **[Inversify](https://inversify.io/)** v8 for IoC/DI. Every class is decorated with `@injectable()`, and constructor dependencies are injected with `@inject(TYPES.<Token>)`.

All bindings are registered in `src/core/di/inversify.config.ts` and all token symbols live in `src/core/di/inversify.types.ts`. Every dependency is bound in **singleton scope** — one instance per application lifecycle.

```
Container
  ├── ClientInfoUtil              (Util)
  │
  ├── UserRepository              (User data access)
  ├── UserMapper
  │
  ├── SessionRepository           (Auth)
  ├── RefreshTokenRepository
  ├── AuthMapper
  ├── SignupUsecase
  ├── LoginUsecase
  ├── RotateTokenUsecase
  ├── LogoutUsecase
  ├── AuthController
  ├── AuthRouter
  │
  ├── GetAccountUsecase           (Account)
  ├── UpdateAccountUsecase
  ├── DeleteAccountUsecase
  ├── AccountController
  ├── AccountRouter
  │
  ├── MerchantRepository          (Merchant)
  ├── MerchantMapper
  ├── CreateMerchantUsecase
  ├── GetMerchantDetailsUsecase
  ├── GetUserMerchantsUsecase
  ├── DeleteMerchantUsecase
  ├── MerchantController
  ├── MerchantRouter
  │
  ├── ApiKeyRepository            (API Key)
  ├── ApiKeyMapper
  ├── GenerateApiKeyUsecase
  ├── GetActiveApiKeyUsecase
  ├── RotateApiKeyUsecase
  ├── RevokeApiKeyUsecase
  ├── ApiKeyController
  ├── ApiKeyRouter
  │
  ├── ValidateApiKeyUsecase       (Internal)
  ├── InternalController
  └── InternalRouter
```

### Module Anatomy

Each business domain follows a **Clean Architecture** pattern with explicit Use Cases:

```
modules/<domain>/
├── <domain>.router.ts      # Injectable Express Router — declares routes & middleware chain
├── <domain>.controller.ts  # Request/response handling — delegates to use cases
├── application/
│   ├── dto/                # Data Transfer Objects (use case input shapes)
│   └── usecase/            # Single-responsibility use case classes (business logic)
├── entity/                 # Domain entity types (output shapes)
├── error/                  # Typed AppError subclasses + error code enums
├── schema/                 # Zod validation schemas
├── repository/             # Database access layer (Prisma)
├── <domain>.mapper.ts      # Prisma model -> domain entity transformer (where applicable)
└── test/                   # Co-located unit tests for use cases
```

> **Note:** The `user` module is a pure data-access module (repository, mapper, entity) — it has no router or controller. User-facing operations are handled by the `account` module.

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
| JWT | Jose (via `@payvo/shared/jwt`) |
| CORS | cors |
| UA Parsing | ua-parser-js |
| Date Utils | date-fns |
| Testing | Vitest + Supertest |
| Package Manager | pnpm (workspace) |

---

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 12.6.0
- **Docker** (for the PostgreSQL database)
- All commands should be run from the **monorepo root** unless otherwise noted.

---

## Environment Variables

Create a `.env.development` file in `apps/dashboard/api/`. These variables are read at runtime via `dotenv-cli`.

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `ACCESS_TOKEN_SECRET` | Base64-encoded secret for signing JWTs | `V422XYsLS1u1...` |
| `ACCESS_TOKEN_EXPIRY_MIN` | Access token lifespan in minutes | `15` |
| `SESSION_EXPIRY_DAYS` | Session (refresh token) lifespan in days | `30` |
| `FRONTEND_URL` | Frontend dashboard URL (CORS origin) | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://admin:pass@localhost:5432/payvo_development` |
| `INTERNAL_SECRET` | Shared secret for service-to-service authentication | `QRjaejRh8+oX...` |

> **Security note:** Never commit real secrets. The `ACCESS_TOKEN_SECRET` and `INTERNAL_SECRET` should be cryptographically random base64-encoded values of at least 32 bytes.

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

This runs Prisma migrations defined in `packages/database/`.

### 4. Start the development server

From the **monorepo root**:

```bash
pnpm --filter @payvo/dashboard-api dev
```

Or from `apps/dashboard/api/` directly:

```bash
pnpm dev
```

The server starts with `dotenv-cli` loading `.env.development` and `tsx --watch` for hot-reload. You should see:

```
Server is running on port: 3000
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
| `companyName` | string | No | Max 100 characters; `null` if not provided |

**Success response — `201 Created`:**

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>"
  }
}
```

Sets `refreshToken` HTTP-only cookie (scoped to `/api/auth/rotate-token`).

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
- `401 Unauthorized` — invalid (`INVALID_REFRESH_TOKEN`), expired (`EXPIRED_SESSION`), or revoked (`REVOKED_REFRESH_TOKEN`) token

---

#### `POST /api/auth/logout`

Revoke the current session (based on the access token's `sid` claim). Clears the `refreshToken` cookie.

**Authorization:** `Bearer <accessToken>`

**Success response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### Account — `/api/account`

All account endpoints require a valid `Bearer` access token. These endpoints manage the authenticated user's own profile.

---

#### `GET /api/account`

Retrieve the authenticated user's account details.

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
    "deletedAt": null,
    "createdAt": "2026-09-02T15:00:00.000Z",
    "updatedAt": "2026-09-02T15:00:00.000Z"
  }
}
```

> The `passwordHash` field is always stripped from the response.

**Error responses:**
- `404 Not Found` — account not found (`ACCOUNT_NOT_FOUND`)

---

#### `PATCH /api/account`

Update the authenticated user's profile fields.

**Authorization:** `Bearer <accessToken>`

**Request body** (all fields optional):

```json
{
  "fullname": "Jane Smith",
  "companyName": "New Corp"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `fullname` | string | No | 3 to 50 characters |
| `companyName` | string \| null | No | Max 100 characters; can be set to `null` |

**Success response — `200 OK`:** Updated account object.

**Error responses:**
- `400 Bad Request` — validation failure
- `404 Not Found` — account not found (`ACCOUNT_NOT_FOUND`)

---

#### `DELETE /api/account`

Soft-delete the authenticated user's account. Sets `deletedAt` timestamp; the user can no longer access protected resources.

**Authorization:** `Bearer <accessToken>`

**Success response — `204 No Content`**

**Error responses:**
- `404 Not Found` — account not found (`ACCOUNT_NOT_FOUND`)

---

### Merchants — `/api/merchants`

All merchant endpoints require a valid `Bearer` access token **and** an active (non-deleted) user. The `requireActiveUser` middleware is applied as part of the auth protection suite.

---

#### `GET /api/merchants`

List all merchants belonging to the authenticated user.

**Authorization:** `Bearer <accessToken>`

**Success response — `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

#### `POST /api/merchants`

Create a new merchant for the authenticated user.

**Authorization:** `Bearer <accessToken>`

**Success response — `201 Created`:** The created merchant object.

---

#### `GET /api/merchants/:merchantId`

Get details for a specific merchant.

**Authorization:** `Bearer <accessToken>`

**Path param:** `merchantId` — UUID of the merchant.

**Success response — `200 OK`:** Merchant object.

**Error responses:**
- `404 Not Found` — merchant not found (`MERCHANT_NOT_FOUND`)

---

#### `DELETE /api/merchants/:merchantId`

Delete a merchant by ID.

**Authorization:** `Bearer <accessToken>`

**Path param:** `merchantId` — UUID of the merchant.

**Success response — `204 No Content`**

---

### API Keys (Merchant-scoped) — `/api/merchants/:merchantId/api-keys`

All API key endpoints require a valid `Bearer` access token and an active user. The `:merchantId` is the **merchant UUID**.

Environment values are `TEST` or `LIVE`.

---

#### `POST /api/merchants/:merchantId/api-keys/generate`

Generate a new API key for the merchant in the specified environment.

**Authorization:** `Bearer <accessToken>`

**Request body:**

```json
{
  "environment": "TEST"
}
```

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
- `404 Not Found` — merchant not found (`MERCHANT_NOT_FOUND`)
- `403 Forbidden` — merchant is inactive (`MERCHANT_INACTIVE`)
- `409 Conflict` — active key already exists (`API_KEY_ALREADY_EXISTS`)

---

#### `GET /api/merchants/:merchantId/api-keys/active`

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

#### `POST /api/merchants/:merchantId/api-keys/rotate`

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
| `oldKeyRevokeStrategy` | string | Yes | `IMMEDIATELY` or `24_HOURS` |

- `IMMEDIATELY` — old key is revoked at the time of rotation.
- `24_HOURS` — old key remains valid for 24 hours, allowing zero-downtime key migrations.

**Success response — `201 Created`:** New API key object + `keySecret` (store immediately).

---

### API Keys (Top-level) — `/api/api-keys`

Top-level API key operations that are not scoped to a specific merchant.

---

#### `POST /api/api-keys/:apiKeyId/revoke`

Revoke a specific API key by its ID.

**Authorization:** `Bearer <accessToken>`

**Path param:** `apiKeyId` — UUID of the API key.

**Success response — `200 OK`:** Revoked API key object.

**Error responses:**
- `404 Not Found` — API key not found (`API_KEY_NOT_FOUND`)
- `409 Conflict` — API key already revoked (`REVOKED_API_KEY`)

---

### Internal — `/internal`

Internal service-to-service endpoints, **not** intended for public use. Authenticated via the `x-internal-secret` header instead of JWT tokens.

---

#### `POST /internal/validate-api-key`

Validate a merchant API key. Used by other Payvo services (e.g., the payment gateway) to verify API key credentials before processing requests.

**Header required:** `x-internal-secret: <INTERNAL_SECRET>`

**Request body:**

```json
{
  "keyId": "test_key_...",
  "keySecret": "sk_test_..."
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `keyId` | string | Yes | Non-empty |
| `keySecret` | string | Yes | Non-empty |

**Validation flow:**
1. Looks up the API key by `keyId`.
2. Hashes the provided `keySecret` and compares against the stored hash.
3. Checks the key is not revoked.
4. Verifies the associated merchant is active.
5. Verifies the associated user exists.

**Success response — `200 OK`:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "merchantId": "uuid",
    "environment": "TEST"
  }
}
```

**Error responses:**
- `401 Unauthorized` — missing (`MISSING_INTERNAL_SECRET`) or invalid (`INVALID_INTERNAL_SECRET`) internal secret
- `401 Unauthorized` — invalid API key credentials (`INVALID_API_KEY_CREDENTIALS`)
- `409 Conflict` — API key is revoked (`REVOKED_API_KEY`)

---

## Authentication Flow

### Token Strategy

```
Client                              Server
  |                                   |
  |---- POST /api/auth/login -------> |
  |                                   | 1. Verify credentials
  |                                   | 2. Create session row (DB)
  |                                   | 3. Sign access token (JWT, configurable)
  |                                   | 4. Generate refresh token (opaque, configurable)
  | <-- 200 OK ---------------------- |    stored as SHA-256 hash in refresh_tokens table
  |     body: { accessToken }         |
  |     cookie: refreshToken          |
```

**Access Token** — Short-lived JWT (default: 15 minutes) signed with `ACCESS_TOKEN_SECRET`.
Payload: `{ sid: sessionId, sub: userId, iat, exp }`

**Refresh Token** — Long-lived opaque token (default: 30 days). Stored as a cryptographic hash in the `refresh_tokens` table, linked to a session. Delivered as an `httpOnly; secure; sameSite=strict` cookie, scoped to the `/api/auth/rotate-token` path.

### Session Management

Every login and signup creates a new row in the `sessions` table, recording:

| Field | Description |
|---|---|
| `userId` | Owner of the session |
| `userAgent` | Parsed from the `User-Agent` header via `ua-parser-js` |
| `ipAddress` | Client IP from `req.ip` |
| `expiresAt` | `now + SESSION_EXPIRY_DAYS` |
| `revokedAt` | `null` until explicitly revoked |

A corresponding `refresh_tokens` row stores the token hash, linked to the session via `sessionId`.

### Refresh Token Rotation

On every call to `POST /api/auth/rotate-token`:

1. The `refreshToken` cookie is read from the request.
2. The token is hashed and the matching refresh token record is looked up (with session and user data).
3. Guards: refresh token must exist, not be revoked; session must not be expired, not be revoked; user must not be deleted.
4. The old refresh token is revoked and a new refresh token row is created with a fresh `tokenHash`.
5. The session `expiresAt` is extended.
6. A new access token is signed and returned.
7. The new refresh token is set as a cookie.

This ensures **single-use refresh tokens** — a stolen token cannot be reused after rotation.

---

## Middleware Pipeline

The API uses a layered middleware pipeline. Endpoints apply middleware in the following order:

| Middleware | Purpose | Applied to |
|---|---|---|
| `express.json()` | Parse JSON request bodies | All routes |
| `cookieParser()` | Parse cookies | All routes |
| `cors(corsOptions)` | CORS with origin restricted to `FRONTEND_URL` | All routes |
| `authenticateUser` | Verify JWT `Bearer` token, populate `req.auth` | Protected `/api/*` routes |
| `requireActiveUser` | Verify user is not soft-deleted (checks DB) | Merchant & API key routes |
| `authenticateInternal` | Verify `x-internal-secret` header | `/internal/*` routes |
| `validateRequest(schema)` | Zod validation of body/params/query/cookies | Routes with input |
| `handleError` | Global error handler (catches `AppError` and unhandled errors) | All routes (terminal) |

**Auth Protection Suite:** Merchant and API key routes use a combined `[authenticateUser, requireActiveUser]` middleware array to ensure both valid authentication and an active user account.

---

## Request Validation

All request validation is performed by the `validateRequest` middleware factory using **Zod** schemas. It validates `body`, `query`, `params`, and `cookies` independently:

```typescript
validateRequest({
  body: z.object({ ... }),
  params: z.object({ merchantId: z.string().uuid() }),
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
| `REVOKED_REFRESH_TOKEN` | 401 | Refresh token was explicitly revoked |
| `EXPIRED_SESSION` | 401 | Session has passed its expiry date |
| `REVOKED_SESSION` | 401 | Session was explicitly revoked |
| `INACTIVE_USER` | 401 | User account is soft-deleted or inactive |
| `MISSING_ACCESS_TOKEN` | 401 | No Bearer token in Authorization header |
| `INVALID_ACCESS_TOKEN` | 401 | JWT signature invalid or expired |

#### Account Errors

| Code | HTTP Status | Description |
|---|---|---|
| `ACCOUNT_NOT_FOUND` | 404 | User account does not exist |

#### Merchant Errors

| Code | HTTP Status | Description |
|---|---|---|
| `MERCHANT_NOT_FOUND` | 404 | Merchant with given ID does not exist |
| `MERCHANT_INACTIVE` | 403 | Operation requires an active merchant |

#### API Key Errors

| Code | HTTP Status | Description |
|---|---|---|
| `API_KEY_ALREADY_EXISTS` | 409 | Active key already exists for this environment |
| `API_KEY_NOT_FOUND` | 404 | No active API key for this environment |
| `REVOKED_API_KEY` | 409 | API key has already been revoked |
| `INVALID_API_KEY_CREDENTIALS` | 401 | API key ID or secret is incorrect |

#### Internal Errors

| Code | HTTP Status | Description |
|---|---|---|
| `MISSING_INTERNAL_SECRET` | 401 | `x-internal-secret` header not provided |
| `INVALID_INTERNAL_SECRET` | 401 | `x-internal-secret` value does not match |

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
| `@payvo/config` | Centralized app, JWT, session, server, cookie, and database configuration |
| `@payvo/database` | Prisma client, schema, migrations, and typed DB models |
| `@payvo/shared` | Shared utilities: Argon2 hashing, JWT helpers, API key generators, HTTP status codes, `AppError` base class |

---

## Testing

Tests are **co-located** with their modules inside `<module>/test/` directories:

```
src/modules/auth/test/         # Auth use case tests
src/modules/account/test/      # Account use case tests
src/modules/merchant/test/     # Merchant use case tests
src/modules/api-key/test/      # API key use case tests
```

Tests run with **Vitest** + **Supertest**.

### Run Tests

```bash
# Unit tests (modules + internals)
pnpm test:unit

# Integration tests (loads .env.test)
pnpm test:integration

# From the monorepo root
pnpm --filter @payvo/dashboard-api test:unit
```

### Coverage

```bash
pnpm vitest run --coverage
```

### Test Suites

| Module | Tests |
|---|---|
| Auth | `SignupUsecase`, `LoginUsecase`, `LogoutUsecase`, `RotateTokenUsecase` |
| Account | `GetAccountUsecase`, `UpdateAccountUsecase`, `DeleteAccountUsecase` |
| Merchants | `CreateMerchantUsecase`, `GetMerchantDetailsUsecase`, `GetUserMerchantsUsecase`, `DeleteMerchantUsecase` |
| API Keys | `GenerateApiKeyUsecase`, `GetActiveApiKeyUsecase`, `RotateApiKeyUsecase`, `RevokeApiKeyUsecase` |

> `fileParallelism: false` is set in `vitest.config.ts` to prevent database race conditions during integration testing.

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `dotenv -e .env.development -- tsx --watch src/server.ts` | Start dev server with hot-reload (loads `.env.development`) |
| `test:unit` | `vitest src/modules src/internals` | Run unit tests for modules and internals |
| `test:integration` | `dotenv -e .env.test -- vitest` | Run integration tests (loads `.env.test`) |
| `build` | `tsc && tsc-alias` | Compile TypeScript and resolve path aliases |
| `start` | `node dist/server.js` | Run compiled production build |

**Monorepo-level scripts** (run from root):

| Script | Description |
|---|---|
| `pnpm db:migrate` | Run Prisma migrations via `@payvo/database` |
| `pnpm contract:emit` | Emit Prisma client type contracts |
| `pnpm plan:migration` | Plan a new Prisma migration |
| `pnpm migration:status` | Check Prisma migration status |

---

## Development Notes

- **Path alias** `@/*` resolves to `./src/*` — configured in `tsconfig.json` and mirrored in `vitest.config.ts` for tests.
- **Decorator metadata** — `experimentalDecorators` and `emitDecoratorMetadata` are enabled in `tsconfig.json` for Inversify to work at runtime.
- **ESM** — The package uses `"type": "module"`. All internal imports must use the `.js` extension (TypeScript resolves to the corresponding `.ts` source at build time via `tsc-alias`).
- **Clean Architecture** — Business logic lives in single-responsibility Use Case classes (`application/usecase/`). Controllers are thin HTTP adapters that delegate to use cases. Repositories handle data access. This separation enables isolated unit testing of business logic.
- **Async error handling** — All controller methods are wrapped with the `catchAsync` utility to forward async exceptions to the Express error middleware automatically.
- **Cookie path scoping** — The `refreshToken` cookie is scoped to `/api/auth/rotate-token`, limiting its exposure across unrelated requests.
- **CORS** — The server is configured with `cors` middleware, restricting the `origin` to `FRONTEND_URL` and allowing credentials (cookies/auth headers).
- **Active user enforcement** — The `requireActiveUser` middleware checks the database to ensure the authenticated user has not been soft-deleted before allowing access to merchant and API key routes.
- **Dual router pattern** — The `ApiKeyRouter` exposes two Express routers: `merchantApiKeyRouter` (mounted at `/api/merchants/:merchantId/api-keys` with `mergeParams`) for merchant-scoped operations, and `router` (mounted at `/api/api-keys`) for top-level operations like revocation.
- **Internal API** — The `/internal` prefix hosts service-to-service endpoints authenticated via a shared `INTERNAL_SECRET` header, not JWT tokens. These are used by other Payvo microservices.
- **Environment-specific dotenv** — The `dev` and `test:integration` scripts use `dotenv-cli` to load `.env.development` and `.env.test` respectively, instead of relying on a generic `.env` file.
 