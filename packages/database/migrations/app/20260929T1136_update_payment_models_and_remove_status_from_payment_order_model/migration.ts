#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1338b658d62347e49e05b54c196c4221bd7e688f3ea436b1b7faed8dd740e468/contract';
import startContract from '../../snapshots/1338b658d62347e49e05b54c196c4221bd7e688f3ea436b1b7faed8dd740e468/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b767ce6bcecdd3a406686f93b589e819c7716ba1bfa57de2c4ec6465c04abb7d/contract';
import endContract from '../../snapshots/b767ce6bcecdd3a406686f93b589e819c7716ba1bfa57de2c4ec6465c04abb7d/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'payment_attempts', column: 'completed_at' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'payment_orders',
        constraint: 'payment_orders_status_check_729f24c9',
      }),
      this.dropColumn({ schema: 'public', table: 'payment_orders', column: 'late_payment' }),
      this.dropColumn({ schema: 'public', table: 'payment_orders', column: 'status' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
