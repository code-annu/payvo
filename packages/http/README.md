# @payvo/redis

High-performance Redis client and caching layer for the **Payvo** payment platform.

Built on [`ioredis`](https://github.com/redis/ioredis), `@payvo/redis` provides resilient connection handling, automated retry policies, graceful degradation, and type-safe cache helpers for sub-millisecond API key lookups, user session caching, and cache invalidation.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Monorepo Installation](#monorepo-installation)
- [Directory Structure](#directory-structure)
- [Configuration & Environment](#configuration--environment)
- [Exported Namespaces & API](#exported-namespaces--api)
  - [`@payvo/redis/cache`](#payvorediscache)
    - [`getCache<T>(key)`](#getcachetkey)
    - [`setCache<T>({ key, value, ttlSeconds })`](#setcachet-key-value-ttlseconds-)
    - [`deleteCache(key)`](#deletecachekey)
- [Resilience & Graceful Degradation](#resilience--graceful-degradation)
- [Real-world Usage in Payvo](#real-world-usage-in-payvo)
- [Scripts & Build Commands](#scripts--build-commands)
- [Local Redis with Docker](#local-redis-with-docker)

---

## Overview & Architecture

In a payment gateway, request latency is critical. `@payvo/redis` accelerates read-heavy pathways:
- **API Key Validation**: Caching active API key records allows the Gateway API to authenticate merchant requests without querying PostgreSQL on every transaction.
- **User / Merchant Profiles**: Caching dashboard user records reduces database load.
- **Fail-Open Resilience**: Cache read/write failures gracefully degrade (logging errors and falling through to the primary database) rather than failing payment operations.
- **Automated Backoff**: Exponential reconnection strategy ensures transient Redis downtime does not exhaust connection pools.

---

## Monorepo Installation

In any workspace package (`apps/*` or `packages/*`):

```json
{
  "dependencies": {
    "@payvo/redis": "workspace:*"
  }
}
```

Then run:

```bash
pnpm install
```

---

## Directory Structure

```text
packages/redis/
├── package.json
├── tsconfig.json
└── src/
    ├── client/
    │   └── redis.client.ts   # ioredis client singleton with retry & lifecycle logging
    └── cache/
        ├── cache.ts          # getCache, setCache, and deleteCache implementations
        └── index.ts          # Public export barrel
```

---

## Configuration & Environment

The Redis connection is loaded via `@payvo/config/redis`:

| Variable | Type | Default | Description |
|---|---|---|---|
| `REDIS_URL` | `string` | **Required** | Redis connection URI (e.g. `redis://localhost:6379`) |

---

## Exported Namespaces & API

### `@payvo/redis/cache`

Exposes generic, JSON-serializing caching utilities.

#### `getCache<T>(key: string): Promise<T | null>`

Fetches a value from Redis and parses it as type `T`. Returns `null` if the key does not exist or if Redis encounters an error.

```typescript
import { getCache } from "@payvo/redis/cache";

interface UserProfile {
  id: string;
  email: string;
  fullname: string;
}

const user = await getCache<UserProfile>("cache:user:usr_123");
if (user) {
  console.log("Cache hit:", user.email);
} else {
  console.log("Cache miss - query database");
}
```

#### `setCache<T>(input: { key: string; value: T; ttlSeconds: number }): Promise<void>`

Serializes `value` to JSON and stores it with an explicit Time-To-Live (TTL) in seconds (`EX`).

```typescript
import { setCache } from "@payvo/redis/cache";

await setCache({
  key: "cache:user:usr_123",
  value: { id: "usr_123", email: "merchant@payvo.com", fullname: "Jane Doe" },
  ttlSeconds: 300, // 5 minutes
});
```

#### `deleteCache(key: string): Promise<void>`

Removes a key from Redis. Ideal for cache invalidation upon record update or deletion.

```typescript
import { deleteCache } from "@payvo/redis/cache";

// Invalidate cached API key when rotated or revoked
await deleteCache("cache:api_key:pvo_live_9999");
```

---

## Resilience & Graceful Degradation

### Reconnection Strategy

The underlying `ioredis` client uses a bounded linear/exponential retry strategy:

```typescript
export const redisCacheClient = new Redis(redisConfig.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Retries every 200ms, 400ms, up to a maximum cap of 2000ms (2s)
    return Math.min(times * 200, 2000);
  },
});
```

### Fail-Safe Cache Operations

`getCache`, `setCache`, and `deleteCache` are wrapped in `try/catch` blocks:
- **`getCache`**: If Redis is unreachable, it logs `Redis getCache error:` and returns `null`. The calling code simply executes its fallback database query.
- **`setCache` & `deleteCache`**: Write failures are logged without re-throwing, ensuring an unreachable Redis cluster does not crash active payment flows.

---

## Real-world Usage in Payvo

### Cache-Aside Pattern in User Repository

```typescript
import { getCache, setCache, deleteCache } from "@payvo/redis/cache";
import { client } from "@payvo/database/client";

const CACHE_TTL = 60 * 10; // 10 minutes

export async function getUserById(id: string) {
  const cacheKey = `user:${id}`;

  // 1. Check cache
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // 2. Fall back to PostgreSQL
  const user = await client.orm.public.User.where({ id }).first();
  if (user) {
    await setCache({ key: cacheKey, value: user, ttlSeconds: CACHE_TTL });
  }

  return user;
}

export async function updateUser(id: string, data: any) {
  const updated = await client.orm.public.User.where({ id }).update(data);

  // Invalidate cache
  await deleteCache(`user:${id}`);
  return updated;
}
```

---

## Scripts & Build Commands

Inside `packages/redis`:

```bash
# Build TypeScript
pnpm run build

# Watch mode
pnpm run dev
```

From monorepo root:

```bash
pnpm build:package:redis
```

---

## Local Redis with Docker

The local development Redis service is defined in root `docker-compose.yaml`:

```bash
# Start Redis 8 container (payvo-redis on port 6379)
docker compose up -d redis
```

Test connection via Redis CLI:

```bash
docker exec -it payvo-redis redis-cli ping
# Response: PONG
```
