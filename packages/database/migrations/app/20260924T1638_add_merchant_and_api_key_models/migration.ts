#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2c42311eb90332b4cab32119023074bc8304509c8dab8d43c4de2b2299338b6d/contract';
import startContract from '../../snapshots/2c42311eb90332b4cab32119023074bc8304509c8dab8d43c4de2b2299338b6d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/9d4f226d5b7833f41b140f59719af543107f5fe406d848af28f617e2d4f22397/contract';
import endContract from '../../snapshots/9d4f226d5b7833f41b140f59719af543107f5fe406d848af28f617e2d4f22397/contract.json' with { type: 'json' };
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
          col('grace_ends_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('key_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('last_used_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('merchant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('revoked_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
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
          checkExpression(
            'api_keys_status_check_e8636911',
            "\"status\" IN ('ACTIVE', 'GRACE_PERIOD', 'REVOKED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'merchants',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_active', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('mid', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('user_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'api_keys',
        constraint: 'api_keys_key_id_key',
        columns: ['key_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'merchants',
        constraint: 'merchants_mid_key',
        columns: ['mid'],
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
        table: 'merchants',
        index: 'idx_merchants_user_id',
        columns: ['user_id'],
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
      this.addForeignKey({
        schema: 'public',
        table: 'merchants',
        foreignKey: {
          name: 'merchants_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
