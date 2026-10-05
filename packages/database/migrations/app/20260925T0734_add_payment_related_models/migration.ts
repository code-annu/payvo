#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/9d4f226d5b7833f41b140f59719af543107f5fe406d848af28f617e2d4f22397/contract';
import startContract from '../../snapshots/9d4f226d5b7833f41b140f59719af543107f5fe406d848af28f617e2d4f22397/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c89704235288798ffcd3508289676c655dd13b0b54de020da1846605cb470ad6/contract';
import endContract from '../../snapshots/c89704235288798ffcd3508289676c655dd13b0b54de020da1846605cb470ad6/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'payment_attempts',
        columns: [
          col('attempt_number', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('completed_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('payment_method_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('payment_order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PROCESSING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'payment_attempts_status_check_c3edf213',
            "\"status\" IN ('PROCESSING', 'FAILED', 'CANCELED', 'SUCCEED', 'REJECTED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'payment_methods',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('icon_url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'payment_orders',
        columns: [
          col('amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('completed_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('csi', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('currency', 'character(3)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 3 } },
          }),
          col('expires_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('idempotency_key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('merchant_customer_id', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),
          col('merchant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('merchant_order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('CREATED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'payment_orders_status_check_729f24c9',
            "\"status\" IN ('CREATED', 'PAYMENT_PENDING', 'EXPIRED', 'FAILED', 'COMPLETED')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'payment_attempts',
        constraint: 'payment_attempts_payment_order_id_attempt_number_key',
        columns: ['payment_order_id', 'attempt_number'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'payment_methods',
        constraint: 'payment_methods_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'payment_orders',
        constraint: 'payment_orders_idempotency_key_key',
        columns: ['idempotency_key'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'payment_orders',
        constraint: 'payment_orders_csi_key',
        columns: ['csi'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment_attempts',
        index: 'idx_payment_attempts_payment_method_id',
        columns: ['payment_method_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment_attempts',
        index: 'idx_payment_attempts_payment_order_id',
        columns: ['payment_order_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'payment_orders',
        index: 'idx_payment_orders_merchant_id',
        columns: ['merchant_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payment_attempts',
        foreignKey: {
          name: 'payment_attempts_payment_order_id_fkey',
          columns: ['payment_order_id'],
          references: { schema: 'public', table: 'payment_orders', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payment_attempts',
        foreignKey: {
          name: 'payment_attempts_payment_method_id_fkey',
          columns: ['payment_method_id'],
          references: { schema: 'public', table: 'payment_methods', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'payment_orders',
        foreignKey: {
          name: 'payment_orders_merchant_id_fkey',
          columns: ['merchant_id'],
          references: { schema: 'public', table: 'merchants', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
