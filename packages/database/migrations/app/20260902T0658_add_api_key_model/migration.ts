#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8e3cfc8b1e57e68c175fa52d0c5f770573835b7adbc3a2d9c80028a49344ae3b/contract';
import endContract from '../../snapshots/8e3cfc8b1e57e68c175fa52d0c5f770573835b7adbc3a2d9c80028a49344ae3b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ad23ceb081e69aca6e8632983a0d525f407f85677d8ef21d5a553a2beda83d3f/contract';
import startContract from '../../snapshots/ad23ceb081e69aca6e8632983a0d525f407f85677d8ef21d5a553a2beda83d3f/contract.json' with { type: 'json' };
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
        table: 'api_keys',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('environment', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('key_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('last_used_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('merchant_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('revoked_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('schedule_revoke_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('secret_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('ACTIVE'),
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
            'api_keys_environment_check_6cd03fea',
            "\"environment\" IN ('TEST', 'LIVE')",
          ),
          checkExpression('api_keys_status_check_35f03e2c', "\"status\" IN ('ACTIVE', 'REVOKED')"),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'api_keys',
        constraint: 'api_keys_key_id_key',
        columns: ['key_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'api_keys',
        index: 'idx_api_keys_merchant_id',
        columns: ['merchant_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'api_keys',
        index: 'idx_api_keys_merchant_id_environment',
        columns: ['merchant_id', 'environment'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'api_keys',
        index: 'idx_api_keys_merchant_id_environment_status',
        columns: ['merchant_id', 'environment', 'status'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'api_keys',
        foreignKey: {
          name: 'api_keys_merchant_id_fkey',
          columns: ['merchant_id'],
          references: { schema: 'public', table: 'merchants', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
