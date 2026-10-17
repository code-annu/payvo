CREATE TYPE "merchant_status" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE "api_key_environment" AS ENUM ('TEST', 'LIVE');
CREATE TYPE "api_key_status" AS ENUM ('ACTIVE', 'GRACE_PERIOD', 'REVOKED');

CREATE TABLE "merchants" (
    "id" UUID NOT NULL,
    "mid" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "closed_at" TIMESTAMPTZ(6),
    "status" "merchant_status" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "key_id" TEXT NOT NULL,
    "secret_hash" VARCHAR(255) NOT NULL,
    "environment" "api_key_environment" NOT NULL,
    "status" "api_key_status" NOT NULL,
    "grace_ends_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "merchants_mid_key" ON "merchants"("mid");
CREATE INDEX "merchants_user_id_idx" ON "merchants"("user_id");
CREATE INDEX "api_keys_merchant_id_idx" ON "api_keys"("merchant_id");
CREATE UNIQUE INDEX "uq_api_keys_active_merchant_env"
    ON "api_keys" ("merchant_id", "environment")
    WHERE status = 'ACTIVE';

ALTER TABLE "merchants"
    ADD CONSTRAINT "merchants_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "api_keys"
    ADD CONSTRAINT "api_keys_merchant_id_fkey"
    FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
