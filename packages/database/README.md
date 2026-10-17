# @payvo/database

Database persistence and data access layer for the **Payvo** payment platform, powered by **Prisma ORM 8** and **PostgreSQL 17**.

This package provides a strongly typed database client, atomic transaction utilities, compiled data contracts, migration tooling, and domain model types consumed by all backend services (`@payvo/dashboard-api` and `@payvo/gateway-api`).

---

## Table of Contents

- [Architecture & Prisma ORM 8](#architecture--prisma-orm-8)
- [Monorepo Installation](#monorepo-installation)
- [Directory Structure](#directory-structure)
- [Core Models & Schema Overview](#core-models--schema-overview)
- [Exported Namespaces & Public API](#exported-namespaces--public-api)
  - [`@payvo/database/client`](#payvodatabaseclient)
    - [Basic Queries](#basic-queries)
    - [Transactions (`dbTransaction`)](#transactions-dbtransaction)
  - [`@payvo/database/types`](#payvodatabasetypes)
- [Database Migrations & Workflow](#database-migrations--workflow)
  - [Workflow: Modifying Schema](#workflow-modifying-schema)
  - [Migration Commands](#migration-commands)
- [Build & Type Distribution](#build--type-distribution)
- [Local Development with Docker](#local-development-with-docker)

---

## Architecture & Prisma ORM 8

Payvo uses **Prisma ORM 8** (`@prisma/orm-postgres`). Prisma 8 introduces a modern, contract-first compilation model that differs significantly from legacy Prisma:

1. **Data Contract (`src/prisma/contract.prisma`)**: Your schema definition lives in `contract.prisma`.
2. **Contract Artifacts**: Running `pnpm run contract:emit` produces:
   - `src/prisma/contract.json`: The compiled metadata artifact read at runtime by the database engine.
   - `src/prisma/contract.d.ts`: TypeScript definition file providing type inference and autocompletion for models, queries, and relations.
3. **Query Engine**: Instead of the legacy global client generator, queries use the typed client runtime:
   ```typescript
   import { client } from "@payvo/database/client";

   const user = await client.orm.public.User
     .where({ email: "merchant@payvo.com" })
     .first();
   ```
4. **Contract Type Syncing**: Because TypeScript projects compile to `dist/`, a dedicated script (`pnpm run cp:contract`) copies `contract.d.ts` into `dist/prisma/contract.d.ts` so consuming monorepo apps receive full IntelliSense without type errors.

---

## Monorepo Installation

In any workspace package (`apps/*` or `packages/*`):

```json
{
  "dependencies": {
    "@payvo/database": "workspace:*"
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
packages/database/
├── package.json
├── prisma.config.ts         # Prisma 8 CLI engine & ORM postgres configuration
├── tsconfig.json
├── migrations/              # Prisma 8 migration history & state refs
│   └── app/
│       ├── refs/db.json
│       └── <timestamp>_<migration_name>/
└── src/
    ├── client/
    │   ├── index.ts         # Exports client, dbTransaction, TransactionClient
    │   └── transaction.ts   # Atomic transaction execution wrapper
    ├── prisma/
    │   ├── contract.prisma  # PSL schema definition (Data Contract)
    │   ├── contract.json    # Emitted contract metadata (runtime)
    │   ├── contract.d.ts    # Emitted contract type definitions (compile time)
    │   └── db.ts            # Client singleton initialization with postgres runtime
    └── types/               # Type derivations for models & inputs
        ├── api-key.types.ts
        ├── merchant.types.ts
        ├── payment-attempt.types.ts
        ├── payment-method.types.ts
        ├── payment-order.types.ts
        ├── refresh-token.types.ts
        ├── session.types.ts
        ├── transaction.types.ts
        ├── user.types.ts
        ├── webhook.types.ts
        └── index.ts
```

---

## Core Models & Schema Overview

The database contract models the core domain of a payment gateway:

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Portal users / merchant administrators (email, password hash, status). |
| `Session` | `sessions` | Active user sessions with IP and User-Agent tracking. |
| `RefreshToken` | `refresh_tokens` | Hashed refresh tokens linked to user sessions for rotation. |
| `Merchant` | `merchants` | Merchant entities with unique `mid` (Merchant ID) tied to users. |
| `ApiKey` | `api_keys` | Gateway API credentials with environments (`TEST`, `LIVE`) and lifecycle status (`ACTIVE`, `GRACE_PERIOD`, `REVOKED`). |
| `Webhook` | `webhooks` | Merchant webhook configurations (endpoint URL and shared HMAC secret). |
| `PaymentOrder` | `payment_orders` | Orders created by merchants via API with unique `orderNumber`, `csi`, amount, currency, and status (`CREATED`, `PAYMENT_PROCESSING`, `PAYMENT_FAILED`, `EXPIRED`, `COMPLETED`). |
| `PaymentMethod` | `payment_methods` | Supported payment methods (e.g. Card, UPI, NetBanking). |
| `PaymentAttempt` | `payment_attempts` | Individual payment attempts per order with sequence tracking and status (`PROCESSING`, `FAILED`, `SUCCEED`). |
| `Transaction` | `transactions` | Immutable financial ledger records capturing `grossAmount`, `feeAmount`, `netAmount`, and `paymentType` (`PAYIN`, `REFUND`). |

---

## Exported Namespaces & Public API

### `@payvo/database/client`

Provides the database client singleton and transaction runner.

#### Basic Queries

```typescript
import { client } from "@payvo/database/client";

// Find a single record
const user = await client.orm.public.User
  .where({ email: "alex@example.com" })
  .first();

// Create a record
const newMerchant = await client.orm.public.Merchant.create({
  mid: "mid_live_abc123",
  userId: user.id,
  isActive: true,
});

// Update a record (Prisma 8 chains .update() after .where())
const updatedOrder = await client.orm.public.PaymentOrder
  .where({ id: orderId })
  .update({ status: "COMPLETED", completedAt: new Date().toISOString() });
```

#### Transactions (`dbTransaction`)

For multi-step atomic operations, use `dbTransaction`. If any operation fails, all changes are automatically rolled back.

```typescript
import { dbTransaction, type TransactionClient } from "@payvo/database/client";

const result = await dbTransaction(async (tx: TransactionClient) => {
  // 1. Mark existing active key into GRACE_PERIOD
  await tx.orm.public.ApiKey
    .where({ id: currentKeyId })
    .update({
      status: "GRACE_PERIOD",
      graceEndsAt: new Date(Date.now() + 86400000).toISOString(),
    });

  // 2. Insert new active API key
  const newKey = await tx.orm.public.ApiKey.create({
    merchantId,
    keyId: newKeyId,
    secretHash: newSecretHash,
    environment: "LIVE",
    status: "ACTIVE",
  });

  return newKey;
});
```

---

### `@payvo/database/types`

Exports all entity return types and input parameters. In Prisma 8, update parameters are extracted from the where-scoped chain.

```typescript
import type {
  // Entities
  User,
  Merchant,
  ApiKey,
  PaymentOrder,
  PaymentAttempt,
  Transaction,
  Webhook,

  // Inputs
  UserCreateInput,
  UserUpdateInput,
  MerchantCreateInput,
  ApiKeyCreateInput,
  PaymentOrderCreateInput,
  WebhookCreateInput,
  WebhookUpdateInput
} from "@payvo/database/types";

function sanitizeUser(user: User) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
```

---

## Database Migrations & Workflow

### Workflow: Modifying Schema

When modifying the database structure, always follow these steps:

1. **Edit the Contract**: Update [`src/prisma/contract.prisma`](src/prisma/contract.prisma).
2. **Emit the Contract**:
   ```bash
   pnpm run contract:emit
   ```
   This synchronizes `contract.json` and updates `contract.d.ts`.
3. **Plan / Create Migration**:
   ```bash
   pnpm run plan:migration <migration_name>
   ```
4. **Apply Migration**:
   ```bash
   pnpm run db:migrate
   ```

### Migration Commands

Inside `packages/database`:

| Command | Script | Description |
|---|---|---|
| `pnpm run contract:emit` | `prisma contract emit` | Compiles PSL contract into `contract.json` and `contract.d.ts` |
| `pnpm run db:migrate` | `prisma db migrate --advance-ref db` | Applies pending migrations to the PostgreSQL database |
| `pnpm run plan:migration` | `prisma migration plan --name` | Generates a new migration plan from schema diff |
| `pnpm run migration:status` | `prisma migration status` | Checks pending / applied migration state |

From the monorepo root:

```bash
# Emit contract and apply migrations in one command
pnpm db:setup

# Apply migrations
pnpm db:migrate

# Emit contract only
pnpm db:contract:emit
```

---

## Build & Type Distribution

Because `contract.d.ts` is emitted into `src/prisma/`, TypeScript compilation alone will not copy `.d.ts` files into `dist/`. The build process includes a dedicated copy step:

```bash
# In packages/database:
pnpm run build
# Runs: tsc && pnpm run cp:contract

# Watch mode for iterative local development:
pnpm run dev
# Runs concurrently: tsc -w AND chokidar watch on contract.d.ts
```

From root:

```bash
pnpm build:package:database
```

---

## Local Development with Docker

A local PostgreSQL 17 database is configured in the root `docker-compose.yaml`:

```bash
# Start PostgreSQL container (payvo-db on port 5432)
docker compose up -d postgres

# Optional: Start pgAdmin web dashboard
docker compose up -d pgadmin
```

Verify connection:

```bash
psql -h localhost -p 5432 -U payvo -d payvo_db
```
