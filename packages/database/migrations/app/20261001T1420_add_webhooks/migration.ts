#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/054397f8b1b33fcc4764fbabf88269ebe674c79fad2efa463758c27211693ca9/contract';
import startContract from '../../snapshots/054397f8b1b33fcc4764fbabf88269ebe674c79fad2efa463758c27211693ca9/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/528c4dbfc8c2b2635125563d6cd36fbe6eed8da1dca7e178f6cf9e44abf66599/contract';
import endContract from '../../snapshots/528c4dbfc8c2b2635125563d6cd36fbe6eed8da1dca7e178f6cf9e44abf66599/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'webhooks',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('merchant_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('secret_key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'webhooks',
        index: 'idx_webhooks_merchant_id',
        columns: ['merchant_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'webhooks',
        foreignKey: {
          name: 'webhooks_merchant_id_fkey',
          columns: ['merchant_id'],
          references: { schema: 'public', table: 'merchants', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
