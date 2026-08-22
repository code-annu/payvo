/*
  Warnings:

  - You are about to drop the column `project_id` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the `projects` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `merchant_id` to the `api_keys` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('CREATED', 'REQUIRES_ACTION', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "payment_attempt_status" AS ENUM ('CREATED', 'PROCESSING', 'SUCCEED', 'FAILED', 'EXPIRED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "api_keys" DROP CONSTRAINT "api_keys_project_id_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_user_id_fkey";

-- DropIndex
DROP INDEX "idx_api_keys_project_id";

-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "project_id",
ADD COLUMN     "merchant_id" UUID NOT NULL;

-- DropTable
DROP TABLE "projects";

-- CreateTable
CREATE TABLE "merchants" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "payment_status" NOT NULL DEFAULT 'CREATED',
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "description" TEXT,
    "provider_transaction_id" VARCHAR(255),
    "failure_code" VARCHAR(100),
    "failure_message" TEXT,
    "paid_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" "payment_attempt_status" NOT NULL DEFAULT 'CREATED',
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_merchants_user_id" ON "merchants"("user_id");

-- CreateIndex
CREATE INDEX "idx_payments_merchant_id" ON "payments"("merchant_id");

-- CreateIndex
CREATE INDEX "idx_payments_customer_id" ON "payments"("customer_id");

-- CreateIndex
CREATE INDEX "idx_payments_order_id" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uq_payments_merchant_idempotency" ON "payments"("merchant_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "idx_payment_attempts_payment_id" ON "payment_attempts"("payment_id");

-- CreateIndex
CREATE INDEX "idx_payment_attempts_status" ON "payment_attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_payment_id_key" ON "transactions"("payment_id");

-- CreateIndex
CREATE INDEX "idx_transactions_merchant_id" ON "transactions"("merchant_id");

-- CreateIndex
CREATE INDEX "idx_transactions_payment_id" ON "transactions"("payment_id");

-- CreateIndex
CREATE INDEX "idx_api_keys_merchant_id" ON "api_keys"("merchant_id");

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
