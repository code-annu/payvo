# @payvo/shared

Core utility and domain foundation package for the **Payvo** payment platform.

`@payvo/shared` provides cryptographically sound security primitives, Argon2 password hashing, `jose`-powered JWT issuance and verification, structured error hierarchies, HTTP response envelopes, API key generation, and refresh token helpers used by all applications and packages across the monorepo.

---

## Table of Contents

- [Overview](#overview)
- [Monorepo Installation](#monorepo-installation)
- [Directory Structure](#directory-structure)
- [Subpath Namespaces & Public API](#subpath-namespaces--public-api)
  - [`@payvo/shared/api-key`](#payvosharedapi-key)
  - [`@payvo/shared/crypto`](#payvosharedcrypto)
  - [`@payvo/shared/error`](#payvosharederror)
  - [`@payvo/shared/http`](#payvosharedhttp)
  - [`@payvo/shared/jwt`](#payvosharedjwt)
  - [`@payvo/shared/refresh-token`](#payvosharedrefresh-token)
- [Security & Architectural Design](#security--architectural-design)
- [Scripts & Build Commands](#scripts--build-commands)

---

## Overview

In fintech and payment gateways, security and consistency are paramount:
- **No plaintext secrets**: API keys and refresh tokens are hashed (SHA-256) before storing in PostgreSQL.
- **Modern Password Hashing**: Utilizes **Argon2** (winner of the Password Hashing Competition) rather than legacy bcrypt.
- **Web Standards Crypto**: Uses the modern **`jose`** library for tamper-proof HS256 JWT tokens with zero runtime vulnerabilities.
- **Consistent Response Envelopes**: Eliminates inconsistency across REST endpoints through `buildSuccessResponse` and standardized `AppError` subclasses.

---

## Monorepo Installation

In any workspace package (`apps/*` or `packages/*`):

```json
{
  "dependencies": {
    "@payvo/shared": "workspace:*"
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
packages/shared/
├── package.json
├── tsconfig.json
└── src/
    ├── api-key/
    │   ├── generate.ts          # API Key generator with pvo_ prefix
    │   ├── hash.ts              # SHA-256 secret hashing
    │   ├── types.ts             # Environment ("TEST" | "LIVE")
    │   └── index.ts
    ├── crypto/
    │   ├── id/generate.ts       # Cryptographic random IDs
    │   ├── password/hash.ts     # Argon2 password hashing
    │   ├── password/verify.ts   # Argon2 password verification
    │   ├── secret/generate.ts   # High-entropy random secrets
    │   ├── signature/generate.ts# HMAC-SHA256 signature generator for webhooks
    │   └── index.ts
    ├── error/
    │   ├── AppError.ts          # Base operational error class
    │   ├── AppErrorCode.ts      # Standard error code enum
    │   ├── app.errors.ts        # BadRequestError, RateLimitExceededError, InternalServerError
    │   └── index.ts
    ├── http/
    │   ├── HttpStatusCode.ts    # Standard HTTP status code constants
    │   ├── success.response.ts  # Standard { success: true, data } response envelope
    │   └── index.ts
    ├── jwt/
    │   ├── payload.types.ts     # AccessTokenPayload { sub, sid }
    │   ├── sign.ts              # HS256 JWT token signer
    │   ├── verify.ts            # HS256 JWT token verifier
    │   └── index.ts
    └── refresh-token/
        ├── generate.ts          # 64-byte high-entropy refresh token generator
        ├── hash.ts              # SHA-256 token hash generator
        └── index.ts
```

---

## Subpath Namespaces & Public API

Every module is isolated and exposed via targeted subpaths in `package.json#exports`.

### `@payvo/shared/api-key`

Utilities for generating and hashing merchant API credentials.

```typescript
import { generateApiKey, hashKeySecret, type Environment } from "@payvo/shared/api-key";

// 1. Generate new API key pair for TEST or LIVE
const { keyId, keySecret } = generateApiKey("LIVE");
// keyId:     "pvo_live_A1b2C3d4E5f6G7h8" (12 random bytes, base64url)
// keySecret: "9Jk8Lm7No6Pq5Rs4Tu3Vw2Xy" (20 random bytes, base64url)

// 2. Hash secret before persisting to database (NEVER store raw keySecret!)
const secretHash = hashKeySecret(keySecret);
```

---

### `@payvo/shared/crypto`

General cryptographic helpers: Argon2 password hashing, webhook HMAC signatures, and ID generators.

#### Password Hashing (Argon2)

```typescript
import { hashPassword, verifyPassword } from "@payvo/shared/crypto";

// Hash user password during registration
const hash = await hashPassword("StrongUserPassword123!");

// Verify password on login
const isValid = await verifyPassword("StrongUserPassword123!", hash);
console.log(isValid); // true / false
```

#### Webhook Signatures (HMAC-SHA256)

Signs webhook event payloads sent to merchants for verification.

```typescript
import { generateSignature } from "@payvo/shared/crypto";

const payload = JSON.stringify({ event: "payment.succeeded", orderId: "ord_123" });
const secret = "whsec_live_9988776655";

const signatureHeader = generateSignature({ secret, payload });
// Output: "sha256=4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e135291b..."
```

#### ID and Secret Generation

```typescript
import {
  generateId,
  generateAlphaNumericId,
  generateRandomSecret
} from "@payvo/shared/crypto";

// URL-safe base64 ID (default 10 bytes)
const id = generateId();

// Strictly alphanumeric ID (letters and numbers only)
const alphanumericId = generateAlphaNumericId(12);

// High-entropy 64-byte random secret string
const webhookSecret = generateRandomSecret(64);
```

---

### `@payvo/shared/error`

Typed application error classes for standardized API error handling and status codes.

```typescript
import {
  AppError,
  BadRequestError,
  RateLimitExceededError,
  InternalServerError
} from "@payvo/shared/error";

// 400 Bad Request
throw new BadRequestError("Invalid email format", { field: "email" });

// 429 Rate Limit Exceeded
throw new RateLimitExceededError("Too many payment attempts, try again later");

// 500 Internal Server Error
throw new InternalServerError("Unexpected gateway failure");

// Custom domain error extending AppError
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super({
      message,
      statusCode: 401,
      code: "UNAUTHORIZED",
      isOperational: true,
    });
  }
}
```

---

### `@payvo/shared/http`

HTTP status code constants and standard API envelope wrappers.

```typescript
import { HttpStatusCode, buildSuccessResponse } from "@payvo/shared/http";

app.get("/api/merchants", async (req, res) => {
  const merchants = await getMerchants();

  // Standardized response: { success: true, data: [...] }
  res.status(HttpStatusCode.Success.OK).json(
    buildSuccessResponse(merchants)
  );
});
```

#### `HttpStatusCode` Mapping

- **Success**: `OK` (200), `CREATED` (201), `NO_CONTENT` (204)
- **Error**: `BAD_REQUEST` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMIT` (429), `INTERNAL_SERVER` (500)

---

### `@payvo/shared/jwt`

Stateless JWT signing and verification built with `jose` using HMAC-SHA256 (`HS256`).

```typescript
import { signAccessToken, verifyAccessToken, type AccessTokenPayload } from "@payvo/shared/jwt";

const payload: AccessTokenPayload = {
  sub: "user_uuid_here",   // Subject: User ID
  sid: "session_uuid_here" // Session ID
};

// Sign access token
const token = await signAccessToken(payload, {
  secret: "your_jwt_secret_key_at_least_32_chars",
  expiresInMinute: 15,
});

// Verify access token
try {
  const decoded = await verifyAccessToken(token, "your_jwt_secret_key_at_least_32_chars");
  console.log("Authenticated user:", decoded.sub, "Session:", decoded.sid);
} catch (err) {
  console.error("Invalid or expired token");
}
```

---

### `@payvo/shared/refresh-token`

Cryptographically secure random refresh token generation and SHA-256 storage hashing.

```typescript
import { generateRefreshToken, hashRefreshToken } from "@payvo/shared/refresh-token";

// 1. Generate 64-byte random URL-safe refresh token
const rawRefreshToken = generateRefreshToken();

// 2. Hash token for storage in PostgreSQL
const tokenHash = hashRefreshToken(rawRefreshToken);

// 3. Store tokenHash in DB, send rawRefreshToken to client via HTTP-only Cookie
```

---

## Security & Architectural Design

| Domain | Mechanism | Why It Was Chosen |
|---|---|---|
| **Passwords** | Argon2id | Resistant to GPU/ASIC brute-force attacks and memory-hard. |
| **Tokens & Secrets** | `crypto.randomBytes` + `base64url` | Cryptographically secure pseudo-random number generator (CSPRNG) with URL-safe output. |
| **API Keys** | Hashed with SHA-256 | If the database is compromised, attackers cannot reconstruct raw API keys to spoof merchant requests. |
| **Webhooks** | HMAC-SHA256 (`sha256=<hex>`) | Industry-standard payload signature pattern (comparable to Stripe and GitHub). |
| **JWT** | `jose` (HS256) | Zero-dependency, standards-compliant, and avoids `jsonwebtoken` legacy vulnerabilities. |

---

## Scripts & Build Commands

Inside `packages/shared`:

```bash
# Compile TypeScript to dist/
pnpm run build

# Watch mode
pnpm run dev
```

From monorepo root:

```bash
pnpm build:package:shared
```
