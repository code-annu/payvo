#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1338b658d62347e49e05b54c196c4221bd7e688f3ea436b1b7faed8dd740e468/contract';
import endContract from '../../snapshots/1338b658d62347e49e05b54c196c4221bd7e688f3ea436b1b7faed8dd740e468/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c89704235288798ffcd3508289676c655dd13b0b54de020da1846605cb470ad6/contract';
import startContract from '../../snapshots/c89704235288798ffcd3508289676c655dd13b0b54de020da1846605cb470ad6/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'payment_attempts',
        constraint: 'payment_attempts_status_check_c3edf213',
      }),
      this.addColumn({
        schema: 'public',
        table: 'payment_attempts',
        column: col('failure_code', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'payment_attempts',
        column: col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'payment_orders',
        column: col('late_payment', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'payment_attempts',
        constraint: 'payment_attempts_status_check_4b470de9',
        expression: "\"status\" IN ('PROCESSING', 'FAILED', 'SUCCEED')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
