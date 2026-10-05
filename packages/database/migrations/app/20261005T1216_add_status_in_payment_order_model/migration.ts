#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2f025c68c58fb2734603560b792366338242e8b631326f4ddcf6679ced3cfb4e/contract';
import endContract from '../../snapshots/2f025c68c58fb2734603560b792366338242e8b631326f4ddcf6679ced3cfb4e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/696e9c8467bfcf1a1d6f83117fe022d7d8121f6a6eb55fa047570401693b370e/contract';
import startContract from '../../snapshots/696e9c8467bfcf1a1d6f83117fe022d7d8121f6a6eb55fa047570401693b370e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'payment_orders',
        column: col('status', 'text', {
          notNull: true,
          default: lit('CREATED'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'payment_orders',
        constraint: 'payment_orders_status_check_05a5444d',
        expression:
          "\"status\" IN ('CREATED', 'PAYMENT_PROCESSING', 'PAYMENT_FAILED', 'EXPIRED', 'COMPLETED')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
