#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/054397f8b1b33fcc4764fbabf88269ebe674c79fad2efa463758c27211693ca9/contract';
import endContract from '../../snapshots/054397f8b1b33fcc4764fbabf88269ebe674c79fad2efa463758c27211693ca9/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b767ce6bcecdd3a406686f93b589e819c7716ba1bfa57de2c4ec6465c04abb7d/contract';
import startContract from '../../snapshots/b767ce6bcecdd3a406686f93b589e819c7716ba1bfa57de2c4ec6465c04abb7d/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'transactions',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('currency', 'character(3)', {
            notNull: true,
            codecRef: { codecId: 'sql/char@1', typeParams: { length: 3 } },
          }),
          col('fee_amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('gross_amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('merchant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('net_amount', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('payment_attempt_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('payment_order_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('payment_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'transactions_payment_type_check_48ef5891',
            "\"payment_type\" IN ('PAYIN', 'REFUND')",
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'transactions',
        index: 'idx_transactions_merchant_id',
        columns: ['merchant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'transactions',
        index: 'idx_transactions_payment_attempt_id',
        columns: ['payment_attempt_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'transactions',
        index: 'idx_transactions_payment_order_id',
        columns: ['payment_order_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'transactions',
        foreignKey: {
          name: 'transactions_merchant_id_fkey',
          columns: ['merchant_id'],
          references: { schema: 'public', table: 'merchants', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'transactions',
        foreignKey: {
          name: 'transactions_payment_order_id_fkey',
          columns: ['payment_order_id'],
          references: { schema: 'public', table: 'payment_orders', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'transactions',
        foreignKey: {
          name: 'transactions_payment_attempt_id_fkey',
          columns: ['payment_attempt_id'],
          references: { schema: 'public', table: 'payment_attempts', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
