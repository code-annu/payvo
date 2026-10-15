# @payvo/config

Centralized environment variable loader and configuration system for the **Payvo** payment gateway platform.

`@payvo/config` validates, formats, and exports strongly typed configuration namespaces across all services in the monorepo (`@payvo/dashboard-api`, `@payvo/gateway-api`, etc.), preventing configuration drift and runtime parsing bugs.

---

## Table of Contents

- [Overview](#overview)
- [Monorepo Installation](#monorepo-installation)
- [Directory Structure](#directory-structure)
- [Environment Variables](#environment-variables)
- [Exported Namespaces & API](#exported-namespaces--api)
  - [`@payvo/config/app`](#payvoconfigapp)
  - [`@payvo/config/auth`](#payvoconfigauth)
  - [`@payvo/config/cookie`](#payvoconfigcookie)
  - [`@payvo/config/database`](#payvoconfigdatabase)
  - [`@payvo/config/payment`](#payvoconfigpayment)
  - [`@payvo/config/redis`](#payvoconfigredis)
  - [`@payvo/config/server`](#payvoconfigserver)
- [Scripts & Build Commands](#scripts--build-commands)
- [Usage Guidelines & Best Practices](#usage-guidelines--best-practices)

---

## Overview

In microservice and modular payment architectures, hardcoding `process.env` calls inside business logic leads to tight coupling, fragile testing, and unpredictable runtime failures due to missing or wrongly typed values.

`@payvo/config` provides:
- **Eager Loading**: Automatically loads `.env` files via `dotenv/config` on import.
- **Type Coercion**: Parses numbers (ports, TTLs, expiries) into strict primitive types.
- **Subpath Modular Exports**: Applications import only the specific configuration domain they need (e.g., `@payvo/config/redis`, `@payvo/config/auth`).
- **Encapsulated Policy**: Standardizes sensitive configuration like cookie security policies (`httpOnly`, `secure`, `sameSite: none`).

---

## Monorepo Installation

In any workspace package (`apps/*` or `packages/*`):

```json
{
  "dependencies": {
    "@payvo/config": "workspace:*"
  }
}
```

Then install dependencies across the monorepo:

```bash
pnpm install
```

---

## Directory Structure

```text
packages/config/
├── package.json
├── tsconfig.json
└── src/
    ├── app/
    │   ├── app.config.ts        # Service ports & internal communication config
    │   └── index.ts
    ├── auth/
    │   ├── jwt.config.ts        # Access token secret and expiration
    │   ├── session.config.ts    # Refresh session lifespan
    │   └── index.ts
    ├── cookie/
    │   ├── cookie.config.ts     # Cookie generator & options (security flags)
    │   └── index.ts
    ├── database/
    │   ├── database.config.ts   # PostgreSQL connection string
    │   └── index.ts
    ├── env/
    │   └── load.ts              # Central raw process.env parser
    ├── payment/
    │   ├── payment.config.ts    # Payment order expiry & checkout URL
    │   └── index.ts
    ├── redis/
    │   ├── redis.config.ts      # Redis connection URI
    │   └── index.ts
    └── server/
        ├── server.config.ts     # HTTP server port & frontend CORS config
        └── index.ts
```

---

## Environment Variables

The package reads the following environment variables from `process.env` (or a `.env` file in the execution root):

| Variable | Type | Default / Requirement | Description |
|---|---|---|---|
| `PORT` | `number` | `4000` | Port for the HTTP server |
| `FRONTEND_URL` | `string` | **Required** | Origin URL of the merchant dashboard frontend (for CORS & redirects) |
| `FRONTEND_SECRET` | `string` | **Required** | Secret key for frontend-to-API communication |
| `DATABASE_URL` | `string` | **Required** | PostgreSQL connection URI (e.g., `postgresql://user:pass@localhost:5432/payvo`) |
| `ACCESS_TOKEN_SECRET` | `string` | **Required** | Secret key used to sign and verify JWT access tokens |
| `ACCESS_TOKEN_EXPIRY_MIN`| `number` | **Required** | JWT access token lifetime in minutes |
| `SESSION_EXPIRY_DAYS` | `number` | **Required** | User session and refresh token lifetime in days |
| `INTERNAL_SECRET` | `string` | **Required** | Inter-service shared secret (e.g., Gateway <-> Dashboard service requests) |
| `REDIS_URL` | `string` | **Required** | Redis connection URI (e.g., `redis://localhost:6379`) |
| `DASHBOARD_INTERNAL_URL`| `string` | **Required** | Internal RPC / HTTP endpoint for accessing Dashboard API |
| `PAYMENT_ORDER_EXPIRY_MINUTES` | `number` | **Required** | Order timeout before marking payment orders as `EXPIRED` |
| `PAYMENT_CHECKOUT_SESSION_EXPIRY_MINUTES` | `number` | **Required** | Hosted checkout page session expiry window in minutes |
| `CHECKOUT_BASE_URL` | `string` | **Required** | Base URL for hosted payment checkout links (e.g., `https://checkout.payvo.com`) |

### Example `.env`

```env
PORT=4000
FRONTEND_URL=http://localhost:3000
FRONTEND_SECRET=dev_frontend_secret_32char_key
DATABASE_URL=postgresql://payvo:payvo_pass@localhost:5432/payvo_db
ACCESS_TOKEN_SECRET=dev_jwt_secret_key_at_least_32_chars
ACCESS_TOKEN_EXPIRY_MIN=15
SESSION_EXPIRY_DAYS=30
INTERNAL_SECRET=dev_internal_secret_inter_service
REDIS_URL=redis://localhost:6379
DASHBOARD_INTERNAL_URL=http://localhost:4000
PAYMENT_ORDER_EXPIRY_MINUTES=30
PAYMENT_CHECKOUT_SESSION_EXPIRY_MINUTES=15
CHECKOUT_BASE_URL=http://localhost:3001/checkout
```

---

## Exported Namespaces & API

Every configuration domain is exposed via targeted package subpaths configured in `package.json#exports`.

### `@payvo/config/app`

Configuration for general application runtime and inter-service authentication.

```typescript
import { appConfig } from "@payvo/config/app";

console.log(appConfig.port);                 // number (e.g. 4000)
console.log(appConfig.internalSecret);       // string
console.log(appConfig.dashboardInternalUrl); // string
```

### `@payvo/config/auth`

Authentication configuration for stateless JWT tokens and persistent sessions.

```typescript
import { jwtConfig, sessionConfig } from "@payvo/config/auth";

// JWT Access Token configuration
console.log(jwtConfig.accessToken.secret);        // string
console.log(jwtConfig.accessToken.expiryMinutes); // number (e.g. 15)

// Refresh Session configuration
console.log(sessionConfig.sessionExpiryDays);     // number (e.g. 30)
```

### `@payvo/config/cookie`

Generates standardized options for setting secure HTTP cookies (e.g., refresh token cookies).

```typescript
import { cookieConfig } from "@payvo/config/cookie";

const cookie = cookieConfig.refreshToken(30, "/api/auth/refresh");
// Returns:
// {
//   key: "refreshToken",
//   options: {
//     httpOnly: true,
//     secure: true,
//     sameSite: "none",
//     path: "/api/auth/refresh",
//     maxAge: 2592000000 // 30 days in milliseconds
//   }
// }

// Usage in Express:
res.cookie(cookie.key, refreshToken, cookie.options);
```

### `@payvo/config/database`

Database connection settings for Prisma ORM 8 and PostgreSQL.

```typescript
import { databaseConfig } from "@payvo/config/database";

console.log(databaseConfig.url); // string (DATABASE_URL)
```

### `@payvo/config/payment`

Payment lifecycle configuration, including checkout order TTL and URLs.

```typescript
import { paymentConfig } from "@payvo/config/payment";

console.log(paymentConfig.order.expiryMinutes);   // number
console.log(paymentConfig.order.checkoutBaseUrl); // string
```

### `@payvo/config/redis`

Redis cache connection settings.

```typescript
import { redisConfig } from "@payvo/config/redis";

console.log(redisConfig.redisUrl); // string
```

### `@payvo/config/server`

HTTP server settings and frontend CORS credentials.

```typescript
import { serverConfig } from "@payvo/config/server";

console.log(serverConfig.port);           // number
console.log(serverConfig.frontendUrl);    // string
console.log(serverConfig.frontendSecret); // string
```

---

## Scripts & Build Commands

Inside `packages/config`:

```bash
# Compile TypeScript to dist/
pnpm run build

# Watch mode for iterative development
pnpm run dev
```

From the monorepo root:

```bash
# Build this package specifically
pnpm build:package:config

# Build all packages in correct order
pnpm build:packages
```

---

## Usage Guidelines & Best Practices

1. **Avoid direct `process.env` in application code**: Always import from `@payvo/config/*` so values are typed and consistently named.
2. **Use specific subpaths**: Import `@payvo/config/redis` rather than pulling in unused modules. This keeps tree shaking efficient and code boundaries clean.
3. **Environment Isolation**: In integration tests, use `dotenv-cli` (e.g., `dotenv -e .env.test -- vitest`) to supply isolated test credentials without modifying the codebase.
