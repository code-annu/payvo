#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/528c4dbfc8c2b2635125563d6cd36fbe6eed8da1dca7e178f6cf9e44abf66599/contract';
import startContract from '../../snapshots/528c4dbfc8c2b2635125563d6cd36fbe6eed8da1dca7e178f6cf9e44abf66599/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/696e9c8467bfcf1a1d6f83117fe022d7d8121f6a6eb55fa047570401693b370e/contract';
import endContract from '../../snapshots/696e9c8467bfcf1a1d6f83117fe022d7d8121f6a6eb55fa047570401693b370e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      rawSql({
        id: 'sequence.public.payvo_order_sequence',
        label: 'Create sequence payvo_order_sequence',
        operationClass: 'additive',
        target: {
          id: 'postgres',
          details: {
            schema: 'public',
            objectType: 'sequence',
            name: 'payvo_order_sequence',
          },
        },
        precheck: [
          {
            description: 'ensure sequence "payvo_order_sequence" does not exist',
            sql: "SELECT NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'payvo_order_sequence') AS \"result\"",
            params: [],
          },
        ],
        execute: [
          {
            description: 'create sequence payvo_order_sequence',
            sql: 'CREATE SEQUENCE IF NOT EXISTS payvo_order_sequence START 10000000000000',
          },
        ],
        postcheck: [
          {
            description: 'verify sequence "payvo_order_sequence" exists',
            sql: "SELECT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'payvo_order_sequence') AS \"result\"",
            params: [],
          },
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'payment_orders',
        column: col('order_number', 'int8', {
          notNull: true,
          default: fn("nextval('payvo_order_sequence'::regclass)"),
          codecRef: { codecId: 'pg/int8@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'payment_orders',
        constraint: 'payment_orders_order_number_key',
        columns: ['order_number'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
