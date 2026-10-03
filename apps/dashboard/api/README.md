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
  - [Authentication](#authentication)
  - [Account](#account)
  - [Merchants](#merchants)
  - [API Keys (Merchant-scoped)](#api-keys-merchant-scoped)
  - [Webhooks (Merchant-scoped)](#webhooks-merchant-scoped)
  - [Internal](#internal)
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
- **Merchant lifecycle management** — create, view, list, and delete merchants with active-user enforcement.
- **API key management** — generate, list, fetch, rotate, and revoke `TEST` / `LIVE` environment API keys per merchant with configurable revocation strategies.
- **Webhook management** — create, list, view, update, and delete webhook endpoints for active merchants.
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
│   │   │   ├── inversify.config.ts   # IoC container — dependency bindings
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
│   │   ├── merchant/           # Merchant management and authorization
│   │   ├── api-key/            # Merchant-scoped API key lifecycle
│   │   └── webhook/            # Merchant-scoped webhook management
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

All bindings are registered in `src/core/di/inversify.config.ts` and all token symbols live in `src/core/di/inversify.types.ts`. Bindings use the container's default scope; the registrations do not explicitly request singleton scope.

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
  ├── ListMerchantApiKeysUsecase
  ├── RotateApiKeyUsecase
  ├── RevokeApiKeyUsecase
  ├── ApiKeyController
  ├── ApiKeyRouter
  │
  ├── WebhookRepository          (Webhook)
  ├── WebhookMapper
  ├── CreateWebhookUsecase
  ├── GetMerchantWebhooksUsecase
  ├── GetWebhookDetailsUsecase
  ├── UpdateWebhookUsecase
  ├── DeleteWebhookUsecase
  ├── WebhookController
  ├── WebhookRouter
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
| `ACCESS_TOKEN_SECRET` | Secret used to sign access tokens | `<random-secret>` |
| `ACCESS_TOKEN_EXPIRY_MIN` | Access-token lifespan in minutes | `15` |
| `SESSION_EXPIRY_DAYS` | Session (refresh-token) lifespan in days | `30` |
| `FRONTEND_URL` | Frontend dashboard URL used as the CORS origin | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://<user>:<password>@localhost:5432/<database>` |
| `INTERNAL_SECRET` | Shared secret for service-to-service authentication | `<random-secret>` |
| `REDIS_URL` | Redis connection string from shared configuration | `redis://localhost:6379` |
| `DASHBOARD_INTERNAL_URL` | Dashboard API URL from shared application configuration | `http://localhost:3000` |
| `PAYMENT_ORDER_EXPIRY_MINUTES` | Payment-order expiry duration in minutes | `30` |
| `CHECKOUT_BASE_URL` | Base URL used to build checkout links | `http://localhost:5173/checkout` |
| `PAYMENT_CHECKOUT_SESSION_EXPIRY_MINUTES` | Payment checkout-session expiry duration in minutes | `30` |

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

All routes are relative to the API base URL (for example, `http://localhost:3000`). JSON successes use `{ "success": true, "data": ... }`, except routes returning `204 No Content`, which have no body.

### Authentication

Base path: `/api/auth`.

Signup and login return a short-lived access token in JSON and set a refresh token in an HTTP-only, secure, `SameSite=Strict` cookie scoped to `/api/auth/rotate-token`.

#### `POST /api/auth/signup`

Creates an account, session, and refresh-token record.

```json
{
  "email": "user@example.com",
  "password": "MyPass@123",
  "fullname": "Jane Doe",
  "companyName": "Acme Corp"
}
```

| Field | Type | Required | Validation |
|---|---|---:|---|
| `email` | string | Yes | Trimmed valid email |
| `password` | string | Yes | Trimmed, at least 8 characters; includes lowercase, uppercase, number, and one of `@$!%*?&` |
| `fullname` | string | Yes | Trimmed, 3–50 characters |
| `companyName` | string \| null | No | Trimmed, at most 100 characters; omitted/null becomes `null` |

**`201 Created` response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>"
  }
}
```

Sets the refresh-token cookie. Errors: `400 INVALID_REQUEST` for invalid input; `409 EMAIL_ALREADY_EXISTS` if the email is already registered.

#### `POST /api/auth/login`

Body:

```json
{
  "email": "user@example.com",
  "password": "MyPass@123"
}
```

Both fields are required; email must be valid.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>"
  }
}
```

Sets the refresh-token cookie.

Errors: `400 INVALID_REQUEST` for invalid input; `401 INVALID_CREDENTIALS` for incorrect credentials.

#### `POST /api/auth/rotate-token`

Requires a non-empty `refreshToken` cookie. Revokes the presented refresh token and returns a replacement pair.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "<jwt>"
  }
}
```

Replaces the refresh-token cookie.

Errors: `400 INVALID_REQUEST` when the cookie is missing/empty; `401` for `INVALID_REFRESH_TOKEN`, `REVOKED_REFRESH_TOKEN`, `EXPIRED_SESSION`, `REVOKED_SESSION`, or `INVALID_CREDENTIALS` when the session or user is no longer valid.

#### `POST /api/auth/logout`

Requires `Authorization: Bearer <access-token>`. Revokes the current session and clears the refresh-token cookie.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Account

Base path: `/api/account`.

All account routes require a valid access token and operate on the authenticated user. They do not use the `requireActiveUser` middleware. `passwordHash` is removed from account responses.

#### `GET /api/account`

Returns the account fields `id`, `email`, `fullname`, `companyName`, `isEmailVerified`, `deletedAt`, `createdAt`, and `updatedAt`.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "email": "user@example.com",
    "fullname": "Jane Doe",
    "companyName": null,
    "isEmailVerified": false,
    "deletedAt": null,
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  }
}
```

Error: `404 ACCOUNT_NOT_FOUND`.

#### `PATCH /api/account`

Updates the profile. Body fields are optional:

```json
{
  "fullname": "Jane Smith",
  "companyName": "New Corp"
}
```

`fullname`, when provided, must be 3–50 trimmed characters. `companyName` may be a string of up to 100 trimmed characters or `null`. Returns the updated account using the same shape as `GET`.

Errors: `400 INVALID_REQUEST`; `404 ACCOUNT_NOT_FOUND`.

#### `DELETE /api/account`

Soft-deletes the authenticated account. Returns **`204 No Content`**. Error: `404 ACCOUNT_NOT_FOUND`.

### Merchants

Base path: `/api/merchants`.

All merchant routes require a valid access token and an active user. Merchant IDs in path parameters must be UUIDs.

#### `GET /api/merchants`

Lists the authenticated user's merchants.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "userId": "<user-uuid>",
    "merchants": [
      {
        "id": "<merchant-uuid>",
        "isActive": true,
        "mid": "<merchant-number>"
      }
    ]
  }
}
```

#### `POST /api/merchants`

Creates a merchant for the authenticated user. No request body is required.

**`201 Created` response:**

```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "mid": "<merchant-number>",
    "isActive": true,
    "userId": "<user-uuid>",
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  }
}
```

#### `GET /api/merchants/:merchantId`

Returns the merchant only when it belongs to the authenticated user.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "mid": "<merchant-number>",
    "isActive": true,
    "userId": "<user-uuid>",
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  }
}
```

Errors: `400 INVALID_REQUEST` for an invalid UUID; `404 MERCHANT_NOT_FOUND` if it does not exist or is not owned by the user.

#### `DELETE /api/merchants/:merchantId`

Deletes the specified merchant only when owned by the authenticated user. Returns **`204 No Content`**.

Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND`.

### API Keys (Merchant-scoped)

Base path: `/api/merchants/:merchantId/api-keys`.

Every API-key route requires a valid access token, an active user, and an owned, active merchant. `merchantId` is a UUID. Key environments are `TEST` and `LIVE`; statuses are `ACTIVE`, `GRACE_PERIOD`, and `REVOKED`.

#### `GET /api/merchants/:merchantId/api-keys`

Lists merchant key metadata without returning `keyId` or `secretHash`.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "merchantId": "<merchant-uuid>",
    "apiKeys": [
      {
        "id": "<api-key-uuid>",
        "status": "ACTIVE",
        "environment": "TEST",
        "graceEndsAt": null,
        "revokedAt": null,
        "lastUsedAt": null
      }
    ]
  }
}
```

Returns an empty `apiKeys` array when there are no keys. Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND`; `403 MERCHANT_INACTIVE`.

#### `POST /api/merchants/:merchantId/api-keys/generate`

Body: `{ "environment": "TEST" }`. `environment` is required and must be `TEST` or `LIVE`.

**`201 Created` response:**

```json
{
  "success": true,
  "data": {
    "id": "<api-key-uuid>",
    "keyId": "<generated-key-id>",
    "keySecret": "<generated-secret>",
    "status": "ACTIVE",
    "environment": "TEST",
    "generatedAt": "<timestamp>"
  }
}
```

The plaintext `keySecret` is returned at generation and rotation; store it securely. The database stores its hash.

Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND`; `403 MERCHANT_INACTIVE`; `409 API_KEY_ALREADY_EXISTS` if an active key already exists for the environment.

#### `GET /api/merchants/:merchantId/api-keys/active`

Requires query parameter `environment=TEST` or `environment=LIVE`.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "id": "<api-key-uuid>",
    "keyId": "<key-id>",
    "status": "ACTIVE",
    "environment": "TEST",
    "lastUsedAt": null,
    "generatedAt": "<timestamp>"
  }
}
```

Does not return the plaintext secret or stored secret hash.

Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND` or `API_KEY_NOT_FOUND`; `403 MERCHANT_INACTIVE`.

#### `POST /api/merchants/:merchantId/api-keys/rotate`

Both request fields are required:

```json
{
  "environment": "TEST",
  "oldKeyRevokeStrategy": "IMMEDIATELY"
}
```

`environment` must be `TEST` or `LIVE`; `oldKeyRevokeStrategy` must be `IMMEDIATELY` or `24_HOURS`. Rotation is transactional. `IMMEDIATELY` revokes the old key; `24_HOURS` moves it to `GRACE_PERIOD` until its grace deadline.

**`201 Created` response:**

```json
{
  "success": true,
  "data": {
    "id": "<api-key-uuid>",
    "keyId": "<generated-key-id>",
    "keySecret": "<generated-secret>",
    "status": "ACTIVE",
    "environment": "TEST",
    "generatedAt": "<timestamp>"
  }
}
```

The plaintext `keySecret` is returned for the newly generated active key; store it securely.

Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND` or `API_KEY_NOT_FOUND` if no active key can be rotated; `403 MERCHANT_INACTIVE`.

#### `POST /api/merchants/:merchantId/api-keys/:apiKeyId/revoke`

Both path parameters must be UUIDs. Requires ownership of an active merchant.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "id": "<api-key-uuid>",
    "keyId": "<key-id>",
    "status": "REVOKED",
    "environment": "TEST",
    "revokedAt": "<timestamp>"
  }
}
```

Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND` or `API_KEY_NOT_FOUND`; `403 MERCHANT_INACTIVE`; `409 REVOKED_API_KEY` if the key was already revoked.

> The application does not mount a top-level `/api/api-keys` router. API-key operations, including revocation, are merchant-scoped.

### Webhooks (Merchant-scoped)

Base path: `/api/merchants/:merchantId/webhooks`.

Every webhook route requires a valid access token, an active user, and an owned, active merchant. `merchantId` and (where present) `webhookId` must be UUIDs.

#### `POST /api/merchants/:merchantId/webhooks`

Body:

```json
{
  "url": "https://example.com/webhooks"
}
```

`url` is required and must be a valid URL.

**`201 Created` response:**

```json
{
  "success": true,
  "data": {
    "id": "<webhook-uuid>",
    "merchantId": "<merchant-uuid>",
    "secretKey": "<generated-secret>",
    "url": "https://example.com/webhooks"
  }
}
```

The response includes the webhook secret; store it securely.

Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND`; `403 MERCHANT_INACTIVE`.

#### `GET /api/merchants/:merchantId/webhooks`

Lists webhook IDs and URLs. Webhook secrets are omitted.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "merchantId": "<merchant-uuid>",
    "webhooks": [
      {
        "id": "<webhook-uuid>",
        "url": "https://example.com/webhooks"
      }
    ]
  }
}
```

Returns an empty list when there are no webhooks. Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND`; `403 MERCHANT_INACTIVE`.

#### `GET /api/merchants/:merchantId/webhooks/:webhookId`

Returns a webhook belonging to the specified merchant.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "id": "<webhook-uuid>",
    "merchantId": "<merchant-uuid>",
    "secretKey": "<webhook-secret>",
    "url": "https://example.com/webhooks"
  }
}
```

Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND` or `WEBHOOK_NOT_FOUND`; `403 MERCHANT_INACTIVE`.

#### `PATCH /api/merchants/:merchantId/webhooks/:webhookId`

Body:

```json
{
  "url": "https://example.com/new-webhook-url"
}
```

`url` is optional; when supplied, it must be a valid URL.

**`200 OK` response:** The updated webhook using the same shape as the details response, including `secretKey`.

Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND` or `WEBHOOK_NOT_FOUND`; `403 MERCHANT_INACTIVE`.

#### `DELETE /api/merchants/:merchantId/webhooks/:webhookId`

Deletes the webhook belonging to the specified merchant. Returns **`204 No Content`**.

Errors: `400 INVALID_REQUEST`; `404 MERCHANT_NOT_FOUND` or `WEBHOOK_NOT_FOUND`; `403 MERCHANT_INACTIVE`.

### Internal

Base path: `/internal`.

Internal service-to-service routes use `x-internal-secret` authentication instead of a user access token. Do not expose this interface publicly.

#### `POST /internal/validate-api-key`

Header: `x-internal-secret: <INTERNAL_SECRET>`.

Body:

```json
{
  "keyId": "<key-id>",
  "keySecret": "<plaintext-secret>"
}
```

Both fields are required non-empty strings. The API checks the key ID and secret hash, rejects revoked keys, and verifies that the associated merchant is active and its user exists.

**`200 OK` response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "merchantId": "<merchant-uuid>",
    "environment": "TEST"
  }
}
```

Errors: `400 INVALID_REQUEST`; `401 MISSING_INTERNAL_SECRET`, `INVALID_INTERNAL_SECRET`, or `INVALID_API_KEY_CREDENTIALS`; `409 REVOKED_API_KEY`.

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

**Access Token** — Short-lived JWT signed with `ACCESS_TOKEN_SECRET`; its lifetime is configured by `ACCESS_TOKEN_EXPIRY_MIN`.
Payload: `{ sid: sessionId, sub: userId, iat, exp }`

**Refresh Token** — Long-lived opaque token. Its session lifetime is configured by `SESSION_EXPIRY_DAYS`. The token is stored as a cryptographic hash in the `refresh_tokens` table, linked to a session, and delivered as an `httpOnly; secure; sameSite=strict` cookie scoped to `/api/auth/rotate-token`.

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
| `authenticateUser` | Verify JWT `Bearer` token, populate `req.auth` | Protected account and resource routes; applied per auth endpoint |
| `requireActiveUser` | Verify user is not soft-deleted (checks DB) | Merchant, API key, and webhook routes |
| `authenticateInternal` | Verify `x-internal-secret` header | `/internal/*` routes |
| `validateRequest(schema)` | Zod validation of body/params/query/cookies | Routes with input |
| `handleError` | Global error handler (catches `AppError` and unhandled errors) | All routes (terminal) |

**Auth Protection Suite:** Merchant, API key, and webhook routes use a combined `[authenticateUser, requireActiveUser]` middleware array to ensure both valid authentication and an active user account. Account routes require authentication but do not use `requireActiveUser`; resource-level use cases also check ownership and, where required, that the merchant is active.

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

When an `AppError` includes `details`, the handler includes them in the response. Request-validation errors provide per-field details; errors without details omit the field.

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

#### Webhook Errors

| Code | HTTP Status | Description |
|---|---|---|
| `WEBHOOK_NOT_FOUND` | 404 | Webhook does not exist for the specified merchant |

#### Internal Errors

| Code | HTTP Status | Description |
|---|---|---|
| `MISSING_INTERNAL_SECRET` | 401 | `x-internal-secret` header not provided |
| `INVALID_INTERNAL_SECRET` | 401 | `x-internal-secret` value does not match |

#### Generic Errors

| Code | HTTP Status | Description |
|---|---|---|
| `INVALID_REQUEST` | 400 | Request validation failure |
| `RATE_LIMIT_EXCEEDED` | 429 | Request rate limit was exceeded |
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
src/modules/webhook/test/      # Webhook use case tests
test/integration/              # HTTP integration tests using Vitest + Supertest
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
pnpm --filter @payvo/dashboard-api exec vitest run src/modules src/internals --coverage
```

### Test Suites

| Module | Tests |
|---|---|
| Auth | `SignupUsecase`, `LoginUsecase`, `LogoutUsecase`, `RotateTokenUsecase` |
| Account | `GetAccountUsecase`, `UpdateAccountUsecase`, `DeleteAccountUsecase` |
| Merchants | `CreateMerchantUsecase`, `GetMerchantDetailsUsecase`, `GetUserMerchantsUsecase`, `DeleteMerchantUsecase` |
| API Keys | `GenerateApiKeyUsecase`, `GetActiveApiKeyUsecase`, `ListMerchantApiKeysUsecase`, `RotateApiKeyUsecase`, `RevokeApiKeyUsecase` |
| Webhooks | Create, list, details, update, and delete webhook use cases |

Integration suites live under `test/integration/` and exercise the HTTP routes with Supertest:

| Area | Suites |
|---|---|
| Auth | Signup, login, logout, and refresh-token rotation |
| Account | Get, update, and delete account |
| Merchants | Create, list, get details, and delete merchant |
| API Keys | Generate, get active, list merchant keys, rotate, and revoke |
| Webhooks | Create, list, get details, update, and delete |

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
- **Active user enforcement** — The `requireActiveUser` middleware checks the database to ensure the authenticated user has not been soft-deleted before allowing access to merchant, API-key, and webhook routes.
- **Merchant-scoped resources** — API-key and webhook routers are mounted by `src/app.ts` under `/api/merchants/:merchantId/api-keys` and `/api/merchants/:merchantId/webhooks`, respectively. API-key revocation is merchant-scoped; the application does not mount a top-level `/api/api-keys` route.
- **Internal API** — The `/internal` prefix hosts service-to-service endpoints authenticated via a shared `INTERNAL_SECRET` header, not JWT tokens. These are used by other Payvo microservices.
- **Environment-specific dotenv** — The `dev` and `test:integration` scripts use `dotenv-cli` to load `.env.development` and `.env.test` respectively, instead of relying on a generic `.env` file.
 